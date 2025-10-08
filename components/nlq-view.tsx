"use client"

import { JsonValue } from '@/store/json-store'
import { NaturalLanguageQuery } from './natural-language-query'
import { QueryIntent, VisualizationSuggestion } from '@/lib/natural-language-processor'
import { useJsonStore } from '@/store/json-store'

interface NLQViewProps {
  data: JsonValue
}

export function NLQView({ data }: NLQViewProps) {
  const { setView } = useJsonStore()

  const handleVisualize = (suggestion: VisualizationSuggestion) => {
    // Switch to visualization view with the suggested configuration
    setView('visualize')
    // TODO: Pass the suggestion configuration to the visualization view
    console.log('Visualization suggestion:', suggestion)
  }

  const handleQuery = (intent: QueryIntent) => {
    // Process the query intent
    console.log('Query intent:', intent)
    
    // For now, just switch to appropriate view based on intent
    if (intent.chartType) {
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