"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotesStore } from '@/store/notes-store'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import { NotesList } from '@/components/notes/notes-list'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NotesPage() {
  const router = useRouter()
  const { loadNotes, loadFolders, createNote, selectedFolderId } = useNotesStore()

  const [mounted, setMounted] = useState(false)
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  useEffect(() => {
    setMounted(true)
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  const handleCreateNote = async () => {
    const note = await createNote({
      title: newNoteTitle.trim() || 'Untitled Note',
      content: '',
      folderId: selectedFolderId || undefined,
    })
    setShowNewNoteDialog(false)
    setNewNoteTitle('')
    router.push(`/notes/${note.id}?edit=true`)
  }

  const handleQuickCreate = async () => {
    const note = await createNote({
      title: 'Untitled Note',
      content: '',
      folderId: selectedFolderId || undefined,
    })
    router.push(`/notes/${note.id}?edit=true`)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64">
        <NotesSidebar onCreateNote={() => setShowNewNoteDialog(true)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 border-l">
        <NotesList />
      </div>

      {/* New Note Dialog */}
      <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
              placeholder="Note title..."
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateNote()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleQuickCreate}>
              Quick Create
            </Button>
            <Button onClick={handleCreateNote}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
