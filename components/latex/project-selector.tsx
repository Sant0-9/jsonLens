"use client"

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLatexStore } from '@/store/latex-store'

interface ProjectSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSelector({ isOpen, onClose }: ProjectSelectorProps) {
  const {
    projects,
    currentProjectId,
    isLoadingProjects,
    loadProjects,
    loadProject,
    createNewProject,
    deleteCurrentProject,
    duplicateCurrentProject
  } = useLatexStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen, loadProjects])

  const handleCreateProject = async () => {
    setError('')

    if (!newProjectName.trim()) {
      setError('Project name is required')
      return
    }

    try {
      await createNewProject(newProjectName.trim())
      setNewProjectName('')
      setIsCreating(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  const handleOpenProject = async (projectId: string) => {
    await loadProject(projectId)
    onClose()
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    // Load and delete the project
    await loadProject(projectId)
    await deleteCurrentProject()
    await loadProjects()
  }

  const handleDuplicateProject = async (projectId: string) => {
    await loadProject(projectId)
    await duplicateCurrentProject()
    await loadProjects()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Create new project form */}
        {isCreating && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject()
                  if (e.key === 'Escape') setIsCreating(false)
                }}
                autoFocus
              />
              <Button onClick={handleCreateProject}>Create</Button>
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
        )}

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet</p>
              <p className="text-sm">Create a new project to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const isActive = project.id === currentProjectId
                const fileCount = project.files.length
                const texFileCount = project.files.filter(f => f.type === 'tex').length

                return (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <button
                      className="flex-1 flex items-start gap-3 text-left"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <FolderOpen className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {texFileCount} tex, {fileCount - texFileCount} other
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(project.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicateProject(project.id)}
                        title="Duplicate project"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 text-sm text-muted-foreground">
          Projects are stored locally in your browser. Export important projects regularly.
        </div>
      </div>
    </div>
  )
}
