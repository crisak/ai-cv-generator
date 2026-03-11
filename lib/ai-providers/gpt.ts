import type { AIProvider, AIRequest, AIResponse } from './types'

export class GPTProvider implements AIProvider {
  async call(req: AIRequest): Promise<AIResponse> {
    const { apiKey, messages, maxTokens = 800, responseFormat = 'text' } = req

    const body: Record<string, unknown> = {
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }

    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' }
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(`OpenAI API error ${res.status}: ${JSON.stringify(error)}`)
    }

    const data = await res.json()
    return { text: data.choices?.[0]?.message?.content ?? '' }
  }
}
