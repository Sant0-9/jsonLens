// Settings Zustand Store
import { create } from 'zustand'
import type { Settings } from '@/lib/db/schema'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import {
  saveApiKey,
  getApiKey,
  removeApiKey,
  testApiKey,
  getApiKeyStatus,
  type Provider,
  type ApiKeyStatus,
} from '@/lib/settings/api-keys'

interface SettingsState {
  // State
  settings: Settings
  apiKeyStatus: ApiKeyStatus[]
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions
  loadSettings: () => Promise<void>
  updateAppearance: (appearance: Partial<Settings['appearance']>) => Promise<void>
  updateCompilation: (compilation: Partial<Settings['compilation']>) => Promise<void>
  updateBudget: (budget: Partial<Settings['budget']>) => Promise<void>

  // API Key actions
  loadApiKeyStatus: () => Promise<void>
  addApiKey: (provider: Provider, key: string) => Promise<boolean>
  deleteApiKey: (provider: Provider) => Promise<void>
  testKey: (provider: Provider, key: string) => Promise<boolean>
  getKey: (provider: Provider) => Promise<string | null>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  apiKeyStatus: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const settings = await getSettings()
      set({ settings, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load settings',
        isLoading: false,
      })
    }
  },

  updateAppearance: async (appearance) => {
    set({ isSaving: true, error: null })
    try {
      const current = get().settings
      const updated = await updateSettings({
        appearance: { ...current.appearance, ...appearance },
      })
      set({ settings: updated, isSaving: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isSaving: false,
      })
    }
  },

  updateCompilation: async (compilation) => {
    set({ isSaving: true, error: null })
    try {
      const current = get().settings
      const updated = await updateSettings({
        compilation: { ...current.compilation, ...compilation },
      })
      set({ settings: updated, isSaving: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isSaving: false,
      })
    }
  },

  updateBudget: async (budget) => {
    set({ isSaving: true, error: null })
    try {
      const current = get().settings
      const updated = await updateSettings({
        budget: { ...current.budget, ...budget },
      })
      set({ settings: updated, isSaving: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
        isSaving: false,
      })
    }
  },

  loadApiKeyStatus: async () => {
    try {
      const status = await getApiKeyStatus()
      set({ apiKeyStatus: status })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load API key status',
      })
    }
  },

  addApiKey: async (provider, key) => {
    set({ isSaving: true, error: null })
    try {
      await saveApiKey(provider, key)
      await get().loadApiKeyStatus()
      set({ isSaving: false })
      return true
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save API key',
        isSaving: false,
      })
      return false
    }
  },

  deleteApiKey: async (provider) => {
    set({ isSaving: true, error: null })
    try {
      await removeApiKey(provider)
      await get().loadApiKeyStatus()
      set({ isSaving: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete API key',
        isSaving: false,
      })
    }
  },

  testKey: async (provider, key) => {
    try {
      return await testApiKey(provider, key)
    } catch {
      return false
    }
  },

  getKey: async (provider) => {
    return await getApiKey(provider)
  },
}))
