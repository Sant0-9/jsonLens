"use client"

import { useState, useMemo } from 'react'
import { JsonValue } from '@/store/json-store'
import { naturalLanguageProcessor, QueryIntent, VisualizationSuggestion } from '@/lib/natural-language-processor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Zap, BarChart3, TrendingUp, PieChart, Grid3X3, TreePine, Table, Network } from 'lucide-react'

interface NaturalLanguageQueryProps {
  data: JsonValue
  onVisualize: (suggestion: VisualizationSuggestion) => void
  onQuery: (intent: QueryIntent) => void
}

const chartIcons = {
  bar: BarChart3,
  line: TrendingUp,
  pie: PieChart,
  scatter: BarChart3, // Using BarChart3 as fallback for scatter
  area: TrendingUp,
  heatmap: Grid3X3,
  treemap: TreePine,
  table: Table,
  graph: Network
}

export function NaturalLanguageQuery({ data, onVisualize, onQuery }: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastIntent, setLastIntent] = useState<QueryIntent | null>(null)

  const suggestions = useMemo(() => {
    return naturalLanguageProcessor.generateVisualizationSuggestions(data)
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsProcessing(true)
    try {
      const intent = naturalLanguageProcessor.parseQuery(query, data)
      setLastIntent(intent)
      onQuery(intent)
    } catch {
      // Query processing failed - silent failure, user can retry
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionClick = (suggestion: VisualizationSuggestion) => {
    onVisualize(suggestion)
  }

  const exampleQueries = [
    "Show me sales data as a bar chart",
    "Create a line chart of revenue over time",
    "Display the distribution of categories as a pie chart",
    "Plot the relationship between price and quantity",
    "Show a heatmap of sales by region and product",
    "Group data by category and show totals",
    "Filter data where price is greater than 100",
    "Sort by revenue in descending order"
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Natural Language Query
        </h3>
        <p className="text-sm text-muted-foreground">
          Ask questions about your data in plain English and get instant visualizations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ask a Question
          </CardTitle>
          <CardDescription>
            Describe what you want to see or analyze in your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Show me sales data as a bar chart"
                className="flex-1"
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing || !query.trim()}>
                {isProcessing ? 'Processing...' : 'Ask'}
              </Button>
            </div>
          </form>

          {lastIntent && (
            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <h4 className="text-sm font-medium mb-2">Query Analysis:</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Action:</strong> {lastIntent.action}</div>
                {lastIntent.chartType && <div><strong>Chart Type:</strong> {lastIntent.chartType}</div>}
                {lastIntent.fields && lastIntent.fields.length > 0 && (
                  <div><strong>Fields:</strong> {lastIntent.fields.join(', ')}</div>
                )}
                {lastIntent.filters && lastIntent.filters.length > 0 && (
                  <div><strong>Filters:</strong> {lastIntent.filters.map(f => `${f.field} ${f.operator} ${f.value}`).join(', ')}</div>
                )}
                {lastIntent.aggregation && (
                  <div><strong>Aggregation:</strong> {lastIntent.aggregation.operation} of {lastIntent.aggregation.field}</div>
                )}
                <div><strong>Confidence:</strong> {Math.round(lastIntent.confidence * 100)}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h4 className="text-md font-semibold mb-3">Suggested Visualizations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => {
            const IconComponent = chartIcons[suggestion.chartType as keyof typeof chartIcons] || BarChart3
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm">{suggestion.title}</h5>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.chartType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% match
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-3">Example Queries</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exampleQueries.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="justify-start text-left h-auto p-3"
              onClick={() => setQuery(example)}
            >
              <span className="text-sm">{example}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}