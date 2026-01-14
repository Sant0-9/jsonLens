"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCost } from '@/lib/costs/cost-calculator'
import { Lightbulb, TrendingDown, Zap, Database } from 'lucide-react'
import type { CostRecommendation } from '@/lib/costs/cost-tracker'

interface RecommendationsProps {
  recommendations: CostRecommendation[]
}

const typeIcons: Record<CostRecommendation['type'], React.ReactNode> = {
  'switch-model': <TrendingDown className="h-4 w-4" />,
  'reduce-usage': <Zap className="h-4 w-4" />,
  'batch-requests': <Database className="h-4 w-4" />,
  'use-cache': <Database className="h-4 w-4" />,
}

const typeColors: Record<CostRecommendation['type'], string> = {
  'switch-model': 'bg-blue-500/10 text-blue-500',
  'reduce-usage': 'bg-yellow-500/10 text-yellow-500',
  'batch-requests': 'bg-green-500/10 text-green-500',
  'use-cache': 'bg-purple-500/10 text-purple-500',
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <CardTitle className="text-sm font-medium">Cost Optimization Tips</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recommendations yet. Keep using the app to get personalized tips.
          </p>
        ) : (
          recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <div className={`p-2 rounded-full ${typeColors[rec.type]}`}>
                {typeIcons[rec.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  {rec.potentialSavings > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Save ~{formatCost(rec.potentialSavings)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {rec.description}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
