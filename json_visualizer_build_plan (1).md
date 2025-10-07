# JSONLens — Full Build Plan (Claude Prompt Edition)

*Tagline:* **See JSON clearly. Diagram instantly.**

This document is written **entirely in plain English** as detailed build instructions for Claude or Cursor to follow — no code here. The goal is to create a **Next.js 14 web app** that lets users visually explore JSON data, generate diagrams (Mermaid, graphs, tables, etc.), transform and profile data, and extend functionality via plugins and AI assistance.

---

## 🧭 Global Rules for Claude/Cursor (read first)

**Hard requirements for this repo and all generated artifacts:**
- **No emojis** anywhere in the **codebase** (source files, comments, JSDoc, tests), and **no emojis in commit messages**. UI copy **may** contain emojis only if I explicitly request it later. Default = none.
- **No tags/mentions** in commits: do **not** add Git tags, do **not** @mention people, do **not** reference issues with `#123`, and do **not** include AI model names (e.g., "Claude", "Cursor", "ChatGPT") in commit messages or file headers.
- $1- **Phase commits**: after completing each Phase (0, 1, 2, ...), make a single commit summarizing the work. Use subject `phase<N>: <short summary>`. No tags, no mentions, no model names.
- **Work in small, verifiable increments.** After each phase, run lint/tests and verify acceptance criteria before moving on.
- **No network calls by default.** The app is local-first; any network dependency must be clearly isolated behind a user-controlled toggle.
- **Determinism**: pin dependency versions and record the exact Node/PNPM/Yarn versions in the README. Lockfiles must be committed.
- **Security first**: sanitize all dynamic content (including Mermaid text), never eval, use strict CSP.

> If any point is ambiguous, choose the most conservative interpretation and proceed. Ask for clarification only when blocked.

---

## 🔰 Phase 0: Project Initialization

1. Create a new **Next.js 14** project with App Router, TypeScript, Tailwind CSS, and shadcn/ui.
2. Configure dark mode, responsive layout, and clean typography.
3. Prepare the base folder structure:
   - `app/` for routes and views
   - `components/` for reusable UI
   - `lib/` for utilities (parsers, schema inference, converters, etc.)
   - `workers/` for heavy logic offloaded to Web Workers
   - `store/` for Zustand or Jotai global state
4. Add a **ThemeProvider**, global layout, and base navigation shell.
$16. Name the app **JSONLens**. Update the README title, project metadata, and in-app About screen with the name and tagline: *“See JSON clearly. Diagram instantly.”* Use the name consistently in UI copy and docs.

---

## 🌳 Phase 1: Core Features — Tree & Table

**Goal:** Build the foundation for JSON visualization.

1. Implement JSON file import via drag/drop, paste, or file picker.
2. Add JSON validation and error handling with precise line/column info.
3. Display formatted JSON in a collapsible **Tree View**:
   - Expand/collapse nodes.
   - Search/filter keys or values.
   - Copy JSONPath and values.
4. Add a **Table View** for arrays of objects:
   - Auto-infer columns.
   - Sort, filter, and paginate large datasets.
   - Support virtualization for large lists.
5. Save the last loaded JSON to IndexedDB for persistence.

**Success criteria:** Handle 50MB JSON smoothly; no blocking UI.

---

## 🧩 Phase 2: JSON Diff & Query Engine

**Goal:** Allow users to compare and query JSON data efficiently.

1. Build a **Diff view** for comparing two JSON files.
   - Side-by-side and unified diff.
   - Toggle to ignore key order or whitespace.
   - Collapsible unchanged sections.
2. Integrate a **JSONPath or JMESPath engine**.
   - Input box with autocomplete.
   - Run query → show results in Tree or Table.
   - Save queries per workspace.

**Success criteria:** Query and diff 10k+ objects under 1s.

---

## 🧱 Phase 3: Schema Inference & Validation

**Goal:** Automatically infer schema and validate JSON data.

1. Use heuristic-based schema inference:
   - Determine field types, optional fields, enums, date detection.
   - Identify numeric ranges and string length bounds.
2. Display the inferred schema in a dedicated **Schema View**.
3. Run **validation** against a schema (inferred or uploaded).
   - Highlight invalid fields inline.
4. Export inferred schema as **JSON Schema**, **TypeScript types**, and **Zod schema**.

**Success criteria:** 90%+ type accuracy across heterogeneous samples.

---

## 🧭 Phase 4: Mermaid Diagrams

**Goal:** Turn JSON structures into readable diagrams.

