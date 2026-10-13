import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import { AIProviderError } from '@/lib/ai-providers/types'
import type { AIProviderName } from '@/lib/ai-providers/types'
import { logger, requestContext } from '@/lib/logger'

const SUPPORTED: AIProviderName[] = ['claude', 'gpt', 'deepseek', 'gemini']

interface ValidateRequest {
  model: string
  modelId?: string
  apiKey: string
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  const ctx = requestContext(request, 'ai/validate', userId)
  if (!userId) {
    logger.warn('request.unauthorized', ctx)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as ValidateRequest | null
  if (!body?.model || !body?.apiKey) {
    logger.warn('request.invalid_body', { ...ctx, hasModel: !!body?.model, hasApiKey: !!body?.apiKey })
    return NextResponse.json({ valid: false, reason: 'Faltan parámetros' }, { status: 400 })
  }

  const { model, apiKey } = body
  const modelId = typeof body.modelId === 'string' ? body.modelId : undefined

  if (!SUPPORTED.includes(model as AIProviderName)) {
    logger.warn('request.unsupported_provider', { ...ctx, model })
    return NextResponse.json({ valid: false, reason: `Proveedor "${model}" no soportado para validación` })
  }

  const startedAt = Date.now()
  try {
    const provider = AIProviderFactory.create(model as AIProviderName)
    await provider.call({
      apiKey,
      model: modelId,
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 1,
    })
    logger.info('validate.ok', { ...ctx, model, modelId, durationMs: Date.now() - startedAt })
    return NextResponse.json({ valid: true })
  } catch (error) {
    logger.error('validate.failed', error, { ...ctx, model, modelId, durationMs: Date.now() - startedAt })
    if (error instanceof AIProviderError) {
      return NextResponse.json({ valid: false, reason: error.message, code: error.code })
    }
    return NextResponse.json({ valid: false, reason: 'Error inesperado al validar la conexión' })
  }
}
