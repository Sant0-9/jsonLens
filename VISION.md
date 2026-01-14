# Research Toolkit (BYOK)

> **Bring Your Own Keys. Pay API costs, not subscriptions. Own your data.**

## Why

1. **Subscription fatigue** - Paying $80-150/mo across AI tools, Overleaf Pro, etc. when free tiers + API usage costs $5-20/mo
2. **Data ownership** - If services shut down or raise prices, you lose everything. Exportable data = safety.
3. **Tool fragmentation** - Constantly switching between 5-6 apps for one workflow
4. **Portfolio value** - A serious research toolkit demonstrates initiative for grad school applications

## What

A unified research toolkit deployed on free cloud infrastructure (Cloudflare Pages), using free-tier database (Supabase or Turso). You provide API keys for LLMs, pay per use.

## Modules

| Route | Module | Purpose |
|-------|--------|---------|
| `/papers` | Paper Lens | PDF chat, summaries, citation graph, annotations |
| `/arxiv` | ArXiv Radar | Paper discovery, relevance scoring, daily digest |
| `/prompts` | Prompt Lab | Multi-model comparison, cost tracking |
| `/notes` | Research Notes | Zettelkasten-style connected notes with KaTeX |
| `/latex` | LaTeX Editor | Full LaTeX editing + compilation (replaces Overleaf Pro) |
| `/graph` | Knowledge Graph | Visualize papers + notes connections |
| `/questions` | Research Questions | Track open questions, link to papers |
| `/costs` | Cost Dashboard | API spend tracking, model recommendations |
| `/settings` | Settings | API keys, preferences, export/import |

## LLM Tiers

| Tier | Use Case | Examples |
|------|----------|----------|
| **Lite** | Bulk ops, scoring | GPT-4o-mini, Gemini Flash-Lite, Groq |
| **Normal** | Summaries, chat | Claude Sonnet, GPT-4o |
| **Max** | Deep analysis, reasoning | Claude Opus (extended thinking), DeepSeek R1 |

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Framework | Next.js 15.5+ or 16 | Stable, React 19, Turbopack |
| Deployment | Cloudflare Pages | Unlimited bandwidth free, no surprise bills |
| Database | Supabase or Turso | Free tier, real database |
| Auth | NextAuth.js or Clerk | Optional, add later if needed |
| UI | shadcn/ui + Tailwind | Clean, accessible |
| State | Zustand | Minimal, fast |
| PDF | PDF.js | Standard, maintained |
| Math | KaTeX | Fast rendering |
| LaTeX | SwiftLaTeX (WASM) | In-browser compilation, no server needed |
| Editor | Monaco or CodeMirror | Rich text/code editing |
| Charts | Recharts | Lightweight |
| Graph | D3.js or react-force-graph | Visualization |

## Architecture

```text
Cloudflare Pages (free)
    |
    +-- Next.js App
    |       |
    |       +-- /papers, /arxiv, /prompts, /notes, /latex, /graph, /questions, /costs, /settings
    |
    +-- Supabase or Turso (free tier DB)
    |
    +-- Direct API calls to: OpenAI, Anthropic, Google, DeepSeek, Groq
```

## Build Order

1. **Foundation** - Project setup, DB schema, LLM router (3-tier)
2. **Paper Lens** - PDF viewer, arXiv import, AI chat, summaries, citations
3. **Research Notes** - Markdown + KaTeX editor, linking, tags, paper connections
4. **LaTeX Editor** - Full editor + SwiftLaTeX compilation (no Overleaf needed)
5. **Prompt Lab** - Multi-provider comparison, cost tracking, templates
6. **ArXiv Radar** - Filters, relevance scoring, daily digest, import to Paper Lens
7. **Knowledge Graph** - Visualization of papers + notes, gap detection
8. **Polish** - Research Questions, Cost Dashboard, annotations, export/import, shortcuts

## Anti-Goals

- Not a paid cloud service (use free tiers only)
- Not feature-bloated (focused tools that work)
- Not dependent on any single provider (exportable, replaceable)

---

*Build tools you own. Pay for what you use. Keep your data exportable.*
