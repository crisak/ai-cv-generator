import type { NextApiRequest, NextApiResponse } from 'next'

interface ParseRequest {
  jobOffer: string
  model?: string
  apiKey?: string
}

interface ErrorResponse {
  error: string
  code?: string
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { jobOffer, model = 'claude', apiKey: clientApiKey } = req.body as ParseRequest

    if (!jobOffer || typeof jobOffer !== 'string' || jobOffer.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid jobOffer' })
    }

    if (!clientApiKey) {
      return res.status(503).json({ error: 'AI service not configured.', code: 'NO_API_KEY' })
    }

    const prompt = JOB_OFFER_PROMPT(jobOffer)

    if (model === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': clientApiKey,
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
        return res.status(response.status).json({ error: `AI API error: ${response.status}`, code: 'AI_API_ERROR' })
      }

      const data = await response.json()
      const parsed = parseAIJson(data.content?.[0]?.text ?? '')
      if (!parsed) return res.status(500).json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' })
      return res.status(200).json({ success: true, data: parsed })
    }

    if (model === 'deepseek') {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${clientApiKey}`,
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
        return res.status(response.status).json({ error: `AI API error: ${response.status}`, code: 'AI_API_ERROR' })
      }

      const data = await response.json()
      const parsed = parseAIJson(data.choices?.[0]?.message?.content ?? '')
      if (!parsed) return res.status(500).json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' })
      return res.status(200).json({ success: true, data: parsed })
    }

    if (model === 'gpt') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${clientApiKey}`,
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
        return res.status(response.status).json({ error: `AI API error: ${response.status}`, code: 'AI_API_ERROR' })
      }

      const data = await response.json()
      const parsed = parseAIJson(data.choices?.[0]?.message?.content ?? '')
      if (!parsed) return res.status(500).json({ error: 'Invalid response format from AI', code: 'INVALID_FORMAT' })
      return res.status(200).json({ success: true, data: parsed })
    }

    return res.status(501).json({ error: 'Model not yet implemented', code: 'NOT_IMPLEMENTED' })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
}
