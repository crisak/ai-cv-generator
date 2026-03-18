import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { AIProviderError } from '@/lib/ai-providers/types'
import type { AIProviderName } from '@/lib/ai-providers/types'

interface ParseRequest {
  jobOffer: string
  model?: string
  apiKey?: string
  mode?: 'extract' | 'clean'
}

const EXTRACT_PROMPT = (jobOffer: string) => `Analiza esta oferta laboral y extrae la información clave. Responde SOLO con un JSON válido sin explicaciones.

Campos a extraer:
- company: nombre de la empresa (string)
- position: título del cargo (string)
- salaryOffered: salario numérico si se menciona (number, sin texto)
- salaryCurrency: moneda del salario si se menciona: COP, USD o EUR (string)
- benefits: lista de beneficios mencionados (array de strings cortos)

Oferta laboral:
${jobOffer.substring(0, 4000)}

JSON:`

// mode=clean: convert raw scraped text to clean markdown preserving the FULL original job offer
const CLEAN_PROMPT = (raw: string) => `Eres un conversor de texto a markdown para ofertas laborales. Se te dará texto extraído de una página web (puede incluir navegación, cookies, scripts, publicidad, etc.).

Tu tarea:
1. Identifica si el texto contiene UNA oferta laboral concreta (no una lista de ofertas, no un portal genérico, no una página de login, no un captcha).
2. Si SÍ hay oferta: convierte TODA la oferta laboral a markdown limpio. Incluye TODO el contenido original de la oferta sin resumir, sin omitir, sin parafrasear — solo elimina el ruido de la página (navegación, footer, cookies, publicidad). El resultado debe ser la oferta completa tal como fue publicada.
3. Si NO hay oferta concreta: responde exactamente con la palabra NULL.

Responde SOLO con el markdown completo de la oferta O con la palabra NULL. Sin explicaciones ni texto adicional.

Texto extraído:
${raw.substring(0, 8000)}`

function parseAIJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

const SUPPORTED: AIProviderName[] = ['claude', 'gpt', 'deepseek', 'gemini']

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as ParseRequest
    const { jobOffer, model = 'claude', apiKey, mode = 'extract' } = body

    if (!jobOffer || typeof jobOffer !== 'string' || jobOffer.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or invalid jobOffer' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured.', code: 'NO_API_KEY' }, { status: 503 })
    }

    if (!SUPPORTED.includes(model as AIProviderName)) {
      return NextResponse.json({ error: 'Model not yet implemented', code: 'NOT_IMPLEMENTED' }, { status: 501 })
    }

    const provider = AIProviderFactory.create(model as AIProviderName)

    // mode=clean: return cleaned markdown of the job offer, or null if not a job offer
    if (mode === 'clean') {
      const result = await provider.call({
        apiKey,
        messages: [{ role: 'user', content: CLEAN_PROMPT(jobOffer) }],
        maxTokens: 3000,
      })
      const text = result.text.trim()
      if (text === 'NULL' || text.toUpperCase() === 'NULL') {
        return NextResponse.json({ success: true, markdown: null })
      }
      return NextResponse.json({ success: true, markdown: text })
    }

    // mode=extract (default): return structured JSON fields
    const result = await provider.call({
      apiKey,
      messages: [{ role: 'user', content: EXTRACT_PROMPT(jobOffer) }],
      maxTokens: 600,
      responseFormat: 'json_object',
    })

    const parsed = parseAIJson(result.text)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    console.error('API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const code = error instanceof AIProviderError ? error.code : 'INTERNAL_ERROR'
    return NextResponse.json({ error: message, code }, { status: 500 })
  }
}
