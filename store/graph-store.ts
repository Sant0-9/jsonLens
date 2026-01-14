import { create } from 'zustand'
import { analyzeGaps, getGraphHealthScore, type GapSuggestion } from '@/lib/graph/gap-detector'

export interface GraphNode {
  id: string
  label: string
  type: 'paper' | 'note' | 'question' | 'experiment' | 'tag'
  color?: string
  size?: number
  data?: Record<string, unknown>
}

export interface GraphLink {
  source: string
  target: string
  type: 'cites' | 'links_to' | 'answers' | 'tagged' | 'related'
  label?: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface GraphHealthMetrics {
  score: number
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  metrics: {
    totalNodes: number
    totalLinks: number
    orphanCount: number
    weakConnectionCount: number
    clusterCount: number
    avgConnectionsPerNode: number
  }
}

interface GraphState {
  // Data
  graphData: GraphData
  selectedNodeId: string | null
  gapSuggestions: GapSuggestion[]
  healthMetrics: GraphHealthMetrics | null

  // UI State
  isLoading: boolean
  showPapers: boolean
  showNotes: boolean
  showQuestions: boolean
  showExperiments: boolean
  showTags: boolean
  highlightLinks: boolean
  focusedType: GraphNode['type'] | 'all'
  showGapPanel: boolean

