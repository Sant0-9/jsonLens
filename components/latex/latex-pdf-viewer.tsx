"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  RotateCw,
  Link
} from 'lucide-react'
import { downloadPDF } from '@/lib/latex/compiler'
import { useLatexStore } from '@/store/latex-store'
import {
  createHeuristicMapping,
  pdfToSource,
  type SyncTeXData
} from '@/lib/latex/synctex-parser'

interface LatexPDFViewerProps {
  pdf: Uint8Array | null
  fileName?: string
}

// Dynamic import for pdf.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib

  // Dynamic import of pdf.js
  const pdfjs = await import('pdfjs-dist')
  pdfjsLib = pdfjs

  // Set worker source
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  }

  return pdfjsLib
}

export function LatexPDFViewer({ pdf, fileName = 'document.pdf' }: LatexPDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncTeXEnabled, setSyncTeXEnabled] = useState(true)
  const [syncTeXData, setSyncTeXData] = useState<SyncTeXData | null>(null)

  // Get store state and actions
  const {
    content,
    activeFile,
    syncTeXNavigation,
    navigateToSourceLocation,
    clearSyncTeXNavigation
  } = useLatexStore()

  // Load PDF document
  useEffect(() => {
    if (!pdf || pdf.length === 0) {
      setPdfDoc(null)
      setTotalPages(0)
      setCurrentPage(1)
      setSyncTeXData(null)
      return
    }

    // Validate PDF data is a proper Uint8Array with content
    if (!(pdf instanceof Uint8Array) || pdf.byteLength === 0) {
      setError('Invalid PDF data received')
      setIsLoading(false)
      return
    }

    // Check for valid PDF header (%PDF-)
    const header = String.fromCharCode(pdf[0], pdf[1], pdf[2], pdf[3], pdf[4])
    if (!header.startsWith('%PDF')) {
      setError('Invalid PDF format - missing PDF header')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    loadPdfJs()
      .then((pdfjs) => {
        if (!pdfjs || !pdfjs.getDocument) {
          throw new Error('PDF.js library failed to load')
        }
        // Create a copy of the data to ensure it's not a detached buffer
        const pdfData = new Uint8Array(pdf)
        return pdfjs.getDocument({ data: pdfData }).promise
      })
      .then((doc) => {
        if (!doc || typeof doc.numPages !== 'number') {
          throw new Error('Invalid PDF document')
        }
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        setCurrentPage(1)
        setIsLoading(false)

        // Create heuristic SyncTeX mapping
        if (content && syncTeXEnabled) {
          const heuristic = createHeuristicMapping(content, activeFile, doc.numPages)
          setSyncTeXData(heuristic)
        }
      })
      .catch((err) => {
        console.error('PDF loading error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
        setIsLoading(false)
      })
  }, [pdf, content, activeFile, syncTeXEnabled])

  // Handle highlight from editor (source-to-PDF)
  useEffect(() => {
    if (!syncTeXNavigation.highlightPDF || !highlightCanvasRef.current || !canvasRef.current) {
      return
    }

    const highlight = syncTeXNavigation.highlightPDF

    // Navigate to the correct page if needed
    if (highlight.page !== currentPage) {
      setCurrentPage(highlight.page)
    }

    // Draw highlight on overlay canvas
    const canvas = highlightCanvasRef.current
    const mainCanvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match dimensions
    canvas.width = mainCanvas.width
    canvas.height = mainCanvas.height

    // Clear previous highlights
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw highlight rectangle
    const x = highlight.x * canvas.width
    const y = highlight.y * canvas.height
    const width = highlight.width * canvas.width
    const height = highlight.height * canvas.height

    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)'
    ctx.lineWidth = 2
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)

    // Clear after 3 seconds
    const timer = setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      clearSyncTeXNavigation()
    }, 3000)

    return () => clearTimeout(timer)
  }, [syncTeXNavigation.highlightPDF, currentPage, clearSyncTeXNavigation])

  // Handle click on PDF for reverse sync (PDF-to-source)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!syncTeXEnabled || !syncTeXData || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate normalized position (0-1)
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    // Find source location
    const source = pdfToSource(syncTeXData, currentPage, x, y)
    if (source) {
      navigateToSourceLocation(source)
    }
  }, [syncTeXEnabled, syncTeXData, currentPage, navigateToSourceLocation])

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      // Validate page number
      const pageNum = Math.max(1, Math.min(currentPage, pdfDoc.numPages || 1))

      const page = await pdfDoc.getPage(pageNum)
      if (!page || !page.getViewport) {
        throw new Error('Failed to get PDF page')
      }

      const viewport = page.getViewport({ scale, rotation })
      if (!viewport || !viewport.width || !viewport.height) {
        throw new Error('Invalid viewport dimensions')
      }

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport
      }

      await page.render(renderContext).promise
    } catch (err) {
      console.error('Page render error:', err)
      setError(err instanceof Error ? err.message : 'Failed to render page')
    }
  }, [pdfDoc, currentPage, scale, rotation])

  useEffect(() => {
    renderPage()
  }, [renderPage])

  // Navigation handlers
  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])

  // Zoom handlers
  const zoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 3.0))
  }

  const zoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.5))
  }

  const fitToWidth = () => {
    if (!containerRef.current || !canvasRef.current) return
    const containerWidth = containerRef.current.clientWidth - 32 // padding
    const canvasWidth = canvasRef.current.width / scale
    if (canvasWidth > 0) {
      setScale(containerWidth / canvasWidth)
    }
  }

  // Rotation handler
  const rotate = () => {
    setRotation((r) => (r + 90) % 360)
  }

  // Download handler
  const handleDownload = () => {
    if (pdf) {
      downloadPDF(pdf, fileName.replace(/\.tex$/, '.pdf'))
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          goToPrevPage()
          break
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          goToNextPage()
          break
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomIn()
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomOut()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevPage, goToNextPage])

  if (!pdf) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No PDF generated yet.</p>
          <p className="text-sm mt-2">Click &quot;Compile&quot; to generate a PDF.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading PDF...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>Failed to load PDF</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={fitToWidth} title="Fit to width">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={rotate} title="Rotate">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={syncTeXEnabled ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSyncTeXEnabled(!syncTeXEnabled)}
            title={syncTeXEnabled ? "SyncTeX enabled - click PDF to jump to source" : "SyncTeX disabled"}
          >
            <Link className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted p-4"
      >
        <div className="flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="shadow-lg bg-white"
              style={{ maxWidth: '100%', cursor: syncTeXEnabled ? 'crosshair' : 'default' }}
              onClick={handleCanvasClick}
            />
            {/* Overlay canvas for SyncTeX highlights */}
            <canvas
              ref={highlightCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ maxWidth: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
