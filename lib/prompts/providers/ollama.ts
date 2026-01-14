/**
 * Ollama Provider
 *
 * Local LLM inference with Ollama.
 */

import { getApiKey } from '@/lib/settings/api-keys'
import type {
  LLMProvider,
  ModelInfo,
  ChatRequest,
  ChatResponse,
  ChatChunk,
} from './base'
import { ProviderError, buildMessages } from './base'

// Default models - actual models will be fetched from Ollama
const DEFAULT_OLLAMA_MODELS: ModelInfo[] = [
  {
    id: 'llama3.2',
    name: 'Llama 3.2',
    contextLength: 128000,
    inputPrice: 0,
    outputPrice: 0,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    contextLength: 32768,
    inputPrice: 0,
    outputPrice: 0,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    contextLength: 16384,
    inputPrice: 0,
    outputPrice: 0,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'phi3',
    name: 'Phi-3',
    contextLength: 4096,
    inputPrice: 0,
    outputPrice: 0,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
]

export class OllamaProvider implements LLMProvider {
  id = 'ollama'
  name = 'Ollama'
  models = DEFAULT_OLLAMA_MODELS

  private cachedModels: ModelInfo[] | null = null

  async isConfigured(): Promise<boolean> {
    const url = await getApiKey('ollama')
    if (!url) return false

    try {
      const response = await fetch(`${url}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch available models from Ollama
   */
  async fetchModels(): Promise<ModelInfo[]> {
    const url = await getApiKey('ollama')
    if (!url) return DEFAULT_OLLAMA_MODELS

    try {
      const response = await fetch(`${url}/api/tags`)
      if (!response.ok) return DEFAULT_OLLAMA_MODELS

      const data = await response.json()
      const models = data.models || []

      const fetchedModels: ModelInfo[] = models.map((m: { name: string; details?: { parameter_size?: string } }) => ({
        id: m.name,
        name: m.name,
        contextLength: 4096, // Default, actual varies by model
        inputPrice: 0,
        outputPrice: 0,
        supportsStreaming: true,
        supportsSystemPrompt: true,
      }))

      this.cachedModels = fetchedModels
      return fetchedModels
    } catch {
      return DEFAULT_OLLAMA_MODELS
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const url = await getApiKey('ollama')
    if (!url) {
      throw new ProviderError('Ollama URL not configured', this.id, 'auth')
    }

    const startTime = Date.now()
    const messages = buildMessages(request)

    const body: Record<string, unknown> = {
      model: request.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
    }

    if (request.temperature !== undefined) {
      body.options = { temperature: request.temperature }
    }

    try {
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new ProviderError(
          error.error || `Ollama error: ${response.status}`,
          this.id,
          'server_error'
        )
      }

      const data = await response.json()
      const latencyMs = Date.now() - startTime

      return {
        content: data.message?.content || '',
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
        model: request.model,
        latencyMs,
        finishReason: 'stop',
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error
      throw new ProviderError(
        `Failed to connect to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        'network'
      )
    }
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<ChatChunk, void, unknown> {
    const url = await getApiKey('ollama')
    if (!url) {
      throw new ProviderError('Ollama URL not configured', this.id, 'auth')
    }

    const messages = buildMessages(request)

    const body: Record<string, unknown> = {
      model: request.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }

    if (request.temperature !== undefined) {
      body.options = { temperature: request.temperature }
    }

    let response: Response

    try {
      response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw new ProviderError(
        `Failed to connect to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        'network'
      )
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ProviderError(
        error.error || `Ollama error: ${response.status}`,
        this.id,
        'server_error'
      )
    }

    const reader = response.body?.getReader()
    if (!reader) throw new ProviderError('No response body', this.id, 'network')

    const decoder = new TextDecoder()
    let buffer = ''
    let inputTokens = 0
    let outputTokens = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const parsed = JSON.parse(line)
            const content = parsed.message?.content || ''

            if (parsed.done) {
              inputTokens = parsed.prompt_eval_count || 0
              outputTokens = parsed.eval_count || 0
            }

            if (content) {
              yield { content, done: false }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { content: '', done: true, inputTokens, outputTokens }
  }
}

export const ollamaProvider = new OllamaProvider()
