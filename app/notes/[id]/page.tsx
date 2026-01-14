"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotesStore } from '@/store/notes-store'
import { NoteEditor } from '@/components/notes/note-editor'
import { NotePreview } from '@/components/notes/note-preview'
import { Loader2 } from 'lucide-react'
import { use } from 'react'
import type { Note } from '@/lib/db/schema'

interface NotePageProps {
  params: Promise<{ id: string }>
}

export default function NotePage({ params }: NotePageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const editMode = searchParams.get('edit') === 'true'

  const { notes, loadNotes, updateNote, isLoading, setIsEditing } = useNotesStore()

  const [mounted, setMounted] = useState(false)
  const [isEditingLocal, setIsEditingLocal] = useState(editMode)

  useEffect(() => {
    setMounted(true)
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    setIsEditingLocal(editMode)
  }, [editMode])

  const note = notes.find(n => n.id === resolvedParams.id)

  const handleSave = async (updates: Partial<Note>) => {
    if (!note) return
    await updateNote(note.id, updates)
    setIsEditingLocal(false)
    setIsEditing(false)
    // Remove edit query param
    router.replace(`/notes/${resolvedParams.id}`)
  }

  const handleCancel = () => {
    setIsEditingLocal(false)
    setIsEditing(false)
    router.replace(`/notes/${resolvedParams.id}`)
  }

  const handleEdit = () => {
    setIsEditingLocal(true)
    setIsEditing(true)
    router.replace(`/notes/${resolvedParams.id}?edit=true`)
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-muted-foreground">Note not found</p>
        <button
          onClick={() => router.push('/notes')}
          className="mt-4 text-primary hover:underline"
        >
          Back to Notes
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {isEditingLocal ? (
        <NoteEditor note={note} onSave={handleSave} onCancel={handleCancel} />
      ) : (
        <NotePreview note={note} onEdit={handleEdit} />
      )}
    </div>
  )
}
