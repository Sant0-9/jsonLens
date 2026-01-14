# Complete Build Plan: Research Workbench + Overleaf Replacement

> **100% Feature Complete. No MVPs. No Shortcuts.**

---

## Project Overview

A unified research toolkit combining:
1. **Full Overleaf Replacement** - No compile limits, multi-file projects, all LaTeX features
2. **Paper Lens** - AI-powered paper reading
3. **Prompt Lab** - Multi-model prompt testing
4. **ArXiv Radar** - Smart paper discovery
5. **Experiment Log** - Lightweight ML tracking
6. **Cost Dashboard** - API spend tracking

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App (Browser)                     │
├─────────────────────────────────────────────────────────────────┤
│  Routes:                                                         │
│  /              → Dashboard (module launcher)                    │
│  /latex         → Full LaTeX Editor (Overleaf replacement)       │
│  /papers        → Paper Lens                                     │
│  /prompts       → Prompt Lab                                     │
│  /arxiv         → ArXiv Radar                                    │
│  /experiments   → Experiment Log                                 │
│  /costs         → Cost Dashboard                                 │
│  /settings      → API keys, preferences                          │
├─────────────────────────────────────────────────────────────────┤
│  State: Zustand stores (per module)                              │
│  Storage: IndexedDB (papers, projects, experiments)              │
│  Theme: next-themes (dark/light)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services (BYOK)                     │
├─────────────────────────────────────────────────────────────────┤
│  LaTeX Compilation:                                              │
│  ├── Option A: Docker container (local, no limits)               │
│  ├── Option B: VPS with TeX Live (remote, your server)           │
│  └── Option C: latex.online API (free tier, fallback)            │
│                                                                  │
│  AI APIs (user's keys):                                          │
│  ├── OpenAI (GPT-4, GPT-4o, o1)                                  │
│  ├── Anthropic (Claude 3.5, Claude 4)                            │
│  ├── Google (Gemini)                                             │
│  ├── Groq (fast inference)                                       │
│  └── Ollama (local models)                                       │
│                                                                  │
│  Data Sources:                                                   │
│  ├── ArXiv API (paper metadata)                                  │
│  ├── Semantic Scholar API (citations)                            │
│  └── CrossRef API (DOI lookup)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module 1: Full LaTeX Editor (Overleaf Replacement)

### 1.1 Compilation System (NO LIMITS)

#### Files to Create:
```
lib/latex/
├── compiler.ts              ✅ EXISTS (needs enhancement)
├── docker-compiler.ts       🆕 Docker-based compilation
├── remote-compiler.ts       🆕 Remote server compilation
├── texlive-installer.ts     🆕 Auto-install TeX Live
└── synctex-parser.ts        🆕 PDF-source synchronization

app/api/latex/
├── compile/route.ts         ✅ EXISTS (needs enhancement)
├── compile-docker/route.ts  🆕 Docker compilation endpoint
└── status/route.ts          🆕 Compilation status check
```

#### Implementation Details:

**docker-compiler.ts**
```typescript
// Spawn Docker container with TeX Live
// Mount project files as volume
// Run pdflatex/xelatex/lualatex
// No timeout limits
// Return PDF + logs
```

**Remote compilation options:**
1. User's own VPS with TeX Live
2. latex.online API (free: 1000 compiles/month)
3. Self-hosted compilation server

**Compilation settings UI:**
- Engine selection: pdflatex, xelatex, lualatex
- Compilation mode: draft, final
- BibTeX/Biber toggle
- Custom preamble injection

### 1.2 Multi-File Project System

#### Files to Create:
```
components/latex/
├── file-tree.tsx            🆕 Project file explorer
├── file-tree-item.tsx       🆕 Tree node component
├── new-file-dialog.tsx      🆕 Create file modal
├── upload-dialog.tsx        🆕 Upload files modal
├── rename-dialog.tsx        🆕 Rename file modal
└── project-settings.tsx     🆕 Project configuration

lib/latex/
├── project-manager.ts       🆕 CRUD for projects
├── file-resolver.ts         🆕 Resolve \input{} paths
└── image-handler.ts         🆕 Handle image uploads

store/
└── project-store.ts         🆕 Multi-file project state
```

#### Data Structures:
```typescript
interface LatexProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  mainFile: string
  files: ProjectFile[]
  settings: ProjectSettings
}

interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
  size: number
}

interface ProjectSettings {
  engine: 'pdflatex' | 'xelatex' | 'lualatex'
  mainFile: string
  outputFormat: 'pdf' | 'dvi'
  bibliography: 'bibtex' | 'biber' | 'none'
  customPreamble?: string
}
```

#### Features:
- [ ] File tree sidebar with drag-drop reorder
- [ ] Create/rename/delete files and folders
- [ ] Upload images (PNG, JPG, PDF, EPS)
- [ ] Auto-resolve \input{}, \include{}, \includegraphics{}
- [ ] .bib file support with BibTeX/Biber
- [ ] .cls and .sty custom class support
- [ ] Project templates (article, report, thesis, beamer)
- [ ] Export project as .zip
- [ ] Import from .zip or Overleaf export

### 1.3 Advanced Editor Features

#### Files to Create/Modify:
```
components/latex/
├── latex-monaco.tsx         ✅ EXISTS (needs enhancement)
├── autocomplete-provider.ts 🆕 LaTeX command completion
├── snippet-provider.ts      🆕 Code snippets
├── error-lens.tsx           🆕 Inline error display
├── outline-view.tsx         🆕 Document structure
├── find-replace.tsx         🆕 Advanced search
└── vim-mode.ts              🆕 Optional Vim keybindings

lib/latex/
├── latex-language.ts        🆕 Full language definition
├── latex-formatter.ts       🆕 Auto-formatting
└── latex-linter.ts          🆕 Real-time linting
```

#### Autocomplete Features:
- [ ] All LaTeX commands (\section, \begin, etc.)
- [ ] Environment completion (\begin{...} → auto-close)
- [ ] Greek letters (\alpha → α preview)
- [ ] Math symbols with preview
- [ ] Citation keys from .bib files
- [ ] Cross-reference labels (\ref{...})
- [ ] File paths for \input{}, \includegraphics{}
- [ ] Package-specific commands

#### Snippet Library:
```
Trigger     → Expansion
fig         → \begin{figure}...\end{figure}
tab         → \begin{tabular}...\end{tabular}
eq          → \begin{equation}...\end{equation}
align       → \begin{align}...\end{align}
enum        → \begin{enumerate}...\end{enumerate}
item        → \begin{itemize}...\end{itemize}
frac        → \frac{▸}{▸}
sqrt        → \sqrt{▸}
sum         → \sum_{▸}^{▸}
int         → \int_{▸}^{▸}
```

### 1.4 PDF Viewer Enhancements

#### Files to Modify/Create:
```
components/latex/
├── latex-pdf-viewer.tsx     ✅ EXISTS (needs enhancement)
├── pdf-search.tsx           🆕 Text search in PDF
├── pdf-thumbnails.tsx       🆕 Page thumbnail navigation
├── pdf-annotations.tsx      🆕 Highlight, notes
└── synctex-overlay.tsx      🆕 Click-to-source
```

#### Features:
- [ ] SyncTeX: Click PDF → jump to source line
- [ ] SyncTeX: Click source → highlight in PDF
- [ ] Text search within PDF
- [ ] Page thumbnails sidebar
- [ ] Annotations (highlight, underline, notes)
- [ ] Presentation mode for Beamer
- [ ] Two-page spread view
- [ ] Continuous scroll mode
- [ ] Keyboard navigation (j/k, arrows)

### 1.5 Bibliography Management

#### Files to Create:
```
components/latex/
├── bib-manager.tsx          🆕 Bibliography editor
├── bib-entry-form.tsx       🆕 Add/edit entry
├── bib-import.tsx           🆕 Import from DOI/URL
├── citation-picker.tsx      🆕 Insert citation dialog
└── bib-preview.tsx          🆕 Formatted preview

lib/latex/
├── bib-parser.ts            🆕 Parse .bib files
├── bib-formatter.ts         🆕 Format entries
├── doi-lookup.ts            🆕 Fetch from CrossRef
└── citation-styles.ts       🆕 CSL style support
```

#### Features:
- [ ] Visual .bib file editor
- [ ] Add entry manually (form-based)
- [ ] Import from DOI (paste DOI → fetch metadata)
- [ ] Import from URL (arXiv, Semantic Scholar)
- [ ] Import from BibTeX string
- [ ] Citation key generation (author-year format)
- [ ] Duplicate detection
- [ ] Citation preview (APA, IEEE, etc.)
- [ ] \cite{} autocomplete with preview
- [ ] Unused entry detection

### 1.6 Templates System

#### Files to Create:
```
components/latex/
├── template-gallery.tsx     🆕 Browse templates
├── template-preview.tsx     🆕 Preview before use
└── template-customizer.tsx  🆕 Customize before create

lib/latex/
├── templates/
│   ├── article.tex          🆕 Basic article
│   ├── ieee.tex             🆕 IEEE conference
│   ├── acm.tex              🆕 ACM format
│   ├── arxiv.tex            🆕 arXiv preprint
│   ├── thesis.tex           🆕 Thesis template
│   ├── report.tex           🆕 Technical report
│   ├── beamer.tex           🆕 Presentation slides
│   ├── cv-academic.tex      🆕 Academic CV
│   ├── cv-modern.tex        🆕 Modern CV
│   ├── letter.tex           🆕 Formal letter
│   └── poster.tex           🆕 Conference poster
└── template-engine.ts       🆕 Variable substitution
```

#### Template Variables:
```latex
% Template placeholders
{{TITLE}}
{{AUTHOR}}
{{DATE}}
{{INSTITUTION}}
{{EMAIL}}
{{ABSTRACT}}
```

### 1.7 Version History

#### Files to Create:
```
components/latex/
├── version-history.tsx      🆕 History sidebar
├── version-diff.tsx         🆕 Compare versions
└── version-restore.tsx      🆕 Restore dialog

lib/latex/
├── version-manager.ts       🆕 Store versions in IndexedDB
└── diff-engine.ts           🆕 Line-by-line diff
```

#### Features:
- [ ] Auto-save versions every 5 minutes
- [ ] Manual save points with labels
- [ ] Visual diff between versions
- [ ] Restore to any version
- [ ] Export version as .tex
- [ ] Purge old versions (keep last 50)

---

## Module 2: Paper Lens

### 2.1 PDF Reader

#### Files to Create:
```
app/papers/
├── page.tsx                 🆕 Papers list view
├── [id]/page.tsx            🆕 Single paper view
└── layout.tsx               🆕 Papers layout

components/papers/
├── paper-list.tsx           🆕 Library view
├── paper-card.tsx           🆕 Paper preview card
├── paper-reader.tsx         🆕 Full reader
├── paper-sidebar.tsx        🆕 Metadata panel
├── paper-notes.tsx          🆕 Annotations
├── paper-summary.tsx        🆕 AI summary panel
├── import-paper.tsx         🆕 Import dialog
└── arxiv-import.tsx         🆕 arXiv URL import

lib/papers/
├── pdf-extractor.ts         🆕 Extract text from PDF
├── arxiv-api.ts             🆕 Fetch arXiv metadata
├── semantic-scholar.ts      🆕 Citation data
├── paper-summarizer.ts      🆕 AI summarization
└── bibtex-generator.ts      🆕 Generate citation

store/
└── papers-store.ts          🆕 Paper library state
```

### 2.2 Features

- [ ] Import PDF (drag-drop, file picker)
- [ ] Import from arXiv URL (auto-fetch PDF + metadata)
- [ ] Import from DOI
- [ ] Auto-extract: title, authors, abstract, sections
- [ ] AI summary (using user's API key):
  - Key contributions
  - Methodology
  - Main results
  - Limitations
  - Related work suggestions
- [ ] Highlight text → add notes
- [ ] Generate BibTeX citation
- [ ] Export to LaTeX project
- [ ] Reading progress tracking
- [ ] Tags and folders organization
- [ ] Full-text search across library
- [ ] Citation graph (papers this cites, cited by)

### 2.3 Data Model

```typescript
interface Paper {
  id: string
  title: string
  authors: string[]
  abstract: string
  year: number
  venue?: string
  doi?: string
  arxivId?: string
  pdfData: Blob
  addedAt: number
  lastReadAt?: number
  readProgress: number // 0-100
  tags: string[]
  folder?: string
  notes: PaperNote[]
  summary?: AISummary
  bibtex: string
}

interface PaperNote {
  id: string
  pageNumber: number
  position: { x: number; y: number }
  highlightedText?: string
  content: string
  createdAt: number
}

interface AISummary {
  keyContributions: string[]
  methodology: string
  results: string
  limitations: string
  generatedAt: number
  model: string
  cost: number
}
```

---

## Module 3: Prompt Lab

### 3.1 Structure

#### Files to Create:
```
app/prompts/
├── page.tsx                 🆕 Prompt workspace
├── [id]/page.tsx            🆕 Single prompt view
└── templates/page.tsx       🆕 Template library

components/prompts/
├── prompt-editor.tsx        🆕 Main editor
├── prompt-input.tsx         🆕 Prompt text area
├── model-selector.tsx       🆕 Choose models
├── response-panel.tsx       🆕 Display responses
├── response-compare.tsx     🆕 Side-by-side compare
├── variable-editor.tsx      🆕 Template variables
├── cost-tracker.tsx         🆕 Token/cost display
├── prompt-history.tsx       🆕 Version history
└── template-library.tsx     🆕 Saved templates

lib/prompts/
├── providers/
│   ├── openai.ts            🆕 OpenAI API wrapper
│   ├── anthropic.ts         🆕 Anthropic API wrapper
│   ├── google.ts            🆕 Gemini API wrapper
│   ├── groq.ts              🆕 Groq API wrapper
│   └── ollama.ts            🆕 Local Ollama
├── token-counter.ts         🆕 Count tokens per model
├── cost-calculator.ts       🆕 Calculate API costs
└── prompt-optimizer.ts      🆕 Suggest improvements

store/
└── prompts-store.ts         🆕 Prompts state
```

### 3.2 Features

- [ ] Write prompt with syntax highlighting
- [ ] Template variables: {{variable}} → input fields
- [ ] Select multiple models to test
- [ ] Send to all selected models simultaneously
- [ ] Side-by-side response comparison
- [ ] Token count per model (input + output)
- [ ] Cost tracking per request
- [ ] Response rating (thumbs up/down)
- [ ] Save prompt as template
- [ ] Version history per prompt
- [ ] Export results as JSON/CSV
- [ ] System prompt + user prompt separation
- [ ] Temperature and other parameter controls
- [ ] Streaming responses

### 3.3 Supported Models

```typescript
const SUPPORTED_MODELS = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'o1-preview',
    'o1-mini'
  ],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229'
  ],
  google: [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash'
  ],
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ],
  ollama: [
    'llama3.2',
    'mistral',
    'codellama',
    'phi3'
  ]
}
```

---

## Module 4: ArXiv Radar

### 4.1 Structure

#### Files to Create:
```
app/arxiv/
├── page.tsx                 🆕 Daily digest view
├── filters/page.tsx         🆕 Manage filters
└── history/page.tsx         🆕 Past digests

components/arxiv/
├── digest-view.tsx          🆕 Daily papers list
├── paper-preview.tsx        🆕 Quick preview
├── filter-builder.tsx       🆕 Create filters
├── filter-card.tsx          🆕 Single filter
├── relevance-badge.tsx      🆕 AI score display
└── digest-settings.tsx      🆕 Notification settings

lib/arxiv/
├── arxiv-api.ts             🆕 Fetch papers
├── filter-engine.ts         🆕 Apply filters
├── relevance-scorer.ts      🆕 AI scoring
└── digest-generator.ts      🆕 Generate digest

store/
└── arxiv-store.ts           🆕 ArXiv state
```

### 4.2 Features

- [ ] Configure interest filters:
  - Topics (cs.LG, cs.CL, cs.AI, etc.)
  - Keywords (transformer, attention, RLHF, etc.)
  - Authors (follow specific researchers)
  - Institutions
  - Exclude patterns (surveys, reviews)
- [ ] Daily fetch of new papers
- [ ] AI relevance scoring (0-100) based on your interests
- [ ] Show only papers above threshold (e.g., 70+)
- [ ] Quick summary for each paper
- [ ] One-click add to Paper Lens
- [ ] One-click generate BibTeX
- [ ] Email digest option (via user's email provider)
- [ ] RSS feed generation
- [ ] History of past digests
- [ ] Statistics (papers read, topics trending)

### 4.3 Filter Definition

```typescript
interface ArxivFilter {
  id: string
  name: string
  enabled: boolean
  categories: string[]        // ['cs.LG', 'cs.CL']
  keywords: string[]          // ['transformer', 'attention']
  authors: string[]           // ['Yann LeCun', 'Geoffrey Hinton']
  excludeKeywords: string[]   // ['survey', 'review', 'benchmark']
  minRelevance: number        // 0-100
  customPrompt?: string       // "I'm interested in..."
}
```

---

## Module 5: Experiment Log

### 5.1 Structure

#### Files to Create:
```
app/experiments/
├── page.tsx                 🆕 Experiments list
├── [id]/page.tsx            🆕 Single experiment
└── compare/page.tsx         🆕 Compare runs

components/experiments/
├── experiment-list.tsx      🆕 All experiments
├── experiment-card.tsx      🆕 Summary card
├── run-logger.tsx           🆕 Log new run
├── run-table.tsx            🆕 Tabular view
├── run-chart.tsx            🆕 Metric charts
├── run-compare.tsx          🆕 Side-by-side
├── metric-input.tsx         🆕 Log metrics
└── notes-editor.tsx         🆕 Markdown notes

lib/experiments/
├── experiment-manager.ts    🆕 CRUD operations
├── chart-generator.ts       🆕 Generate charts
└── export-utils.ts          🆕 Export to CSV/JSON

store/
└── experiments-store.ts     🆕 Experiments state
```

### 5.2 Features

- [ ] Create experiment (name, description, tags)
- [ ] Log runs with:
  - Hyperparameters (key-value pairs)
  - Metrics (loss, accuracy, etc.)
  - Markdown notes
  - Timestamp
- [ ] Visualize metrics over runs (line charts)
- [ ] Compare multiple runs side-by-side
- [ ] Filter runs by parameters
- [ ] Sort by any metric
- [ ] Export to CSV/JSON
- [ ] Import from CSV
- [ ] Link to Paper Lens (which paper inspired this)
- [ ] Link to Prompt Lab (prompt used)
- [ ] Tags and search

### 5.3 Data Model

```typescript
interface Experiment {
  id: string
  name: string
  description: string
  tags: string[]
  createdAt: number
  runs: ExperimentRun[]
}

interface ExperimentRun {
  id: string
  experimentId: string
  name?: string
  timestamp: number
  hyperparameters: Record<string, string | number | boolean>
  metrics: Record<string, number>
  notes: string // Markdown
  linkedPaperId?: string
  linkedPromptId?: string
}
```

---

## Module 6: Cost Dashboard

### 6.1 Structure

#### Files to Create:
```
app/costs/
├── page.tsx                 🆕 Cost overview
└── [provider]/page.tsx      🆕 Provider breakdown

components/costs/
├── cost-summary.tsx         🆕 Total spending
├── cost-by-provider.tsx     🆕 Breakdown chart
├── cost-by-module.tsx       🆕 Per-module usage
├── cost-timeline.tsx        🆕 Daily/weekly trend
├── budget-alert.tsx         🆕 Set budget limits
└── recommendations.tsx      🆕 Cost-saving tips

lib/costs/
├── cost-tracker.ts          🆕 Track API calls
├── pricing-data.ts          🆕 Model pricing
└── cost-analyzer.ts         🆕 Generate insights

store/
└── costs-store.ts           🆕 Cost tracking state
```

### 6.2 Features

- [ ] Track every API call (tokens, cost, model, module)
- [ ] Total spend: daily, weekly, monthly
- [ ] Breakdown by provider (OpenAI, Anthropic, etc.)
- [ ] Breakdown by module (Paper Lens, Prompt Lab, etc.)
- [ ] Breakdown by model (GPT-4 vs Haiku)
- [ ] Timeline chart
- [ ] Set monthly budget with alerts
- [ ] Recommendations:
  - "You used GPT-4 for summarization. Switch to Haiku, save 90%"
  - "Your most expensive task is X. Consider caching."
- [ ] Export cost report

### 6.3 Pricing Data (Updated Jan 2026)

```typescript
const PRICING = {
  'gpt-4o': { input: 0.0025, output: 0.01 },       // per 1K tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku': { input: 0.0008, output: 0.004 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  // ... etc
}
```

---

## Module 7: Settings & API Keys

### 7.1 Structure

#### Files to Create:
```
app/settings/
├── page.tsx                 🆕 Settings overview
├── api-keys/page.tsx        🆕 Manage API keys
├── compilation/page.tsx     🆕 LaTeX settings
└── appearance/page.tsx      🆕 Theme, fonts

components/settings/
├── api-key-form.tsx         🆕 Add/edit keys
├── api-key-list.tsx         🆕 Saved keys
├── api-key-test.tsx         🆕 Test connection
├── docker-setup.tsx         🆕 Docker configuration
├── theme-picker.tsx         🆕 Theme selection
└── editor-settings.tsx      🆕 Editor preferences

lib/settings/
├── api-key-manager.ts       🆕 Secure key storage
├── encryption.ts            🆕 Encrypt keys locally
└── settings-schema.ts       🆕 Settings types
```

### 7.2 Features

- [ ] Securely store API keys (encrypted in IndexedDB)
- [ ] Test API connection before saving
- [ ] Configure compilation:
  - Docker path
  - Remote server URL
  - Fallback to latex.online
  - Default engine (pdflatex/xelatex/lualatex)
- [ ] Appearance:
  - Light/dark/system theme
  - Editor font size
  - Editor font family
  - Line height
  - Tab size
- [ ] Keyboard shortcuts customization
- [ ] Data management:
  - Export all data
  - Import data
  - Clear cache
  - Reset to defaults

---

## Module 8: Dashboard (Home)

### 8.1 Structure

#### Files to Create:
```
app/
├── page.tsx                 🆕 Dashboard home

components/dashboard/
├── module-grid.tsx          🆕 Module cards
├── recent-activity.tsx      🆕 Recent items
├── quick-stats.tsx          🆕 Summary stats
├── quick-actions.tsx        🆕 Common actions
└── onboarding.tsx           🆕 First-time setup
```

### 8.2 Features

- [ ] Module launcher (grid of cards)
- [ ] Recent activity:
  - Last opened project
  - Last read paper
  - Recent prompts
- [ ] Quick stats:
  - Papers read this week
  - Experiments logged
  - API costs this month
- [ ] Quick actions:
  - New LaTeX project
  - Import paper
  - New prompt
- [ ] First-time onboarding:
  - Set up API keys
  - Choose compilation method
  - Optional: connect Zotero

---

## Database Schema (IndexedDB)

```typescript
// Database: research-workbench

// Store: projects
interface ProjectRecord {
  id: string
  project: LatexProject
  updatedAt: number
}

// Store: papers
interface PaperRecord {
  id: string
  paper: Paper
  pdfBlob: Blob
  addedAt: number
}

// Store: prompts
interface PromptRecord {
  id: string
  prompt: Prompt
  versions: PromptVersion[]
  results: PromptResult[]
}

// Store: experiments
interface ExperimentRecord {
  id: string
  experiment: Experiment
}

// Store: arxiv-digests
interface DigestRecord {
  date: string // YYYY-MM-DD
  papers: ArxivPaper[]
  scores: Record<string, number>
}

// Store: api-costs
interface CostRecord {
  id: string
  timestamp: number
  provider: string
  model: string
  module: string
  inputTokens: number
  outputTokens: number
  cost: number
}

// Store: settings
interface SettingsRecord {
  key: string
  value: any
  encryptedValue?: string // For API keys
}

// Store: versions
interface VersionRecord {
  projectId: string
  versionId: string
  content: Record<string, string>
  timestamp: number
  label?: string
}
```

---

## File Count Summary

| Category | New Files | Existing (Modify) |
|----------|-----------|-------------------|
| App routes | 15 | 2 |
| Components | 65 | 8 |
| Lib utilities | 35 | 3 |
| Store files | 8 | 1 |
| Templates | 11 | 0 |
| **Total** | **134** | **14** |

---

## Build Order (Sequential Phases)

### Phase 1: Core Infrastructure
1. Settings & API key management
2. IndexedDB schema and utilities
3. Dashboard home
4. Navigation between modules

### Phase 2: LaTeX Editor (Complete Overleaf Replacement)
1. Docker compilation setup
2. Multi-file project system
3. File tree component
4. Enhanced autocomplete
5. Snippet system
6. Bibliography manager
7. Template gallery
8. Version history
9. Enhanced PDF viewer with SyncTeX
10. Project import/export

### Phase 3: Paper Lens
1. PDF reader component
2. ArXiv import
3. Paper library
4. AI summarization
5. Notes and highlights
6. BibTeX generation
7. Search and organization

### Phase 4: Prompt Lab
1. Multi-provider API wrapper
2. Prompt editor
3. Side-by-side comparison
4. Token counting
5. Cost tracking
6. Template system
7. History and versioning

### Phase 5: ArXiv Radar
1. ArXiv API integration
2. Filter builder
3. AI relevance scoring
4. Daily digest generation
5. Integration with Paper Lens

### Phase 6: Experiment Log
1. Experiment CRUD
2. Run logging
3. Metric visualization
4. Run comparison
5. Export functionality

### Phase 7: Cost Dashboard
1. Cost tracking infrastructure
2. Provider breakdown
3. Timeline charts
4. Budget alerts
5. Recommendations

### Phase 8: Polish & Integration
1. Keyboard shortcuts everywhere
2. Mobile responsiveness
3. Performance optimization
4. Error handling
5. Onboarding flow
6. Documentation

---

## Compilation Strategy (Solving the Overleaf Limit Problem)

### Option A: Local Docker (Recommended)

**Setup:**
```bash
# One-time setup
docker pull texlive/texlive:latest

# Compilation command (run by app)
docker run --rm -v $(pwd):/workdir texlive/texlive \
  pdflatex -output-directory=/workdir /workdir/main.tex
```

**Pros:**
- No limits
- Full TeX Live (all packages)
- Works offline
- Fast after first run

**Cons:**
- 4GB+ Docker image
- Requires Docker installed

### Option B: Remote VPS

**Setup:**
- $5/month VPS (DigitalOcean, Vultr)
- Install TeX Live
- Simple API endpoint

**Pros:**
- No local CPU/storage
- Accessible from anywhere

**Cons:**
- Monthly cost
- Internet required

### Option C: latex.online API (Fallback)

**Usage:**
```typescript
const response = await fetch('https://latex.ytotech.com/builds/sync', {
  method: 'POST',
  body: JSON.stringify({
    compiler: 'pdflatex',
    resources: [{ path: 'main.tex', content: latexContent }]
  })
})
```

**Pros:**
- Free tier (1000/month)
- No setup

**Cons:**
- Rate limits
- Internet required
- Limited packages

### Implementation:

```typescript
// lib/latex/compiler-router.ts
async function compile(project: LatexProject): Promise<CompileResult> {
  const settings = await getCompilationSettings()

  // Try in order of preference
  if (settings.docker.enabled && await isDockerAvailable()) {
    return compileWithDocker(project)
  }

  if (settings.remote.enabled && settings.remote.url) {
    return compileWithRemote(project, settings.remote.url)
  }

  // Fallback to latex.online
  return compileWithLatexOnline(project)
}
```

---

## Success Criteria

The project is **100% complete** when:

1. **LaTeX Editor**
   - [ ] Can compile complex documents (thesis, 100+ pages) without limits
   - [ ] Multi-file projects work (10+ files, images, .bib)
   - [ ] All Overleaf features replicated
   - [ ] SyncTeX click-to-source works

2. **Paper Lens**
   - [ ] Can import from arXiv URL
   - [ ] AI summary costs <$0.05/paper
   - [ ] Library holds 500+ papers without performance issues
   - [ ] Full-text search works

3. **Prompt Lab**
   - [ ] All 5 providers work
   - [ ] Token counting accurate
   - [ ] Cost tracking matches actual bills

4. **ArXiv Radar**
   - [ ] Daily digest generates in <2 minutes
   - [ ] Relevance scoring is useful (not random)
   - [ ] Integration with Paper Lens works

5. **Experiment Log**
   - [ ] Can log 1000+ runs without slowdown
   - [ ] Charts render correctly
   - [ ] Export to CSV works

6. **Cost Dashboard**
   - [ ] Tracking accurate to the cent
   - [ ] Recommendations are actionable

7. **Overall**
   - [ ] All data persists in IndexedDB
   - [ ] Works offline (except API calls)
   - [ ] No memory leaks
   - [ ] Build passes, no TypeScript errors
   - [ ] Lighthouse score >90

---

## Timeline Estimate

**Not providing time estimates** as requested, but here's the build order and dependencies:

```
Phase 1 (Infrastructure)
    ↓
Phase 2 (LaTeX) ←── Most complex, do first
    ↓
Phase 3 (Papers) + Phase 4 (Prompts) ←── Can parallelize
    ↓
Phase 5 (ArXiv) ←── Depends on Papers
    ↓
Phase 6 (Experiments) + Phase 7 (Costs) ←── Independent
    ↓
Phase 8 (Polish)
```

---

## Ready to Build

This plan is comprehensive and actionable. Each section can be implemented file-by-file.

**Start with:** Phase 1 → Settings & API key management, then Docker compilation setup.

Say "start building" and I'll begin with Phase 1.
