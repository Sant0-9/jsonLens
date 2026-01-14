# jsonLens - Project Archive Documentation

> **Local-first JSON visualization studio** - "See JSON clearly. Diagram instantly."

This document archives the complete architecture and feature set of jsonLens before any major changes.

---

## Overview

jsonLens is a powerful, browser-based JSON visualization and analysis tool built with Next.js 15. It processes data entirely locally with zero network calls (except optional LLM features), supporting files up to 100MB.

**Core Philosophy:**
- Local-first (privacy by design)
- Zero-config (drag and drop to start)
- Feature-rich (13 visualization modes)
- Performance-focused (Web Workers, virtualization)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15.5.9 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui, Radix UI |
| State | Zustand 5.0.8 |
| Storage | IndexedDB, localStorage |
| Charts | Recharts, D3.js |
| Diagrams | Mermaid 11.12 |
| Editor | Monaco Editor |
| Query | JSONPath, JMESPath |
| Parsing | PapaParse (CSV), js-yaml (YAML) |
| Math | KaTeX (LaTeX rendering) |
| PDF | pdfjs-dist |

---

## Feature Overview

### 13 Visualization Modes

| # | View | Shortcut | Description |
|---|------|----------|-------------|
| 1 | Tree | Cmd+1 | Expandable JSON tree with search |
| 2 | Table | Cmd+2 | Virtualized data table with sorting |
| 3 | Raw | Cmd+3 | Monaco editor with syntax highlighting |
| 4 | Diff | Cmd+4 | Side-by-side JSON comparison |
| 5 | Query | Cmd+5 | JSONPath/JMESPath query engine |
| 6 | Schema | Cmd+6 | Auto-inferred schema with type detection |
| 7 | Diagram | Cmd+7 | Mermaid diagrams (class, flowchart, ER) |
| 8 | Graph | Cmd+8 | D3 force-directed relationship graph |
| 9 | Visualize | Cmd+9 | Charts (treemap, heatmap, timeline) |
| 10 | Transform | Cmd+Shift+1 | Flatten, pivot, dedupe, redact |
| 11 | API | Cmd+Shift+2 | OpenAPI playground with sequence diagrams |
| 12 | Profiler | - | Statistical analysis, outlier detection |
| 13 | NLQ | - | Natural language queries |

### Additional Features

- **Command Palette** (Cmd+K) - Quick actions
- **Multi-workspace tabs** - Work with multiple files
- **Crash recovery** - Auto-restore sessions
- **Dark/light themes** - System-aware theming
- **Plugin system** - Extensible transformations
- **LLM integration** - OpenAI/Anthropic for NLQ
- **Export** - JSON, CSV, YAML, TypeScript types, Zod schemas

### LaTeX Editor (/latex)

Separate full-featured LaTeX editor with:
- Monaco editor with LaTeX syntax
- Live KaTeX preview
- PDF compilation
- Symbol palette (1000+ symbols)
- Multi-file projects

---

## Directory Structure

```
jsonLens/
├── app/
│   ├── page.tsx                 # Main JSON viewer
│   ├── latex/page.tsx           # LaTeX editor
│   ├── diagnostics/page.tsx     # Debug info
│   └── api/
│       ├── llm/generate/        # LLM API
│       ├── validate-llm/        # LLM validation
│       └── latex/compile/       # LaTeX compilation
│
├── components/
│   ├── json-viewer.tsx          # Main orchestrator
│   ├── json-import.tsx          # File import UI
│   ├── json-toolbar.tsx         # View switcher
│   ├── command-palette.tsx      # Cmd+K interface
│   ├── workspace-tabs.tsx       # Multi-tab support
│   ├── tree-view.tsx            # Tree visualization
│   ├── table-view.tsx           # Table with virtualization
│   ├── raw-view.tsx             # Monaco raw editor
│   ├── diff-view.tsx            # JSON diff
│   ├── query-view.tsx           # Query interface
│   ├── schema-view.tsx          # Schema display
│   ├── diagram-view.tsx         # Mermaid diagrams
│   ├── graph-view.tsx           # D3 graph
│   ├── visualization-view.tsx   # Charts
│   ├── transform-view.tsx       # Transformations
│   ├── api-playground-view.tsx  # API testing
│   ├── profiler-view.tsx        # Data profiling
│   ├── nlq-view.tsx             # Natural language
│   ├── latex/                   # LaTeX components
│   └── ui/                      # Base UI components
│
├── lib/
│   ├── json-parser.ts           # JSON parsing
│   ├── json-query.ts            # Query execution
│   ├── json-diff.ts             # Diff algorithm
│   ├── transformers.ts          # Data transforms
│   ├── converters.ts            # Format conversion
│   ├── schema-inference.ts      # Schema generation
│   ├── data-profiler.ts         # Statistical analysis
│   ├── graph-inference.ts       # Relationship detection
│   ├── mermaid-generator.ts     # Diagram generation
│   ├── natural-language-processor.ts  # NLQ parsing
│   ├── openapi-parser.ts        # OpenAPI support
│   ├── plugin-system.ts         # Plugin architecture
│   ├── llm-service.ts           # LLM integration
│   ├── indexeddb.ts             # Local storage
│   └── latex/compiler.ts        # LaTeX compilation
│
├── store/
│   ├── json-store.ts            # Main state
│   └── latex-store.ts           # LaTeX state
```

