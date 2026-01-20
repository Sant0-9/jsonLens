"use client"

import { useEffect, useCallback, useState, useRef } from 'react'
import { useLatexStore } from '@/store/latex-store'
import { LatexToolbar } from './latex-toolbar'
import { LatexMonaco } from './latex-monaco'
import { LatexPreview } from './latex-preview'
import { SymbolPalette } from './symbol-palette'
import { LatexPDFViewer } from './latex-pdf-viewer'
import { CompilationLog } from './compilation-log'
import { compileAuto, CompilationError } from '@/lib/latex/compiler'

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
  const [splitRatio, setSplitRatio] = useState(50) // percentage for left panel
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle split panel resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100

      // Clamp between 20% and 80%
      setSplitRatio(Math.min(80, Math.max(20, newRatio)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Convert string errors to CompilationError objects
  const errors: CompilationError[] = compilationErrors.map((msg) => ({ message: msg }))

  // Check function - validates LaTeX without generating PDF (faster, no storage)
  const handleCheck = useCallback(async () => {
    setCompiling(true)
    setShowCompilationLog(true)

    try {
      // Check-only mode: runs compilation but doesn't store PDF
      const result = await compileAuto(content, { checkOnly: true })

      setCompilationResult({
        success: result.success,
        pdf: null, // Don't store PDF for check-only
        log: result.log,
        errors: result.errors.map((e) => e.message),
        warnings: result.warnings,
      })
    } catch (error) {
      setCompilationResult({
        success: false,
        pdf: null,
        log: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        errors: [error instanceof Error ? error.message : 'Compilation failed'],
        warnings: [],
      })
    }
  }, [content, setCompiling, setCompilationResult])

  // Compile function - generates PDF output
  const handleCompile = useCallback(async () => {
    setCompiling(true)
    setShowCompilationLog(true)

    try {
      const result = await compileAuto(content)

      setCompilationResult({
        success: result.success,
        pdf: result.pdf || null,
        log: result.log,
        errors: result.errors.map((e) => e.message),
        warnings: result.warnings,
      })
      // Note: Don't auto-switch to PDF view - let user decide
    } catch (error) {
      setCompilationResult({
        success: false,
        pdf: null,
        log: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        errors: [error instanceof Error ? error.message : 'Compilation failed'],
        warnings: [],
      })
    }
  }, [content, setCompiling, setCompilationResult])

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
      <LatexToolbar
        onCheck={handleCheck}
        onCompile={handleCompile}
        showCompilationLog={showCompilationLog}
        onToggleLog={() => setShowCompilationLog(!showCompilationLog)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
          {/* Editor Pane */}
          {(view === 'split' || view === 'editor') && (
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: view === 'split' ? `${splitRatio}%` : '100%' }}
            >
              <LatexMonaco />
            </div>
          )}

          {/* Resize Handle */}
          {view === 'split' && (
            <div
              className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors"
              onMouseDown={handleMouseDown}
              title="Drag to resize"
            />
          )}

          {/* Preview Pane */}
          {(view === 'split' || view === 'preview') && (
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: view === 'split' ? `${100 - splitRatio}%` : '100%' }}
            >
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
