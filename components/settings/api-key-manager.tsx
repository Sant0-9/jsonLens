'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Provider } from '@/lib/settings/api-keys'
import { maskApiKey } from '@/lib/settings/encryption'
import { Key, Trash2, Check, X, Loader2, Eye, EyeOff } from 'lucide-react'

const PROVIDERS: { id: Provider; name: string; description: string; placeholder: string }[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, o1',
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 4 Sonnet, Claude 4.5 Haiku',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 2.5 Flash, Gemini Pro',
    placeholder: 'AI...',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Llama 3.1 70B (fast inference)',
    placeholder: 'gsk_...',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run models locally',
    placeholder: 'http://localhost:11434',
  },
]

export function ApiKeyManager() {
  const { apiKeyStatus, addApiKey, deleteApiKey, testKey, getKey, isSaving } = useSettingsStore()

  return (
    <div className="grid gap-4">
      {PROVIDERS.map((provider) => (
        <ApiKeyCard
          key={provider.id}
          provider={provider}
          status={apiKeyStatus.find((s) => s.provider === provider.id)}
          onSave={(key) => addApiKey(provider.id, key)}
          onDelete={() => deleteApiKey(provider.id)}
          onTest={(key) => testKey(provider.id, key)}
          onGetKey={() => getKey(provider.id)}
          isSaving={isSaving}
        />
      ))}
    </div>
  )
}

interface ApiKeyCardProps {
  provider: { id: Provider; name: string; description: string; placeholder: string }
  status?: { isSet: boolean; isValid: boolean }
  onSave: (key: string) => Promise<boolean>
  onDelete: () => Promise<void>
  onTest: (key: string) => Promise<boolean>
  onGetKey: () => Promise<string | null>
  isSaving: boolean
}

function ApiKeyCard({
  provider,
  status,
  onSave,
  onDelete,
  onTest,
  onGetKey,
  isSaving,
}: ApiKeyCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)
  const [maskedKey, setMaskedKey] = useState<string | null>(null)

  const handleEdit = async () => {
    setIsEditing(true)
    const key = await onGetKey()
    if (key) {
      setInputValue(key)
      setMaskedKey(maskApiKey(key))
    }
  }

  const handleSave = async () => {
    const success = await onSave(inputValue)
    if (success) {
      setIsEditing(false)
      setInputValue('')
      setTestResult(null)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setInputValue('')
    setTestResult(null)
  }

  const handleTest = async () => {
    setIsTesting(true)
    const result = await onTest(inputValue)
    setTestResult(result)
    setIsTesting(false)
  }

  const handleDelete = async () => {
    await onDelete()
    setMaskedKey(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <CardDescription className="text-sm">{provider.description}</CardDescription>
            </div>
          </div>
          {status?.isSet && !isEditing && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={provider.placeholder}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setTestResult(null)
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!inputValue || isTesting}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : testResult === true ? (
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                ) : testResult === false ? (
                  <X className="h-4 w-4 mr-1 text-red-600" />
                ) : null}
                Test
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!inputValue || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
            {testResult === false && (
              <p className="text-sm text-red-600">
                Connection failed. Please check your API key.
              </p>
            )}
          </div>
        ) : status?.isSet ? (
          <div className="flex items-center justify-between">
            <code className="text-sm text-muted-foreground">{maskedKey || '****...****'}</code>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Add API Key
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