1. Implement **Class Diagram** generation from inferred types.
2. Add **Sequence Diagram** for API logs (request → response flows).
3. Support **Flowchart** and **State Diagram** generation for configs or workflows.
4. Provide export options: PNG, SVG, and shareable static HTML.
5. Sync diagram theme (light/dark) with the app theme.

**Success criteria:** All Mermaid diagrams render and export under 1s.

---

## 🕸️ Phase 5: Graph View (Entity Relationships)

**Goal:** Visualize relationships between entities in complex data.

1. Use naming conventions (`userId`, `product_id`) to infer relationships.
2. Cluster related entities using a force-directed layout.
3. Support node search, zoom, and drag.
4. Allow exporting graph as PNG/SVG and `.graph.json`.

**Success criteria:** 5k nodes interactive with no lag.

---

## 📊 Phase 6: Treemap, Heatmap & Timeline

**Goal:** Add data profiling visuals.

1. **Treemap:** Show size or structure of JSON sections.
2. **Heatmap:** Display key frequency or missing data patterns.
3. **Timeline:** Visualize timestamps (`createdAt`, etc.) for trends.

**Success criteria:** Handle 100k records with responsive updates.

---

## 🧮 Phase 7: Transformers, Converters & Mock Data

**Goal:** Manipulate and reuse JSON data.

1. Add built-in **transformers** (flatten, unflatten, dedupe, redact, pivot, remap keys).
2. Support conversions between formats:
   - JSON ↔ CSV
   - JSON ↔ YAML
   - JSON ↔ NDJSON
3. Generate **mock data** using JSON Schema definitions.
4. Add export options: ZIP, HTML, JSON, CSV, YAML.

**Success criteria:** Fast, reversible transforms with undo/redo.

---

## 🧪 Phase 8: API Playground

**Goal:** Integrate real-world JSON sources.

1. Allow users to import **OpenAPI specs**.
2. Build a simple **request runner** (GET, POST) with environment variables.
3. Save request/response pairs as snapshots.
4. Diff snapshots and visualize sequence diagrams.

**Success criteria:** Runs real API calls; saves and compares responses easily.

---

## ⚡ Phase 9: UX Polish & Power Tools

**Goal:** Refine the user experience for power users.

1. Implement a **Command Palette (⌘K)** with fuzzy search for all actions.
2. Add keyboard shortcuts, contextual tooltips, and onboarding tooltips.
3. Integrate dark/light mode switching and responsive layouts.
4. Create a **status bar** for dataset stats (size, count, errors).
5. Add workspace tabs, autosave, and a crash recovery mechanism.

**Success criteria:** Every feature accessible via palette or hotkeys.

---

## 🧠 Phase 10: Advanced Tools (Low Priority until Core is Done)

These are postponed until after the MVP is shipped but should be architected for easy integration.

### 1. Live File Watcher (File System Access API)
- Automatically detect when a watched file changes on disk.
- Refresh JSON data in-app without reload.
- Handle permission revocation and conflicts.

### 2. LLM Explain & Suggest
- Provide contextual explanations of JSON data.
- Suggest better data structure or test case generation.
- Keep an **offline mode** toggle and optional user-provided API key.

### 3. Plugin System
- Allow developers to drop TypeScript modules that register transformers or visualizers.
- Plugins run in sandboxed Workers with message passing.
- No network or DOM access unless explicitly granted.

### 4. Dataset Profiler
- Analyze large datasets for:
  - Type distribution, null rates, cardinalities.
  - Value range and outliers.
  - Histograms for numeric or date fields.
- Show metrics visually and export as report.

**These will be added post-launch as separate sprints.**

---

## 🧠 Engineering Workflow & Git Hygiene

- **Branching**: `main` (protected) + short-lived feature branches (`feat/…`, `fix/…`). Rebase before merge to keep history linear.
- **Commits**: small and focused. No emojis, no tags/mentions, no AI model names, no auto-generated co-author lines.
- **PRs**: concise description (what/why), screenshots for UI, perf notes for heavy changes. Link to acceptance criteria from this plan.
- **Pre-commit**: formatting, lint, typecheck, unit tests on staged files. Fail fast.
- **CI (local or GH Actions)**: install, typecheck, lint, unit + integration tests, bundle size check, a11y checks, build. Artifacts stored per run.
- **Release**: version bump with changelog (human-written). Attach screenshots/GIFs for major UI additions.

## 🔒 Security, Privacy & Compliance

- **Sanitization**: treat all JSON values as untrusted; escape before rendering. For Mermaid, sanitize graph text and block HTML/links. No `dangerouslySetInnerHTML`.
- **CSP**: disallow inline scripts; only self origin. No third-party analytics by default.
- **Data handling**: processing is in-browser by default. Explicit opt-in for any network activity. Provide redaction presets (emails, JWTs, keys) before sharing/export.
- **Permissions**: File System Access API requires explicit user consent; handle revocation gracefully.
- **Licenses**: track third-party licenses and ensure compatibility. Ship a `THIRD_PARTY_NOTICES.md`.

