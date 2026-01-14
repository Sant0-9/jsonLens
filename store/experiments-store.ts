import { create } from 'zustand'
import type { Experiment, ExperimentRun } from '@/lib/db/schema'
import { DB_NAME, DB_VERSION, STORES } from '@/lib/db/schema'

interface ExperimentsState {
  // Data
  experiments: Experiment[]
  selectedExperimentId: string | null
  selectedRunIds: string[]

  // UI State
  isLoading: boolean
  isSaving: boolean
  filterStatus: Experiment['status'] | 'all'
  searchQuery: string
  sortBy: 'updated' | 'created' | 'name'
  sortOrder: 'asc' | 'desc'

  // Actions
  loadExperiments: () => Promise<void>
  createExperiment: (experiment: Partial<Experiment>) => Promise<Experiment>
  updateExperiment: (id: string, updates: Partial<Experiment>) => Promise<void>
  deleteExperiment: (id: string) => Promise<void>
  selectExperiment: (id: string | null) => void

  // Run Actions
  addRun: (experimentId: string, run: Partial<ExperimentRun>) => Promise<ExperimentRun>
  updateRun: (experimentId: string, runId: string, updates: Partial<ExperimentRun>) => Promise<void>
  deleteRun: (experimentId: string, runId: string) => Promise<void>
  selectRuns: (runIds: string[]) => void
  toggleRunSelection: (runId: string) => void

  // Metrics Actions
  logMetric: (experimentId: string, runId: string, name: string, value: number, step?: number) => Promise<void>
  logMetrics: (experimentId: string, runId: string, metrics: Record<string, number>) => Promise<void>

