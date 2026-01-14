"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCost } from '@/lib/costs/cost-calculator'
import type { DailyCost, CostSummary } from '@/lib/costs/cost-tracker'

interface CostByProviderProps {
  summary: CostSummary
}

export function CostByProvider({ summary }: CostByProviderProps) {
  const providers = Object.entries(summary.byProvider).sort((a, b) => b[1] - a[1])
  const total = summary.totalCost || 1

  const colors: Record<string, string> = {
    openai: 'bg-green-500',
    anthropic: 'bg-orange-500',
    google: 'bg-blue-500',
    groq: 'bg-purple-500',
    ollama: 'bg-gray-500',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">By Provider</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data yet
          </p>
        ) : (
          providers.map(([provider, cost]) => {
            const percentage = (cost / total) * 100
            return (
              <div key={provider} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{provider}</span>
                  <span className="font-medium">{formatCost(cost)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[provider] || 'bg-gray-400'} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% of total
                </p>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

interface CostByModuleProps {
  summary: CostSummary
}

export function CostByModule({ summary }: CostByModuleProps) {
  const modules = Object.entries(summary.byModule).sort((a, b) => b[1] - a[1])
  const total = summary.totalCost || 1

  const moduleNames: Record<string, string> = {
    'paper-lens': 'Paper Lens',
    'prompt-lab': 'Prompt Lab',
    'arxiv-radar': 'ArXiv Radar',
    'research-notes': 'Research Notes',
    'latex-editor': 'LaTeX Editor',
    unknown: 'Other',
  }

  const colors: Record<string, string> = {
    'paper-lens': 'bg-blue-500',
    'prompt-lab': 'bg-purple-500',
    'arxiv-radar': 'bg-green-500',
    'research-notes': 'bg-yellow-500',
    'latex-editor': 'bg-red-500',
    unknown: 'bg-gray-500',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">By Module</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data yet
          </p>
        ) : (
          modules.map(([module, cost]) => {
            const percentage = (cost / total) * 100
            return (
              <div key={module} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{moduleNames[module] || module}</span>
                  <span className="font-medium">{formatCost(cost)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[module] || 'bg-gray-400'} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% of total
                </p>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

interface CostTimelineProps {
  dailyCosts: DailyCost[]
}

export function CostTimeline({ dailyCosts }: CostTimelineProps) {
  const last30Days = dailyCosts.slice(-30)
  const maxCost = Math.max(...last30Days.map(d => d.cost), 0.01)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Daily Spending (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {last30Days.every(d => d.cost === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No spending data yet
          </p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {last30Days.map((day) => {
              const height = (day.cost / maxCost) * 100
              return (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                  title={`${day.date}: ${formatCost(day.cost)}`}
                >
                  <div
                    className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {day.date.slice(5)}: {formatCost(day.cost)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{last30Days[0]?.date.slice(5) || ''}</span>
          <span>{last30Days[last30Days.length - 1]?.date.slice(5) || ''}</span>
        </div>
      </CardContent>
    </Card>
  )
}
