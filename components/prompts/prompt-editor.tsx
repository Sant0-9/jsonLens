"use client"

import { usePromptsStore } from '@/store/prompts-store'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { VariableEditor } from './variable-editor'
import { Play, Loader2, Square, Sparkles } from 'lucide-react'
import { PROMPT_TEMPLATES, type TemplateId } from '@/lib/prompts/template-engine'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function PromptEditor() {
  const {
    systemPrompt,
    userPrompt,
    setSystemPrompt,
    setUserPrompt,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    isRunning,
    runPromptStreaming,
    stopRun,
    selectedModels,
  } = usePromptsStore()

  const handleUseTemplate = (templateId: TemplateId) => {
    const template = PROMPT_TEMPLATES[templateId]
    setSystemPrompt(template.systemPrompt)
    setUserPrompt(template.userPrompt)
  }

  return (
    <div className="space-y-4">
      {/* System Prompt */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">System Prompt</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-3 w-3 mr-2" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(PROMPT_TEMPLATES).map(([id, template]) => (
                  <DropdownMenuItem
                    key={id}
                    onClick={() => handleUseTemplate(id as TemplateId)}
                  >
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="You are a helpful assistant..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="min-h-[80px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* User Prompt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">User Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your prompt here... Use {{variable}} for template variables."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Variables */}
      <VariableEditor />

      {/* Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Temperature</Label>
              <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              0-0.7: focused | 0.7-1.0: balanced | 1.0+: random (not recommended)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Max Tokens</Label>
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
              min={1}
              max={128000}
            />
          </div>
        </CardContent>
      </Card>

      {/* Run Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!userPrompt.trim() || selectedModels.length === 0}
        onClick={isRunning ? stopRun : runPromptStreaming}
      >
        {isRunning ? (
          <>
            <Square className="h-4 w-4 mr-2" />
            Stop
          </>
        ) : (
          <>
            {selectedModels.length > 0 ? (
              <Play className="h-4 w-4 mr-2" />
            ) : (
              <Loader2 className="h-4 w-4 mr-2" />
            )}
            {selectedModels.length === 0
              ? 'Select Models'
              : `Run on ${selectedModels.length} Model${selectedModels.length !== 1 ? 's' : ''}`}
          </>
        )}
      </Button>
    </div>
  )
}
