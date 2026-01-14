/**
 * Cost Tracker
 *
 * Records and manages LLM API usage costs.
 * Integrates with IndexedDB for persistence.
 */

import { put, getAll, getAllByIndex, generateId, STORES } from '@/lib/db'
import type { CostRecord } from '@/lib/db/schema'
import { calculateCost, formatCost, getBudgetUsage } from './cost-calculator'
import type { Provider } from './pricing-data'

// Module names for categorizing costs
export type CostModule =
  | 'paper-lens'      // Paper summarization
  | 'prompt-lab'      // Prompt testing
  | 'arxiv-radar'     // ArXiv relevance scoring
  | 'research-notes'  // Note generation
  | 'latex-editor'    // LaTeX assistance
  | 'unknown'

/**
 * Record an API call cost
 */
export async function recordCost(
  provider: Provider,
  model: string,
  module: CostModule,
  inputTokens: number,
  outputTokens: number
): Promise<CostRecord> {
  const { totalCost } = calculateCost(provider, model, { inputTokens, outputTokens })

  const record: CostRecord = {
    id: generateId(),
    timestamp: Date.now(),
    provider,
    model,
    module,
    inputTokens,
    outputTokens,
    cost: totalCost,
  }

  await put(STORES.API_COSTS, record)

  // Check budget after recording
  await checkBudgetAlert()

  return record
}

/**
 * Get all cost records
 */
export async function getAllCosts(): Promise<CostRecord[]> {
  return getAll<CostRecord>(STORES.API_COSTS)
}

/**
 * Get costs by provider
 */
export async function getCostsByProvider(provider: Provider): Promise<CostRecord[]> {
  return getAllByIndex<CostRecord>(STORES.API_COSTS, 'provider', provider)
}

/**
 * Get costs by module
 */
export async function getCostsByModule(module: CostModule): Promise<CostRecord[]> {
  return getAllByIndex<CostRecord>(STORES.API_COSTS, 'module', module)
}

/**
 * Get costs within a time range
 */
export async function getCostsInRange(startTime: number, endTime: number): Promise<CostRecord[]> {
  const allCosts = await getAllCosts()
  return allCosts.filter(c => c.timestamp >= startTime && c.timestamp <= endTime)
}

/**
 * Get costs for the current month
 */
export async function getCurrentMonthCosts(): Promise<CostRecord[]> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
  return getCostsInRange(startOfMonth, endOfMonth)
}

/**
 * Get total spend for the current month
 */
export async function getCurrentMonthSpend(): Promise<number> {
  const costs = await getCurrentMonthCosts()
  return costs.reduce((sum, c) => sum + c.cost, 0)
}

/**
 * Get cost summary statistics
 */
export interface CostSummary {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  recordCount: number
  byProvider: Record<string, number>
  byModule: Record<string, number>
  byModel: Record<string, number>
  averageCostPerCall: number
}

export async function getCostSummary(costs?: CostRecord[]): Promise<CostSummary> {
  const records = costs || await getAllCosts()

  const summary: CostSummary = {
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    recordCount: records.length,
    byProvider: {},
    byModule: {},
    byModel: {},
    averageCostPerCall: 0,
  }

  for (const record of records) {
    summary.totalCost += record.cost
    summary.totalInputTokens += record.inputTokens
    summary.totalOutputTokens += record.outputTokens

    summary.byProvider[record.provider] = (summary.byProvider[record.provider] || 0) + record.cost
    summary.byModule[record.module] = (summary.byModule[record.module] || 0) + record.cost
    summary.byModel[record.model] = (summary.byModel[record.model] || 0) + record.cost
  }

  summary.averageCostPerCall = records.length > 0 ? summary.totalCost / records.length : 0

  return summary
}

/**
 * Get daily cost breakdown for a date range
 */
export interface DailyCost {
  date: string
  cost: number
  calls: number
}

