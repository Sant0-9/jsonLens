"use client"

import { usePromptsStore } from '@/store/prompts-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function VariableEditor() {
  const { getVariables, variableValues, setVariableValue } = usePromptsStore()
  const variables = getVariables()

  if (variables.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Variables</CardTitle>
        <p className="text-xs text-muted-foreground">
          Fill in the template variables below
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {variables.map((variable) => (
          <div key={variable.name} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor={variable.name} className="text-sm">
                {variable.name}
              </Label>
              {variable.required && (
                <Badge variant="secondary" className="text-xs py-0">
                  required
                </Badge>
              )}
            </div>
            <Input
              id={variable.name}
              placeholder={variable.defaultValue || `Enter ${variable.name}...`}
              value={variableValues[variable.name] || ''}
              onChange={(e) => setVariableValue(variable.name, e.target.value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
