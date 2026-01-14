/**
 * Cost Calculator
 *
 * Calculate costs based on token usage and model pricing
 */

import { getModelPricing, getProviderModels, type Provider, type ModelPricing } from './pricing-data'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  totalCost: number
  pricing: ModelPricing | null
}

/**
 * Calculate cost for a single API call
 */
export function calculateCost(
  provider: Provider,
  model: string,
  usage: TokenUsage
): CostBreakdown {
  const pricing = getModelPricing(provider, model)

  if (!pricing) {
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      pricing: null,
    }
  }

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPricePerMillion
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPricePerMillion
  const totalCost = inputCost + outputCost

  return {
    inputCost,
    outputCost,
    totalCost,
    pricing,
  }
}

/**
 * Estimate cost before making an API call
 */
export function estimateCost(
  provider: Provider,
  model: string,
  inputTokens: number,
  estimatedOutputTokens: number
): CostBreakdown {
  return calculateCost(provider, model, {
    inputTokens,
    outputTokens: estimatedOutputTokens,
  })
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'Free'
  if (cost < 0.0001) return '< $0.0001'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  if (cost < 1) return `$${cost.toFixed(3)}`
  return `$${cost.toFixed(2)}`
}

/**
 * Format token count with thousands separator
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1_000_000).toFixed(2)}M`
}

/**
 * Calculate cost per 1000 tokens for a model
 */
export function getCostPer1000Tokens(
  provider: Provider,
  model: string
): { input: number; output: number } | null {
  const pricing = getModelPricing(provider, model)
  if (!pricing) return null

  return {
    input: pricing.inputPricePerMillion / 1000,
    output: pricing.outputPricePerMillion / 1000,
  }
}

/**
 * Compare costs across different models for the same token usage
 */
export function compareCosts(
  usage: TokenUsage,
  models: Array<{ provider: Provider; model: string }>
): Array<{ provider: Provider; model: string; cost: CostBreakdown }> {
  return models
    .map(({ provider, model }) => ({
      provider,
      model,
      cost: calculateCost(provider, model, usage),
    }))
    .sort((a, b) => a.cost.totalCost - b.cost.totalCost)
}

/**
 * Calculate percentage of budget used
 */
export function getBudgetUsage(
  currentSpend: number,
  budgetLimit: number
): {
  percentage: number
  remaining: number
  status: 'ok' | 'warning' | 'critical'
} {
  const percentage = budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0
  const remaining = Math.max(0, budgetLimit - currentSpend)

  let status: 'ok' | 'warning' | 'critical' = 'ok'
  if (percentage >= 90) status = 'critical'
  else if (percentage >= 70) status = 'warning'

  return { percentage, remaining, status }
}

/**
 * Estimate tokens needed for common operations
 */
export const TOKEN_ESTIMATES = {
  // Paper summarization
  paperSummary: {
    inputTokens: 15000,  // ~10 page paper
    outputTokens: 1500,   // Detailed summary
  },
  // ArXiv relevance scoring
  relevanceScore: {
    inputTokens: 500,    // Title + abstract
    outputTokens: 100,    // Score + brief reason
  },
  // Prompt comparison
  promptComparison: {
    inputTokens: 500,    // Average prompt
    outputTokens: 1000,   // Average response
  },
  // Research question analysis
  questionAnalysis: {
    inputTokens: 2000,   // Question + context
    outputTokens: 500,    // Analysis
  },
} as const

/**
 * Get recommended model for a budget
 */
export function getRecommendedModel(
  provider: Provider,
  maxCostPer1000Tokens: number
): string | null {
  const models = getProviderModels(provider)

  for (const model of models) {
    const pricing = getModelPricing(provider, model)
    if (!pricing) continue

    const avgCost = (pricing.inputPricePerMillion + pricing.outputPricePerMillion) / 2000
    if (avgCost <= maxCostPer1000Tokens) {
      return model
    }
  }

  return null
}
