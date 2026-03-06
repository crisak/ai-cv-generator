import type { NextApiRequest, NextApiResponse } from 'next'

interface ParseRequest {
  jobOffer: string
  model?: string
}

interface ErrorResponse {
  error: string
  code?: string
}

/**
 * Backend proxy for AI API calls
 *
 * SECURITY NOTE: This endpoint requires ANTHROPIC_API_KEY in environment variables.
 * It proxies requests from the client to AI providers WITHOUT exposing the API key
 * to the browser.
 *
 * Usage:
 *   POST /api/ai/parse
 *   { jobOffer: "..." }
 *
 * Returns: AI parsed response or error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | ErrorResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { jobOffer, model = 'claude' } = req.body as ParseRequest

    if (!jobOffer || typeof jobOffer !== 'string' || jobOffer.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid jobOffer' })
    }

    // Check if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(503).json({
        error: 'AI service not configured. Using regex fallback on client.',
        code: 'NO_API_KEY'
      })
    }

    // Call Anthropic API (only Claude for now, others use regex fallback)
    if (model === 'claude') {
      const prompt = `Analiza esta oferta laboral y extrae la información clave. Responde SOLO con un JSON válido sin explicaciones.

Campos a extraer:
- company: nombre de la empresa (string)
- position: título del cargo (string)
- salaryOffered: salario numérico si se menciona (number, sin texto)
- salaryCurrency: moneda del salario si se menciona: COP, USD o EUR (string)
- benefits: lista de beneficios mencionados (array de strings cortos)

Oferta laboral:
${jobOffer.substring(0, 4000)}

JSON:`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Anthropic API error:', error)
        return res.status(response.status).json({
          error: `AI API error: ${response.status}`,
          code: 'AI_API_ERROR'
        })
      }

      const data = await response.json()
      const content = data.content?.[0]?.text ?? ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        return res.status(500).json({
          error: 'Invalid response format from AI',
          code: 'INVALID_FORMAT'
        })
      }

      try {
        const parsed = JSON.parse(jsonMatch[0])
        return res.status(200).json({ success: true, data: parsed })
      } catch (e) {
        return res.status(500).json({
          error: 'Failed to parse AI response',
          code: 'PARSE_ERROR'
        })
      }
    }

    // Other models (GPT, Gemini, etc) not yet implemented
    return res.status(501).json({
      error: 'Model not yet implemented in backend proxy',
      code: 'NOT_IMPLEMENTED'
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}
