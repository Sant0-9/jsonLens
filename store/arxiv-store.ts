"use client"

import { create } from 'zustand'
import { put, get as dbGet, getAll, remove, generateId, STORES } from '@/lib/db'
import type { ArxivFilter, ArxivPaper, DigestRecord } from '@/lib/db/schema'
import { searchArxiv, type ArxivPaperData, ARXIV_CATEGORIES } from '@/lib/papers/arxiv-api'

interface ArxivState {
  // Filters
  filters: ArxivFilter[]
  isLoadingFilters: boolean

  // Digest
  currentDigest: DigestRecord | null
  isGeneratingDigest: boolean
  digestError: string | null

  // UI state
  selectedFilterId: string | null
  showFilterDialog: boolean

  // Actions
  loadFilters: () => Promise<void>
  addFilter: (filter: Omit<ArxivFilter, 'id'>) => Promise<string>
  updateFilter: (id: string, updates: Partial<ArxivFilter>) => Promise<void>
  deleteFilter: (id: string) => Promise<void>
  toggleFilter: (id: string) => Promise<void>

  // Digest
  generateDigest: () => Promise<void>
  loadDigest: (date: string) => Promise<void>
  loadLatestDigest: () => Promise<void>

  // UI
  setSelectedFilterId: (id: string | null) => void
  setShowFilterDialog: (show: boolean) => void
}

const FILTERS_KEY = 'arxiv-filters'

