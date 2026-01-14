"use client"

import { useRef, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  FileText,
  StickyNote,
  HelpCircle,
  FlaskConical,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import type { GraphNode, GraphData } from '@/store/graph-store'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Loading graph...</p>
    </div>
  ),
})

interface KnowledgeGraphProps {
  data: GraphData
  selectedNodeId: string | null
  onNodeClick: (nodeId: string) => void
  filters: {
    showPapers: boolean
    showNotes: boolean
    showQuestions: boolean
    showExperiments: boolean
    showTags: boolean
  }
  onToggleFilter: (type: 'papers' | 'notes' | 'questions' | 'experiments' | 'tags') => void
}

// Node colors
const nodeColors: Record<GraphNode['type'], string> = {
  paper: '#3b82f6',
  note: '#22c55e',
  question: '#f59e0b',
  experiment: '#8b5cf6',
  tag: '#6b7280',
}

export function KnowledgeGraph({
  data,
  selectedNodeId,
  onNodeClick,
  filters,
  onToggleFilter,
}: KnowledgeGraphProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Handle node click
  const handleNodeClick = useCallback(
    (node: { id?: string | number }) => {
      if (node.id) {
        onNodeClick(node.id.toString())
      }
    },
    [onNodeClick]
  )

  // Custom node rendering
  const nodeCanvasObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x === undefined || node.y === undefined) return

      const size = node.size || 5
      const isSelected = selectedNodeId === node.id

      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
      ctx.fillStyle = node.color || '#999'
      ctx.fill()

      // Draw selection ring
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw label if zoomed in enough
      if (globalScale > 0.8 && node.label) {
        const label = node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label
        const fontSize = 10 / globalScale
        ctx.font = `${fontSize}px Sans-Serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#e5e5e5'
        ctx.fillText(label, node.x, node.y + size + 2)
      }
    },
    [selectedNodeId]
  )

  // Zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1.5)
    }
  }

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(0.67)
    }
  }

  const handleZoomFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400)
    }
  }

  // Count nodes by type
  const counts = {
    papers: data.nodes.filter(n => n.type === 'paper').length,
    notes: data.nodes.filter(n => n.type === 'note').length,
    questions: data.nodes.filter(n => n.type === 'question').length,
    experiments: data.nodes.filter(n => n.type === 'experiment').length,
    tags: data.nodes.filter(n => n.type === 'tag').length,
  }

  return (
    <div className="flex h-full">
      {/* Graph Container */}
      <div ref={containerRef} className="flex-1 relative bg-background">
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            if (node.x === undefined || node.y === undefined) return
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, (node.size || 5) + 2, 0, 2 * Math.PI)
            ctx.fill()
          }}
          linkColor={() => 'rgba(100, 100, 100, 0.3)'}
          linkWidth={1}
          onNodeClick={handleNodeClick}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400)}
        />

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          <Button variant="secondary" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleZoomFit}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/90 border rounded-md p-3">
          <p className="text-xs font-medium mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.paper }} />
              <span className="text-xs">Paper</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.note }} />
              <span className="text-xs">Note</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.question }} />
              <span className="text-xs">Question</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.experiment }} />
              <span className="text-xs">Experiment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.tag }} />
              <span className="text-xs">Tag</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Filters */}
      <div className="w-64 border-l p-4 space-y-4">
        <div>
          <h3 className="font-medium mb-3">Filters</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: nodeColors.paper }} />
                <Label htmlFor="papers" className="text-sm">
                  Papers ({counts.papers})
                </Label>
              </div>
              <Switch
                id="papers"
                checked={filters.showPapers}
                onCheckedChange={() => onToggleFilter('papers')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" style={{ color: nodeColors.note }} />
                <Label htmlFor="notes" className="text-sm">
                  Notes ({counts.notes})
                </Label>
              </div>
              <Switch
                id="notes"
                checked={filters.showNotes}
                onCheckedChange={() => onToggleFilter('notes')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" style={{ color: nodeColors.question }} />
                <Label htmlFor="questions" className="text-sm">
                  Questions ({counts.questions})
                </Label>
              </div>
              <Switch
                id="questions"
                checked={filters.showQuestions}
                onCheckedChange={() => onToggleFilter('questions')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" style={{ color: nodeColors.experiment }} />
                <Label htmlFor="experiments" className="text-sm">
                  Experiments ({counts.experiments})
                </Label>
              </div>
              <Switch
                id="experiments"
                checked={filters.showExperiments}
                onCheckedChange={() => onToggleFilter('experiments')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" style={{ color: nodeColors.tag }} />
                <Label htmlFor="tags" className="text-sm">
                  Tags ({counts.tags})
                </Label>
              </div>
              <Switch
                id="tags"
                checked={filters.showTags}
                onCheckedChange={() => onToggleFilter('tags')}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-medium mb-2">Statistics</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Total Nodes: {data.nodes.length}</p>
            <p>Total Links: {data.links.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