  // Actions
  buildGraph: (data: {
    papers: Array<{ id: string; title: string; tags: string[] }>
    notes: Array<{ id: string; title: string; tags: string[]; linkedNotes: string[]; linkedPapers: string[] }>
    questions: Array<{ id: string; question: string; tags: string[]; linkedPapers: string[]; linkedNotes: string[] }>
    experiments: Array<{ id: string; name: string; tags: string[]; linkedPapers: string[]; linkedNotes: string[] }>
  }) => void
  selectNode: (id: string | null) => void
  toggleFilter: (type: 'papers' | 'notes' | 'questions' | 'experiments' | 'tags') => void
  setFocusedType: (type: GraphNode['type'] | 'all') => void
  toggleGapPanel: () => void
  getFilteredGraph: () => GraphData
}

// Node colors by type
const nodeColors: Record<GraphNode['type'], string> = {
  paper: '#3b82f6', // blue
  note: '#22c55e', // green
  question: '#f59e0b', // amber
  experiment: '#8b5cf6', // violet
  tag: '#6b7280', // gray
}

// Node sizes by type
const nodeSizes: Record<GraphNode['type'], number> = {
  paper: 8,
  note: 6,
  question: 7,
  experiment: 7,
  tag: 4,
}

export const useGraphStore = create<GraphState>((set, get) => ({
  // Initial state
  graphData: { nodes: [], links: [] },
  selectedNodeId: null,
  gapSuggestions: [],
  healthMetrics: null,
  isLoading: false,
  showPapers: true,
  showNotes: true,
  showQuestions: true,
  showExperiments: true,
  showTags: true,
  highlightLinks: true,
  focusedType: 'all',
  showGapPanel: false,

  // Build graph from all data sources
  buildGraph: (data) => {
    set({ isLoading: true })

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const tagSet = new Set<string>()

    // Add paper nodes
    for (const paper of data.papers) {
      nodes.push({
        id: `paper:${paper.id}`,
        label: paper.title,
        type: 'paper',
        color: nodeColors.paper,
        size: nodeSizes.paper,
        data: paper,
      })

      // Collect tags
      paper.tags.forEach(tag => tagSet.add(tag))
    }

    // Add note nodes and links
    for (const note of data.notes) {
      nodes.push({
        id: `note:${note.id}`,
        label: note.title,
        type: 'note',
        color: nodeColors.note,
        size: nodeSizes.note,
        data: note,
      })

      // Link to other notes
      for (const linkedNoteId of note.linkedNotes) {
        links.push({
          source: `note:${note.id}`,
          target: `note:${linkedNoteId}`,
          type: 'links_to',
        })
      }

      // Link to papers
      for (const paperId of note.linkedPapers) {
        links.push({
          source: `note:${note.id}`,
          target: `paper:${paperId}`,
          type: 'cites',
        })
      }

      // Collect tags
      note.tags.forEach(tag => tagSet.add(tag))
    }

    // Add question nodes and links
    for (const question of data.questions) {
      nodes.push({
        id: `question:${question.id}`,
        label: question.question.length > 50
          ? question.question.substring(0, 50) + '...'
          : question.question,
        type: 'question',
        color: nodeColors.question,
        size: nodeSizes.question,
        data: question,
      })

      // Link to papers
      for (const paperId of question.linkedPapers) {
        links.push({
          source: `question:${question.id}`,
          target: `paper:${paperId}`,
          type: 'answers',
        })
      }

      // Link to notes
      for (const noteId of question.linkedNotes) {
        links.push({
          source: `question:${question.id}`,
          target: `note:${noteId}`,
          type: 'related',
        })
      }

      // Collect tags
      question.tags.forEach(tag => tagSet.add(tag))
    }

    // Add experiment nodes and links
    for (const experiment of data.experiments) {
      nodes.push({
        id: `experiment:${experiment.id}`,
        label: experiment.name,
        type: 'experiment',
        color: nodeColors.experiment,
        size: nodeSizes.experiment,
        data: experiment,
      })

      // Link to papers
      for (const paperId of experiment.linkedPapers) {
        links.push({
          source: `experiment:${experiment.id}`,
          target: `paper:${paperId}`,
          type: 'related',
        })
      }

      // Link to notes
      for (const noteId of experiment.linkedNotes) {
        links.push({
          source: `experiment:${experiment.id}`,
          target: `note:${noteId}`,
          type: 'related',
        })
      }

      // Collect tags
      experiment.tags.forEach(tag => tagSet.add(tag))
    }

    // Add tag nodes and links
    for (const tag of tagSet) {
      nodes.push({
        id: `tag:${tag}`,
        label: tag,
        type: 'tag',
        color: nodeColors.tag,
        size: nodeSizes.tag,
      })

      // Link items to their tags
      for (const paper of data.papers) {
        if (paper.tags.includes(tag)) {
          links.push({
            source: `paper:${paper.id}`,
            target: `tag:${tag}`,
            type: 'tagged',
          })
        }
      }

      for (const note of data.notes) {
        if (note.tags.includes(tag)) {
          links.push({
            source: `note:${note.id}`,
            target: `tag:${tag}`,
            type: 'tagged',
          })
        }
      }

      for (const question of data.questions) {
        if (question.tags.includes(tag)) {
          links.push({
            source: `question:${question.id}`,
            target: `tag:${tag}`,
            type: 'tagged',
          })
        }
      }
    }

    const graphData = { nodes, links }

    // Analyze gaps and health
    const gapSuggestions = analyzeGaps(graphData)
    const healthMetrics = getGraphHealthScore(graphData)

    set({ graphData, gapSuggestions, healthMetrics, isLoading: false })
  },

  toggleGapPanel: () => {
    set(state => ({ showGapPanel: !state.showGapPanel }))
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  toggleFilter: (type) => {
    switch (type) {
      case 'papers':
        set(state => ({ showPapers: !state.showPapers }))
        break
      case 'notes':
        set(state => ({ showNotes: !state.showNotes }))
        break
      case 'questions':
        set(state => ({ showQuestions: !state.showQuestions }))
        break
      case 'experiments':
        set(state => ({ showExperiments: !state.showExperiments }))
        break
      case 'tags':
        set(state => ({ showTags: !state.showTags }))
        break
    }
  },

  setFocusedType: (type) => {
    set({ focusedType: type })
  },

  getFilteredGraph: () => {
    const {
      graphData,
      showPapers,
      showNotes,
      showQuestions,
      showExperiments,
      showTags,
      focusedType,
    } = get()

    // Filter nodes
    let filteredNodes = graphData.nodes.filter(node => {
      if (focusedType !== 'all' && node.type !== focusedType) {
        // Keep nodes connected to focused type
        const hasConnection = graphData.links.some(
          link =>
            (link.source === node.id || link.target === node.id) &&
            graphData.nodes.some(
              n => n.type === focusedType && (link.source === n.id || link.target === n.id)
            )
        )
        if (!hasConnection) return false
      }

      switch (node.type) {
        case 'paper':
          return showPapers
        case 'note':
          return showNotes
        case 'question':
          return showQuestions
        case 'experiment':
          return showExperiments
        case 'tag':
          return showTags
        default:
          return true
      }
    })

    const nodeIds = new Set(filteredNodes.map(n => n.id))

    // Filter links to only include those between visible nodes
    const filteredLinks = graphData.links.filter(
      link => nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
    )

    return { nodes: filteredNodes, links: filteredLinks }
  },
}))
