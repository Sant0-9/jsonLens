"use client"

import { usePromptsStore, type RunResult } from '@/store/prompts-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { providerRegistry } from '@/lib/prompts/provider-registry'
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ResponseCardProps {
  modelId: string
  result: RunResult
}

function ResponseCard({ modelId, result }: ResponseCardProps) {
  const [copied, setCopied] = useState(false)

  const model = providerRegistry.getAllModels().find(m => m.id === modelId)
  const modelName = model?.name || modelId

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cost = result.response
    ? ((result.response.inputTokens * (model?.inputPrice || 0) / 1000) +
       (result.response.outputTokens * (model?.outputPrice || 0) / 1000))
    : 0

  return (
    <Card className={result.error ? 'border-destructive' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{modelName}</CardTitle>
            {result.streaming && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {result.response && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{result.response.inputTokens + result.response.outputTokens} tokens</span>
                <span>${cost.toFixed(4)}</span>
                {result.response.latencyMs > 0 && (
                  <span>{(result.response.latencyMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            )}
            {!result.error && result.content && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {result.error ? (
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm">{result.error}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="text-sm whitespace-pre-wrap">{result.content || 'Waiting...'}</div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export function ResponsePanel() {
  const { results, isRunning, selectedModels } = usePromptsStore()

  if (selectedModels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select models to compare responses</p>
      </div>
    )
  }

  if (results.size === 0 && !isRunning) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Run a prompt to see responses</p>
      </div>
    )
  }

  const resultArray = Array.from(results.entries())

  // Show in grid for multiple models
  if (resultArray.length > 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resultArray.map(([modelId, result]) => (
          <ResponseCard key={modelId} modelId={modelId} result={result} />
        ))}
      </div>
    )
  }

  // Single model - full width
  if (resultArray.length === 1) {
    const [modelId, result] = resultArray[0]
    return <ResponseCard modelId={modelId} result={result} />
  }

  return null
}