  // Filter & Sort
  setFilterStatus: (status: Experiment['status'] | 'all') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'updated' | 'created' | 'name') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  getFilteredExperiments: () => Experiment[]

  // Analysis
  getRunComparison: (runIds: string[]) => {
    runs: ExperimentRun[]
    commonMetrics: string[]
    commonHyperparams: string[]
  }
  getBestRun: (experimentId: string, metric: string, direction: 'max' | 'min') => ExperimentRun | null
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const useExperimentsStore = create<ExperimentsState>((set, get) => ({
  // Initial state
  experiments: [],
  selectedExperimentId: null,
  selectedRunIds: [],
  isLoading: false,
  isSaving: false,
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'updated',
  sortOrder: 'desc',

  // Load experiments from IndexedDB
  loadExperiments: async () => {
    set({ isLoading: true })
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORES.EXPERIMENTS)) {
            db.createObjectStore(STORES.EXPERIMENTS, { keyPath: 'id' })
          }
        },
      })

      const records = await db.getAll(STORES.EXPERIMENTS)
      const experiments = records.map((r: { experiment: Experiment }) => r.experiment)
      set({ experiments, isLoading: false })
    } catch (error) {
      console.error('Failed to load experiments:', error)
      set({ isLoading: false })
    }
  },

  // Create new experiment
  createExperiment: async (experimentData: Partial<Experiment>) => {
    const now = Date.now()
    const experiment: Experiment = {
      id: generateId('exp'),
      name: experimentData.name || 'Untitled Experiment',
      description: experimentData.description || '',
      hypothesis: experimentData.hypothesis,
      tags: experimentData.tags || [],
      status: experimentData.status || 'planning',
      createdAt: now,
      updatedAt: now,
      linkedPapers: experimentData.linkedPapers || [],
      linkedNotes: experimentData.linkedNotes || [],
      runs: [],
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.EXPERIMENTS, { id: experiment.id, experiment })

      set(state => ({ experiments: [...state.experiments, experiment] }))
      return experiment
    } catch (error) {
      console.error('Failed to create experiment:', error)
      throw error
    }
  },

  // Update experiment
  updateExperiment: async (id: string, updates: Partial<Experiment>) => {
    set({ isSaving: true })

    const existingExperiment = get().experiments.find(e => e.id === id)
    if (!existingExperiment) {
      set({ isSaving: false })
      throw new Error('Experiment not found')
    }

    const updatedExperiment: Experiment = {
      ...existingExperiment,
      ...updates,
      updatedAt: Date.now(),
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.EXPERIMENTS, { id: updatedExperiment.id, experiment: updatedExperiment })

      set(state => ({
        experiments: state.experiments.map(e => (e.id === id ? updatedExperiment : e)),
        isSaving: false,
      }))
    } catch (error) {
      console.error('Failed to update experiment:', error)
      set({ isSaving: false })
      throw error
    }
  },

  // Delete experiment
  deleteExperiment: async (id: string) => {
    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.delete(STORES.EXPERIMENTS, id)

      set(state => ({
        experiments: state.experiments.filter(e => e.id !== id),
        selectedExperimentId: state.selectedExperimentId === id ? null : state.selectedExperimentId,
      }))
    } catch (error) {
      console.error('Failed to delete experiment:', error)
      throw error
    }
  },

  selectExperiment: (id: string | null) => {
    set({ selectedExperimentId: id, selectedRunIds: [] })
  },

  // Add run to experiment
  addRun: async (experimentId: string, runData: Partial<ExperimentRun>) => {
    const experiment = get().experiments.find(e => e.id === experimentId)
    if (!experiment) throw new Error('Experiment not found')

    const run: ExperimentRun = {
      id: generateId('run'),
      experimentId,
      name: runData.name,
      status: runData.status || 'running',
      timestamp: Date.now(),
      duration: runData.duration,
      hyperparameters: runData.hyperparameters || {},
      metrics: runData.metrics || {},
      metricsHistory: runData.metricsHistory || {},
      notes: runData.notes || '',
      linkedPaperId: runData.linkedPaperId,
      linkedPromptId: runData.linkedPromptId,
      linkedNoteId: runData.linkedNoteId,
      artifacts: runData.artifacts || [],
    }

    const updatedExperiment: Experiment = {
      ...experiment,
      runs: [...experiment.runs, run],
      status: experiment.status === 'planning' ? 'running' : experiment.status,
      updatedAt: Date.now(),
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.EXPERIMENTS, { id: updatedExperiment.id, experiment: updatedExperiment })

      set(state => ({
        experiments: state.experiments.map(e => (e.id === experimentId ? updatedExperiment : e)),
      }))
      return run
    } catch (error) {
      console.error('Failed to add run:', error)
      throw error
    }
  },

  // Update run
  updateRun: async (experimentId: string, runId: string, updates: Partial<ExperimentRun>) => {
    const experiment = get().experiments.find(e => e.id === experimentId)
    if (!experiment) throw new Error('Experiment not found')

    const runIndex = experiment.runs.findIndex(r => r.id === runId)
    if (runIndex === -1) throw new Error('Run not found')

    const updatedRun = { ...experiment.runs[runIndex], ...updates }
    const updatedRuns = [...experiment.runs]
    updatedRuns[runIndex] = updatedRun

    const updatedExperiment: Experiment = {
      ...experiment,
      runs: updatedRuns,
      updatedAt: Date.now(),
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.EXPERIMENTS, { id: updatedExperiment.id, experiment: updatedExperiment })

      set(state => ({
        experiments: state.experiments.map(e => (e.id === experimentId ? updatedExperiment : e)),
      }))
    } catch (error) {
      console.error('Failed to update run:', error)
      throw error
    }
  },

  // Delete run
  deleteRun: async (experimentId: string, runId: string) => {
    const experiment = get().experiments.find(e => e.id === experimentId)
    if (!experiment) throw new Error('Experiment not found')

    const updatedExperiment: Experiment = {
      ...experiment,
      runs: experiment.runs.filter(r => r.id !== runId),
      updatedAt: Date.now(),
    }

    try {
      const { openDB } = await import('idb')
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORES.EXPERIMENTS, { id: updatedExperiment.id, experiment: updatedExperiment })

      set(state => ({
        experiments: state.experiments.map(e => (e.id === experimentId ? updatedExperiment : e)),
        selectedRunIds: state.selectedRunIds.filter(id => id !== runId),
      }))
    } catch (error) {
      console.error('Failed to delete run:', error)
      throw error
    }
  },

  selectRuns: (runIds: string[]) => {
    set({ selectedRunIds: runIds })
  },

  toggleRunSelection: (runId: string) => {
    set(state => ({
      selectedRunIds: state.selectedRunIds.includes(runId)
        ? state.selectedRunIds.filter(id => id !== runId)
        : [...state.selectedRunIds, runId],
    }))
  },

  // Log single metric
  logMetric: async (experimentId: string, runId: string, name: string, value: number, step?: number) => {
    const experiment = get().experiments.find(e => e.id === experimentId)
    if (!experiment) throw new Error('Experiment not found')

    const runIndex = experiment.runs.findIndex(r => r.id === runId)
    if (runIndex === -1) throw new Error('Run not found')

    const run = experiment.runs[runIndex]
    const history = run.metricsHistory || {}
    const metricHistory = history[name] || []

    const newEntry = {
      step: step ?? metricHistory.length,
      value,
      timestamp: Date.now(),
    }

    const updatedRun: ExperimentRun = {
      ...run,
      metrics: { ...run.metrics, [name]: value },
      metricsHistory: {
        ...history,
        [name]: [...metricHistory, newEntry],
      },
    }

    await get().updateRun(experimentId, runId, updatedRun)
  },

  // Log multiple metrics
  logMetrics: async (experimentId: string, runId: string, metrics: Record<string, number>) => {
    const experiment = get().experiments.find(e => e.id === experimentId)
    if (!experiment) throw new Error('Experiment not found')

    const runIndex = experiment.runs.findIndex(r => r.id === runId)
    if (runIndex === -1) throw new Error('Run not found')

    const run = experiment.runs[runIndex]
    const history = run.metricsHistory || {}
    const updatedHistory = { ...history }

    for (const [name, value] of Object.entries(metrics)) {
      const metricHistory = updatedHistory[name] || []
      updatedHistory[name] = [
        ...metricHistory,
        { step: metricHistory.length, value, timestamp: Date.now() },
      ]
    }

    const updatedRun: ExperimentRun = {
      ...run,
      metrics: { ...run.metrics, ...metrics },
      metricsHistory: updatedHistory,
    }

    await get().updateRun(experimentId, runId, updatedRun)
  },

  // Filters
  setFilterStatus: (status: Experiment['status'] | 'all') => {
    set({ filterStatus: status })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setSortBy: (sortBy: 'updated' | 'created' | 'name') => {
    set({ sortBy })
  },

  setSortOrder: (order: 'asc' | 'desc') => {
    set({ sortOrder: order })
  },

  getFilteredExperiments: () => {
    const { experiments, filterStatus, searchQuery, sortBy, sortOrder } = get()

    let filtered = experiments

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.name.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
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

  // Get comparison data for selected runs
  getRunComparison: (runIds: string[]) => {
    const { experiments } = get()
    const runs: ExperimentRun[] = []

    for (const experiment of experiments) {
      for (const run of experiment.runs) {
        if (runIds.includes(run.id)) {
          runs.push(run)
        }
      }
    }

    // Find common metrics
    const metricSets = runs.map(r => new Set(Object.keys(r.metrics)))
    const commonMetrics = metricSets.length > 0
      ? [...metricSets[0]].filter(m => metricSets.every(s => s.has(m)))
      : []

    // Find common hyperparameters
    const paramSets = runs.map(r => new Set(Object.keys(r.hyperparameters)))
    const commonHyperparams = paramSets.length > 0
      ? [...paramSets[0]].filter(p => paramSets.every(s => s.has(p)))
      : []

    return { runs, commonMetrics, commonHyperparams }
  },

  // Get best run for a metric
  getBestRun: (experimentId: string, metric: string, direction: 'max' | 'min') => {
    const experiment = get().experiments.find(e => e.id === experimentId)
    if (!experiment || experiment.runs.length === 0) return null

    const runsWithMetric = experiment.runs.filter(r => r.metrics[metric] !== undefined)
    if (runsWithMetric.length === 0) return null

    return runsWithMetric.reduce((best, current) => {
      const bestValue = best.metrics[metric]
      const currentValue = current.metrics[metric]
      if (direction === 'max') {
        return currentValue > bestValue ? current : best
      } else {
        return currentValue < bestValue ? current : best
      }
    })
  },
}))
