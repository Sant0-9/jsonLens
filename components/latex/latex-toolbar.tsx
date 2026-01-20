"use client"

import { useLatexStore, LatexView } from '@/store/latex-store'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Eye,
  Split,
  FileOutput,
  Grid3X3,
  BookOpen,
  Download,
  Upload,
  Play,
  Check,
  Settings,
  Home,
  Sun,
  Moon,
  Terminal,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

interface LatexToolbarProps {
  onCheck?: () => void
  onCompile?: () => void
  showCompilationLog?: boolean
  onToggleLog?: () => void
}

export function LatexToolbar({ onCheck, onCompile, showCompilationLog, onToggleLog }: LatexToolbarProps) {
  const {
    view,
    setView,
    isCompiling,
    fileName,
    toggleSymbolPalette,
    toggleTemplates,
    showSymbolPalette,
    content,
  } = useLatexStore()

  const { theme, setTheme } = useTheme()

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'document.tex'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.tex,.latex,.bib'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          useLatexStore.getState().setContent(text)
          useLatexStore.getState().setFileName(file.name)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const viewOptions: { id: LatexView; icon: React.ReactNode; label: string }[] = [
    { id: 'split', icon: <Split className="h-4 w-4" />, label: 'Split' },
    { id: 'editor', icon: <FileText className="h-4 w-4" />, label: 'Editor' },
    { id: 'preview', icon: <Eye className="h-4 w-4" />, label: 'Preview' },
    { id: 'pdf', icon: <FileOutput className="h-4 w-4" />, label: 'PDF' },
  ]

  return (
    <div className="border-b bg-card p-2 flex items-center justify-between gap-2 flex-wrap">
      {/* Left section - Navigation & File info */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm" title="Back to JSON Editor">
            <Home className="h-4 w-4" />
          </Button>
        </Link>

        <div className="h-6 w-px bg-border" />

        <span className="text-sm font-medium text-muted-foreground">
          {fileName}
        </span>
      </div>

      {/* Center section - View switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1" role="group" aria-label="View options">
        {viewOptions.map((option) => (
          <Button
            key={option.id}
            variant={view === option.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView(option.id)}
            title={option.label}
          >
            {option.icon}
            <span className="ml-1 hidden sm:inline">{option.label}</span>
          </Button>
        ))}
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant={showSymbolPalette ? 'secondary' : 'outline'}
          size="sm"
          onClick={toggleSymbolPalette}
          title="Symbol Palette"
        >
          <Grid3X3 className="h-4 w-4" />
          <span className="ml-1 hidden md:inline">Symbols</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleTemplates}
          title="Templates"
        >
          <BookOpen className="h-4 w-4" />
          <span className="ml-1 hidden md:inline">Templates</span>
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          title="Import .tex file"
        >
          <Upload className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          title="Export .tex file"
        >
          <Download className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          disabled={isCompiling}
          onClick={onCheck}
          title="Check for errors (no PDF)"
        >
          <Check className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Check</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          disabled={isCompiling}
          onClick={onCompile}
          title="Compile to PDF (Ctrl+Enter)"
        >
          <Play className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">
            {isCompiling ? 'Building...' : 'Build PDF'}
          </span>
        </Button>

        <Button
          variant={showCompilationLog ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleLog}
          title="Toggle Compilation Log"
        >
          <Terminal className="h-4 w-4" />
          <span className="ml-1 hidden md:inline">Log</span>
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button variant="ghost" size="sm" title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
