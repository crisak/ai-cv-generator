import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { AIProviderError } from '@/lib/ai-providers/types'
import { logger, requestContext } from '@/lib/logger'

const RequestSchema = z.object({
  provider: z.enum(['claude', 'gpt', 'deepseek', 'gemini']),
  apiKey: z.string().min(1),
  modelId: z.string().max(200).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .min(1),
  maxTokens: z.number().int().positive().optional(),
  responseFormat: z.enum(['text', 'json_object']).optional(),
})

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  const ctx = requestContext(request, 'ai/proxy', userId)
  if (!userId) {
    logger.warn('request.unauthorized', ctx)
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    logger.warn('request.invalid_json', ctx)
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('request.validation_failed', { ...ctx, issues: parsed.error.issues })
    return NextResponse.json(
      { error: 'Invalid request', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { provider, apiKey, modelId, messages, maxTokens, responseFormat } = parsed.data

  const startedAt = Date.now()
  try {
    const handler = AIProviderFactory.create(provider)
    const result = await handler.call({ apiKey, model: modelId, messages, maxTokens, responseFormat })
    return NextResponse.json({ text: result.text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const code = error instanceof AIProviderError ? error.code : 'PROVIDER_ERROR'
    logger.error('proxy.failed', error, {
      ...ctx,
      provider,
      modelId,
      messageCount: messages.length,
      maxTokens,
      responseFormat,
      durationMs: Date.now() - startedAt,
    })
    return NextResponse.json(
      { error: message, code },
      { status: 502 }
    )
  }
}
