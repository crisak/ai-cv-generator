import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'
import { resolveModel } from './models'

interface OpenAIError {
  error: { message: string; type: string; code: string | null }
}

export class GPTProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800, responseFormat = 'text' } = req
    const model = resolveModel('gpt', req.model)

    const body: Record<string, unknown> = {
      model,
      max_completion_tokens: maxTokens,
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
    } catch (cause) {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar OpenAI', { provider: 'gpt', model }, { cause })
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as OpenAIError)
      const details = {
        provider: 'gpt',
        model,
        status: res.status,
        upstreamRequestId: res.headers.get('request-id') ?? res.headers.get('x-request-id'),
        upstreamBody: err,
      }
      const code = (err as OpenAIError)?.error?.code ?? ''

      if (res.status === 401 || code === 'invalid_api_key') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de OpenAI inválida o revocada', details)
      }
      if (code === 'insufficient_quota') {
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Cuota de OpenAI agotada, revisa tu plan y facturación', details)
      }
      if (code === 'rate_limit_exceeded' || res.status === 429) {
        throw new AIProviderError('RATE_LIMIT', 'Límite de requests de OpenAI alcanzado, intenta en unos minutos', details)
      }
      if (code === 'model_not_found' || res.status === 403) {
        throw new AIProviderError('MODEL_NOT_FOUND', 'Tu API key no tiene acceso a este modelo de OpenAI', details)
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de OpenAI ${res.status}`, details)
    }

    const data = await res.json()
    return { text: data.choices?.[0]?.message?.content ?? '' }
  }
}
