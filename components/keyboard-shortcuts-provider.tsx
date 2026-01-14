'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import {
  getShortcutsManager,
  DEFAULT_SHORTCUTS,
  formatShortcut,
  type ShortcutConfig,
} from '@/lib/settings/keyboard-shortcuts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcutsContextType {
  showShortcutsDialog: () => void
  hideShortcutsDialog: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null)

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider')
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)

  const showShortcutsDialog = useCallback(() => setShowDialog(true), [])
  const hideShortcutsDialog = useCallback(() => setShowDialog(false), [])

  useEffect(() => {
    const manager = getShortcutsManager()

    // Register navigation shortcuts
    manager.register({
      id: 'goto-dashboard',
      keys: ['g', 'd'],
      description: 'Go to Dashboard',
      category: 'navigation',
      action: () => router.push('/'),
    })

    manager.register({
      id: 'goto-latex',
      keys: ['g', 'l'],
      description: 'Go to LaTeX Editor',
      category: 'navigation',
      action: () => router.push('/latex'),
    })

    manager.register({
      id: 'goto-papers',
      keys: ['g', 'p'],
      description: 'Go to Paper Lens',
      category: 'navigation',
      action: () => router.push('/papers'),
    })

    manager.register({
      id: 'goto-prompts',
      keys: ['g', 'r'],
      description: 'Go to Prompt Lab',
      category: 'navigation',
      action: () => router.push('/prompts'),
    })

    manager.register({
      id: 'goto-arxiv',
      keys: ['g', 'a'],
      description: 'Go to ArXiv Radar',
      category: 'navigation',
      action: () => router.push('/arxiv'),
    })

    manager.register({
      id: 'goto-notes',
      keys: ['g', 'n'],
      description: 'Go to Notes',
      category: 'navigation',
      action: () => router.push('/notes'),
    })

    manager.register({
      id: 'goto-experiments',
      keys: ['g', 'e'],
      description: 'Go to Experiments',
      category: 'navigation',
      action: () => router.push('/experiments'),
    })

    manager.register({
      id: 'goto-questions',
      keys: ['g', 'q'],
      description: 'Go to Questions',
      category: 'navigation',
      action: () => router.push('/questions'),
    })

    manager.register({
      id: 'goto-graph',
      keys: ['g', 'g'],
      description: 'Go to Knowledge Graph',
      category: 'navigation',
      action: () => router.push('/graph'),
    })

    manager.register({
      id: 'goto-costs',
      keys: ['g', 'c'],
      description: 'Go to Cost Dashboard',
      category: 'navigation',
      action: () => router.push('/costs'),
    })

    manager.register({
      id: 'goto-settings',
      keys: ['g', 's'],
      description: 'Go to Settings',
      category: 'navigation',
      action: () => router.push('/settings'),
    })

    // General shortcuts
    manager.register({
      id: 'show-shortcuts',
      keys: ['?'],
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: () => setShowDialog(true),
    })

    manager.register({
      id: 'escape',
      keys: ['Escape'],
      description: 'Close modal',
      category: 'general',
      action: () => setShowDialog(false),
    })

    return () => {
      // Cleanup shortcuts on unmount
      DEFAULT_SHORTCUTS.forEach(s => manager.unregister(s.id))
    }
  }, [router])

  // Group shortcuts by category
  const groupedShortcuts = DEFAULT_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, ShortcutConfig[]>)

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    general: 'General',
    editor: 'Editor',
    notes: 'Notes',
    papers: 'Papers',
    prompts: 'Prompt Lab',
  }

  return (
    <KeyboardShortcutsContext.Provider value={{ showShortcutsDialog, hideShortcutsDialog }}>
      {children}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map(shortcut => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                        {formatShortcut(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> to toggle this dialog
          </div>
        </DialogContent>
      </Dialog>
    </KeyboardShortcutsContext.Provider>
  )
}
