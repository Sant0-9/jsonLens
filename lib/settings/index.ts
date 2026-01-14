// General Settings Management
import { get, put, STORES } from '@/lib/db'
import type { Settings, SettingsRecord } from '@/lib/db/schema'

const SETTINGS_KEY = 'app-settings'

export const DEFAULT_SETTINGS: Settings = {
  apiKeys: {},
  compilation: {
    method: 'online',
    defaultEngine: 'pdflatex',
  },
  appearance: {
    theme: 'system',
    editorFontSize: 14,
    editorFontFamily: 'JetBrains Mono, Fira Code, monospace',
    lineHeight: 1.5,
    tabSize: 2,
  },
  budget: {
    alertEnabled: false,
  },
}

export async function getSettings(): Promise<Settings> {
  const record = await get<SettingsRecord>(STORES.SETTINGS, SETTINGS_KEY)
  if (!record?.value) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...(record.value as Partial<Settings>) }
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()

  // Deep merge settings
  const updated: Settings = {
    apiKeys: { ...current.apiKeys, ...updates.apiKeys },
    compilation: { ...current.compilation, ...updates.compilation },
    appearance: { ...current.appearance, ...updates.appearance },
    budget: { ...current.budget, ...updates.budget },
  }

  await put<SettingsRecord>(STORES.SETTINGS, {
    key: SETTINGS_KEY,
    value: updated,
  })

  return updated
}

export async function resetSettings(): Promise<Settings> {
  await put<SettingsRecord>(STORES.SETTINGS, {
    key: SETTINGS_KEY,
    value: DEFAULT_SETTINGS,
  })
  return DEFAULT_SETTINGS
}

// Export types
export type { Settings } from '@/lib/db/schema'
export * from './api-keys'
