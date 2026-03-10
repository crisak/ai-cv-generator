import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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

    const prompt = JOB_OFFER_PROMPT(jobOffer)

    if (model === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Anthropic API error:', error)
        return NextResponse.json({ error: `AI API error: ${response.status}`, code: 'AI_API_ERROR' }, { status: response.status })
      }

      const data = await response.json()
      const parsed = parseAIJson(data.content?.[0]?.text ?? '')
      if (!parsed) return NextResponse.json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' }, { status: 500 })
      return NextResponse.json({ success: true, data: parsed })
    }

    if (model === 'deepseek') {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('DeepSeek API error:', error)
        return NextResponse.json({ error: `AI API error: ${response.status}`, code: 'AI_API_ERROR' }, { status: response.status })
      }

      const data = await response.json()
      const parsed = parseAIJson(data.choices?.[0]?.message?.content ?? '')
      if (!parsed) return NextResponse.json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' }, { status: 500 })
      return NextResponse.json({ success: true, data: parsed })
    }

    if (model === 'gpt') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('OpenAI API error:', error)
        return NextResponse.json({ error: `AI API error: ${response.status}`, code: 'AI_API_ERROR' }, { status: response.status })
      }

      const data = await response.json()
      const parsed = parseAIJson(data.choices?.[0]?.message?.content ?? '')
      if (!parsed) return NextResponse.json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' }, { status: 500 })
      return NextResponse.json({ success: true, data: parsed })
    }

    return NextResponse.json({ error: 'Model not yet implemented', code: 'NOT_IMPLEMENTED' }, { status: 501 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
