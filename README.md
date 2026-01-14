# Research Workbench

> **BYOK Research Toolkit** - Bring Your Own Keys. Pay API costs, not subscriptions. Own your data.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A unified research toolkit for academics and researchers. LaTeX editing with offline WASM compilation, paper management, AI-powered analysis, and knowledge graph visualization.

## Features

| Module | Description |
|--------|-------------|
| **LaTeX Editor** | Full editor with SwiftLaTeX WASM (offline compilation), PDF preview, templates |
| **Paper Lens** | PDF viewer, ArXiv import, AI summaries, annotations |
| **Prompt Lab** | Multi-model comparison (OpenAI, Anthropic, Google, Groq), cost tracking |
| **ArXiv Radar** | Paper discovery, relevance scoring, daily digest |
| **Research Notes** | Markdown + KaTeX, wikilinks, backlinks |
| **Knowledge Graph** | Visualize connections between papers, notes, questions |
| **Research Questions** | Track open questions, link to papers and notes |
| **Cost Dashboard** | API spend tracking, budget alerts |
| **Experiments** | Track ML experiments, hyperparameters, metrics |

## Quick Start

```bash
# Clone
git clone https://github.com/Sant0-9/jsonLens.git
cd jsonLens

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Storage**: IndexedDB (local-first)
- **LaTeX**: SwiftLaTeX WASM (offline) + latex.online API (fallback)
- **PDF**: PDF.js
- **Editor**: Monaco
- **Graph**: react-force-graph-2d
- **Math**: KaTeX

## Architecture

```
Local-First Design
    |
    +-- Browser (IndexedDB)
    |       |
    |       +-- All data stored locally
    |       +-- Encrypted API keys (AES-GCM)
    |       +-- Offline LaTeX compilation (WASM)
    |
    +-- External APIs (optional, BYOK)
            |
            +-- OpenAI, Anthropic, Google, Groq
            +-- ArXiv API
            +-- latex.online (fallback)
```

## Modules

### LaTeX Editor (`/latex`)
- Monaco editor with LaTeX syntax highlighting
- SwiftLaTeX WASM for offline PDF compilation
- Symbol palette, templates, multi-file projects
- SyncTeX support (click PDF to jump to source)

### Paper Lens (`/papers`)
- Import from ArXiv URL or local PDF
- AI-powered summaries (requires API key)
- Annotations and highlights
- BibTeX export

### Prompt Lab (`/prompts`)
- Compare responses across multiple LLMs
- Template variables `{{topic}}`
- Token counting and cost tracking
- Save and version prompts

### Research Notes (`/notes`)
- Markdown with KaTeX math rendering
- `[[Wikilinks]]` for connecting notes
- `@paper:id` syntax to link papers
- Backlinks panel

### Knowledge Graph (`/graph`)
- Force-directed graph visualization
- Papers, notes, questions as nodes
- Click to navigate
- Gap detection

## API Keys

Add your API keys in Settings (`/settings`):

- **OpenAI**: For GPT models
- **Anthropic**: For Claude models
- **Google**: For Gemini models
- **Groq**: For fast inference

Keys are encrypted with AES-GCM and stored locally. They never leave your browser.

## Offline Support

- **LaTeX compilation**: Works offline via SwiftLaTeX WASM
- **Data access**: All data in IndexedDB, accessible offline
- **API features**: Require network (summaries, LLM queries)

## Deployment

### Vercel (Recommended)
1. Fork this repo
2. Import to [Vercel](https://vercel.com)
3. Deploy (zero config)

### Self-hosted
```bash
npm run build
npm start
```

## Development

```bash
# Dev server
npm run dev

# Type check
npm run lint

# Build
npm run build
```

## License

MIT

---

*Build tools you own. Pay for what you use. Keep your data exportable.*
