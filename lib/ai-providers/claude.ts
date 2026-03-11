import 'server-only'
import type { AIProvider, AIRequest, AIResponse } from './types'

export class ClaudeProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800 } = req

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: messages.find((m) => m.role === 'system')?.content,
        messages: messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(`Claude API error ${res.status}: ${JSON.stringify(error)}`)
    }

    const data = await res.json()
    return { text: data.content?.[0]?.text ?? '' }
  }
}
