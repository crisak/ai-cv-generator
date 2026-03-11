import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'

interface AnthropicError {
  type: 'error'
  error: { type: string; message: string }
}

export class ClaudeProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800 } = req

    let res: Response
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system: messages.find((m) => m.role === 'system')?.content,
          messages: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })
    } catch {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar Anthropic')
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as AnthropicError)
      const errorType = (body as AnthropicError)?.error?.type ?? ''

      if (res.status === 401 || errorType === 'authentication_error') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de Anthropic inválida o revocada')
      }
      if (res.status === 403 || errorType === 'permission_error') {
        throw new AIProviderError('PERMISSION_DENIED', 'La API key no tiene permisos para este recurso')
      }
      if (res.status === 429) {
        if (errorType === 'rate_limit_error') {
          throw new AIProviderError('RATE_LIMIT', 'Límite de requests alcanzado, intenta en unos minutos')
        }
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Cuota de tokens agotada')
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de Anthropic ${res.status}`)
    }

    const data = await res.json()
    return { text: data.content?.[0]?.text ?? '' }
  }
}
