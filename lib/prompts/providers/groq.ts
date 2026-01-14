/**
 * Groq Provider
 *
 * Fast inference with open-source models.
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

const GROQ_MODELS: ModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    contextLength: 128000,
    inputPrice: 0.00059,
    outputPrice: 0.00079,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    contextLength: 128000,
    inputPrice: 0.00005,
    outputPrice: 0.00008,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    contextLength: 32768,
    inputPrice: 0.00024,
    outputPrice: 0.00024,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    contextLength: 8192,
    inputPrice: 0.0002,
    outputPrice: 0.0002,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
]

export class GroqProvider implements LLMProvider {
  id = 'groq'
  name = 'Groq'
  models = GROQ_MODELS

  async isConfigured(): Promise<boolean> {
    const key = await getApiKey('groq')
    return !!key
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = await getApiKey('groq')
    if (!apiKey) {
      throw new ProviderError('Groq API key not configured', this.id, 'auth')
    }

    const startTime = Date.now()
    const messages = buildMessages(request)

    const body: Record<string, unknown> = {
      model: request.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature
    }
    if (request.maxTokens) {
      body.max_tokens = request.maxTokens
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = error.error?.message || `Groq API error: ${response.status}`

      if (response.status === 401) {
        throw new ProviderError(message, this.id, 'auth')
      }
      if (response.status === 429) {
        throw new ProviderError(message, this.id, 'rate_limit')
      }
      throw new ProviderError(message, this.id, 'server_error')
    }

    const data = await response.json()
    const latencyMs = Date.now() - startTime

    return {
      content: data.choices[0]?.message?.content || '',
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      model: request.model,
      latencyMs,
      finishReason: data.choices[0]?.finish_reason === 'stop' ? 'stop' : 'length',
    }
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<ChatChunk, void, unknown> {
    const apiKey = await getApiKey('groq')
    if (!apiKey) {
      throw new ProviderError('Groq API key not configured', this.id, 'auth')
    }

    const messages = buildMessages(request)

    const body: Record<string, unknown> = {
      model: request.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature
    }
    if (request.maxTokens) {
      body.max_tokens = request.maxTokens
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ProviderError(
        error.error?.message || `Groq API error: ${response.status}`,
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
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''

            // Groq includes usage in the final chunk
            if (parsed.x_groq?.usage) {
              inputTokens = parsed.x_groq.usage.prompt_tokens || 0
              outputTokens = parsed.x_groq.usage.completion_tokens || 0
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

export const groqProvider = new GroqProvider()
