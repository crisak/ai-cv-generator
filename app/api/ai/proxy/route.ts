import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { AIProviderFactory } from '@/lib/ai-providers/factory'

const RequestSchema = z.object({
  provider: z.enum(['claude', 'gpt', 'deepseek']),
  apiKey: z.string().min(1),
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
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { provider, apiKey, messages, maxTokens, responseFormat } = parsed.data

  try {
    const handler = AIProviderFactory.create(provider)
    const result = await handler.call({ apiKey, messages, maxTokens, responseFormat })
    return NextResponse.json({ text: result.text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[ai/proxy] ${provider} error:`, message)
    return NextResponse.json(
      { error: message, code: 'PROVIDER_ERROR' },
      { status: 502 }
    )
  }
}
