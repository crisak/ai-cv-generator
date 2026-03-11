import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'

interface DeepSeekError {
  error: { message: string; type: string; code: string | null }
}

export class DeepSeekProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800, responseFormat = 'text' } = req

    const body: Record<string, unknown> = {
      model: 'deepseek-chat',
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }

    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' }
    }

    let res: Response
    try {
      res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar DeepSeek')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as DeepSeekError)
      const errType = (err as DeepSeekError)?.error?.type ?? ''

      if (res.status === 401 || errType === 'authentication_error') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de DeepSeek inválida o revocada')
      }
      // DeepSeek usa HTTP 402 para saldo insuficiente
      if (res.status === 402) {
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Saldo insuficiente en tu cuenta de DeepSeek')
      }
      if (res.status === 429) {
        throw new AIProviderError('RATE_LIMIT', 'Límite de requests de DeepSeek alcanzado, intenta en unos minutos')
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de DeepSeek ${res.status}`)
    }

    const data = await res.json()
    return { text: data.choices?.[0]?.message?.content ?? '' }
  }
}
