"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCost, formatTokens } from '@/lib/costs/cost-calculator'
import { DollarSign, TrendingUp, Coins, Activity } from 'lucide-react'
import type { CostSummary as CostSummaryType } from '@/lib/costs/cost-tracker'

interface CostSummaryProps {
  summary: CostSummaryType
  currentMonthSpend: number
  budgetLimit?: number
}

export function CostSummary({ summary, currentMonthSpend, budgetLimit }: CostSummaryProps) {
  const budgetPercentage = budgetLimit && budgetLimit > 0
    ? Math.min(100, (currentMonthSpend / budgetLimit) * 100)
    : 0

  const getBudgetColor = () => {
    if (!budgetLimit) return 'text-muted-foreground'
    if (budgetPercentage >= 90) return 'text-red-500'
    if (budgetPercentage >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCost(currentMonthSpend)}</div>
          {budgetLimit && budgetLimit > 0 && (
            <p className={`text-xs ${getBudgetColor()}`}>
              {budgetPercentage.toFixed(0)}% of {formatCost(budgetLimit)} budget
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCost(summary.totalCost)}</div>
          <p className="text-xs text-muted-foreground">
            {summary.recordCount} API calls
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatTokens(summary.totalInputTokens + summary.totalOutputTokens)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatTokens(summary.totalInputTokens)} in / {formatTokens(summary.totalOutputTokens)} out
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Per Call</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCost(summary.averageCostPerCall)}</div>
          <p className="text-xs text-muted-foreground">
            per API call
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
