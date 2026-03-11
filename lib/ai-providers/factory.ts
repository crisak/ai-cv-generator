import 'server-only'
import { ClaudeProvider } from './claude'
import { GPTProvider } from './gpt'
import { DeepSeekProvider } from './deepseek'
import type { AIProvider, AIProviderName } from './types'

export class AIProviderFactory {
  static create(provider: AIProviderName): AIProvider {
    switch (provider) {
      case 'claude':
        return new ClaudeProvider()
      case 'gpt':
        return new GPTProvider()
      case 'deepseek':
        return new DeepSeekProvider()
    }
  }
}
