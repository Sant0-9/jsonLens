import { create } from 'zustand'
import type { ResearchQuestion } from '@/lib/db/schema'
import { DB_NAME, DB_VERSION, STORES } from '@/lib/db/schema'

interface QuestionsState {
  // Data
  questions: ResearchQuestion[]
  selectedQuestionId: string | null

  // UI State
  isLoading: boolean
  isSaving: boolean
  filterStatus: ResearchQuestion['status'] | 'all'
  filterPriority: ResearchQuestion['priority'] | 'all'
  searchQuery: string
  sortBy: 'updated' | 'created' | 'priority'
  sortOrder: 'asc' | 'desc'

  // Actions
  loadQuestions: () => Promise<void>
  createQuestion: (question: Partial<ResearchQuestion>) => Promise<ResearchQuestion>
  updateQuestion: (id: string, updates: Partial<ResearchQuestion>) => Promise<void>
  deleteQuestion: (id: string) => Promise<void>
  selectQuestion: (id: string | null) => void

  // Linking Actions
  linkPaper: (questionId: string, paperId: string) => Promise<void>
  unlinkPaper: (questionId: string, paperId: string) => Promise<void>
  linkNote: (questionId: string, noteId: string) => Promise<void>
  unlinkNote: (questionId: string, noteId: string) => Promise<void>
  linkExperiment: (questionId: string, experimentId: string) => Promise<void>
  unlinkExperiment: (questionId: string, experimentId: string) => Promise<void>

  // Filter & Sort
  setFilterStatus: (status: ResearchQuestion['status'] | 'all') => void
  setFilterPriority: (priority: ResearchQuestion['priority'] | 'all') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'updated' | 'created' | 'priority') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  getFilteredQuestions: () => ResearchQuestion[]

  // Stats
  getQuestionsByStatus: () => Record<ResearchQuestion['status'], number>
  getOpenQuestionsCount: () => number
}

// Generate unique ID
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Priority order for sorting
const priorityOrder: Record<ResearchQuestion['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export const useQuestionsStore = create<QuestionsState>((set, get) => ({
  // Initial state
  questions: [],
  selectedQuestionId: null,
  isLoading: false,
  isSaving: false,
  filterStatus: 'all',
  filterPriority: 'all',
  searchQuery: '',
  sortBy: 'updated',
  sortOrder: 'desc',

  // Load questions from IndexedDB
  loadQuestions: async () => {
    set({ isLoading: true })
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
            db.createObjectStore(STORES.QUESTIONS, { keyPath: 'id' })
          }
        },
      })

      const records = await db.getAll(STORES.QUESTIONS)
      const questions = records.map((r: { question: ResearchQuestion }) => r.question)
      set({ questions, isLoading: false })
    } catch (error) {
      console.error('Failed to load questions:', error)
      set({ isLoading: false })
    }
  },

  // Create new question
  createQuestion: async (questionData: Partial<ResearchQuestion>) => {
    const now = Date.now()
    const question: ResearchQuestion = {
      id: generateId(),
      question: questionData.question || '',
      description: questionData.description || '',
      status: questionData.status || 'open',
      priority: questionData.priority || 'medium',
      linkedPapers: questionData.linkedPapers || [],
      linkedNotes: questionData.linkedNotes || [],
      linkedExperiments: questionData.linkedExperiments || [],
      answer: questionData.answer,
      tags: questionData.tags || [],
      createdAt: now,
      updatedAt: now,
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.QUESTIONS, { id: question.id, question })

      set(state => ({ questions: [...state.questions, question] }))
      return question
    } catch (error) {
      console.error('Failed to create question:', error)
      throw error
    }
  },

  // Update question
  updateQuestion: async (id: string, updates: Partial<ResearchQuestion>) => {
    set({ isSaving: true })

    const existingQuestion = get().questions.find(q => q.id === id)
    if (!existingQuestion) {
      set({ isSaving: false })
      throw new Error('Question not found')
    }

    const updatedQuestion: ResearchQuestion = {
      ...existingQuestion,
      ...updates,
      updatedAt: Date.now(),
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.QUESTIONS, { id: updatedQuestion.id, question: updatedQuestion })

      set(state => ({
        questions: state.questions.map(q => (q.id === id ? updatedQuestion : q)),
        isSaving: false,
      }))
    } catch (error) {
      console.error('Failed to update question:', error)
      set({ isSaving: false })
      throw error
    }
  },

  // Delete question
  deleteQuestion: async (id: string) => {
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.delete(STORES.QUESTIONS, id)

      set(state => ({
        questions: state.questions.filter(q => q.id !== id),
        selectedQuestionId: state.selectedQuestionId === id ? null : state.selectedQuestionId,
      }))
    } catch (error) {
      console.error('Failed to delete question:', error)
      throw error
    }
  },

  selectQuestion: (id: string | null) => {
    set({ selectedQuestionId: id })
  },

  // Link/unlink paper
  linkPaper: async (questionId: string, paperId: string) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    if (!question.linkedPapers.includes(paperId)) {
      await get().updateQuestion(questionId, {
        linkedPapers: [...question.linkedPapers, paperId],
      })
    }
  },

  unlinkPaper: async (questionId: string, paperId: string) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    await get().updateQuestion(questionId, {
      linkedPapers: question.linkedPapers.filter(id => id !== paperId),
    })
  },

  // Link/unlink note
  linkNote: async (questionId: string, noteId: string) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    if (!question.linkedNotes.includes(noteId)) {
      await get().updateQuestion(questionId, {
        linkedNotes: [...question.linkedNotes, noteId],
      })
    }
  },

  unlinkNote: async (questionId: string, noteId: string) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    await get().updateQuestion(questionId, {
      linkedNotes: question.linkedNotes.filter(id => id !== noteId),
    })
  },

  // Link/unlink experiment
  linkExperiment: async (questionId: string, experimentId: string) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    if (!question.linkedExperiments.includes(experimentId)) {
      await get().updateQuestion(questionId, {
        linkedExperiments: [...question.linkedExperiments, experimentId],
      })
    }
  },

  unlinkExperiment: async (questionId: string, experimentId: string) => {
    const question = get().questions.find(q => q.id === questionId)
    if (!question) return

    await get().updateQuestion(questionId, {
      linkedExperiments: question.linkedExperiments.filter(id => id !== experimentId),
    })
  },

  // Filters
  setFilterStatus: (status: ResearchQuestion['status'] | 'all') => {
    set({ filterStatus: status })
  },

  setFilterPriority: (priority: ResearchQuestion['priority'] | 'all') => {
    set({ filterPriority: priority })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setSortBy: (sortBy: 'updated' | 'created' | 'priority') => {
    set({ sortBy })
  },

  setSortOrder: (order: 'asc' | 'desc') => {
    set({ sortOrder: order })
  },

  getFilteredQuestions: () => {
    const { questions, filterStatus, filterPriority, searchQuery, sortBy, sortOrder } = get()

    let filtered = questions

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => q.status === filterStatus)
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(q => q.priority === filterPriority)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        q =>
          q.question.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query) ||
          q.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
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

  // Stats
  getQuestionsByStatus: () => {
    const { questions } = get()
    return questions.reduce(
      (acc, q) => {
        acc[q.status]++
        return acc
      },
      {
        open: 0,
        exploring: 0,
        partially_answered: 0,
        answered: 0,
        archived: 0,
      } as Record<ResearchQuestion['status'], number>
    )
  },

  getOpenQuestionsCount: () => {
    const { questions } = get()
    return questions.filter(q => q.status === 'open' || q.status === 'exploring').length
  },
}))