export const useArxivStore = create<ArxivState>((set, get) => ({
  // Initial state
  filters: [],
  isLoadingFilters: false,
  currentDigest: null,
  isGeneratingDigest: false,
  digestError: null,
  selectedFilterId: null,
  showFilterDialog: false,

  // Load filters
  loadFilters: async () => {
    set({ isLoadingFilters: true })
    try {
      const record = await dbGet<{ key: string; value: ArxivFilter[] }>(STORES.SETTINGS, FILTERS_KEY)
      set({ filters: record?.value || [], isLoadingFilters: false })
    } catch (error) {
      console.error('Failed to load filters:', error)
      set({ filters: [], isLoadingFilters: false })
    }
  },

  // Save filters
  addFilter: async (filterData) => {
    const id = generateId()
    const filter: ArxivFilter = { ...filterData, id }
    const { filters } = get()
    const updated = [...filters, filter]

    await put(STORES.SETTINGS, { key: FILTERS_KEY, value: updated })
    set({ filters: updated })
    return id
  },

  updateFilter: async (id, updates) => {
    const { filters } = get()
    const updated = filters.map(f => f.id === id ? { ...f, ...updates } : f)

    await put(STORES.SETTINGS, { key: FILTERS_KEY, value: updated })
    set({ filters: updated })
  },

  deleteFilter: async (id) => {
    const { filters, selectedFilterId } = get()
    const updated = filters.filter(f => f.id !== id)

    await put(STORES.SETTINGS, { key: FILTERS_KEY, value: updated })
    set({
      filters: updated,
      selectedFilterId: selectedFilterId === id ? null : selectedFilterId,
    })
  },

  toggleFilter: async (id) => {
    const { filters } = get()
    const filter = filters.find(f => f.id === id)
    if (filter) {
      await get().updateFilter(id, { enabled: !filter.enabled })
    }
  },

  // Generate digest
  generateDigest: async () => {
    const { filters } = get()
    const enabledFilters = filters.filter(f => f.enabled)

    if (enabledFilters.length === 0) {
      set({ digestError: 'No filters enabled. Enable at least one filter.' })
      return
    }

    set({ isGeneratingDigest: true, digestError: null })

    try {
      // Collect all categories and keywords from enabled filters
      const allCategories = new Set<string>()
      const allKeywords = new Set<string>()
      const excludeKeywords = new Set<string>()

      for (const filter of enabledFilters) {
        filter.categories.forEach(c => allCategories.add(c))
        filter.keywords.forEach(k => allKeywords.add(k))
        filter.excludeKeywords.forEach(k => excludeKeywords.add(k))
      }

      // Build search query
      const keywordQuery = Array.from(allKeywords).join(' OR ')
      const papers = await searchArxiv(keywordQuery || 'machine learning', {
        maxResults: 50,
        categories: Array.from(allCategories),
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      })

      // Filter out excluded keywords
      const filteredPapers = papers.filter(paper => {
        const text = `${paper.title} ${paper.abstract}`.toLowerCase()
        return !Array.from(excludeKeywords).some(kw => text.includes(kw.toLowerCase()))
      })

      // Convert to ArxivPaper format and calculate scores
      const today = new Date().toISOString().split('T')[0]
      const scores: Record<string, number> = {}

      const digestPapers: ArxivPaper[] = filteredPapers.map(paper => {
        // Simple relevance scoring based on keyword matches
        const score = calculateRelevanceScore(paper, enabledFilters)
        scores[paper.arxivId] = score

        return {
          id: paper.arxivId,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          categories: paper.categories,
          published: paper.published,
          updated: paper.updated,
          pdfUrl: paper.pdfUrl,
          relevanceScore: score,
        }
      })

      // Sort by relevance score
      digestPapers.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

      // Filter by minimum relevance
      const minRelevance = Math.min(...enabledFilters.map(f => f.minRelevance))
      const relevantPapers = digestPapers.filter(p => (p.relevanceScore || 0) >= minRelevance)

      const digest: DigestRecord = {
        date: today,
        papers: relevantPapers,
        scores,
      }

      await put(STORES.ARXIV_DIGESTS, { id: today, ...digest })
      set({ currentDigest: digest, isGeneratingDigest: false })
    } catch (error) {
      set({
        digestError: error instanceof Error ? error.message : 'Failed to generate digest',
        isGeneratingDigest: false,
      })
    }
  },

  // Load digest
  loadDigest: async (date: string) => {
    try {
      const record = await dbGet<DigestRecord & { id: string }>(STORES.ARXIV_DIGESTS, date)
      if (record) {
        set({ currentDigest: record })
      }
    } catch (error) {
      console.error('Failed to load digest:', error)
    }
  },

  loadLatestDigest: async () => {
    try {
      const digests = await getAll<DigestRecord & { id: string }>(STORES.ARXIV_DIGESTS)
      if (digests.length > 0) {
        // Sort by date descending
        digests.sort((a, b) => b.date.localeCompare(a.date))
        set({ currentDigest: digests[0] })
      }
    } catch (error) {
      console.error('Failed to load latest digest:', error)
    }
  },

  // UI
  setSelectedFilterId: (id) => set({ selectedFilterId: id }),
  setShowFilterDialog: (show) => set({ showFilterDialog: show }),
}))

// Helper function to calculate relevance score
function calculateRelevanceScore(paper: ArxivPaperData, filters: ArxivFilter[]): number {
  let score = 50 // Base score

  const text = `${paper.title} ${paper.abstract}`.toLowerCase()

  for (const filter of filters) {
    // Category match: +10 per matching category
    const categoryMatches = filter.categories.filter(c =>
      paper.categories.some(pc => pc.toLowerCase().includes(c.toLowerCase()))
    )
    score += categoryMatches.length * 10

    // Keyword match: +15 per keyword in title, +5 in abstract
    for (const keyword of filter.keywords) {
      const kw = keyword.toLowerCase()
      if (paper.title.toLowerCase().includes(kw)) {
        score += 15
      } else if (paper.abstract.toLowerCase().includes(kw)) {
        score += 5
      }
    }

    // Author match: +20
    for (const author of filter.authors) {
      if (paper.authors.some(a => a.toLowerCase().includes(author.toLowerCase()))) {
        score += 20
      }
    }
  }

  return Math.min(100, score)
}

export { ARXIV_CATEGORIES }
