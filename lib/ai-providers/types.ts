import 'server-only'

export type AIProviderName = 'claude' | 'gpt' | 'deepseek'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequest {
  apiKey: string
  messages: AIMessage[]
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}

export interface AIResponse {
  text: string
}

export interface AIProvider {
  call(req: AIRequest): Promise<AIResponse>
}
