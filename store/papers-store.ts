"use client"

import { create } from 'zustand'
import type { Paper, PaperNote, AISummary } from '@/lib/db/schema'
import { put, get as dbGet, getAll, remove, generateId, STORES } from '@/lib/db'

export interface PaperRecord {
  id: string
  paper: Paper
  pdfBlob?: Blob
  addedAt: number
}

interface PapersState {
  // Papers list
  papers: PaperRecord[]
  isLoading: boolean
  error: string | null

  // Current paper view
  currentPaperId: string | null
  currentPaper: PaperRecord | null

  // UI state
  selectedFolder: string | null
  selectedTags: string[]
  searchQuery: string
  sortBy: 'addedAt' | 'title' | 'year' | 'lastReadAt'
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list'

  // Import modal
  showImportModal: boolean

  // Actions
  loadPapers: () => Promise<void>
  loadPaper: (id: string) => Promise<void>

  // CRUD operations
  addPaper: (paper: Omit<Paper, 'id' | 'addedAt' | 'readProgress' | 'notes'>, pdfBlob?: Blob) => Promise<PaperRecord>
  updatePaper: (id: string, updates: Partial<Paper>) => Promise<void>
  deletePaper: (id: string) => Promise<void>

  // Reading
  updateReadProgress: (id: string, progress: number) => Promise<void>
  markAsRead: (id: string) => Promise<void>

  // Notes
  addNote: (paperId: string, note: Omit<PaperNote, 'id' | 'createdAt'>) => Promise<void>
  updateNote: (paperId: string, noteId: string, content: string) => Promise<void>
  deleteNote: (paperId: string, noteId: string) => Promise<void>

  // Organization
  addTag: (paperId: string, tag: string) => Promise<void>
  removeTag: (paperId: string, tag: string) => Promise<void>
  setFolder: (paperId: string, folder: string | undefined) => Promise<void>

  // Summary
  setSummary: (paperId: string, summary: AISummary) => Promise<void>

  // UI actions
  setSelectedFolder: (folder: string | null) => void
  setSelectedTags: (tags: string[]) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: PapersState['sortBy']) => void
  setSortOrder: (order: PapersState['sortOrder']) => void
  setViewMode: (mode: PapersState['viewMode']) => void
  setShowImportModal: (show: boolean) => void
  setCurrentPaperId: (id: string | null) => void

  // Computed
  getAllTags: () => string[]
  getAllFolders: () => string[]
  getFilteredPapers: () => PaperRecord[]
}

