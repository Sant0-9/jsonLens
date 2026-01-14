/**
 * Provider Registry
 *
 * Central registry for all LLM providers.
 */

import type { LLMProvider, ModelInfo, ChatRequest, ChatResponse, ChatChunk } from './providers/base'
import { openaiProvider } from './providers/openai'
import { anthropicProvider } from './providers/anthropic'
import { googleProvider } from './providers/google'
import { groqProvider } from './providers/groq'
import { ollamaProvider } from './providers/ollama'

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama'

class ProviderRegistry {
  private providers: Map<ProviderId, LLMProvider> = new Map()

  constructor() {
    this.register(openaiProvider)
    this.register(anthropicProvider)
    this.register(googleProvider)
    this.register(groqProvider)
    this.register(ollamaProvider)
  }

  register(provider: LLMProvider): void {
    this.providers.set(provider.id as ProviderId, provider)
  }

  get(id: ProviderId): LLMProvider | undefined {
    return this.providers.get(id)
  }

  getAll(): LLMProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get all configured providers
   */
  async getConfigured(): Promise<LLMProvider[]> {
    const configured: LLMProvider[] = []
    for (const provider of this.providers.values()) {
      if (await provider.isConfigured()) {
        configured.push(provider)
      }
    }
    return configured
  }

  /**
   * Get all available models across all providers
   */
  getAllModels(): Array<ModelInfo & { providerId: ProviderId }> {
    const models: Array<ModelInfo & { providerId: ProviderId }> = []
    for (const provider of this.providers.values()) {
      for (const model of provider.models) {
        models.push({ ...model, providerId: provider.id as ProviderId })
      }
    }
    return models
  }

  /**
   * Get all available models from configured providers
   */
  async getConfiguredModels(): Promise<Array<ModelInfo & { providerId: ProviderId; providerName: string }>> {
    const models: Array<ModelInfo & { providerId: ProviderId; providerName: string }> = []
    for (const provider of this.providers.values()) {
      if (await provider.isConfigured()) {
        for (const model of provider.models) {
          models.push({
            ...model,
            providerId: provider.id as ProviderId,
            providerName: provider.name,
          })
        }
      }
    }
    return models
  }

  /**
   * Find provider for a model
   */
  findProviderForModel(modelId: string): LLMProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.models.some(m => m.id === modelId)) {
        return provider
      }
    }
    return undefined
  }

  /**
   * Chat with a specific model
   */
  async chat(modelId: string, request: Omit<ChatRequest, 'model'>): Promise<ChatResponse> {
    const provider = this.findProviderForModel(modelId)
    if (!provider) {
      throw new Error(`No provider found for model: ${modelId}`)
    }
    return provider.chat({ ...request, model: modelId })
  }

  /**
   * Stream chat with a specific model
   */
  async *streamChat(modelId: string, request: Omit<ChatRequest, 'model'>): AsyncGenerator<ChatChunk, void, unknown> {
    const provider = this.findProviderForModel(modelId)
    if (!provider) {
      throw new Error(`No provider found for model: ${modelId}`)
    }
    yield* provider.streamChat({ ...request, model: modelId })
  }

  /**
   * Chat with multiple models in parallel
   */
  async chatMultiple(
    modelIds: string[],
    request: Omit<ChatRequest, 'model'>
  ): Promise<Map<string, ChatResponse | Error>> {
    const results = new Map<string, ChatResponse | Error>()

    const promises = modelIds.map(async (modelId) => {
      try {
        const response = await this.chat(modelId, request)
        results.set(modelId, response)
      } catch (error) {
        results.set(modelId, error instanceof Error ? error : new Error(String(error)))
      }
    })

    await Promise.all(promises)
    return results
  }
}

export const providerRegistry = new ProviderRegistry()

// Re-export types
export type { LLMProvider, ModelInfo, ChatRequest, ChatResponse, ChatChunk }
