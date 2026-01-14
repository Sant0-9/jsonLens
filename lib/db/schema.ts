// IndexedDB Schema for Research Workbench
// Database: research-workbench

export const DB_NAME = 'research-workbench'
export const DB_VERSION = 3

// Store names
export const STORES = {
  PROJECTS: 'projects',
  PAPERS: 'papers',
  PROMPTS: 'prompts',
  EXPERIMENTS: 'experiments',
  ARXIV_DIGESTS: 'arxiv-digests',
  API_COSTS: 'api-costs',
  SETTINGS: 'settings',
  VERSIONS: 'versions',
  NOTES: 'notes',
  QUESTIONS: 'questions',
} as const

// Type definitions

export interface LatexProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  mainFile: string
  files: ProjectFile[]
  settings: ProjectSettings
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
  size: number
}

export interface ProjectSettings {
  engine: 'pdflatex' | 'xelatex' | 'lualatex'
  mainFile: string
  outputFormat: 'pdf' | 'dvi'
  bibliography: 'bibtex' | 'biber' | 'none'
  customPreamble?: string
}

export interface Paper {
  id: string
  title: string
  authors: string[]
  abstract: string
  year: number
  venue?: string
  doi?: string
  arxivId?: string
  addedAt: number
  lastReadAt?: number
  readProgress: number
  tags: string[]
  folder?: string
  notes: PaperNote[]
  summary?: AISummary
  bibtex: string
}

export interface PaperNote {
  id: string
  pageNumber: number
  position: { x: number; y: number }
  highlightedText?: string
  content: string
  createdAt: number
}

export interface AISummary {
  keyContributions: string[]
  methodology: string
  results: string
  limitations: string
  generatedAt: number
  model: string
  cost: number
}

export interface Prompt {
  id: string
  name: string
  systemPrompt: string
  userPrompt: string
  variables: Record<string, string>
  createdAt: number
  updatedAt: number
  tags: string[]
}

export interface PromptVersion {
  id: string
  promptId: string
  systemPrompt: string
  userPrompt: string
  timestamp: number
}

export interface PromptResult {
  id: string
  promptId: string
  versionId: string
  model: string
  provider: string
  response: string
  inputTokens: number
  outputTokens: number
  cost: number
  latency: number
  rating?: 'up' | 'down'
  timestamp: number
}

export interface Experiment {
  id: string
  name: string
  description: string
  hypothesis?: string
  tags: string[]
  status: 'planning' | 'running' | 'completed' | 'failed' | 'archived'
  createdAt: number
  updatedAt: number
  linkedPapers: string[]
  linkedNotes: string[]
  runs: ExperimentRun[]
}

export interface ExperimentRun {
  id: string
  experimentId: string
  name?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  timestamp: number
  duration?: number // in milliseconds
  hyperparameters: Record<string, string | number | boolean>
  metrics: Record<string, number>
  metricsHistory?: Record<string, Array<{ step: number; value: number; timestamp: number }>>
  notes: string
  linkedPaperId?: string
  linkedPromptId?: string
  linkedNoteId?: string
  artifacts?: Array<{ name: string; type: string; url?: string }>
}

export interface ArxivFilter {
  id: string
  name: string
  enabled: boolean
  categories: string[]
  keywords: string[]
  authors: string[]
  excludeKeywords: string[]
  minRelevance: number
  customPrompt?: string
}

export interface ArxivPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  categories: string[]
  published: string
  updated: string
  pdfUrl: string
  relevanceScore?: number
}

export interface ArxivDigest {
  date: string
  papers: ArxivPaper[]
  scores: Record<string, number>
}

export interface CostRecord {
  id: string
  timestamp: number
  provider: string
  model: string
  module: string
  inputTokens: number
  outputTokens: number
  cost: number
}

export interface Settings {
  // API Keys (encrypted)
  apiKeys: {
    openai?: string
    anthropic?: string
    google?: string
    groq?: string
    ollamaUrl?: string
  }
  // Compilation
  compilation: {
    method: 'docker' | 'remote' | 'online'
    dockerPath?: string
    remoteUrl?: string
    defaultEngine: 'pdflatex' | 'xelatex' | 'lualatex'
  }
  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'system'
    editorFontSize: number
    editorFontFamily: string
    lineHeight: number
    tabSize: number
  }
  // Budget
  budget: {
    monthlyLimit?: number
    alertThreshold?: number
    alertEnabled: boolean
  }
}

export interface VersionRecord {
  projectId: string
  versionId: string
  content: Record<string, string>
  timestamp: number
  label?: string
}

// IndexedDB Store Records
export interface ProjectRecord {
  id: string
  project: LatexProject
  updatedAt: number
}

export interface PaperRecord {
  id: string
  paper: Paper
  pdfBlob?: Blob
  addedAt: number
}

export interface PromptRecord {
  id: string
  prompt: Prompt
  versions: PromptVersion[]
  results: PromptResult[]
}

export interface ExperimentRecord {
  id: string
  experiment: Experiment
}

export interface DigestRecord {
  date: string
  papers: ArxivPaper[]
  scores: Record<string, number>
}

export interface SettingsRecord {
  key: string
  value: unknown
  encryptedValue?: string
}

// Research Notes
export interface Note {
  id: string
  title: string
  content: string // Markdown with KaTeX support
  tags: string[]
  linkedPapers: string[] // Paper IDs linked via @paper:id
  linkedNotes: string[] // Note IDs linked via [[Note Title]]
  backlinks: string[] // Note IDs that link to this note
  createdAt: number
  updatedAt: number
  folderId?: string
}

export interface NoteFolder {
  id: string
  name: string
  parentId?: string
  color?: string
  createdAt: number
}

export interface NoteRecord {
  id: string
  note: Note
}

export interface NoteFolderRecord {
  id: string
  folder: NoteFolder
}

// Research Questions
export interface ResearchQuestion {
  id: string
  question: string
  description: string
  status: 'open' | 'exploring' | 'partially_answered' | 'answered' | 'archived'
  priority: 'critical' | 'high' | 'medium' | 'low'
  linkedPapers: string[]
  linkedNotes: string[]
  linkedExperiments: string[]
  answer?: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface QuestionRecord {
  id: string
  question: ResearchQuestion
}
