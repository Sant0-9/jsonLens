/**
 * LLM Pricing Data (2025)
 *
 * Prices in USD per 1M tokens
 * Updated: January 2025
 */

export interface ModelPricing {
  inputPricePerMillion: number
  outputPricePerMillion: number
  contextWindow: number
  notes?: string
}

export interface ProviderPricing {
  [model: string]: ModelPricing
}

// OpenAI Models
export const OPENAI_PRICING: ProviderPricing = {
  // GPT-4o models
  'gpt-4o': {
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
    contextWindow: 128000,
  },
  'gpt-4o-mini': {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    contextWindow: 128000,
  },
  'gpt-4o-2024-11-20': {
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
    contextWindow: 128000,
  },
  // GPT-4 Turbo
  'gpt-4-turbo': {
    inputPricePerMillion: 10.00,
    outputPricePerMillion: 30.00,
    contextWindow: 128000,
  },
  'gpt-4-turbo-preview': {
    inputPricePerMillion: 10.00,
    outputPricePerMillion: 30.00,
    contextWindow: 128000,
  },
  // GPT-4
  'gpt-4': {
    inputPricePerMillion: 30.00,
    outputPricePerMillion: 60.00,
    contextWindow: 8192,
  },
  'gpt-4-32k': {
    inputPricePerMillion: 60.00,
    outputPricePerMillion: 120.00,
    contextWindow: 32768,
  },
  // GPT-3.5
  'gpt-3.5-turbo': {
    inputPricePerMillion: 0.50,
    outputPricePerMillion: 1.50,
    contextWindow: 16385,
  },
  'gpt-3.5-turbo-0125': {
    inputPricePerMillion: 0.50,
    outputPricePerMillion: 1.50,
    contextWindow: 16385,
  },
  // o1 reasoning models
  'o1': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 60.00,
    contextWindow: 200000,
  },
  'o1-mini': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 12.00,
    contextWindow: 128000,
  },
  'o1-preview': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 60.00,
    contextWindow: 128000,
  },
}

// Anthropic Models
export const ANTHROPIC_PRICING: ProviderPricing = {
  // Claude 4 (Opus 4.5)
  'claude-opus-4-5-20251101': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    contextWindow: 200000,
  },
  // Claude 3.5 Sonnet
  'claude-3-5-sonnet-20241022': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    contextWindow: 200000,
  },
  'claude-3-5-sonnet-latest': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    contextWindow: 200000,
  },
  // Claude 3.5 Haiku
  'claude-3-5-haiku-20241022': {
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00,
    contextWindow: 200000,
  },
  'claude-3-5-haiku-latest': {
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00,
    contextWindow: 200000,
  },
  // Claude 3 Opus
  'claude-3-opus-20240229': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    contextWindow: 200000,
  },
  'claude-3-opus-latest': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    contextWindow: 200000,
  },
  // Claude 3 Sonnet
  'claude-3-sonnet-20240229': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    contextWindow: 200000,
  },
  // Claude 3 Haiku
  'claude-3-haiku-20240307': {
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    contextWindow: 200000,
  },
}

// Google Models (Gemini)
export const GOOGLE_PRICING: ProviderPricing = {
  // Gemini 2.0
  'gemini-2.0-flash-exp': {
    inputPricePerMillion: 0,  // Currently free in preview
    outputPricePerMillion: 0,
    contextWindow: 1000000,
    notes: 'Free during preview period',
  },
  'gemini-2.0-flash-thinking-exp': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 32767,
    notes: 'Free during preview period',
  },
  // Gemini 1.5 Pro
  'gemini-1.5-pro': {
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
    contextWindow: 2000000,
  },
  'gemini-1.5-pro-latest': {
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
    contextWindow: 2000000,
  },
  // Gemini 1.5 Flash
  'gemini-1.5-flash': {
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
    contextWindow: 1000000,
  },
  'gemini-1.5-flash-latest': {
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
    contextWindow: 1000000,
  },
  // Gemini 1.5 Flash-8B
  'gemini-1.5-flash-8b': {
    inputPricePerMillion: 0.0375,
    outputPricePerMillion: 0.15,
    contextWindow: 1000000,
  },
  // Gemini 1.0 Pro
  'gemini-pro': {
    inputPricePerMillion: 0.50,
    outputPricePerMillion: 1.50,
    contextWindow: 32768,
  },
}

