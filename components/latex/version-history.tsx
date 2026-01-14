"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  History,
  RotateCcw,
  Trash2,
  Tag,
  GitCompare,
  Download,
  Clock,
  FileText,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLatexStore } from '@/store/latex-store'
import {
  getProjectVersions,
  deleteVersion,
  updateVersionLabel,
  formatRelativeTime,
  formatAbsoluteTime,
  type VersionRecord
} from '@/lib/latex/version-manager'
import { VersionDiff } from './version-diff'

interface VersionHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function VersionHistory({ isOpen, onClose }: VersionHistoryProps) {
  const { currentProject, setContent, setActiveFile, loadProject } = useLatexStore()

  const [versions, setVersions] = useState<VersionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<VersionRecord | null>(null)
  const [compareVersion, setCompareVersion] = useState<VersionRecord | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [labelValue, setLabelValue] = useState('')

  const loadVersions = useCallback(async () => {
    if (!currentProject) return

    setIsLoading(true)
    try {
      const data = await getProjectVersions(currentProject.id)
      setVersions(data)
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentProject])

  // Load versions when dialog opens
  useEffect(() => {
    if (isOpen && currentProject) {
      loadVersions()
    }
  }, [isOpen, currentProject, loadVersions])

  const handleRestore = async (version: VersionRecord) => {
    if (!currentProject) return

    if (!confirm('Restore this version? Current changes will be overwritten.')) {
      return
    }

    // Get the main file content from the version
    const mainFileContent = version.content[currentProject.mainFile]
    if (mainFileContent !== undefined) {
      setContent(mainFileContent)
      setActiveFile(currentProject.mainFile)
    }

    // Reload the project to refresh file state
    // Note: For full restore, we'd need to update all files
    await loadProject(currentProject.id)
    onClose()
  }

  const handleDelete = async (version: VersionRecord) => {
    if (!confirm('Delete this version? This cannot be undone.')) {
      return
    }

    await deleteVersion(version.projectId, version.versionId)
    setVersions(versions.filter(v => v.versionId !== version.versionId))

    if (selectedVersion?.versionId === version.versionId) {
      setSelectedVersion(null)
    }
    if (compareVersion?.versionId === version.versionId) {
      setCompareVersion(null)
    }
  }

  const handleUpdateLabel = async (version: VersionRecord) => {
    await updateVersionLabel(version.projectId, version.versionId, labelValue || undefined)
    setVersions(versions.map(v =>
      v.versionId === version.versionId
        ? { ...v, label: labelValue || undefined }
        : v
    ))
    setEditingLabel(null)
    setLabelValue('')
  }

  const handleCompare = () => {
    if (selectedVersion && compareVersion) {
      setShowDiff(true)
    }
  }

  const handleDownloadVersion = (version: VersionRecord) => {
    // Create a zip-like download with all files
    const mainFile = currentProject?.mainFile || 'main.tex'
    const content = version.content[mainFile] || ''

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mainFile}_v${new Date(version.timestamp).toISOString().slice(0, 10)}.tex`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getVersionFiles = (version: VersionRecord): string[] => {
    return Object.keys(version.content)
  }

  if (!isOpen) return null

  if (showDiff && selectedVersion && compareVersion) {
    return (
      <VersionDiff
        isOpen={true}
        onClose={() => setShowDiff(false)}
        oldVersion={compareVersion.timestamp < selectedVersion.timestamp ? compareVersion : selectedVersion}
        newVersion={compareVersion.timestamp < selectedVersion.timestamp ? selectedVersion : compareVersion}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Version History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Compare Action Bar */}
        {(selectedVersion || compareVersion) && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
            <div className="flex items-center gap-2 text-sm">
              {selectedVersion && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Selected: {formatRelativeTime(selectedVersion.timestamp)}
                </span>
              )}
              {compareVersion && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                    Compare: {formatRelativeTime(compareVersion.timestamp)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedVersion && compareVersion && (
                <Button size="sm" onClick={handleCompare}>
                  <GitCompare className="h-4 w-4 mr-1" />
                  View Diff
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedVersion(null)
                  setCompareVersion(null)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/20 border-b">
          Click a version to select it. Click another to compare. Auto-saves are created every 5 minutes.
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No versions yet</p>
              <p className="text-sm mt-1">
                Versions are saved automatically every 5 minutes
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {versions.map((version) => {
                const isSelected = selectedVersion?.versionId === version.versionId
                const isCompare = compareVersion?.versionId === version.versionId
                const fileCount = getVersionFiles(version).length

                return (
                  <div
                    key={version.versionId}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10' : ''
                    } ${isCompare ? 'bg-blue-500/10' : ''}`}
                    onClick={() => {
                      if (!selectedVersion) {
                        setSelectedVersion(version)
                      } else if (selectedVersion.versionId === version.versionId) {
                        setSelectedVersion(null)
                      } else if (!compareVersion) {
                        setCompareVersion(version)
                      } else if (compareVersion.versionId === version.versionId) {
                        setCompareVersion(null)
                      } else {
                        setCompareVersion(version)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Timestamp */}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatRelativeTime(version.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({formatAbsoluteTime(version.timestamp)})
                          </span>
                        </div>

                        {/* Label */}
                        {editingLabel === version.versionId ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              value={labelValue}
                              onChange={(e) => setLabelValue(e.target.value)}
                              placeholder="Enter label..."
                              className="h-7 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateLabel(version)
                                }
                                if (e.key === 'Escape') {
                                  setEditingLabel(null)
                                  setLabelValue('')
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateLabel(version)
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        ) : version.label ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Tag className="h-3 w-3 text-primary" />
                            <span className="text-sm text-primary">{version.label}</span>
                          </div>
                        ) : null}

                        {/* File info */}
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingLabel(version.versionId)
                            setLabelValue(version.label || '')
                          }}
                          title="Add label"
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadVersion(version)
                          }}
                          title="Download version"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestore(version)
                          }}
                          title="Restore version"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(version)
                          }}
                          title="Delete version"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
            <span>Max 50 versions kept per project</span>
          </div>
        </div>
      </div>
    </div>
  )
}