## 🚀 Performance Budgets & Strategies

- **Load**: parse 100MB JSON in a Worker without blocking UI; provide progress and cancellation.
- **Interactivity**: common operations (<10k items) ≤100ms; heavy ops (100k items) ≤500ms with workers + sampling.
- **Rendering**: virtualize long lists/tables; avoid deep React re-renders via memoization and immutable updates.
- **Indexes**: optional lightweight per-field indexes (maps for unique keys, frequency maps) to accelerate filtering and JSONPath.
- **Memory**: cap in-memory representations; store large blobs in IndexedDB; snapshot transformed views rather than duplicating full datasets.

## 🪄 UX & Design System

- **Design tokens**: spacings, radii, shadows, typography; dark/light parity.
- **Loading states**: skeletons + progress for long ops; never freeze.
- **Keyboard-first**: all core actions mapped; focus management correct across tabs and modals.
- **Help**: contextual tips per view; Command Palette discoverability for every action.
- **Error handling**: readable messages with recovery actions; error boundaries per major view.

## 🎨 Simple‑Yet‑Jaw‑Dropping UI Spec (Design That Feels Effortless)

**Design goals**: calm, minimal, and professional at first glance — then *clever* on interaction. Prioritize clarity and speed over ornamentation. Every flourish must earn its keep.

### Visual language
- **Layout**: three‑pane shell (left project/nav, center canvas, right inspector). Resizable with snap points; remember sizes per view.
- **Grid & spacing**: 8‑pt spacing system; consistent gutters; generous whitespace around primary canvases.
- **Color**: neutral base (grays) + **single accent** for highlights and selection. Dark mode is first‑class, not an afterthought.
- **Elevation**: soft, layered surfaces; subtle shadows (no hard outlines). Use depth to signal hierarchy.
- **Typography**: clean sans (e.g., Inter). Clear hierarchy: page titles → section titles → controls → body → code.
- **Iconography**: lucid, line‑based icons with consistent size/weight. **No emojis in UI by default.**

### Motion & micro‑interactions
- **Motion system**: micro transitions 150–250ms; complex diagram/layout transitions 300–450ms. Ease: standard material‑like curves; no bounce.
- **Micro‑interactions**: hover lift on cards, tap/press feedback, animated expand/collapse for trees, smooth diagram relayouts.
- **Delight** (earned): animated breadcrumbs when drilling down; progress bars that fill by actual work units.

### Clever (but simple) interaction patterns
- **Smart Inspector** (right panel): context‑aware — shows schema, profile stats, relations, and quick actions for the *selected node/row*.
- **Breadcrumb as filter**: each segment is clickable to filter the Table/Tree to that subtree; includes a quick “Clear” chip.
- **Omnibar/Command Palette**: `>` for actions, `/` for search, `?` for help. Predictive suggestions based on current view/selection.
- **Compare Mode**: synchronized split view across any two tabs (e.g., Tree↔Table, Graph↔Mermaid) with locked scrolling and linked highlights.
- **Scene Presets** for diagrams: *Exploration*, *Compact*, *Presentation*. One‑click density and label toggles.
- **Quality badges**: inline chips (Unique, Enum, Nullable, Outliers) with tooltips that jump to profiler details.

### Data‑viz aesthetics
- Mermaid theme aligned with app colors; readable labels; avoid clutter by default (truncate long labels with tooltips).
- Graph nodes grouped by entity with muted colors; selected path highlighted; edge arrows clear at any zoom level.
- Treemap/Heatmap use neutral palettes with accent for focus; tooltips show counts and percentages; responsive legends.

### Empty states & guidance
- Friendly, minimal empty states with clear CTAs: drag & drop, paste, or try a sample dataset.
- Inline examples/snippets for JSONPath, Diff, and Transformers to teach by doing.

### Theming & accessibility
- Light/Dark parity; optional high‑contrast theme. Respect system preference by default.
- Strong focus states, visible keyboard order, screen‑reader labels for all interactive elements.

### Acceptance criteria (UI)
- **Perceived performance**: no jank; animations never block input; scroll remains 60fps on typical hardware.
- **3+ “wow” moments** that are still useful: (1) buttery diagram auto‑layout with animated clustering, (2) breadcrumb→filter transition, (3) omnibar speed and context‑awareness.
- **Consistency**: spacing, typography scale, and icon sizing consistent across all views; color contrast passes AA.
- **Resilience**: layouts hold under extreme data (long keys, thousands of rows) and under “no data yet”.

