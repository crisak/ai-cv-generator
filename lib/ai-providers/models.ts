import type { AIProviderName } from './types'

// Modelo por defecto cuando el usuario no configura uno en Ajustes.
export const DEFAULT_MODELS: Record<AIProviderName, string> = {
  claude: 'claude-haiku-5-5',
  gpt: 'gpt-6-luna',
  gemini: 'gemini-3.8-flash',
  deepseek: 'deepseek-flash',
}

// Sugerencias para la UI. El campo de modelo es editable: si un proveedor lanza
// un modelo nuevo basta con escribir su ID, sin tocar este archivo.
export const MODEL_SUGGESTIONS: Record<AIProviderName, string[]> = {
  claude: ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5', 'claude-fable-5-1'],
  gpt: ['gpt-6-luna', 'gpt-6.1-sol', 'gpt-6-astra'],
  gemini: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
  deepseek: ['deepseek-flash', 'deepseek-v4-pro'],
}

export function resolveModel(provider: AIProviderName, model?: string | null): string {
  return model?.trim() || DEFAULT_MODELS[provider]
}
