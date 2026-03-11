import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIProviderFactory } from '@/lib/ai-providers/factory'
import type { AIProviderName } from '@/lib/ai-providers/types'

const SUPPORTED: AIProviderName[] = ['claude', 'gpt', 'deepseek']

interface ValidateRequest {
  model: string
  apiKey: string
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as ValidateRequest | null
  if (!body?.model || !body?.apiKey) {
    return NextResponse.json({ valid: false, reason: 'Faltan parámetros' }, { status: 400 })
  }

  const { model, apiKey } = body

  if (!SUPPORTED.includes(model as AIProviderName)) {
    return NextResponse.json({ valid: false, reason: 'Modelo no soportado para validación' })
  }

  try {
    const provider = AIProviderFactory.create(model as AIProviderName)
    await provider.call({
      apiKey,
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 1,
    })
    return NextResponse.json({ valid: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const isAuth = message.includes('401') || message.toLowerCase().includes('auth')
    return NextResponse.json({
      valid: false,
      reason: isAuth ? 'API key inválida' : `Error al contactar el proveedor`,
    })
  }
}
