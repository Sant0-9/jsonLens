"use client"

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Grid, List, SortAsc, SortDesc, FileText } from 'lucide-react'
import { useNotesStore } from '@/store/notes-store'
import { NoteCard } from './note-card'
import { useRouter } from 'next/navigation'

export function NotesList() {
  const router = useRouter()
  const {
    notes,
    searchQuery,
    viewMode,
    sortBy,
    sortOrder,
    setSearchQuery,
    setViewMode,
    setSortBy,
    setSortOrder,
    getFilteredNotes,
    deleteNote,
    getBacklinksForNote,
  } = useNotesStore()

  const filteredNotes = getFilteredNotes()

  const handleEdit = (noteId: string) => {
    router.push(`/notes/${noteId}?edit=true`)
  }

  const handleDelete = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note && confirm(`Delete "${note.title}"? This cannot be undone.`)) {
      await deleteNote(noteId)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={(v: 'updated' | 'created' | 'title') => setSortBy(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Modified</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-r-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-l-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notes */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              {searchQuery ? (
                <>
                  <p className="text-lg">No notes found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No notes yet</p>
                  <p className="text-sm mt-1">Create your first note to get started</p>
                </>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  backlinksCount={getBacklinksForNote(note.id).length}
                  onEdit={() => handleEdit(note.id)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  backlinksCount={getBacklinksForNote(note.id).length}
                  onEdit={() => handleEdit(note.id)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
