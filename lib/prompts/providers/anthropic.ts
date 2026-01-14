/**
 * Anthropic Provider
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

const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextLength: 200000,
    inputPrice: 0.003,
    outputPrice: 0.015,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextLength: 200000,
    inputPrice: 0.0008,
    outputPrice: 0.004,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextLength: 200000,
    inputPrice: 0.015,
    outputPrice: 0.075,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
]

export class AnthropicProvider implements LLMProvider {
  id = 'anthropic'
  name = 'Anthropic'
  models = ANTHROPIC_MODELS

  async isConfigured(): Promise<boolean> {
    const key = await getApiKey('anthropic')
    return !!key
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = await getApiKey('anthropic')
    if (!apiKey) {
      throw new ProviderError('Anthropic API key not configured', this.id, 'auth')
    }

    const startTime = Date.now()
    const messages = buildMessages(request)

    // Separate system prompt from messages for Anthropic
    const systemMessages = messages.filter(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const body: Record<string, unknown> = {
      model: request.model,
      messages: conversationMessages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: request.maxTokens || 4096,
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n\n')
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = error.error?.message || `Anthropic API error: ${response.status}`

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

    const content = data.content
      ?.filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('') || ''

    return {
      content,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      model: request.model,
      latencyMs,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 'length',
    }
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<ChatChunk, void, unknown> {
    const apiKey = await getApiKey('anthropic')
    if (!apiKey) {
      throw new ProviderError('Anthropic API key not configured', this.id, 'auth')
    }

    const messages = buildMessages(request)
    const systemMessages = messages.filter(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const body: Record<string, unknown> = {
      model: request.model,
      messages: conversationMessages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: request.maxTokens || 4096,
      stream: true,
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n\n')
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ProviderError(
        error.error?.message || `Anthropic API error: ${response.status}`,
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
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text || ''
              if (text) {
                yield { content: text, done: false }
              }
            }

            if (parsed.type === 'message_delta') {
              outputTokens = parsed.usage?.output_tokens || outputTokens
            }

            if (parsed.type === 'message_start') {
              inputTokens = parsed.message?.usage?.input_tokens || 0
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

export const anthropicProvider = new AnthropicProvider()
