/**
 * Keyboard shortcuts system for Research Workbench
 * Provides global navigation and module-specific shortcuts
 */

export interface KeyboardShortcut {
  id: string
  keys: string[] // e.g., ['ctrl', 'k'] or ['meta', 'shift', 'p']
  description: string
  category: 'navigation' | 'editor' | 'general' | 'notes' | 'papers' | 'prompts'
  action: () => void
}

export interface ShortcutConfig {
  id: string
  keys: string[]
  description: string
  category: KeyboardShortcut['category']
}

// Default shortcuts configuration
export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // Navigation
  { id: 'goto-dashboard', keys: ['g', 'd'], description: 'Go to Dashboard', category: 'navigation' },
  { id: 'goto-latex', keys: ['g', 'l'], description: 'Go to LaTeX Editor', category: 'navigation' },
  { id: 'goto-papers', keys: ['g', 'p'], description: 'Go to Paper Lens', category: 'navigation' },
  { id: 'goto-prompts', keys: ['g', 'r'], description: 'Go to Prompt Lab', category: 'navigation' },
  { id: 'goto-arxiv', keys: ['g', 'a'], description: 'Go to ArXiv Radar', category: 'navigation' },
  { id: 'goto-notes', keys: ['g', 'n'], description: 'Go to Notes', category: 'navigation' },
  { id: 'goto-experiments', keys: ['g', 'e'], description: 'Go to Experiments', category: 'navigation' },
  { id: 'goto-questions', keys: ['g', 'q'], description: 'Go to Questions', category: 'navigation' },
  { id: 'goto-graph', keys: ['g', 'g'], description: 'Go to Knowledge Graph', category: 'navigation' },
  { id: 'goto-costs', keys: ['g', 'c'], description: 'Go to Cost Dashboard', category: 'navigation' },
  { id: 'goto-settings', keys: ['g', 's'], description: 'Go to Settings', category: 'navigation' },

  // General
  { id: 'show-shortcuts', keys: ['?'], description: 'Show keyboard shortcuts', category: 'general' },
  { id: 'quick-search', keys: ['ctrl', 'k'], description: 'Quick search / command palette', category: 'general' },
  { id: 'new-item', keys: ['ctrl', 'n'], description: 'Create new item (context-aware)', category: 'general' },
  { id: 'save', keys: ['ctrl', 's'], description: 'Save current item', category: 'general' },
  { id: 'escape', keys: ['Escape'], description: 'Close modal / cancel action', category: 'general' },

  // Editor shortcuts
  { id: 'compile', keys: ['ctrl', 'Enter'], description: 'Compile LaTeX document', category: 'editor' },
  { id: 'toggle-preview', keys: ['ctrl', 'p'], description: 'Toggle preview panel', category: 'editor' },
  { id: 'find', keys: ['ctrl', 'f'], description: 'Find in document', category: 'editor' },
  { id: 'replace', keys: ['ctrl', 'h'], description: 'Find and replace', category: 'editor' },

  // Notes shortcuts
  { id: 'toggle-edit-mode', keys: ['ctrl', 'e'], description: 'Toggle edit/preview mode', category: 'notes' },
  { id: 'insert-link', keys: ['ctrl', 'l'], description: 'Insert wikilink', category: 'notes' },
  { id: 'insert-math', keys: ['ctrl', 'm'], description: 'Insert math block', category: 'notes' },

  // Papers shortcuts
  { id: 'import-paper', keys: ['ctrl', 'i'], description: 'Import paper', category: 'papers' },
  { id: 'generate-summary', keys: ['ctrl', 'g'], description: 'Generate AI summary', category: 'papers' },

  // Prompts shortcuts
  { id: 'run-prompt', keys: ['ctrl', 'Enter'], description: 'Run prompt', category: 'prompts' },
  { id: 'clear-response', keys: ['ctrl', 'shift', 'c'], description: 'Clear responses', category: 'prompts' },
]

// Utility to format key combination for display
export function formatShortcut(keys: string[]): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return keys
    .map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl':
          return isMac ? 'Cmd' : 'Ctrl'
        case 'meta':
          return isMac ? 'Cmd' : 'Win'
        case 'alt':
          return isMac ? 'Option' : 'Alt'
        case 'shift':
          return 'Shift'
        case 'enter':
          return 'Enter'
        case 'escape':
          return 'Esc'
        case 'backspace':
          return 'Backspace'
        case 'delete':
          return 'Del'
        case 'arrowup':
          return 'Up'
        case 'arrowdown':
          return 'Down'
        case 'arrowleft':
          return 'Left'
        case 'arrowright':
          return 'Right'
        default:
          return key.toUpperCase()
      }
    })
    .join(' + ')
}

// Check if a keyboard event matches a shortcut
export function matchesShortcut(event: KeyboardEvent, keys: string[]): boolean {
  const pressedKeys: string[] = []

  if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl')
  if (event.shiftKey) pressedKeys.push('shift')
  if (event.altKey) pressedKeys.push('alt')

  // Add the actual key
  const key = event.key.toLowerCase()
  if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
    pressedKeys.push(key)
  }

  // Normalize keys for comparison
  const normalizedShortcut = keys.map(k => k.toLowerCase())

  // Check if arrays match (order-independent for modifiers)
  if (pressedKeys.length !== normalizedShortcut.length) return false

  const modifiers = ['ctrl', 'shift', 'alt']
  const pressedModifiers = pressedKeys.filter(k => modifiers.includes(k))
  const shortcutModifiers = normalizedShortcut.filter(k => modifiers.includes(k))

  // Check modifiers match
  if (pressedModifiers.length !== shortcutModifiers.length) return false
  if (!pressedModifiers.every(m => shortcutModifiers.includes(m))) return false

  // Check non-modifier key matches
  const pressedKey = pressedKeys.find(k => !modifiers.includes(k))
  const shortcutKey = normalizedShortcut.find(k => !modifiers.includes(k))

  return pressedKey === shortcutKey
}

// Keyboard shortcuts manager class
export class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private sequenceBuffer: string[] = []
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }

  register(shortcut: KeyboardShortcut) {
    this.shortcuts.set(shortcut.id, shortcut)
  }

  unregister(id: string) {
    this.shortcuts.delete(id)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow escape and some ctrl shortcuts
      if (event.key !== 'Escape' && !(event.ctrlKey || event.metaKey)) {
        return
      }
    }

    // Handle sequence shortcuts (like 'g d')
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
      this.sequenceBuffer.push(event.key.toLowerCase())

      if (this.sequenceTimeout) {
        clearTimeout(this.sequenceTimeout)
      }

      // Check for sequence match
      for (const shortcut of this.shortcuts.values()) {
        if (shortcut.keys.length > 1 && !shortcut.keys.some(k => ['ctrl', 'shift', 'alt', 'meta'].includes(k))) {
          if (this.sequenceBuffer.join('') === shortcut.keys.join('')) {
            event.preventDefault()
            shortcut.action()
            this.sequenceBuffer = []
            return
          }
        }
      }

      // Reset buffer after timeout
      this.sequenceTimeout = setTimeout(() => {
        this.sequenceBuffer = []
      }, 500)

      return
    }

    // Handle regular shortcuts
    for (const shortcut of this.shortcuts.values()) {
      if (matchesShortcut(event, shortcut.keys)) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    }
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout)
    }
  }
}

// Create singleton instance
let shortcutsManager: KeyboardShortcutsManager | null = null

export function getShortcutsManager(): KeyboardShortcutsManager {
  if (!shortcutsManager) {
    shortcutsManager = new KeyboardShortcutsManager()
  }
  return shortcutsManager
}
