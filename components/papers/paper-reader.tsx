"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePapersStore } from '@/store/papers-store'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
} from 'lucide-react'

interface PaperReaderProps {
  pdfBlob?: Blob
  paperId: string
}

// Dynamic import for pdf.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib

  const pdfjs = await import('pdfjs-dist')
  pdfjsLib = pdfjs

  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  }

  return pdfjsLib
}

export function PaperReader({ pdfBlob, paperId }: PaperReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { updateReadProgress } = usePapersStore()

  // Load PDF document
  useEffect(() => {
    if (!pdfBlob) {
      setPdfDoc(null)
      setTotalPages(0)
      setCurrentPage(1)
      return
    }

    setIsLoading(true)
    setError(null)

    const loadPdf = async () => {
      try {
        const pdfjs = await loadPdfJs()
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        setCurrentPage(1)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
        setIsLoading(false)
      }
    }

    loadPdf()
  }, [pdfBlob])

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale, rotation })

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport,
      }).promise
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render page')
    }
  }, [pdfDoc, currentPage, scale, rotation])

  useEffect(() => {
    renderPage()
  }, [renderPage])

  // Update read progress when page changes
  useEffect(() => {
    if (totalPages > 0 && paperId) {
      const progress = Math.round((currentPage / totalPages) * 100)
      updateReadProgress(paperId, progress)
    }
  }, [currentPage, totalPages, paperId, updateReadProgress])

  // Navigation
  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }, [currentPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }, [currentPage, totalPages])

  // Zoom
  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3.0))
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))

  const fitToWidth = () => {
    if (!containerRef.current || !canvasRef.current) return
    const containerWidth = containerRef.current.clientWidth - 32
    const canvasWidth = canvasRef.current.width / scale
    if (canvasWidth > 0) {
      setScale(containerWidth / canvasWidth)
    }
  }

  // Rotation
  const rotate = () => setRotation((r) => (r + 90) % 360)

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

  if (!pdfBlob) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No PDF available for this paper.</p>
          <p className="text-sm mt-2">
            Try importing from arXiv to automatically download the PDF.
          </p>
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
      </div>

      {/* PDF Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4"
      >
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            style={{ maxWidth: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}
