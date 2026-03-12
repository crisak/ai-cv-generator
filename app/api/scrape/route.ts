import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

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

interface ScrapeElement {
  selector: string
  results: {
    text: string
    attributes: { name: string; value: string }[]
  }[]
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

  if (!res.ok) return null

  const data = (await res.json()) as { success?: boolean; result?: string }
  const text = data.result?.trim() ?? ''

  if (text.length < MIN_USEFUL_LENGTH) return null

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
 * Strategy 2: /scrape endpoint — extracts structured data from meta tags and body text.
 * Works for heavy SPAs (Eightfold, Workday) that put job info in meta tags.
 */
async function tryScrape(cfBase: string, apiToken: string, url: string): Promise<string | null> {
  const res = await fetch(`${cfBase}/scrape`, {
    method: 'POST',
    headers: CF_HEADERS(apiToken),
    body: JSON.stringify({
      url,
      ...CF_BASE_BODY,
      elements: [
        { selector: 'meta[name="description"]', attributes: ['content'] },
        { selector: 'meta[property="og:title"]', attributes: ['content'] },
        { selector: 'meta[property="og:description"]', attributes: ['content'] },
        { selector: 'h1' },
        { selector: '[class*="description"], [class*="job-detail"], [class*="posting"], [id*="description"], [id*="job"]' },
      ],
    }),
    signal: AbortSignal.timeout(55_000),
  })

  if (!res.ok) return null

  const data = (await res.json()) as { success?: boolean; result?: ScrapeElement[] }
  if (!data.success || !Array.isArray(data.result)) return null

  const parts: string[] = []

  for (const element of data.result) {
    for (const match of element.results ?? []) {
      // Extract from attributes (meta tags)
      const contentAttr = match.attributes?.find((a) => a.name === 'content')
      if (contentAttr?.value) {
        parts.push(contentAttr.value)
      }
      // Extract visible text
      if (match.text?.trim()) {
        parts.push(match.text.trim())
      }
    }
  }

  const combined = parts.filter(Boolean).join('\n\n')
  return combined.length >= MIN_USEFUL_LENGTH ? combined : null
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = ScrapeBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { url } = parsed.data

  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN

  if (!accountId || !apiToken) {
    return NextResponse.json({ error: 'Servicio de scraping no configurado' }, { status: 503 })
  }

  const cfBase = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering`

  try {
    // Strategy 1: Try /markdown (best for most pages)
    const markdown = await tryMarkdown(cfBase, apiToken, url)
    if (markdown) {
      return NextResponse.json({ markdown })
    }

    // Strategy 2: Fallback to /scrape for SPAs that fail with /markdown
    const scraped = await tryScrape(cfBase, apiToken, url)
    if (scraped) {
      return NextResponse.json({ markdown: scraped })
    }

    return NextResponse.json(
      { error: 'Contenido no legible. Intenta copiar y pegar el texto directamente.' },
      { status: 422 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Tiempo de espera agotado. Intenta copiar y pegar el texto directamente.' },
        { status: 504 },
      )
    }
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la URL. Intenta copiar y pegar el texto directamente.' },
      { status: 500 },
    )
  }
}
