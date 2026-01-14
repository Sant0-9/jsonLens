"use client"

import { useState } from 'react'
import {
  FileText,
  BookOpen,
  FileCode,
  Image,
  File,
  Plus,
  Trash2,
  Edit2,
  Star,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useLatexStore, type LatexFile } from '@/store/latex-store'

interface FileTreeProps {
  onAddFile?: () => void
}

export function FileTree({ onAddFile }: FileTreeProps) {
  const {
    files,
    activeFile,
    currentProject,
    setActiveFile,
    deleteFile,
    setMainFile,
    deleteProjectFile,
    setProjectMainFile
  } = useLatexStore()

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    file: LatexFile
  } | null>(null)

  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tex':
        return FileText
      case 'bib':
        return BookOpen
      case 'cls':
      case 'sty':
        return FileCode
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'pdf':
      case 'eps':
      case 'svg':
        return Image
      default:
        return File
    }
  }

  const handleFileClick = (file: LatexFile) => {
    setActiveFile(file.name)
  }

  const handleContextMenu = (e: React.MouseEvent, file: LatexFile) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    })
  }

  const handleSetMainFile = async (file: LatexFile) => {
    if (currentProject) {
      await setProjectMainFile(file.name)
    } else {
      setMainFile(file.name)
    }
    setContextMenu(null)
  }

  const handleDeleteFile = async (file: LatexFile) => {
    if (files.length <= 1) {
      return // Can't delete the last file
    }

    if (currentProject) {
      const projectFile = currentProject.files.find(f => f.name === file.name)
      if (projectFile) {
        await deleteProjectFile(projectFile.id)
      }
    } else {
      deleteFile(file.name)
    }
    setContextMenu(null)
  }

  const handleRenameFile = (file: LatexFile) => {
    setEditingFile(file.name)
    setEditingName(file.name)
    setContextMenu(null)
  }

  const submitRename = async () => {
    if (!editingFile || !editingName.trim()) {
      setEditingFile(null)
      return
    }

    // TODO: Implement rename in project
    setEditingFile(null)
  }

  // Close context menu on click outside
  const handleClickOutside = () => {
    if (contextMenu) {
      setContextMenu(null)
    }
  }

  return (
    <div
      className="h-full flex flex-col bg-muted/30"
      onClick={handleClickOutside}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Files</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onAddFile?.()
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.map((file) => {
          const Icon = getFileIcon(file.name)
          const isActive = file.name === activeFile
          const isEditing = editingFile === file.name

          return (
            <div
              key={file.name}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => handleFileClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename()
                    if (e.key === 'Escape') setEditingFile(null)
                  }}
                  className="flex-1 bg-background px-1 py-0.5 text-sm rounded border"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-sm truncate">{file.name}</span>
              )}

              {file.isMain && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}

              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  handleContextMenu(e, file)
                }}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border rounded-md shadow-lg py-1 z-50 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {!contextMenu.file.isMain && contextMenu.file.name.endsWith('.tex') && (
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => handleSetMainFile(contextMenu.file)}
            >
              <Star className="h-4 w-4" />
              Set as Main File
            </button>
          )}
          <button
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
            onClick={() => handleRenameFile(contextMenu.file)}
          >
            <Edit2 className="h-4 w-4" />
            Rename
          </button>
          {files.length > 1 && (
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent text-destructive flex items-center gap-2"
              onClick={() => handleDeleteFile(contextMenu.file)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
