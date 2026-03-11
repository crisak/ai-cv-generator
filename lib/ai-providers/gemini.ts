import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'

interface GeminiError {
  error: { code: number; message: string; status: string }
}

export class GeminiProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800 } = req

    const systemMsg = messages.find((m) => m.role === 'system')?.content
    const userMessages = messages.filter((m) => m.role !== 'system')

    const body: Record<string, unknown> = {
      contents: userMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: maxTokens },
    }

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg }] }
    }

    let res: Response
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
    } catch {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar Google Gemini')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as GeminiError)
      const status = (err as GeminiError)?.error?.status ?? ''

      if (res.status === 401 || status === 'UNAUTHENTICATED') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de Google AI Studio inválida')
      }
      if (res.status === 403 || status === 'PERMISSION_DENIED') {
        throw new AIProviderError('PERMISSION_DENIED', 'La API key no tiene permisos (verifica región o términos de uso)')
      }
      if (res.status === 429 || status === 'RESOURCE_EXHAUSTED') {
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Cuota de Gemini agotada, intenta más tarde')
      }
      if (res.status === 404 || status === 'NOT_FOUND') {
        throw new AIProviderError('MODEL_NOT_FOUND', 'Modelo de Gemini no disponible para esta API key')
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de Google Gemini ${res.status}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { text }
  }
}
