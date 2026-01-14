import { create } from 'zustand'
import type { Note, NoteFolder } from '@/lib/db/schema'
import { DB_NAME, DB_VERSION, STORES } from '@/lib/db/schema'
import { parseLinks, extractLinkedNoteTitles, extractLinkedPaperIds } from '@/lib/notes/link-parser'

interface NotesState {
  // Data
  notes: Note[]
  folders: NoteFolder[]
  selectedNoteId: string | null
  selectedFolderId: string | null

  // UI State
  isLoading: boolean
  isSaving: boolean
  searchQuery: string
  viewMode: 'list' | 'grid' | 'graph'
  sortBy: 'updated' | 'created' | 'title'
  sortOrder: 'asc' | 'desc'

  // Editor State
  isEditing: boolean
  unsavedChanges: boolean

  // Actions
  loadNotes: () => Promise<void>
  loadFolders: () => Promise<void>
  createNote: (note: Partial<Note>) => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  selectNote: (id: string | null) => void

  // Folder Actions
  createFolder: (folder: Partial<NoteFolder>) => Promise<NoteFolder>
  updateFolder: (id: string, updates: Partial<NoteFolder>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  selectFolder: (id: string | null) => void

  // Search & Filter
  setSearchQuery: (query: string) => void
  getFilteredNotes: () => Note[]
  getNotesInFolder: (folderId: string | null) => Note[]

  // Linking
  updateBacklinks: (noteId: string, content: string) => Promise<void>
  getBacklinksForNote: (noteId: string) => Note[]
  getLinkedNotes: (noteId: string) => Note[]
  getLinkedPapers: (noteId: string) => string[]
  findNoteByTitle: (title: string) => Note | undefined

  // UI Actions
  setViewMode: (mode: 'list' | 'grid' | 'graph') => void
  setSortBy: (sortBy: 'updated' | 'created' | 'title') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  setIsEditing: (editing: boolean) => void
  setUnsavedChanges: (hasChanges: boolean) => void
}

// Generate unique ID
function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const useNotesStore = create<NotesState>((set, get) => ({
  // Initial state
  notes: [],
  folders: [],
  selectedNoteId: null,
  selectedFolderId: null,
  isLoading: false,
  isSaving: false,
  searchQuery: '',
  viewMode: 'list',
  sortBy: 'updated',
  sortOrder: 'desc',
  isEditing: false,
  unsavedChanges: false,

  // Load notes from IndexedDB
  loadNotes: async () => {
    set({ isLoading: true })
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORES.NOTES)) {
            db.createObjectStore(STORES.NOTES, { keyPath: 'id' })
          }
        },
      })

      const records = await db.getAll(STORES.NOTES)
      const notes = records.map((r: { note: Note }) => r.note)
      set({ notes, isLoading: false })
    } catch (error) {
      console.error('Failed to load notes:', error)
      set({ isLoading: false })
    }
  },

  // Load folders
  loadFolders: async () => {
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('note-folders')) {
            db.createObjectStore('note-folders', { keyPath: 'id' })
          }
        },
      })

      if (db.objectStoreNames.contains('note-folders')) {
        const records = await db.getAll('note-folders')
        const folders = records.map((r: { folder: NoteFolder }) => r.folder)
        set({ folders })
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  },

  // Create new note
  createNote: async (noteData: Partial<Note>) => {
    const now = Date.now()
    const note: Note = {
      id: generateId(),
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      tags: noteData.tags || [],
      linkedPapers: [],
      linkedNotes: [],
      backlinks: [],
      createdAt: now,
      updatedAt: now,
      folderId: noteData.folderId,
    }

    // Parse content for links
    if (note.content) {
      note.linkedPapers = extractLinkedPaperIds(note.content)
      // Resolve note titles to IDs
      const titles = extractLinkedNoteTitles(note.content)
      const { notes: existingNotes } = get()
      note.linkedNotes = titles
        .map(title => existingNotes.find(n => n.title.toLowerCase() === title.toLowerCase())?.id)
        .filter((id): id is string => id !== undefined)
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.NOTES, { id: note.id, note })

      set(state => ({ notes: [...state.notes, note] }))

      // Update backlinks in linked notes
      const { notes: allNotes } = get()
      for (const linkedId of note.linkedNotes) {
        const linkedNote = allNotes.find(n => n.id === linkedId)
        if (linkedNote && !linkedNote.backlinks.includes(note.id)) {
          const updatedBacklinks = [...linkedNote.backlinks, note.id]
          const updatedLinkedNote = { ...linkedNote, backlinks: updatedBacklinks }
          await db.put(STORES.NOTES, { id: linkedId, note: updatedLinkedNote })
          set(state => ({
            notes: state.notes.map(n => (n.id === linkedId ? updatedLinkedNote : n)),
          }))
        }
      }

      return note
    } catch (error) {
      console.error('Failed to create note:', error)
      throw error
    }
  },

  // Update existing note
  updateNote: async (id: string, updates: Partial<Note>) => {
    set({ isSaving: true })

    const existingNote = get().notes.find(n => n.id === id)
    if (!existingNote) {
      set({ isSaving: false })
      throw new Error('Note not found')
    }

    const updatedNote: Note = {
      ...existingNote,
      ...updates,
      updatedAt: Date.now(),
    }

    // Re-parse links if content changed
    if (updates.content !== undefined) {
      updatedNote.linkedPapers = extractLinkedPaperIds(updates.content)
      // Resolve note titles to IDs
      const titles = extractLinkedNoteTitles(updates.content)
      const { notes: existingNotes } = get()
      updatedNote.linkedNotes = titles
        .map(title => existingNotes.find(n => n.title.toLowerCase() === title.toLowerCase())?.id)
        .filter((id): id is string => id !== undefined)
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.NOTES, { id: updatedNote.id, note: updatedNote })

      set(state => ({
        notes: state.notes.map(n => (n.id === id ? updatedNote : n)),
        isSaving: false,
        unsavedChanges: false,
      }))

      // Update backlinks if content changed
      if (updates.content !== undefined) {
        const { notes: allNotes } = get()
        const oldLinkedIds = existingNote.linkedNotes
        const newLinkedIds = updatedNote.linkedNotes

        // Remove backlink from notes that are no longer linked
        const removedLinks = oldLinkedIds.filter(linkId => !newLinkedIds.includes(linkId))
        for (const linkedId of removedLinks) {
          const linkedNote = allNotes.find(n => n.id === linkedId)
          if (linkedNote) {
            const updatedBacklinks = linkedNote.backlinks.filter(bId => bId !== updatedNote.id)
            const updatedLinkedNote = { ...linkedNote, backlinks: updatedBacklinks }
            await db.put(STORES.NOTES, { id: linkedId, note: updatedLinkedNote })
            set(state => ({
              notes: state.notes.map(n => (n.id === linkedId ? updatedLinkedNote : n)),
            }))
          }
        }

        // Add backlink to newly linked notes
        const addedLinks = newLinkedIds.filter(linkId => !oldLinkedIds.includes(linkId))
        for (const linkedId of addedLinks) {
          const linkedNote = allNotes.find(n => n.id === linkedId)
          if (linkedNote && !linkedNote.backlinks.includes(updatedNote.id)) {
            const updatedBacklinks = [...linkedNote.backlinks, updatedNote.id]
            const updatedLinkedNote = { ...linkedNote, backlinks: updatedBacklinks }
            await db.put(STORES.NOTES, { id: linkedId, note: updatedLinkedNote })
            set(state => ({
              notes: state.notes.map(n => (n.id === linkedId ? updatedLinkedNote : n)),
            }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to update note:', error)
      set({ isSaving: false })
      throw error
    }
  },

  // Delete note
  deleteNote: async (id: string) => {
    const noteToDelete = get().notes.find(n => n.id === id)
    if (!noteToDelete) return

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.delete(STORES.NOTES, id)

      // Remove backlinks from notes that were linked
      const { notes: allNotes } = get()
      for (const linkedId of noteToDelete.linkedNotes) {
        const linkedNote = allNotes.find(n => n.id === linkedId)
        if (linkedNote) {
          const updatedBacklinks = linkedNote.backlinks.filter(bId => bId !== noteToDelete.id)
          const updatedLinkedNote = { ...linkedNote, backlinks: updatedBacklinks }
          await db.put(STORES.NOTES, { id: linkedId, note: updatedLinkedNote })
          set(state => ({
            notes: state.notes.map(n => (n.id === linkedId ? updatedLinkedNote : n)),
          }))
        }
      }

      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
      }))
    } catch (error) {
      console.error('Failed to delete note:', error)
      throw error
    }
  },

  selectNote: (id: string | null) => {
    set({ selectedNoteId: id, isEditing: false, unsavedChanges: false })
  },

  // Folder actions
  createFolder: async (folderData: Partial<NoteFolder>) => {
    const folder: NoteFolder = {
      id: `folder_${Date.now()}`,
      name: folderData.name || 'New Folder',
      parentId: folderData.parentId,
      color: folderData.color,
      createdAt: Date.now(),
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('note-folders')) {
            db.createObjectStore('note-folders', { keyPath: 'id' })
          }
        },
      })
      await db.put('note-folders', { id: folder.id, folder })

      set(state => ({ folders: [...state.folders, folder] }))
      return folder
    } catch (error) {
      console.error('Failed to create folder:', error)
      throw error
    }
  },

  updateFolder: async (id: string, updates: Partial<NoteFolder>) => {
    const folder = get().folders.find(f => f.id === id)
    if (!folder) return

    const updatedFolder = { ...folder, ...updates }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put('note-folders', { id: updatedFolder.id, folder: updatedFolder })

      set(state => ({
        folders: state.folders.map(f => (f.id === id ? updatedFolder : f)),
      }))
    } catch (error) {
      console.error('Failed to update folder:', error)
      throw error
    }
  },

  deleteFolder: async (id: string) => {
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.delete('note-folders', id)

      // Move notes in this folder to root
      const notesInFolder = get().notes.filter(n => n.folderId === id)
      for (const note of notesInFolder) {
        await get().updateNote(note.id, { folderId: undefined })
      }

      set(state => ({
        folders: state.folders.filter(f => f.id !== id),
        selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
      }))
    } catch (error) {
      console.error('Failed to delete folder:', error)
      throw error
    }
  },

  selectFolder: (id: string | null) => {
    set({ selectedFolderId: id })
  },

  // Search and filter
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  getFilteredNotes: () => {
    const { notes, searchQuery, sortBy, sortOrder, selectedFolderId } = get()

    let filtered = notes

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter(n => n.folderId === selectedFolderId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'created':
          comparison = a.createdAt - b.createdAt
          break
        case 'updated':
        default:
          comparison = a.updatedAt - b.updatedAt
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getNotesInFolder: (folderId: string | null) => {
    const { notes } = get()
    if (folderId === null) {
      return notes.filter(n => !n.folderId)
    }
    return notes.filter(n => n.folderId === folderId)
  },

  // Link management
  updateBacklinks: async (noteId: string, content: string) => {
    const linkedTitles = extractLinkedNoteTitles(content)
    const { notes } = get()

    // Find notes that are linked
    const linkedNoteIds = linkedTitles
      .map(title => notes.find(n => n.title.toLowerCase() === title.toLowerCase())?.id)
      .filter((id): id is string => id !== undefined)

    // Update backlinks in each linked note
    for (const linkedId of linkedNoteIds) {
      const linkedNote = notes.find(n => n.id === linkedId)
      if (linkedNote && !linkedNote.backlinks.includes(noteId)) {
        await get().updateNote(linkedId, {
          backlinks: [...linkedNote.backlinks, noteId],
        })
      }
    }
  },

  getBacklinksForNote: (noteId: string) => {
    const { notes } = get()
    const note = notes.find(n => n.id === noteId)
    if (!note) return []

    return notes.filter(n => note.backlinks.includes(n.id))
  },

  getLinkedNotes: (noteId: string) => {
    const { notes } = get()
    const note = notes.find(n => n.id === noteId)
    if (!note) return []

    return notes.filter(n => note.linkedNotes.includes(n.id))
  },

  getLinkedPapers: (noteId: string) => {
    const note = get().notes.find(n => n.id === noteId)
    return note?.linkedPapers || []
  },

  findNoteByTitle: (title: string) => {
    return get().notes.find(n => n.title.toLowerCase() === title.toLowerCase())
  },

  // UI actions
  setViewMode: (mode: 'list' | 'grid' | 'graph') => {
    set({ viewMode: mode })
  },

  setSortBy: (sortBy: 'updated' | 'created' | 'title') => {
    set({ sortBy })
  },

  setSortOrder: (order: 'asc' | 'desc') => {
    set({ sortOrder: order })
  },

  setIsEditing: (editing: boolean) => {
    set({ isEditing: editing })
  },

  setUnsavedChanges: (hasChanges: boolean) => {
    set({ unsavedChanges: hasChanges })
  },
}))
