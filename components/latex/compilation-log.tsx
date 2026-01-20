"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, X, AlertCircle, AlertTriangle, CheckCircle, Copy, GripHorizontal } from 'lucide-react'
import { CompilationError } from '@/lib/latex/compiler'

interface CompilationLogProps {
  log: string[]
  errors: CompilationError[]
  warnings: string[]
  isCompiling: boolean
  onClose?: () => void
  onErrorClick?: (error: CompilationError) => void
}

export function CompilationLog({
  log,
  errors,
  warnings,
  isCompiling,
  onClose,
  onErrorClick
}: CompilationLogProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'log' | 'errors' | 'warnings'>('log')
  const [panelHeight, setPanelHeight] = useState(192) // Default h-48 = 192px
  const [isResizing, setIsResizing] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle vertical resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return

      const panelRect = panelRef.current.getBoundingClientRect()
      // Calculate new height based on distance from bottom of panel to mouse
      const newHeight = panelRect.bottom - e.clientY

      // Clamp between 100px and 600px
      setPanelHeight(Math.min(600, Math.max(100, newHeight)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Auto-scroll to bottom when new log entries arrive
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [log, isExpanded])

  // Auto-switch to errors tab if there are errors
  useEffect(() => {
    if (errors.length > 0 && !isCompiling) {
      setActiveTab('errors')
    }
  }, [errors.length, isCompiling])

  const copyLog = () => {
    const content = log.join('\n')
    navigator.clipboard.writeText(content)
  }

  const getStatusIcon = () => {
    if (isCompiling) {
      return (
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      )
    }
    if (errors.length > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    if (warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (isCompiling) return 'Compiling...'
    if (errors.length > 0) return `${errors.length} error${errors.length > 1 ? 's' : ''}`
    if (warnings.length > 0) return `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`
    return 'Success'
  }

  return (
    <div ref={panelRef} className="border-t bg-background">
      {/* Resize Handle */}
      <div
        className="h-2 bg-border hover:bg-primary/50 cursor-row-resize flex items-center justify-center transition-colors group"
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <GripHorizontal className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <span className="font-medium text-sm">Compilation Output</span>
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className="text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 mr-4">
            <button
              className={`px-2 py-1 text-xs rounded ${
                activeTab === 'log'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setActiveTab('log')
              }}
            >
              Log
            </button>
            <button
              className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                activeTab === 'errors'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setActiveTab('errors')
              }}
            >
              Errors
              {errors.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5">
                  {errors.length}
                </span>
              )}
            </button>
            <button
              className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                activeTab === 'warnings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setActiveTab('warnings')
              }}
            >
              Warnings
              {warnings.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs rounded-full px-1.5">
                  {warnings.length}
                </span>
              )}
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              copyLog()
            }}
            title="Copy log"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          ref={logContainerRef}
          className="overflow-auto font-mono text-xs p-4 bg-muted/20"
          style={{ height: `${panelHeight}px` }}
        >
          {activeTab === 'log' && (
            <div className="space-y-0.5">
              {log.length === 0 ? (
                <div className="text-muted-foreground">No compilation output yet.</div>
              ) : (
                log.map((line, index) => (
                  <div
                    key={index}
                    className={`whitespace-pre-wrap ${
                      line.startsWith('!') || line.includes('Error')
                        ? 'text-red-500'
                        : line.includes('Warning')
                        ? 'text-yellow-500'
                        : 'text-foreground'
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-2">
              {errors.length === 0 ? (
                <div className="text-muted-foreground">No errors.</div>
              ) : (
                errors.map((error, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded bg-red-500/10 border border-red-500/20 ${
                      onErrorClick ? 'cursor-pointer hover:bg-red-500/20' : ''
                    }`}
                    onClick={() => onErrorClick?.(error)}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-red-500 font-medium">{error.message}</div>
                        {error.line && (
                          <div className="text-muted-foreground mt-1">
                            Line {error.line}
                            {error.file && ` in ${error.file}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-2">
              {warnings.length === 0 ? (
                <div className="text-muted-foreground">No warnings.</div>
              ) : (
                warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-foreground">{warning}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
