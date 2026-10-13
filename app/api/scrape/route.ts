import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { logger, requestContext } from '@/lib/logger'

const ScrapeBodySchema = z.object({
  url: z.string().url('URL inválida'),
})

const CF_HEADERS = (apiToken: string) => ({
  Authorization: `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
})

const CF_BASE_BODY = {
  gotoOptions: { waitUntil: 'networkidle0' as const, timeout: 45_000 },
  rejectResourceTypes: ['image', 'font', 'media'],
  waitForTimeout: 5_000,
}

const MIN_USEFUL_LENGTH = 200

// Keywords that indicate the content is a cookie banner / captcha / login wall, not a job offer
const NOISE_PATTERNS = [
  /utilizamos cookies/i,
  /hemos detectado una actividad/i,
  /hacer clic para comprobar/i,
  /inicia sesión para ver/i,
  /sign in to view/i,
  /captcha/i,
]

function isNoisyContent(text: string): boolean {
  const first500 = text.slice(0, 500)
  return NOISE_PATTERNS.some((re) => re.test(first500))
}

interface ScrapeElement {
  selector: string
  results: {
    text: string
    attributes: { name: string; value: string }[]
  }[]
}

// Platform-specific selectors for job content
const JOB_SELECTORS = [
  // Generic meta tags (work everywhere)
  { selector: 'meta[name="description"]', attributes: ['content'] },
  { selector: 'meta[property="og:title"]', attributes: ['content'] },
  { selector: 'meta[property="og:description"]', attributes: ['content'] },
  // Common structural
  { selector: 'h1' },
  // Computrabajo
  { selector: '.box_offer' },
  { selector: '[class*="offerContent"], [class*="offer-content"]' },
  // ElEmpleo
  { selector: '[class*="description"], [class*="job-detail"]' },
  // Workday / general ATS
  { selector: '[data-automation-id="jobPostingDescription"]' },
  { selector: '[class*="jobDescription"], [class*="job-description"]' },
  // Eightfold / generic
  { selector: '[class*="posting"], [class*="job-posting"]' },
  // Indeed
  { selector: '[id*="jobDescriptionText"]' },
  // Generic fallback
  { selector: 'article, [role="main"] p' },
]

async function logCfFailure(strategy: string, res: Response, url: string) {
  logger.warn('scrape.cloudflare_error', {
    strategy,
    targetUrl: url,
    status: res.status,
    cfRay: res.headers.get('cf-ray'),
    body: (await res.text().catch(() => '')).slice(0, 500),
  })
}

/**
 * Strategy 1: /markdown endpoint — works for most pages that render server-side or with light JS.
 */
async function tryMarkdown(cfBase: string, apiToken: string, url: string): Promise<string | null> {
  const res = await fetch(`${cfBase}/markdown`, {
    method: 'POST',
    headers: CF_HEADERS(apiToken),
    body: JSON.stringify({ url, ...CF_BASE_BODY }),
    signal: AbortSignal.timeout(55_000),
  })

  if (!res.ok) {
    await logCfFailure('markdown', res, url)
    return null
  }

  const data = (await res.json()) as { success?: boolean; result?: string }
  const text = data.result?.trim() ?? ''

  if (text.length < MIN_USEFUL_LENGTH) return null
  if (isNoisyContent(text)) return null

  // Detect if result is mostly JSON/CSS config instead of real content (common with SPAs)
  if (text.startsWith('`{') || text.startsWith('{')) {
    try {
      JSON.parse(text.startsWith('`') ? text.slice(1, -1) : text)
      return null // It's JSON, not useful page content
    } catch {
      // Not valid JSON, might be real content
    }
  }

  return text
}

/**
 * Strategy 2: /scrape endpoint — extracts structured data from meta tags and platform-specific selectors.
 * Works for SPAs (Eightfold, Workday, ElEmpleo) and sites blocked by Cloudflare anti-bot.
 */
async function tryScrape(cfBase: string, apiToken: string, url: string): Promise<string | null> {
  const res = await fetch(`${cfBase}/scrape`, {
    method: 'POST',
    headers: CF_HEADERS(apiToken),
    body: JSON.stringify({
      url,
      ...CF_BASE_BODY,
      elements: JOB_SELECTORS,
    }),
    signal: AbortSignal.timeout(55_000),
  })

  if (!res.ok) {
    await logCfFailure('scrape', res, url)
    return null
  }

  const data = (await res.json()) as { success?: boolean; result?: ScrapeElement[] }
  if (!data.success || !Array.isArray(data.result)) return null

  const seen = new Set<string>()
  const parts: string[] = []

  for (const element of data.result) {
    for (const match of element.results ?? []) {
      // Extract from attributes (meta tags)
      const contentAttr = match.attributes?.find((a) => a.name === 'content')
      if (contentAttr?.value) {
        const v = contentAttr.value.trim()
        if (v && !seen.has(v)) {
          seen.add(v)
          parts.push(v)
        }
      }
      // Extract visible text
      const txt = match.text?.trim()
      if (txt && !seen.has(txt)) {
        seen.add(txt)
        parts.push(txt)
      }
    }
  }

  const combined = parts.filter(Boolean).join('\n\n')
  if (combined.length < MIN_USEFUL_LENGTH) return null
  if (isNoisyContent(combined)) return null

  return combined
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  const ctx = requestContext(request, 'scrape', userId)
  if (!userId) {
    logger.warn('request.unauthorized', ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    logger.warn('request.invalid_json', { ...ctx, message: String(error) })
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = ScrapeBodySchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('request.validation_failed', { ...ctx, issues: parsed.error.issues })
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { url } = parsed.data

  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN

  if (!accountId || !apiToken) {
    logger.error('scrape.not_configured', new Error('CF_ACCOUNT_ID / CF_API_TOKEN missing'), {
      ...ctx,
      hasAccountId: !!accountId,
      hasApiToken: !!apiToken,
    })
    return NextResponse.json({ error: 'Servicio de scraping no configurado' }, { status: 503 })
  }

  const cfBase = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering`

  try {
    // Strategy 1: Try /markdown (best for most pages)
    const markdown = await tryMarkdown(cfBase, apiToken, url)
    if (markdown) {
      return NextResponse.json({ raw: markdown })
    }

    // Strategy 2: Fallback to /scrape for SPAs and anti-bot blocked pages
    const scraped = await tryScrape(cfBase, apiToken, url)
    if (scraped) {
      return NextResponse.json({ raw: scraped })
    }

    logger.warn('scrape.unreadable', { ...ctx, targetUrl: url })
    return NextResponse.json(
      { error: 'Contenido no legible. Intenta copiar y pegar el texto directamente.' },
      { status: 422 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      logger.error('scrape.timeout', error, { ...ctx, targetUrl: url })
      return NextResponse.json(
        { error: 'Tiempo de espera agotado. Intenta copiar y pegar el texto directamente.' },
        { status: 504 },
      )
    }
    logger.error('scrape.failed', error, { ...ctx, targetUrl: url })
    return NextResponse.json(
      { error: 'Error al procesar la URL. Intenta copiar y pegar el texto directamente.' },
      { status: 500 },
    )
  }
}
