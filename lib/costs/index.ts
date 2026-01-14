/**
 * Cost Tracking Module
 *
 * Tracks and manages LLM API usage costs across the application.
 */

// Main tracker functions
export {
  recordCost,
  getAllCosts,
  getCostsByProvider,
  getCostsByModule,
  getCostsInRange,
  getCurrentMonthCosts,
  getCurrentMonthSpend,
  getCostSummary,
  getDailyCosts,
  setBudgetSettings,
  onBudgetAlert,
  getBudgetStatus,
  getCostRecommendations,
  exportCostsAsCSV,
  clearAllCosts,
  type CostModule,
  type CostSummary,
  type DailyCost,
  type CostRecommendation,
} from './cost-tracker'

// Calculator functions
export {
  calculateCost,
  estimateCost,
  formatCost,
  formatTokens,
  getCostPer1000Tokens,
  compareCosts,
  getBudgetUsage,
  TOKEN_ESTIMATES,
  type TokenUsage,
  type CostBreakdown,
} from './cost-calculator'

// Pricing data
export {
  getModelPricing,
  getProviderModels,
  getBudgetFriendlyModels,
  OPENAI_PRICING,
  ANTHROPIC_PRICING,
  GOOGLE_PRICING,
  GROQ_PRICING,
  OLLAMA_PRICING,
  ALL_PRICING,
  type Provider,
  type ModelPricing,
  type ProviderPricing,
} from './pricing-data'
