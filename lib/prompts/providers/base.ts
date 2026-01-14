/**
 * Base Provider Interface
 *
 * Defines the contract for all LLM providers.
 */

export interface ModelInfo {
  id: string
  name: string
  contextLength: number
  inputPrice: number  // per 1K tokens
  outputPrice: number // per 1K tokens
  supportsStreaming: boolean
  supportsSystemPrompt: boolean
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface ChatResponse {
  content: string
  inputTokens: number
  outputTokens: number
  model: string
  latencyMs: number
  finishReason?: 'stop' | 'length' | 'error'
}

export interface ChatChunk {
  content: string
  done: boolean
  inputTokens?: number
  outputTokens?: number
}

export interface LLMProvider {
  id: string
  name: string
  models: ModelInfo[]

  /**
   * Check if the provider is configured (has valid API key)
   */
  isConfigured(): Promise<boolean>

  /**
   * Send a chat completion request
   */
  chat(request: ChatRequest): Promise<ChatResponse>

  /**
   * Stream a chat completion response
   */
  streamChat(request: ChatRequest): AsyncGenerator<ChatChunk, void, unknown>
}

/**
 * Provider error types
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: 'auth' | 'rate_limit' | 'invalid_request' | 'server_error' | 'network'
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

/**
 * Helper to build messages with optional system prompt
 */
export function buildMessages(request: ChatRequest): Message[] {
  const messages: Message[] = []

  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt })
  }

  messages.push(...request.messages)
  return messages
}
