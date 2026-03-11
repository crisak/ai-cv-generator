import type { SettingsDocument } from './db/schemas'
import type { AIMessage, AIProviderName } from './ai-providers/types'

export type { AIMessage }

export async function callProxy(
  messages: AIMessage[],
  settings: SettingsDocument,
  maxTokens?: number,
  responseFormat?: 'text' | 'json_object'
): Promise<string> {
  const provider = (settings.aiModel ?? 'claude') as AIProviderName

  const res = await fetch('/api/ai/proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      provider,
      apiKey: settings.aiApiKey,
      messages,
      maxTokens,
      responseFormat,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`AI proxy error ${res.status}: ${error.code ?? 'UNKNOWN'}`)
  }

  const data = await res.json()
  return data.text ?? ''
}
