"use client"

import { useEffect, useState } from 'react'
import { CostSummary } from '@/components/costs/cost-summary'
import { CostByProvider, CostByModule, CostTimeline } from '@/components/costs/cost-charts'
import { Recommendations } from '@/components/costs/recommendations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  getCostSummary,
  getDailyCosts,
  getCurrentMonthSpend,
  getCostRecommendations,
  exportCostsAsCSV,
  type CostSummary as CostSummaryType,
  type DailyCost,
  type CostRecommendation,
} from '@/lib/costs/cost-tracker'
import { useSettingsStore } from '@/store/settings-store'
import { Download, RefreshCw, AlertCircle } from 'lucide-react'

export default function CostsPage() {
  const { settings } = useSettingsStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<CostSummaryType | null>(null)
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([])
  const [currentMonthSpend, setCurrentMonthSpend] = useState(0)
  const [recommendations, setRecommendations] = useState<CostRecommendation[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryData, daily, monthSpend, recs] = await Promise.all([
        getCostSummary(),
        getDailyCosts(30),
        getCurrentMonthSpend(),
        getCostRecommendations(),
      ])
      setSummary(summaryData)
      setDailyCosts(daily)
      setCurrentMonthSpend(monthSpend)
      setRecommendations(recs)
    } catch (error) {
      console.error('Failed to load cost data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const handleExport = async () => {
    try {
      const csv = await exportCostsAsCSV()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `api-costs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export costs:', error)
    }
  }

  if (!mounted) {
    return null
  }

  const budgetLimit = settings?.budget?.monthlyLimit

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Cost Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your API spending across all providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Budget Alert */}
      {budgetLimit && currentMonthSpend >= budgetLimit * 0.8 && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          currentMonthSpend >= budgetLimit
            ? 'bg-red-500/10 border border-red-500/50'
            : 'bg-yellow-500/10 border border-yellow-500/50'
        }`}>
          <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
            currentMonthSpend >= budgetLimit ? 'text-red-500' : 'text-yellow-500'
          }`} />
          <div>
            <p className={`font-medium ${
              currentMonthSpend >= budgetLimit ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {currentMonthSpend >= budgetLimit
                ? 'Budget Exceeded'
                : 'Budget Warning'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentMonthSpend >= budgetLimit
                ? `You have exceeded your monthly budget of $${budgetLimit.toFixed(2)}.`
                : `You have used ${((currentMonthSpend / budgetLimit) * 100).toFixed(0)}% of your monthly budget.`}
              {' '}
              <a href="/settings" className="text-primary hover:underline">
                Adjust budget settings
              </a>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading cost data...</div>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <CostSummary
            summary={summary}
            currentMonthSpend={currentMonthSpend}
            budgetLimit={budgetLimit}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostByProvider summary={summary} />
            <CostByModule summary={summary} />
          </div>

          {/* Timeline */}
          <CostTimeline dailyCosts={dailyCosts} />

          {/* Recommendations */}
          <Recommendations recommendations={recommendations} />

          {/* No Data State */}
          {summary.recordCount === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium">No cost data yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start using AI features like Paper Lens, Prompt Lab, or ArXiv Radar
                  to track your API spending.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Failed to load cost data</div>
        </div>
      )}
    </div>
  )
}
