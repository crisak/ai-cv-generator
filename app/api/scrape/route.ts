import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const ScrapeBodySchema = z.object({
  url: z.string().url('URL inválida'),
})

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

  const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/markdown`

  try {
    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Cloudflare error:', response.status, errorText)
      return NextResponse.json(
        { error: 'No se pudo procesar la URL. Intenta copiar y pegar el texto directamente.' },
        { status: 502 },
      )
    }

    const data = (await response.json()) as { result?: string; success?: boolean }

    if (!data.success || typeof data.result !== 'string' || data.result.trim().length === 0) {
      return NextResponse.json(
        { error: 'Contenido no legible. Intenta copiar y pegar el texto directamente.' },
        { status: 422 },
      )
    }

    return NextResponse.json({ markdown: data.result })
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
