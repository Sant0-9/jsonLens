'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { Menu, Moon, Sun, Settings, Home, Keyboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useKeyboardShortcuts } from '@/components/keyboard-shortcuts-provider'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { showShortcutsDialog } = useKeyboardShortcuts()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/latex')) return 'LaTeX Editor'
    if (pathname.startsWith('/papers')) return 'Paper Lens'
    if (pathname.startsWith('/prompts')) return 'Prompt Lab'
    if (pathname.startsWith('/arxiv')) return 'ArXiv Radar'
    if (pathname.startsWith('/notes')) return 'Research Notes'
    if (pathname.startsWith('/experiments')) return 'Experiment Log'
    if (pathname.startsWith('/questions')) return 'Research Questions'
    if (pathname.startsWith('/graph')) return 'Knowledge Graph'
    if (pathname.startsWith('/costs')) return 'Cost Dashboard'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'Research Workbench'
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Link href="/" className="md:hidden">
            <Home className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Link>
          <h1 className="font-semibold">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={showShortcutsDialog}
          title="Keyboard shortcuts (?)"
          className="hidden sm:flex"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
