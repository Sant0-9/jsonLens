"use client"

import { useEffect, useCallback, useState } from 'react'
import { useLatexStore } from '@/store/latex-store'
import { LatexToolbar } from './latex-toolbar'
import { LatexMonaco } from './latex-monaco'
import { LatexPreview } from './latex-preview'
import { SymbolPalette } from './symbol-palette'
import { LatexPDFViewer } from './latex-pdf-viewer'
import { CompilationLog } from './compilation-log'
import { compile, CompilationError } from '@/lib/latex/compiler'

export function LatexEditor() {
  const {
    view,
    content,
    fileName,
    showSymbolPalette,
    toggleSymbolPalette,
    setContent,
    compiledPDF,
    compilationLog,
    compilationErrors,
    compilationWarnings,
    isCompiling,
    setCompiling,
    setCompilationResult,
    setView,
  } = useLatexStore()

  const [showCompilationLog, setShowCompilationLog] = useState(false)

  // Convert string errors to CompilationError objects
  const errors: CompilationError[] = compilationErrors.map((msg) => ({ message: msg }))

  // Compile function
  const handleCompile = useCallback(async () => {
    setCompiling(true)
    setShowCompilationLog(true)

    try {
      const result = await compile(content)

      setCompilationResult({
        success: result.success,
        pdf: result.pdf || null,
        log: result.log,
        errors: result.errors.map((e) => e.message),
        warnings: result.warnings,
      })

      // Switch to PDF view if compilation was successful
      if (result.success && result.pdf) {
        setView('pdf')
      }
    } catch (error) {
      setCompilationResult({
        success: false,
        pdf: null,
        log: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        errors: [error instanceof Error ? error.message : 'Compilation failed'],
        warnings: [],
      })
    }
  }, [content, setCompiling, setCompilationResult, setView])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        (e.target instanceof HTMLTextAreaElement && !e.target.classList.contains('monaco-mouse-cursor-text'))
      ) {
        return
      }

      // Cmd/Ctrl + Enter - Compile
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCompile()
      }

      // Cmd/Ctrl + S - Save (prevent default, trigger compile)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        // Could trigger compile or download here
      }

      // Cmd/Ctrl + B - Bold
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        // Would need editor ref to insert at cursor
      }

      // Cmd/Ctrl + I - Italic
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        // Would need editor ref to insert at cursor
      }

      // Escape - Close panels
      if (e.key === 'Escape') {
        if (showSymbolPalette) {
          toggleSymbolPalette()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSymbolPalette, toggleSymbolPalette, handleCompile])

  const handleInsertSymbol = useCallback((symbol: string) => {
    // This would need to be coordinated with Monaco editor
    // For now, we'll append to content (not ideal, but works as MVP)
    setContent(content + symbol)
  }, [content, setContent])

  const handleErrorClick = useCallback((error: CompilationError) => {
    // Could scroll to error line in editor
    if (error.line) {
      // Switch to editor view and scroll to line
      setView('editor')
    }
  }, [setView])

  return (
    <div className="flex flex-col h-full">
      <LatexToolbar onCompile={handleCompile} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden relative">
          {/* Editor Pane */}
          {(view === 'split' || view === 'editor') && (
            <div className={`flex flex-col ${view === 'split' ? 'w-1/2 border-r' : 'w-full'}`}>
              <LatexMonaco />
            </div>
          )}

          {/* Preview Pane */}
          {(view === 'split' || view === 'preview') && (
            <div className={`flex flex-col ${view === 'split' ? 'w-1/2' : 'w-full'}`}>
              <LatexPreview />
            </div>
          )}

          {/* PDF View */}
          {view === 'pdf' && (
            <div className="w-full h-full">
              <LatexPDFViewer pdf={compiledPDF} fileName={fileName} />
            </div>
          )}

          {/* Symbol Palette (floating) */}
          {showSymbolPalette && (
            <SymbolPalette
              onInsert={handleInsertSymbol}
              onClose={toggleSymbolPalette}
            />
          )}
        </div>

        {/* Compilation Log */}
        {showCompilationLog && (
          <CompilationLog
            log={compilationLog}
            errors={errors}
            warnings={compilationWarnings}
            isCompiling={isCompiling}
            onClose={() => setShowCompilationLog(false)}
            onErrorClick={handleErrorClick}
          />
        )}
      </div>
    </div>
  )
}
