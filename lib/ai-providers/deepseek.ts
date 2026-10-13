import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'
import { resolveModel } from './models'

interface DeepSeekError {
  error: { message: string; type: string; code: string | null }
}

export class DeepSeekProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800, responseFormat = 'text' } = req
    const model = resolveModel('deepseek', req.model)

    const body: Record<string, unknown> = {
      model,
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
    } catch (cause) {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar DeepSeek', { provider: 'deepseek', model }, { cause })
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as DeepSeekError)
      const details = {
        provider: 'deepseek',
        model,
        status: res.status,
        upstreamRequestId: res.headers.get('request-id') ?? res.headers.get('x-request-id'),
        upstreamBody: err,
      }
      const errType = (err as DeepSeekError)?.error?.type ?? ''

      if (res.status === 401 || errType === 'authentication_error') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de DeepSeek inválida o revocada', details)
      }
      // DeepSeek usa HTTP 402 para saldo insuficiente
      if (res.status === 402) {
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Saldo insuficiente en tu cuenta de DeepSeek', details)
      }
      if (res.status === 429) {
        throw new AIProviderError('RATE_LIMIT', 'Límite de requests de DeepSeek alcanzado, intenta en unos minutos', details)
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de DeepSeek ${res.status}`, details)
    }

    const data = await res.json()
    return { text: data.choices?.[0]?.message?.content ?? '' }
  }
}
