"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { providerRegistry, type ModelInfo } from '@/lib/prompts/provider-registry'
import { usePromptsStore } from '@/store/prompts-store'
import { Check, X } from 'lucide-react'

interface ModelWithProvider extends ModelInfo {
  providerId: string
  providerName: string
}

export function ModelSelector() {
  const { selectedModels, toggleModel, clearModels } = usePromptsStore()
  const [models, setModels] = useState<ModelWithProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadModels() {
      const configured = await providerRegistry.getConfiguredModels()
      setModels(configured)
      setLoading(false)
    }
    loadModels()
  }, [])

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.providerId]) {
      acc[model.providerId] = {
        name: model.providerName,
        models: [],
      }
    }
    acc[model.providerId].models.push(model)
    return acc
  }, {} as Record<string, { name: string; models: ModelWithProvider[] }>)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Models</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading models...</p>
        </CardContent>
      </Card>
    )
  }

  if (models.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Models</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No API keys configured. Add keys in{' '}
            <a href="/settings" className="text-primary hover:underline">
              Settings
            </a>
            .
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Models</CardTitle>
          {selectedModels.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearModels}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        {selectedModels.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(modelsByProvider).map(([providerId, { name, models: providerModels }]) => (
          <div key={providerId} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {name}
            </h4>
            <div className="space-y-1">
              {providerModels.map((model) => {
                const isSelected = selectedModels.includes(model.id)
                return (
                  <label
                    key={model.id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{model.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          ${model.inputPrice.toFixed(4)}/{model.outputPrice.toFixed(4)} per 1K
                        </span>
                        {model.contextLength >= 100000 && (
                          <Badge variant="secondary" className="text-xs py-0">
                            {Math.round(model.contextLength / 1000)}K ctx
                          </Badge>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