---

## 🌐 i18n & Accessibility

- Externalize strings to enable future i18n. Support RTL.
- ARIA-compliant Tree, Table, Tabs; high contrast mode; focus indicators.
- Test with screen readers for Tree navigation and search results announcement.

## 🔭 Observability (Local Only by Default)

- Built-in diagnostics page: worker queue depth, op timings, memory estimates, cache hits.
- Optional, opt-in telemetry dataset (local storage) for self-inspection; never sent externally by default.

## 🧪 Sample Datasets & Fixtures

- Provide curated JSON samples: nested e‑commerce data, logs with timestamps, heterogenous arrays, config DAGs, large synthetic dataset.
- Include ground-truth schemas and expected profiles to validate inference and profiler accuracy.

## ⚠️ Risks & Fallbacks

- **Browser limits**: if memory pressure detected, suggest sampling or field pruning before continuing.
- **Diagram clutter**: auto-layout + collapse groups; density sliders; subgraph selection.
- **Ambiguous relations**: confidence scores with user override UI.

---

## 🧩 Phase 11: Testing & QA

1. **Unit Tests:** parsers, schema inference, diff engine, converters.
2. **Integration Tests:** dataset loading, diffing, transformations.
3. **Performance Tests:** 100k+ items, 100MB files.
4. **Accessibility Tests:** keyboard nav, screen reader support.
5. **User Acceptance Tests:** import → explore → transform → visualize → export → share.

**Goal:** Every flow works offline, fast, and reliably.

---

## 📦 Phase 12: Deployment & Docs

1. Deploy to **Vercel** for production.
2. Write a complete README with screenshots and usage guide.
3. Add in-app documentation with short tutorials and tooltips.
4. Bundle example JSON datasets to demo all features.

---

## 🧱 Phase 13: Architecture Design Notes

- Use **Web Workers** for any heavy operation.
- Avoid blocking the main thread.
- Maintain modular architecture: every visualizer and transformer is its own component.
- Persist all workspace data locally (IndexedDB + localStorage).
- Build a clean API for adding more visualization modes later.

---

## 🚀 Delivery Plan Summary

| Week | Focus | Key Deliverables |
|------|--------|------------------|
| 1 | Tree + Table | JSON viewer, validator, search, autosave |
| 2 | Diff + Query + Schema | JSON diff, query engine, schema inference |
| 3 | Diagrams + Graphs | Mermaid diagrams, Graph view |
| 4 | Profiling + Conversions | Treemap, Heatmap, Transformers, Converters |
| 5 | API + Polish | API playground, command palette, UX refinements |
| 6+ | Advanced Tools | Watcher, LLM, Plugins, Profiler |

---

## ✅ Final Goal
By the end of this build, the app should be a **complete, extensible JSON visualization studio**:
- Local-first, fast, and secure.
- Capable of parsing 100MB+ JSON files.
- Rich visualizations and diagrams.
- Extendable via plugins and AI explainers.
- Perfect for developers, analysts, and researchers.

---

**Prompt summary for Claude/Cursor:**
> Follow this document step by step to build the app. Each phase is sequential and self-contained. After each phase, verify acceptance criteria, run tests, and ensure performance budgets are met **and then make a commit** before proceeding to the next phase.
>
> **Strict rules:**
> - Do **not** use emojis anywhere in the **codebase** (source, comments, docs, tests) and do **not** use emojis in commit messages. UI copy should also avoid emojis unless I explicitly request them later.
> - Do **not** tag or mention anything in commits: no Git tags, no `@user`, no `#issue` references, and no AI/model names (e.g., "Claude", "Cursor", "ChatGPT"). Keep commits professional, concise, and imperative.
> - After completing **each phase**, create a commit with subject `phase<N>: <short summary>` (e.g., `phase1: add tree and table views`). No tags or mentions.
> - **Design mandate**: build a **simple, minimal UI that looks premium and feels clever**. It should be calm (clean typography, generous whitespace, subtle motion) yet **jaw‑dropping in interaction** (smart inspector, animated relayouts, omnibar). Every flourish must have UX value.
> - Keep the app local-first and offline by default. Any network-dependent feature must be behind an explicit user-controlled toggle and must clearly indicate what is sent.
> - Work in **small, verifiable increments**. Prefer multiple small PRs over one giant PR.
> - Prioritize accessibility and performance. If a tradeoff arises, maintain responsiveness (no main-thread jank) and keyboard access.
> - Ask for clarification **only** if blocked; otherwise make conservative, secure choices and proceed.

---

