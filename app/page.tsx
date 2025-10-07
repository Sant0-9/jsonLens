import { Navigation } from "@/components/navigation";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              JSONLens
            </h2>
            <p className="text-xl text-muted-foreground">
              See JSON clearly. Diagram instantly.
            </p>
          </div>
          
          <div className="space-y-6 text-left">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-2">About JSONLens</h3>
              <p className="text-muted-foreground">
                A powerful, local-first JSON visualization studio designed for developers, 
                analysts, and researchers. Explore, transform, and visualize JSON data with 
                interactive diagrams, charts, and intelligent insights.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Local First</h3>
                <p className="text-sm text-muted-foreground">
                  All processing happens in your browser. Your data never leaves your machine.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Fast & Powerful</h3>
                <p className="text-sm text-muted-foreground">
                  Handle large JSON files up to 100MB with smooth performance.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Rich Visualizations</h3>
                <p className="text-sm text-muted-foreground">
                  Generate diagrams, graphs, tables, and more from your JSON data.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Developer Friendly</h3>
                <p className="text-sm text-muted-foreground">
                  Schema inference, validation, transformations, and more.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Phase 0 complete - Foundation established
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
