export type AIProviderName = 'claude' | 'gpt' | 'deepseek' | 'gemini'

export type AIErrorCode =
  | 'INVALID_API_KEY'      // 401 — key inválida o revocada
  | 'INSUFFICIENT_QUOTA'   // quota/créditos agotados (OpenAI 429, DeepSeek 402, Gemini 429 RESOURCE_EXHAUSTED)
  | 'RATE_LIMIT'           // demasiadas requests por minuto
  | 'PERMISSION_DENIED'    // key existe pero sin permisos (Claude 403, Gemini 403)
  | 'MODEL_NOT_FOUND'      // modelo no disponible para esta key
  | 'PROVIDER_ERROR'       // error interno del proveedor (5xx)
  | 'NETWORK_ERROR'        // error de red / timeout

export class AIProviderError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

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
