# JSONLens

**See JSON clearly. Diagram instantly.**

A powerful, local-first JSON visualization studio designed for developers, analysts, and researchers. Explore, transform, and visualize JSON data with interactive diagrams, charts, and intelligent insights.

## Features

- Local-first architecture - all processing happens in your browser
- Handle large JSON files up to 100MB with smooth performance
- Rich visualizations including diagrams, graphs, tables, and more
- Schema inference and validation
- Data transformations and conversions
- Dark mode support with system preference detection

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui with Radix UI primitives
- **State Management:** Zustand
- **Theme:** next-themes

## Version Information

- Node.js: v22.17.1
- npm: 10.9.2
- Next.js: 14.2.32
- React: 18
- TypeScript: 5

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
jsonlens/
├── app/              # Next.js app router pages and layouts
├── components/       # Reusable React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions and helpers
├── store/           # Zustand state management
├── workers/         # Web Workers for heavy computations
└── public/          # Static assets
```

## Development Roadmap

This project is being built in phases:

- [x] Phase 0: Project initialization with Next.js 14, TypeScript, Tailwind, and shadcn/ui
- [ ] Phase 1: Core features - Tree & Table views with JSON import/validation
- [ ] Phase 2: JSON Diff & Query Engine
- [ ] Phase 3: Schema Inference & Validation
- [ ] Phase 4: Mermaid Diagrams
- [ ] Phase 5: Graph View (Entity Relationships)
- [ ] Phase 6: Treemap, Heatmap & Timeline
- [ ] Phase 7: Transformers, Converters & Mock Data
- [ ] Phase 8: API Playground
- [ ] Phase 9: UX Polish & Power Tools

## License

This project is built following strict quality and security guidelines with a focus on performance, accessibility, and user privacy.