---

## Key Components

### State Management (Zustand)

**JSON Store** - Main application state:
```typescript
interface JsonState {
  jsonData: JsonValue | null
  rawJson: string
  fileName: string | null
  fileSize: number
  view: ViewType  // 13 view types
  searchQuery: string
  error: JsonError | null
  visualizationConfig: VisualizationConfig
}
```

**LaTeX Store** - Editor state:
```typescript
interface LatexState {
  content: string
  fileName: string
  files: LatexFile[]
  compiledPDF: Uint8Array | null
  view: 'split' | 'editor' | 'preview' | 'pdf'
}
```

### Core Libraries

| Library | Purpose |
|---------|---------|
| `json-parser.ts` | Parse JSON with error recovery |
| `json-query.ts` | JSONPath/JMESPath execution |
| `transformers.ts` | Flatten, pivot, dedupe, redact |
| `schema-inference.ts` | Auto-generate JSON Schema |
| `data-profiler.ts` | Statistics, outliers, distributions |
| `mermaid-generator.ts` | Class, flowchart, ER diagrams |
| `natural-language-processor.ts` | Parse English to actions |

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/llm/generate` | POST | Generate LLM responses |
| `/api/validate-llm` | POST | Validate LLM config |
| `/api/latex/compile` | POST | Compile LaTeX to PDF |

---

## Performance Targets

- Parse 100MB JSON: < 2 seconds (Web Worker)
- Render 10k items: < 100ms (virtualization)
- Query 100k items: < 500ms
- Generate diagram: < 1 second
- Graph: 5k nodes with smooth interaction

---

## Data Format Support

**Input:** JSON, CSV, YAML, OpenAPI specs, paste/drag-drop

**Output:** JSON, CSV, YAML, NDJSON, SVG, PNG, PDF, TypeScript types, JSON Schema, Zod schemas

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "15.5.9",
    "react": "^19.2.3",
    "zustand": "^5.0.8",
    "@monaco-editor/react": "^4.7.0",
    "d3": "^7.9.0",
    "recharts": "^3.2.1",
    "mermaid": "^11.12.0",
    "jsonpath-plus": "^10.3.0",
    "jmespath": "^0.16.0",
    "papaparse": "^5.5.3",
    "js-yaml": "^4.1.1",
    "katex": "^0.16.27",
    "pdfjs-dist": "^5.4.530",
    "cmdk": "^1.1.1"
  }
}
```

---

## Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npm run test     # Jest tests
```

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js App Router | Modern React, SSR support |
| State | Zustand | Lightweight, no boilerplate |
| Storage | IndexedDB | Large data, offline support |
| Virtualization | Custom | Optimized for JSON trees |
| Diagrams | Mermaid | Text-based, themeable |
| Graphs | D3.js | Full control, performance |
| Charts | Recharts | React-native, declarative |
| Editor | Monaco | VS Code quality |

---

## Security

- Local-first: No data leaves browser by default
- No telemetry
- Input sanitization for Mermaid/SQL
- No eval() or dynamic code execution
- CSP headers supported

---

## Related Files

- Build plan: `/home/oneknight/.claude/plans/quirky-conjuring-bear.md`
- This archive: `/home/oneknight/projects/jsonLens/JSONLENS_ARCHIVE.md`

---

*Archived on: January 12, 2026*
