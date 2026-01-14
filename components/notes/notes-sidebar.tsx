"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Folder,
  FolderPlus,
  FileText,
  MoreVertical,
  Edit,
  Trash,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { useNotesStore } from '@/store/notes-store'
import type { NoteFolder } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

interface NotesSidebarProps {
  onCreateNote: () => void
}

export function NotesSidebar({ onCreateNote }: NotesSidebarProps) {
  const {
    folders,
    notes,
    selectedFolderId,
    selectFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    getNotesInFolder,
  } = useNotesStore()

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null)
  const [folderName, setFolderName] = useState('')

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return
    await createFolder({ name: folderName.trim() })
    setFolderName('')
    setShowFolderDialog(false)
  }

  const handleEditFolder = async () => {
    if (!editingFolder || !folderName.trim()) return
    await updateFolder(editingFolder.id, { name: folderName.trim() })
    setEditingFolder(null)
    setFolderName('')
    setShowFolderDialog(false)
  }

  const handleDeleteFolder = async (folder: NoteFolder) => {
    if (confirm(`Delete folder "${folder.name}"? Notes will be moved to root.`)) {
      await deleteFolder(folder.id)
    }
  }

  const openEditDialog = (folder: NoteFolder) => {
    setEditingFolder(folder)
    setFolderName(folder.name)
    setShowFolderDialog(true)
  }

  const openCreateDialog = () => {
    setEditingFolder(null)
    setFolderName('')
    setShowFolderDialog(true)
  }

  const rootNotes = getNotesInFolder(null)

  // Folder colors
  const folderColors: Record<string, string> = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
  }

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Notes</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={openCreateDialog} title="New Folder">
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={onCreateNote}>
              <Plus className="h-4 w-4 mr-1" />
              Note
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{notes.length} notes total</p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Notes */}
          <button
            onClick={() => selectFolder(null)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent',
              selectedFolderId === null && 'bg-accent'
            )}
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left">All Notes</span>
            <span className="text-xs text-muted-foreground">{notes.length}</span>
          </button>

          {/* Folders */}
          {folders.map(folder => {
            const folderNotes = getNotesInFolder(folder.id)
            const isExpanded = expandedFolders.has(folder.id)

            return (
              <div key={folder.id}>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm hover:bg-accent group',
                    selectedFolderId === folder.id && 'bg-accent'
                  )}
                >
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="p-0.5 hover:bg-accent-foreground/10 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => selectFolder(folder.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <Folder
                      className={cn('h-4 w-4', folderColors[folder.color || ''] || 'text-muted-foreground')}
                    />
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">{folderNotes.length}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteFolder(folder)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Notes in folder (when expanded) */}
                {isExpanded && folderNotes.length > 0 && (
                  <div className="ml-6 space-y-0.5">
                    {folderNotes.map(note => (
                      <a
                        key={note.id}
                        href={`/notes/${note.id}`}
                        className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md truncate"
                      >
                        {note.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Root notes (not in any folder) */}
          {folders.length > 0 && rootNotes.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="px-3 text-xs text-muted-foreground mb-2">Unfiled</p>
              {rootNotes.slice(0, 5).map(note => (
                <a
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md truncate"
                >
                  {note.title}
                </a>
              ))}
              {rootNotes.length > 5 && (
                <p className="px-3 py-1 text-xs text-muted-foreground">
                  +{rootNotes.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? 'Rename Folder' : 'New Folder'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="Folder name..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (editingFolder) {
                    handleEditFolder()
                  } else {
                    handleCreateFolder()
                  }
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingFolder ? handleEditFolder : handleCreateFolder}>
              {editingFolder ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