export async function getDailyCosts(days = 30): Promise<DailyCost[]> {
  const now = Date.now()
  const startTime = now - (days * 24 * 60 * 60 * 1000)
  const costs = await getCostsInRange(startTime, now)

  const dailyMap = new Map<string, { cost: number; calls: number }>()

  for (const record of costs) {
    const date = new Date(record.timestamp).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || { cost: 0, calls: 0 }
    dailyMap.set(date, {
      cost: existing.cost + record.cost,
      calls: existing.calls + 1,
    })
  }

  // Fill in missing days
  const result: DailyCost[] = []
  const currentDate = new Date(startTime)
  const endDate = new Date(now)

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const data = dailyMap.get(dateStr) || { cost: 0, calls: 0 }
    result.push({
      date: dateStr,
      cost: data.cost,
      calls: data.calls,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

/**
 * Budget management
 */
let budgetSettings: { monthlyLimit?: number; alertThreshold?: number; alertEnabled: boolean } = {
  alertEnabled: false,
}

let budgetAlertCallback: ((message: string, spend: number, limit: number) => void) | null = null

/**
 * Set budget settings
 */
export function setBudgetSettings(settings: typeof budgetSettings): void {
  budgetSettings = settings
}

/**
 * Set callback for budget alerts
 */
export function onBudgetAlert(callback: typeof budgetAlertCallback): void {
  budgetAlertCallback = callback
}

/**
 * Check if budget alert should be triggered
 */
async function checkBudgetAlert(): Promise<void> {
  if (!budgetSettings.alertEnabled || !budgetSettings.monthlyLimit) return

  const currentSpend = await getCurrentMonthSpend()
  const { percentage, status } = getBudgetUsage(currentSpend, budgetSettings.monthlyLimit)

  const threshold = budgetSettings.alertThreshold || 80

  if (percentage >= threshold && budgetAlertCallback) {
    const message = status === 'critical'
      ? `Budget critical: ${percentage.toFixed(1)}% used (${formatCost(currentSpend)} / ${formatCost(budgetSettings.monthlyLimit)})`
      : `Budget warning: ${percentage.toFixed(1)}% used (${formatCost(currentSpend)} / ${formatCost(budgetSettings.monthlyLimit)})`

    budgetAlertCallback(message, currentSpend, budgetSettings.monthlyLimit)
  }
}

/**
 * Get budget status
 */
export async function getBudgetStatus(): Promise<{
  currentSpend: number
  monthlyLimit: number | undefined
  percentage: number
  remaining: number
  status: 'ok' | 'warning' | 'critical'
  daysRemaining: number
  projectedMonthlySpend: number
}> {
  const currentSpend = await getCurrentMonthSpend()
  const { percentage, remaining, status } = getBudgetUsage(
    currentSpend,
    budgetSettings.monthlyLimit || 0
  )

  // Calculate days remaining in month
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysRemaining = Math.max(1, endOfMonth.getDate() - now.getDate())
  const daysPassed = now.getDate()

  // Project monthly spend based on current usage
  const projectedMonthlySpend = daysPassed > 0
    ? (currentSpend / daysPassed) * (daysPassed + daysRemaining)
    : 0

  return {
    currentSpend,
    monthlyLimit: budgetSettings.monthlyLimit,
    percentage,
    remaining,
    status,
    daysRemaining,
    projectedMonthlySpend,
  }
}

/**
 * Get cost recommendations based on usage patterns
 */
export interface CostRecommendation {
  type: 'switch-model' | 'reduce-usage' | 'batch-requests' | 'use-cache'
  title: string
  description: string
  potentialSavings: number
}

export async function getCostRecommendations(): Promise<CostRecommendation[]> {
  const summary = await getCostSummary()
  const recommendations: CostRecommendation[] = []

  // Check if using expensive models when cheaper alternatives exist
  if (summary.byModel['gpt-4'] && summary.byModel['gpt-4'] > 0.5) {
    recommendations.push({
      type: 'switch-model',
      title: 'Consider GPT-4o Mini',
      description: 'You could save up to 95% by using GPT-4o Mini for suitable tasks.',
      potentialSavings: summary.byModel['gpt-4'] * 0.95,
    })
  }

  if (summary.byModel['claude-3-opus'] || summary.byModel['claude-3-opus-20240229']) {
    const opusCost = (summary.byModel['claude-3-opus'] || 0) + (summary.byModel['claude-3-opus-20240229'] || 0)
    if (opusCost > 0.5) {
      recommendations.push({
        type: 'switch-model',
        title: 'Consider Claude 3.5 Haiku',
        description: 'For many tasks, Claude 3.5 Haiku offers great performance at lower cost.',
        potentialSavings: opusCost * 0.85,
      })
    }
  }

  // High usage recommendations
  if (summary.recordCount > 100 && summary.averageCostPerCall > 0.01) {
    recommendations.push({
      type: 'batch-requests',
      title: 'Consider batching requests',
      description: 'Combining multiple queries into single requests can reduce overhead.',
      potentialSavings: summary.totalCost * 0.15,
    })
  }

  // Module-specific recommendations
  if (summary.byModule['arxiv-radar'] && summary.byModule['arxiv-radar'] > 1) {
    recommendations.push({
      type: 'use-cache',
      title: 'Enable caching for ArXiv scoring',
      description: 'Cache relevance scores to avoid re-scoring the same papers.',
      potentialSavings: summary.byModule['arxiv-radar'] * 0.3,
    })
  }

  return recommendations
}

/**
 * Export cost data as CSV
 */
export async function exportCostsAsCSV(): Promise<string> {
  const costs = await getAllCosts()

  const headers = ['Date', 'Provider', 'Model', 'Module', 'Input Tokens', 'Output Tokens', 'Cost (USD)']
  const rows = costs.map(c => [
    new Date(c.timestamp).toISOString(),
    c.provider,
    c.model,
    c.module,
    c.inputTokens.toString(),
    c.outputTokens.toString(),
    c.cost.toFixed(6),
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * Clear all cost records (for testing/reset)
 */
export async function clearAllCosts(): Promise<void> {
  const { clear } = await import('@/lib/db')
  await clear(STORES.API_COSTS)
}
