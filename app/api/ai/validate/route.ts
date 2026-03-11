import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface ValidateRequest {
  model: string
  apiKey: string
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as ValidateRequest
  const { model, apiKey } = body

  if (!model || !apiKey) {
    return NextResponse.json({ valid: false, reason: 'Faltan parámetros' }, { status: 400 })
  }

  try {
    if (model === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      if (res.ok) return NextResponse.json({ valid: true })
      const err = await res.json()
      const reason = err?.error?.type === 'authentication_error' ? 'API key inválida' : `Error ${res.status}`
      return NextResponse.json({ valid: false, reason })
    }

    if (model === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      if (res.ok) return NextResponse.json({ valid: true })
      const err = await res.json()
      const reason = res.status === 401 ? 'API key inválida' : `Error ${res.status} — ${err?.error?.message ?? ''}`
      return NextResponse.json({ valid: false, reason })
    }

    if (model === 'gpt') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      if (res.ok) return NextResponse.json({ valid: true })
      const err = await res.json()
      const reason = res.status === 401 ? 'API key inválida' : `Error ${res.status} — ${err?.error?.message ?? ''}`
      return NextResponse.json({ valid: false, reason })
    }

    return NextResponse.json({ valid: false, reason: 'Modelo no soportado para validación' })
  } catch {
    return NextResponse.json({ valid: false, reason: 'Error de red al contactar el proveedor' })
  }
}
