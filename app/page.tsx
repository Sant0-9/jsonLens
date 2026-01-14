'use client'

import { useEffect, useState } from 'react'
import { ModuleCard } from '@/components/dashboard/module-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { useSettingsStore } from '@/store/settings-store'
import {
  FileEdit,
  FileText,
  Sparkles,
  Newspaper,
  FlaskConical,
  DollarSign,
  Settings,
  StickyNote,
  HelpCircle,
  Network,
} from 'lucide-react'

const MODULES = [
  {
    title: 'LaTeX Editor',
    description: 'Full Overleaf replacement with unlimited compilation',
    href: '/latex',
    icon: <FileEdit className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Paper Lens',
    description: 'AI-powered paper reading and summarization',
    href: '/papers',
    icon: <FileText className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Prompt Lab',
    description: 'Test prompts across multiple models',
    href: '/prompts',
    icon: <Sparkles className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'ArXiv Radar',
    description: 'AI-filtered daily paper recommendations',
    href: '/arxiv',
    icon: <Newspaper className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Research Notes',
    description: 'Markdown + KaTeX notes with wikilinks',
    href: '/notes',
    icon: <StickyNote className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Experiment Log',
    description: 'Lightweight ML experiment tracking',
    href: '/experiments',
    icon: <FlaskConical className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Research Questions',
    description: 'Track open questions linked to papers and notes',
    href: '/questions',
    icon: <HelpCircle className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Knowledge Graph',
    description: 'Visualize connections between papers and notes',
    href: '/graph',
    icon: <Network className="h-6 w-6" />,
    badge: 'Active',
  },
  {
    title: 'Cost Dashboard',
    description: 'Track your API spending across providers',
    href: '/costs',
    icon: <DollarSign className="h-6 w-6" />,
    badge: 'Active',
  },
]

export default function DashboardPage() {
  const { loadApiKeyStatus, apiKeyStatus } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadApiKeyStatus()
  }, [loadApiKeyStatus])

  const connectedProviders = apiKeyStatus.filter((s) => s.isSet).length

  if (!mounted) {
    return null
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Research Workbench</h1>
        <p className="text-muted-foreground mt-2">
          Bring Your Own Keys. Pay API costs, not subscriptions.
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectedProviders > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm">
            {connectedProviders} API {connectedProviders === 1 ? 'provider' : 'providers'} connected
          </span>
        </div>
        <a
          href="/settings"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Settings className="h-3 w-3" />
          Manage API Keys
        </a>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((module) => (
          <ModuleCard key={module.title} {...module} />
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All data stored locally in your browser. Your API keys are encrypted.</p>
      </div>
    </div>
  )
}
