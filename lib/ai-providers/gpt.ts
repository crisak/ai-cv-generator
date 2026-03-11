import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'

interface OpenAIError {
  error: { message: string; type: string; code: string | null }
}

export class GPTProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800, responseFormat = 'text' } = req

    const body: Record<string, unknown> = {
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }

    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' }
    }

    let res: Response
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar OpenAI')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as OpenAIError)
      const code = (err as OpenAIError)?.error?.code ?? ''

      if (res.status === 401 || code === 'invalid_api_key') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de OpenAI inválida o revocada')
      }
      if (code === 'insufficient_quota') {
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Cuota de OpenAI agotada, revisa tu plan y facturación')
      }
      if (code === 'rate_limit_exceeded' || res.status === 429) {
        throw new AIProviderError('RATE_LIMIT', 'Límite de requests de OpenAI alcanzado, intenta en unos minutos')
      }
      if (code === 'model_not_found' || res.status === 403) {
        throw new AIProviderError('MODEL_NOT_FOUND', 'Tu API key no tiene acceso a este modelo de OpenAI')
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de OpenAI ${res.status}`)
    }

    const data = await res.json()
    return { text: data.choices?.[0]?.message?.content ?? '' }
  }
}
