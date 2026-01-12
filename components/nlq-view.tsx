"use client"

import { JsonValue } from '@/store/json-store'
import { NaturalLanguageQuery } from './natural-language-query'
import { QueryIntent, VisualizationSuggestion } from '@/lib/natural-language-processor'
import { useJsonStore } from '@/store/json-store'

interface NLQViewProps {
  data: JsonValue
}

export function NLQView({ data }: NLQViewProps) {
  const { setView, setVisualizationConfig } = useJsonStore()

  const handleVisualize = (suggestion: VisualizationSuggestion) => {
    // Set visualization config before switching view
    setVisualizationConfig({
      chartType: suggestion.chartType,
      xField: suggestion.config.xField as string | undefined,
      yField: suggestion.config.yField as string | undefined,
      groupBy: suggestion.config.groupBy as string | undefined,
    })
    setView('visualize')
  }

  const handleQuery = (intent: QueryIntent) => {
    // Set visualization config if chart type is specified
    if (intent.chartType) {
      setVisualizationConfig({
        chartType: intent.chartType,
        xField: intent.fields?.[0],
        yField: intent.fields?.[1],
        groupBy: intent.groupBy?.[0],
      })
      setView('visualize')
    } else if (intent.action === 'filter' || intent.action === 'aggregate') {
      setView('query')
    } else {
      setView('table')
    }
  }

  return (
    <div className="p-6">
      <NaturalLanguageQuery
        data={data}
        onVisualize={handleVisualize}
        onQuery={handleQuery}
      />
    </div>
  )
}