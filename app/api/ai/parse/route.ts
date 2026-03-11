import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import type { AIProviderName } from '@/lib/ai-providers/types'

interface ParseRequest {
  jobOffer: string
  model?: string
  apiKey?: string
}

const JOB_OFFER_PROMPT = (jobOffer: string) => `Analiza esta oferta laboral y extrae la información clave. Responde SOLO con un JSON válido sin explicaciones.

Campos a extraer:
- company: nombre de la empresa (string)
- position: título del cargo (string)
- salaryOffered: salario numérico si se menciona (number, sin texto)
- salaryCurrency: moneda del salario si se menciona: COP, USD o EUR (string)
- benefits: lista de beneficios mencionados (array de strings cortos)

Oferta laboral:
${jobOffer.substring(0, 4000)}

JSON:`

function parseAIJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

const SUPPORTED: AIProviderName[] = ['claude', 'gpt', 'deepseek']

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as ParseRequest
    const { jobOffer, model = 'claude', apiKey } = body

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
    const result = await provider.call({
      apiKey,
      messages: [{ role: 'user', content: JOB_OFFER_PROMPT(jobOffer) }],
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
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
