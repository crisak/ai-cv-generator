import type { AIProvider, AIRequest, AIResponse } from './types'
import { AIProviderError } from './types'
import { resolveModel } from './models'

interface AnthropicError {
  type: 'error'
  error: { type: string; message: string }
}

export class ClaudeProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800 } = req
    const model = resolveModel('claude', req.model)

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
          model,
          max_tokens: maxTokens,
          system: messages.find((m) => m.role === 'system')?.content,
          messages: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })
    } catch (cause) {
      throw new AIProviderError('NETWORK_ERROR', 'Error de red al contactar Anthropic', { provider: 'claude', model }, { cause })
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as AnthropicError)
      const details = {
        provider: 'claude',
        model,
        status: res.status,
        upstreamRequestId: res.headers.get('request-id') ?? res.headers.get('x-request-id'),
        upstreamBody: body,
      }
      const errorType = (body as AnthropicError)?.error?.type ?? ''

      if (res.status === 401 || errorType === 'authentication_error') {
        throw new AIProviderError('INVALID_API_KEY', 'API key de Anthropic inválida o revocada', details)
      }
      if (res.status === 403 || errorType === 'permission_error') {
        throw new AIProviderError('PERMISSION_DENIED', 'La API key no tiene permisos para este recurso', details)
      }
      if (res.status === 429) {
        if (errorType === 'rate_limit_error') {
          throw new AIProviderError('RATE_LIMIT', 'Límite de requests alcanzado, intenta en unos minutos', details)
        }
        throw new AIProviderError('INSUFFICIENT_QUOTA', 'Cuota de tokens agotada', details)
      }
      throw new AIProviderError('PROVIDER_ERROR', `Error de Anthropic ${res.status}`, details)
    }

    const data = await res.json()
    // Con thinking adaptativo el primer bloque puede ser de razonamiento: buscar el bloque de texto.
    const textBlock = (data.content as { type: string; text?: string }[] | undefined)?.find((b) => b.type === 'text')
    return { text: textBlock?.text ?? '' }
  }
}
