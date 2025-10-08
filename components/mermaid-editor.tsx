"use client"

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Download, Copy, Check, RotateCcw } from 'lucide-react'
import mermaid from 'mermaid'

interface MermaidEditorProps {
  onClose: () => void
}

export function MermaidEditor({ onClose }: MermaidEditorProps) {
  const [mermaidCode, setMermaidCode] = useState(`graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const diagramRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    })
  }, [theme])

  useEffect(() => {
    if (!mermaidCode || !diagramRef.current) return

    const renderDiagram = async () => {
      try {
        diagramRef.current!.innerHTML = ''
        setError(null)
        
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, mermaidCode)
        
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    renderDiagram()
  }, [mermaidCode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    if (!diagramRef.current) return

    const svg = diagramRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'mermaid-diagram.png'
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const resetToDefault = () => {
    setMermaidCode(`graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Mermaid Editor</h2>
            <p className="text-sm text-muted-foreground">Edit Mermaid code directly and see live preview</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <h3 className="text-sm font-medium">Mermaid Code</h3>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                className="w-full h-full font-mono text-sm bg-transparent border rounded resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your Mermaid code here..."
                spellCheck={false}
              />
            </div>
            <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <h3 className="text-sm font-medium">Live Preview</h3>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-destructive text-sm mb-2">Rendering Error</div>
                    <div className="text-xs text-muted-foreground max-w-md">{error}</div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div ref={diagramRef} className="mermaid-diagram" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}