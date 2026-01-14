'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settings-store'
import { ApiKeyManager } from '@/components/settings/api-key-manager'
import { AppearanceSettings } from '@/components/settings/appearance-settings'
import { CompilationSettings } from '@/components/settings/compilation-settings'
import { BudgetSettings } from '@/components/settings/budget-settings'
import { DataManagement } from '@/components/settings/data-management'

export default function SettingsPage() {
  const { loadSettings, loadApiKeyStatus, isLoading } = useSettingsStore()

  useEffect(() => {
    loadSettings()
    loadApiKeyStatus()
  }, [loadSettings, loadApiKeyStatus])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys, preferences, and application settings.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <ApiKeyManager />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">LaTeX Compilation</h2>
          <CompilationSettings />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <AppearanceSettings />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Budget & Alerts</h2>
          <BudgetSettings />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <DataManagement />
        </section>
      </div>
    </div>
  )
}