export const usePapersStore = create<PapersState>((set, get) => ({
  // Initial state
  papers: [],
  isLoading: false,
  error: null,
  currentPaperId: null,
  currentPaper: null,
  selectedFolder: null,
  selectedTags: [],
  searchQuery: '',
  sortBy: 'addedAt',
  sortOrder: 'desc',
  viewMode: 'grid',
  showImportModal: false,

  // Load all papers
  loadPapers: async () => {
    set({ isLoading: true, error: null })
    try {
      const records = await getAll<PaperRecord>(STORES.PAPERS)
      set({ papers: records, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load papers',
        isLoading: false,
      })
    }
  },

  // Load single paper
  loadPaper: async (id: string) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, id)
    if (record) {
      set({ currentPaperId: id, currentPaper: record })
    }
  },

  // Add new paper
  addPaper: async (paperData, pdfBlob) => {
    const id = generateId()
    const paper: Paper = {
      ...paperData,
      id,
      addedAt: Date.now(),
      readProgress: 0,
      notes: [],
    }

    const record: PaperRecord = {
      id,
      paper,
      pdfBlob,
      addedAt: Date.now(),
    }

    await put(STORES.PAPERS, record)

    set((state) => ({
      papers: [...state.papers, record],
    }))

    return record
  },

  // Update paper
  updatePaper: async (id, updates) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, id)
    if (!record) return

    const updatedRecord: PaperRecord = {
      ...record,
      paper: { ...record.paper, ...updates },
    }

    await put(STORES.PAPERS, updatedRecord)

    set((state) => ({
      papers: state.papers.map((p) => (p.id === id ? updatedRecord : p)),
      currentPaper: state.currentPaperId === id ? updatedRecord : state.currentPaper,
    }))
  },

  // Delete paper
  deletePaper: async (id) => {
    await remove(STORES.PAPERS, id)

    set((state) => ({
      papers: state.papers.filter((p) => p.id !== id),
      currentPaperId: state.currentPaperId === id ? null : state.currentPaperId,
      currentPaper: state.currentPaperId === id ? null : state.currentPaper,
    }))
  },

  // Update read progress
  updateReadProgress: async (id, progress) => {
    await get().updatePaper(id, {
      readProgress: Math.min(100, Math.max(0, progress)),
      lastReadAt: Date.now(),
    })
  },

  // Mark as read
  markAsRead: async (id) => {
    await get().updatePaper(id, {
      readProgress: 100,
      lastReadAt: Date.now(),
    })
  },

  // Add note
  addNote: async (paperId, noteData) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, paperId)
    if (!record) return

    const note: PaperNote = {
      ...noteData,
      id: generateId(),
      createdAt: Date.now(),
    }

    await get().updatePaper(paperId, {
      notes: [...record.paper.notes, note],
    })
  },

  // Update note
  updateNote: async (paperId, noteId, content) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, paperId)
    if (!record) return

    await get().updatePaper(paperId, {
      notes: record.paper.notes.map((n) =>
        n.id === noteId ? { ...n, content } : n
      ),
    })
  },

  // Delete note
  deleteNote: async (paperId, noteId) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, paperId)
    if (!record) return

    await get().updatePaper(paperId, {
      notes: record.paper.notes.filter((n) => n.id !== noteId),
    })
  },

  // Add tag
  addTag: async (paperId, tag) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, paperId)
    if (!record || record.paper.tags.includes(tag)) return

    await get().updatePaper(paperId, {
      tags: [...record.paper.tags, tag],
    })
  },

  // Remove tag
  removeTag: async (paperId, tag) => {
    const record = await dbGet<PaperRecord>(STORES.PAPERS, paperId)
    if (!record) return

    await get().updatePaper(paperId, {
      tags: record.paper.tags.filter((t) => t !== tag),
    })
  },

  // Set folder
  setFolder: async (paperId, folder) => {
    await get().updatePaper(paperId, { folder })
  },

  // Set AI summary
  setSummary: async (paperId, summary) => {
    await get().updatePaper(paperId, { summary })
  },

  // UI actions
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowImportModal: (show) => set({ showImportModal: show }),
  setCurrentPaperId: (id) => {
    set({ currentPaperId: id })
    if (id) {
      get().loadPaper(id)
    } else {
      set({ currentPaper: null })
    }
  },

  // Get all unique tags
  getAllTags: () => {
    const { papers } = get()
    const tagSet = new Set<string>()
    papers.forEach((p) => p.paper.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  },

  // Get all unique folders
  getAllFolders: () => {
    const { papers } = get()
    const folderSet = new Set<string>()
    papers.forEach((p) => {
      if (p.paper.folder) folderSet.add(p.paper.folder)
    })
    return Array.from(folderSet).sort()
  },

  // Get filtered and sorted papers
  getFilteredPapers: () => {
    const {
      papers,
      selectedFolder,
      selectedTags,
      searchQuery,
      sortBy,
      sortOrder,
    } = get()

    let filtered = [...papers]

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter((p) => p.paper.folder === selectedFolder)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.every((tag) => p.paper.tags.includes(tag))
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) =>
        p.paper.title.toLowerCase().includes(query) ||
        p.paper.authors.some((a) => a.toLowerCase().includes(query)) ||
        p.paper.abstract.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'title':
          comparison = a.paper.title.localeCompare(b.paper.title)
          break
        case 'year':
          comparison = a.paper.year - b.paper.year
          break
        case 'lastReadAt':
          comparison = (a.paper.lastReadAt || 0) - (b.paper.lastReadAt || 0)
          break
        case 'addedAt':
        default:
          comparison = a.addedAt - b.addedAt
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },
}))
