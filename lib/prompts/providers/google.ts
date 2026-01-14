/**
 * Google Gemini Provider
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

const GOOGLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    contextLength: 2000000,
    inputPrice: 0.00125,
    outputPrice: 0.005,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    contextLength: 1000000,
    inputPrice: 0.000075,
    outputPrice: 0.0003,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    contextLength: 1000000,
    inputPrice: 0.0001,
    outputPrice: 0.0004,
    supportsStreaming: true,
    supportsSystemPrompt: true,
  },
]

export class GoogleProvider implements LLMProvider {
  id = 'google'
  name = 'Google'
  models = GOOGLE_MODELS

  async isConfigured(): Promise<boolean> {
    const key = await getApiKey('google')
    return !!key
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = await getApiKey('google')
    if (!apiKey) {
      throw new ProviderError('Google API key not configured', this.id, 'auth')
    }

    const startTime = Date.now()
    const messages = buildMessages(request)

    // Convert to Gemini format
    const contents = this.convertToGeminiFormat(messages)
    const systemInstruction = this.extractSystemInstruction(messages)

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
      },
    }

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] }
    }

    if (request.temperature !== undefined) {
      (body.generationConfig as Record<string, unknown>).temperature = request.temperature
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = error.error?.message || `Google API error: ${response.status}`

      if (response.status === 401 || response.status === 403) {
        throw new ProviderError(message, this.id, 'auth')
      }
      if (response.status === 429) {
        throw new ProviderError(message, this.id, 'rate_limit')
      }
      throw new ProviderError(message, this.id, 'server_error')
    }

    const data = await response.json()
    const latencyMs = Date.now() - startTime

    const content = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || ''

    // Gemini doesn't always return token counts
    const inputTokens = data.usageMetadata?.promptTokenCount || 0
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0

    return {
      content,
      inputTokens,
      outputTokens,
      model: request.model,
      latencyMs,
      finishReason: data.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'length',
    }
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<ChatChunk, void, unknown> {
    const apiKey = await getApiKey('google')
    if (!apiKey) {
      throw new ProviderError('Google API key not configured', this.id, 'auth')
    }

    const messages = buildMessages(request)
    const contents = this.convertToGeminiFormat(messages)
    const systemInstruction = this.extractSystemInstruction(messages)

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
      },
    }

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] }
    }

    if (request.temperature !== undefined) {
      (body.generationConfig as Record<string, unknown>).temperature = request.temperature
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ProviderError(
        error.error?.message || `Google API error: ${response.status}`,
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
            const text = parsed.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text || '')
              .join('') || ''

            if (parsed.usageMetadata) {
              inputTokens = parsed.usageMetadata.promptTokenCount || inputTokens
              outputTokens = parsed.usageMetadata.candidatesTokenCount || outputTokens
            }

            if (text) {
              yield { content: text, done: false }
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

  private convertToGeminiFormat(messages: { role: string; content: string }[]) {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
  }

  private extractSystemInstruction(messages: { role: string; content: string }[]): string | null {
    const systemMessages = messages.filter(m => m.role === 'system')
    return systemMessages.length > 0
      ? systemMessages.map(m => m.content).join('\n\n')
      : null
  }
}

export const googleProvider = new GoogleProvider()