// Groq Models (Hosted inference)
export const GROQ_PRICING: ProviderPricing = {
  // Llama 3.3
  'llama-3.3-70b-versatile': {
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    contextWindow: 128000,
  },
  // Llama 3.1
  'llama-3.1-405b-reasoning': {
    inputPricePerMillion: 0,  // Currently free
    outputPricePerMillion: 0,
    contextWindow: 131072,
    notes: 'Free tier available',
  },
  'llama-3.1-70b-versatile': {
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    contextWindow: 131072,
  },
  'llama-3.1-8b-instant': {
    inputPricePerMillion: 0.05,
    outputPricePerMillion: 0.08,
    contextWindow: 131072,
  },
  // Llama 3
  'llama3-70b-8192': {
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
    contextWindow: 8192,
  },
  'llama3-8b-8192': {
    inputPricePerMillion: 0.05,
    outputPricePerMillion: 0.08,
    contextWindow: 8192,
  },
  // Mixtral
  'mixtral-8x7b-32768': {
    inputPricePerMillion: 0.24,
    outputPricePerMillion: 0.24,
    contextWindow: 32768,
  },
  // Gemma
  'gemma2-9b-it': {
    inputPricePerMillion: 0.20,
    outputPricePerMillion: 0.20,
    contextWindow: 8192,
  },
}

// Ollama - Local models are free but track usage
export const OLLAMA_PRICING: ProviderPricing = {
  'llama3.2': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 128000,
    notes: 'Local inference - free',
  },
  'llama3.1': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 128000,
    notes: 'Local inference - free',
  },
  'mistral': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 32768,
    notes: 'Local inference - free',
  },
  'mixtral': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 32768,
    notes: 'Local inference - free',
  },
  'codellama': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 16384,
    notes: 'Local inference - free',
  },
  'phi3': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 128000,
    notes: 'Local inference - free',
  },
  'qwen2.5': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 32768,
    notes: 'Local inference - free',
  },
  'deepseek-r1': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
    contextWindow: 64000,
    notes: 'Local inference - free',
  },
}

// Provider name mapping
export type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama'

// All pricing combined
export const ALL_PRICING: Record<Provider, ProviderPricing> = {
  openai: OPENAI_PRICING,
  anthropic: ANTHROPIC_PRICING,
  google: GOOGLE_PRICING,
  groq: GROQ_PRICING,
  ollama: OLLAMA_PRICING,
}

/**
 * Get pricing for a specific model
 */
export function getModelPricing(provider: Provider, model: string): ModelPricing | null {
  const providerPricing = ALL_PRICING[provider]
  if (!providerPricing) return null

  // Try exact match first
  if (providerPricing[model]) {
    return providerPricing[model]
  }

  // Try prefix match (e.g., 'gpt-4o-2024-05-13' -> 'gpt-4o')
  const modelPrefix = model.split('-').slice(0, -1).join('-')
  if (providerPricing[modelPrefix]) {
    return providerPricing[modelPrefix]
  }

  // Try base model match (e.g., 'claude-3-5-sonnet-20240620' -> 'claude-3-5-sonnet')
  for (const [key, pricing] of Object.entries(providerPricing)) {
    if (model.startsWith(key) || key.startsWith(model.split('-20')[0])) {
      return pricing
    }
  }

  return null
}

/**
 * Get all available models for a provider
 */
export function getProviderModels(provider: Provider): string[] {
  return Object.keys(ALL_PRICING[provider] || {})
}

/**
 * Get recommended budget-friendly models
 */
export function getBudgetFriendlyModels(): Array<{ provider: Provider; model: string; pricing: ModelPricing }> {
  const recommendations: Array<{ provider: Provider; model: string; pricing: ModelPricing }> = []

  for (const [provider, models] of Object.entries(ALL_PRICING) as [Provider, ProviderPricing][]) {
    for (const [model, pricing] of Object.entries(models)) {
      if (pricing.inputPricePerMillion <= 1 && pricing.outputPricePerMillion <= 5) {
        recommendations.push({ provider, model, pricing })
      }
    }
  }

  return recommendations.sort((a, b) =>
    (a.pricing.inputPricePerMillion + a.pricing.outputPricePerMillion) -
    (b.pricing.inputPricePerMillion + b.pricing.outputPricePerMillion)
  )
}
