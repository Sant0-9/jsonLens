"use client"

import { useState, useMemo } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Minus,
  Equal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  compareVersions,
  generateLineDiff,
  formatAbsoluteTime,
  type VersionRecord,
  type FileDiff,
  type LineDiff
} from '@/lib/latex/version-manager'

interface VersionDiffProps {
  isOpen: boolean
  onClose: () => void
  oldVersion: VersionRecord
  newVersion: VersionRecord
}

type DiffViewMode = 'unified' | 'split'

export function VersionDiff({
  isOpen,
  onClose,
  oldVersion,
  newVersion
}: VersionDiffProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<DiffViewMode>('unified')

  // Compute diff between versions
  const diff = useMemo(() => {
    return compareVersions(oldVersion, newVersion)
  }, [oldVersion, newVersion])

  // Auto-select first modified file
  const effectiveSelectedFile = selectedFile || diff.files[0]?.fileName

  // Get the selected file diff
  const fileDiff = diff.files.find(f => f.fileName === effectiveSelectedFile)

  // Generate line diff for the selected file
  const lineDiff = useMemo(() => {
    if (!fileDiff) return []
    return generateLineDiff(fileDiff.oldContent, fileDiff.newContent)
  }, [fileDiff])

  // Statistics
  const stats = useMemo(() => {
    let added = 0
    let removed = 0

    for (const file of diff.files) {
      const lines = generateLineDiff(file.oldContent, file.newContent)
      for (const line of lines) {
        if (line.type === 'added') added++
        if (line.type === 'removed') removed++
      }
    }

    return { added, removed }
  }, [diff])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Compare Versions</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatAbsoluteTime(oldVersion.timestamp)}</span>
                <ChevronRight className="h-4 w-4" />
                <span>{formatAbsoluteTime(newVersion.timestamp)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <Plus className="h-4 w-4" />
                {stats.added}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <Minus className="h-4 w-4" />
                {stats.removed}
              </span>
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  viewMode === 'unified' ? 'bg-muted' : 'hover:bg-muted/50'
                )}
                onClick={() => setViewMode('unified')}
              >
                Unified
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  viewMode === 'split' ? 'bg-muted' : 'hover:bg-muted/50'
                )}
                onClick={() => setViewMode('split')}
              >
                Split
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File List Sidebar */}
          <div className="w-56 border-r bg-muted/20 overflow-y-auto">
            <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Changed Files ({diff.files.length})
            </div>
            <div className="space-y-0.5 p-2">
              {diff.files.map((file) => (
                <button
                  key={file.fileName}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
                    file.fileName === effectiveSelectedFile
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setSelectedFile(file.fileName)}
                >
                  <FileStatusIcon status={file.status} />
                  <span className="flex-1 truncate font-mono text-xs">
                    {file.fileName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Diff View */}
          <div className="flex-1 overflow-auto">
            {!fileDiff ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to view changes
              </div>
            ) : viewMode === 'unified' ? (
              <UnifiedDiffView lineDiff={lineDiff} fileDiff={fileDiff} />
            ) : (
              <SplitDiffView lineDiff={lineDiff} fileDiff={fileDiff} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// File status icon component
function FileStatusIcon({ status }: { status: FileDiff['status'] }) {
  switch (status) {
    case 'added':
      return <Plus className="h-4 w-4 text-green-600" />
    case 'deleted':
      return <Minus className="h-4 w-4 text-red-600" />
    case 'modified':
      return <FileText className="h-4 w-4 text-yellow-600" />
    default:
      return <Equal className="h-4 w-4 text-muted-foreground" />
  }
}

// Unified diff view
function UnifiedDiffView({
  lineDiff,
  fileDiff
}: {
  lineDiff: LineDiff[]
  fileDiff: FileDiff
}) {
  if (fileDiff.status === 'added') {
    return (
      <div className="font-mono text-sm">
        <div className="px-4 py-2 bg-green-500/10 text-green-700 text-xs">
          New file
        </div>
        <pre className="p-4 whitespace-pre-wrap break-all">
          {fileDiff.newContent}
        </pre>
      </div>
    )
  }

  if (fileDiff.status === 'deleted') {
    return (
      <div className="font-mono text-sm">
        <div className="px-4 py-2 bg-red-500/10 text-red-700 text-xs">
          Deleted file
        </div>
        <pre className="p-4 whitespace-pre-wrap break-all text-muted-foreground line-through">
          {fileDiff.oldContent}
        </pre>
      </div>
    )
  }

  return (
    <div className="font-mono text-sm">
      {lineDiff.map((line, index) => (
        <div
          key={index}
          className={cn(
            "flex",
            line.type === 'added' && 'bg-green-500/10',
            line.type === 'removed' && 'bg-red-500/10'
          )}
        >
          <span
            className={cn(
              "w-12 flex-shrink-0 px-2 py-0.5 text-right text-xs border-r select-none",
              line.type === 'added' && 'text-green-700 bg-green-500/20',
              line.type === 'removed' && 'text-red-700 bg-red-500/20',
              line.type === 'unchanged' && 'text-muted-foreground'
            )}
          >
            {line.lineNumber}
          </span>
          <span
            className={cn(
              "w-6 flex-shrink-0 text-center py-0.5 select-none",
              line.type === 'added' && 'text-green-700',
              line.type === 'removed' && 'text-red-700'
            )}
          >
            {line.type === 'added' && '+'}
            {line.type === 'removed' && '-'}
            {line.type === 'unchanged' && ' '}
          </span>
          <pre className="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
            {line.content || ' '}
          </pre>
        </div>
      ))}
    </div>
  )
}

// Split diff view
function SplitDiffView({
  lineDiff,
  fileDiff
}: {
  lineDiff: LineDiff[]
  fileDiff: FileDiff
}) {
  // Pair up lines for side-by-side view
  const pairs = useMemo(() => {
    const result: Array<{
      left: LineDiff | null
      right: LineDiff | null
    }> = []

    let i = 0
    while (i < lineDiff.length) {
      const line = lineDiff[i]

      if (line.type === 'unchanged') {
        result.push({ left: line, right: line })
        i++
      } else if (line.type === 'removed') {
        // Collect consecutive removed lines
        const removed: LineDiff[] = []
        while (i < lineDiff.length && lineDiff[i].type === 'removed') {
          removed.push(lineDiff[i])
          i++
        }

        // Collect consecutive added lines
        const added: LineDiff[] = []
        while (i < lineDiff.length && lineDiff[i].type === 'added') {
          added.push(lineDiff[i])
          i++
        }

        // Pair them up
        const maxLen = Math.max(removed.length, added.length)
        for (let j = 0; j < maxLen; j++) {
          result.push({
            left: removed[j] || null,
            right: added[j] || null
          })
        }
      } else if (line.type === 'added') {
        result.push({ left: null, right: line })
        i++
      }
    }

    return result
  }, [lineDiff])

  if (fileDiff.status === 'added' || fileDiff.status === 'deleted') {
    return <UnifiedDiffView lineDiff={lineDiff} fileDiff={fileDiff} />
  }

  return (
    <div className="font-mono text-sm flex">
      {/* Left side (old) */}
      <div className="w-1/2 border-r">
        <div className="px-2 py-1 bg-muted/50 text-xs text-muted-foreground border-b">
          Old Version
        </div>
        {pairs.map((pair, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              pair.left?.type === 'removed' && 'bg-red-500/10'
            )}
          >
            <span
              className={cn(
                "w-10 flex-shrink-0 px-1 py-0.5 text-right text-xs border-r select-none",
                pair.left?.type === 'removed' && 'text-red-700 bg-red-500/20',
                !pair.left?.type || pair.left?.type === 'unchanged'
                  ? 'text-muted-foreground'
                  : ''
              )}
            >
              {pair.left?.lineNumber || ''}
            </span>
            <pre className="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
              {pair.left?.content || ' '}
            </pre>
          </div>
        ))}
      </div>

      {/* Right side (new) */}
      <div className="w-1/2">
        <div className="px-2 py-1 bg-muted/50 text-xs text-muted-foreground border-b">
          New Version
        </div>
        {pairs.map((pair, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              pair.right?.type === 'added' && 'bg-green-500/10'
            )}
          >
            <span
              className={cn(
                "w-10 flex-shrink-0 px-1 py-0.5 text-right text-xs border-r select-none",
                pair.right?.type === 'added' && 'text-green-700 bg-green-500/20',
                !pair.right?.type || pair.right?.type === 'unchanged'
                  ? 'text-muted-foreground'
                  : ''
              )}
            >
              {pair.right?.lineNumber || ''}
            </span>
            <pre className="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
              {pair.right?.content || ' '}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
