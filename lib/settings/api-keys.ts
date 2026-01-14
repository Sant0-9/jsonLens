// API Key Management
import { get, put, STORES } from '@/lib/db'
import type { SettingsRecord } from '@/lib/db/schema'
import { encrypt, decrypt, validateApiKeyFormat } from './encryption'

export type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama'

export interface ApiKeyStatus {
  provider: Provider
  isSet: boolean
  isValid: boolean
  lastTested?: number
}

const API_KEYS_KEY = 'api-keys'

interface StoredApiKeys {
  openai?: string
  anthropic?: string
  google?: string
  groq?: string
  ollamaUrl?: string
}

export async function saveApiKey(provider: Provider, key: string): Promise<void> {
  // Validate format first
  if (provider !== 'ollama' && !validateApiKeyFormat(provider, key)) {
    throw new Error(`Invalid API key format for ${provider}`)
  }

  const existing = await getStoredKeys()

  // Encrypt the key
  const encryptedKey = provider === 'ollama' ? key : await encrypt(key)

  const updated: StoredApiKeys = {
    ...existing,
    [provider === 'ollama' ? 'ollamaUrl' : provider]: encryptedKey,
  }

  await put<SettingsRecord>(STORES.SETTINGS, {
    key: API_KEYS_KEY,
    value: updated,
  })
}

export async function getApiKey(provider: Provider): Promise<string | null> {
  const keys = await getStoredKeys()
  const key = provider === 'ollama' ? keys.ollamaUrl : keys[provider]

  if (!key) return null

  // Ollama URL is not encrypted
  if (provider === 'ollama') return key

  try {
    return await decrypt(key)
  } catch {
    return null
  }
}

export async function removeApiKey(provider: Provider): Promise<void> {
  const existing = await getStoredKeys()
  const keyName = provider === 'ollama' ? 'ollamaUrl' : provider

  const updated = { ...existing }
  delete updated[keyName as keyof StoredApiKeys]

  await put<SettingsRecord>(STORES.SETTINGS, {
    key: API_KEYS_KEY,
    value: updated,
  })
}

export async function getApiKeyStatus(): Promise<ApiKeyStatus[]> {
  const keys = await getStoredKeys()

  const providers: Provider[] = ['openai', 'anthropic', 'google', 'groq', 'ollama']

  return providers.map(provider => ({
    provider,
    isSet: provider === 'ollama' ? !!keys.ollamaUrl : !!keys[provider],
    isValid: true, // Will be set after testing
  }))
}

async function getStoredKeys(): Promise<StoredApiKeys> {
  const record = await get<SettingsRecord>(STORES.SETTINGS, API_KEYS_KEY)
  return (record?.value as StoredApiKeys) || {}
}

// Test API key validity
export async function testApiKey(provider: Provider, key: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai':
        return await testOpenAI(key)
      case 'anthropic':
        return await testAnthropic(key)
      case 'google':
        return await testGoogle(key)
      case 'groq':
        return await testGroq(key)
      case 'ollama':
        return await testOllama(key)
      default:
        return false
    }
  } catch {
    return false
  }
}

async function testOpenAI(key: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  return response.ok
}

async function testAnthropic(key: string): Promise<boolean> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  })
  // 400 means invalid request but key is valid
  // 401 means invalid key
  return response.ok || response.status === 400
}

async function testGoogle(key: string): Promise<boolean> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${key}`
  )
  return response.ok
}

async function testGroq(key: string): Promise<boolean> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  return response.ok
}

async function testOllama(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/tags`)
    return response.ok
  } catch {
    return false
  }
}
