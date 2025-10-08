"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Zap } from 'lucide-react'

interface LLMSettingsProps {
  onClose: () => void
}

export function LLMSettings({ onClose }: LLMSettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-3.5-turbo')
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      // Store the API key securely
      localStorage.setItem('jsonlens-llm-api-key', apiKey)
      localStorage.setItem('jsonlens-llm-provider', provider)
      localStorage.setItem('jsonlens-llm-model', model)
      
      // Validate the API key by making a test request
      const response = await fetch('/api/validate-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          provider,
          model
        })
      })

      if (response.ok) {
        setValidationStatus('valid')
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        throw new Error('Invalid API key or configuration')
      }
    } catch (err) {
      setValidationStatus('invalid')
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('jsonlens-llm-api-key')
    localStorage.removeItem('jsonlens-llm-provider')
    localStorage.removeItem('jsonlens-llm-model')
    setApiKey('')
    setValidationStatus('idle')
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            LLM Integration Settings
          </CardTitle>
          <CardDescription>
            Configure AI-powered features with your own API key. Your data stays private.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">Local Model</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {validationStatus === 'valid' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Configuration saved successfully
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isValidating || !apiKey.trim()}>
              {isValidating ? 'Validating...' : 'Save Configuration'}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Your API key is stored locally and never sent to our servers.</p>
            <p>AI features are optional and require your explicit consent.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}