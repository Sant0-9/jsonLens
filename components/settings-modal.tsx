"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { PluginManager } from '@/components/plugin-manager'
import { LLMSettings } from '@/components/llm-settings'
import { Code, Zap, X } from 'lucide-react'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'plugins' | 'llm'>('plugins')
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div ref={modalRef} className="bg-card border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="settings-title" className="text-lg font-semibold">Settings</h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r bg-muted/30 p-4">
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'plugins' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('plugins')}
              >
                <Code className="h-4 w-4 mr-2" />
                Plugins
              </Button>
              <Button
                variant={activeTab === 'llm' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('llm')}
              >
                <Zap className="h-4 w-4 mr-2" />
                AI Settings
              </Button>
            </nav>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'plugins' && <PluginManager />}
            {activeTab === 'llm' && <LLMSettings onClose={onClose} />}
          </div>
        </div>
      </div>
    </div>
  )
}