import { LatexEditor } from '@/components/latex/latex-editor'

export const metadata = {
  title: 'LaTeX Editor | Research Workbench',
  description: 'Full-featured LaTeX editor with live preview and PDF compilation',
}

export default function LatexPage() {
  return (
    <main className="h-screen flex flex-col bg-background">
      <LatexEditor />
    </main>
  )
}
