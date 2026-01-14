/**
 * OpenAI Provider
 */

import { getApiKey } from '@/lib/settings/api-keys'
import type {
  LLMProvider,
  ModelInfo,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  Message,
} from './base'
import { ProviderError, buildMessages } from './base'

const OPENAI_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextLength: 128000,
    inputPrice: 0.0025,
    outputPrice: 0.01,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextLength: 128000,
    inputPrice: 0.00015,
    outputPrice: 0.0006,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextLength: 128000,
    inputPrice: 0.01,
    outputPrice: 0.03,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'o1-preview',
    name: 'o1 Preview',
    contextLength: 128000,
    inputPrice: 0.015,
    outputPrice: 0.06,
    supportsStreaming: false,
    supportsSystemPrompt: false,
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    contextLength: 128000,
    inputPrice: 0.003,
    outputPrice: 0.012,
    supportsStreaming: false,
    supportsSystemPrompt: false,
  },
]

export class OpenAIProvider implements LLMProvider {
  id = 'openai'
  name = 'OpenAI'
  models = OPENAI_MODELS

  async isConfigured(): Promise<boolean> {
    const key = await getApiKey('openai')
    return !!key
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = await getApiKey('openai')
    if (!apiKey) {
      throw new ProviderError('OpenAI API key not configured', this.id, 'auth')
    }

    const startTime = Date.now()
    const messages = buildMessages(request)

    // o1 models don't support system prompts - convert to user message
    const model = this.models.find(m => m.id === request.model)
    const formattedMessages = model?.supportsSystemPrompt === false
      ? this.convertSystemToUser(messages)
      : messages

    const body: Record<string, unknown> = {
      model: request.model,
      messages: formattedMessages.map(m => ({ role: m.role, content: m.content })),
    }

    if (request.temperature !== undefined && model?.supportsSystemPrompt !== false) {
      body.temperature = request.temperature
    }
    if (request.maxTokens) {
      body.max_tokens = request.maxTokens
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = error.error?.message || `OpenAI API error: ${response.status}`

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
    const apiKey = await getApiKey('openai')
    if (!apiKey) {
      throw new ProviderError('OpenAI API key not configured', this.id, 'auth')
    }

    const model = this.models.find(m => m.id === request.model)
    if (!model?.supportsStreaming) {
      // Fall back to non-streaming for models that don't support it
      const response = await this.chat(request)
      yield {
        content: response.content,
        done: true,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      }
      return
    }

    const messages = buildMessages(request)

    const body: Record<string, unknown> = {
      model: request.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      stream_options: { include_usage: true },
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature
    }
    if (request.maxTokens) {
      body.max_tokens = request.maxTokens
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        error.error?.message || `OpenAI API error: ${response.status}`,
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

            if (parsed.usage) {
              inputTokens = parsed.usage.prompt_tokens || 0
              outputTokens = parsed.usage.completion_tokens || 0
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

  private convertSystemToUser(messages: Message[]): Message[] {
    return messages.map(m => {
      if (m.role === 'system') {
        return { role: 'user' as const, content: `[System Instructions]\n${m.content}` }
      }
      return m
    })
  }
}

export const openaiProvider = new OpenAIProvider()
