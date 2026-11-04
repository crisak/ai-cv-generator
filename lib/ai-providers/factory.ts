import { ClaudeProvider } from './claude'
import { GPTProvider } from './gpt'
import { DeepSeekProvider } from './deepseek'
import { GeminiProvider } from './gemini'
import { AIProviderError } from './types'
import type { AIProvider, AIProviderName, AIRequest, AIResponse } from './types'
import { logger } from '@/lib/logger'

export class AIProviderFactory {
  static create(provider: AIProviderName): AIProvider {
    switch (provider) {
      case 'claude':
        return new ClaudeProvider()
      case 'gpt':
        return new GPTProvider()
      case 'deepseek':
        return new DeepSeekProvider()
      case 'gemini':
        return new GeminiProvider()
    }
  }
}

/** finishReason que indica que la respuesta se cortó por el límite de tokens (Claude / OpenAI-DeepSeek / Gemini). */
export function isTruncated(finishReason?: string) {
  return finishReason === 'max_tokens' || finishReason === 'length' || finishReason === 'MAX_TOKENS'
}

/** Llama al proveedor y deja trazas: duración, tokens y avisos si la respuesta viene vacía o truncada. */
export async function callProvider(
  provider: AIProviderName,
  req: AIRequest,
  ctx: Record<string, unknown>,
): Promise<AIResponse> {
  const startedAt = Date.now()
  const result = await AIProviderFactory.create(provider).call(req)
  const fields = {
    ...ctx,
    provider,
    modelId: req.model,
    maxTokens: req.maxTokens,
    messageCount: req.messages.length,
    finishReason: result.finishReason,
    usage: result.usage,
    textLength: result.text.length,
    durationMs: Date.now() - startedAt,
  }
  if (!result.text.trim()) {
    const truncated = isTruncated(result.finishReason)
    throw new AIProviderError(
      'EMPTY_RESPONSE',
      truncated
        ? 'El modelo agotó el límite de tokens (razonamiento) antes de escribir la respuesta'
        : 'El modelo no devolvió texto',
      { provider, model: req.model, upstreamBody: { finishReason: result.finishReason, usage: result.usage, maxTokens: req.maxTokens } },
    )
  }
  if (isTruncated(result.finishReason)) {
    logger.warn('ai.truncated_response', fields)
  } else {
    logger.info('ai.call_ok', fields)
  }
  return result
}
