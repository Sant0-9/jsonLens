"use client"

import { useEffect, useState } from 'react'
import { useGraphStore } from '@/store/graph-store'
import { useNotesStore } from '@/store/notes-store'
import { useQuestionsStore } from '@/store/questions-store'
import { useExperimentsStore } from '@/store/experiments-store'
import { KnowledgeGraph } from '@/components/graph/knowledge-graph'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Network,
  X,
  ExternalLink,
  FileText,
  StickyNote,
  HelpCircle,
  FlaskConical,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import type { GraphNode } from '@/store/graph-store'

export default function GraphPage() {
  const {
    isLoading,
    selectedNodeId,
    showPapers,
    showNotes,
    showQuestions,
    showExperiments,
    showTags,
    showGapPanel,
    gapSuggestions,
    healthMetrics,
    buildGraph,
    selectNode,
    toggleFilter,
    toggleGapPanel,
    getFilteredGraph,
  } = useGraphStore()

  const { notes, loadNotes } = useNotesStore()
  const { questions, loadQuestions } = useQuestionsStore()
  const { experiments, loadExperiments } = useExperimentsStore()

  const [mounted, setMounted] = useState(false)

  // Load all data on mount
  useEffect(() => {
    setMounted(true)
    Promise.all([loadNotes(), loadQuestions(), loadExperiments()])
  }, [loadNotes, loadQuestions, loadExperiments])

  // Rebuild graph when data changes
  useEffect(() => {
    if (mounted) {
      buildGraph({
        papers: [],
        notes: notes.map(n => ({
          id: n.id,
          title: n.title,
          tags: n.tags,
          linkedNotes: n.linkedNotes,
          linkedPapers: n.linkedPapers,
        })),
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          tags: q.tags,
          linkedPapers: q.linkedPapers,
          linkedNotes: q.linkedNotes,
        })),
        experiments: experiments.map(e => ({
          id: e.id,
          name: e.name,
          tags: e.tags,
          linkedPapers: e.linkedPapers,
          linkedNotes: e.linkedNotes,
        })),
      })
    }
  }, [notes, questions, experiments, mounted, buildGraph])

  const filteredGraph = getFilteredGraph()
  const selectedNode = filteredGraph.nodes.find(n => n.id === selectedNodeId)

  // Get node info for detail panel
  const getNodeLink = (node: GraphNode): string => {
    const [type, id] = node.id.split(':')
    switch (type) {
      case 'paper':
        return `/papers/${id}`
      case 'note':
        return `/notes/${id}`
      case 'question':
        return `/questions`
      case 'experiment':
        return `/experiments/${id}`
      default:
        return '#'
    }
  }

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'paper':
        return <FileText className="h-4 w-4" />
      case 'note':
        return <StickyNote className="h-4 w-4" />
      case 'question':
        return <HelpCircle className="h-4 w-4" />
      case 'experiment':
        return <FlaskConical className="h-4 w-4" />
      case 'tag':
        return <Tag className="h-4 w-4" />
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Network className="h-5 w-5" />
            Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize connections between your research items
          </p>
        </div>
        <div className="flex items-center gap-3">
          {healthMetrics && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  healthMetrics.rating === 'excellent' ? 'border-green-500 text-green-500' :
                  healthMetrics.rating === 'good' ? 'border-blue-500 text-blue-500' :
                  healthMetrics.rating === 'fair' ? 'border-yellow-500 text-yellow-500' :
                  'border-red-500 text-red-500'
                }
              >
                {healthMetrics.rating === 'excellent' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {healthMetrics.rating === 'good' && <Info className="h-3 w-3 mr-1" />}
                {(healthMetrics.rating === 'fair' || healthMetrics.rating === 'poor') && <AlertTriangle className="h-3 w-3 mr-1" />}
                Health: {healthMetrics.score}%
              </Badge>
            </div>
          )}
          <Button
            variant={showGapPanel ? 'secondary' : 'outline'}
            size="sm"
            onClick={toggleGapPanel}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Gap Analysis
            {gapSuggestions.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {gapSuggestions.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Building graph...</p>
          </div>
        ) : filteredGraph.nodes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Network className="h-12 w-12 mb-4" />
            <p className="text-lg">No data to visualize</p>
            <p className="text-sm mt-2">
              Add notes, questions, or experiments to see your knowledge graph
            </p>
          </div>
        ) : (
          <>
            {/* Graph */}
            <div className="flex-1">
              <KnowledgeGraph
                data={filteredGraph}
                selectedNodeId={selectedNodeId}
                onNodeClick={selectNode}
                filters={{
                  showPapers,
                  showNotes,
                  showQuestions,
                  showExperiments,
                  showTags,
                }}
                onToggleFilter={toggleFilter}
              />
            </div>

            {/* Selected Node Panel */}
            {selectedNode && (
              <div className="w-80 border-l">
                <Card className="h-full rounded-none border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getNodeIcon(selectedNode.type)}
                        <Badge variant="outline">{selectedNode.type}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => selectNode(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-base mt-2">{selectedNode.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      <div className="space-y-4">
                        {/* Connections */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Connections</h4>
                          {(() => {
                            const connections = filteredGraph.links.filter(
                              l =>
                                l.source === selectedNode.id ||
                                l.target === selectedNode.id
                            )
                            if (connections.length === 0) {
                              return (
                                <p className="text-sm text-muted-foreground">
                                  No connections
                                </p>
                              )
                            }
                            return (
                              <div className="space-y-2">
                                {connections.map((link, idx) => {
                                  const otherId =
                                    link.source === selectedNode.id
                                      ? link.target
                                      : link.source
                                  const otherNode = filteredGraph.nodes.find(
                                    n => n.id === otherId
                                  )
                                  if (!otherNode) return null
                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      {getNodeIcon(otherNode.type)}
                                      <button
                                        onClick={() => selectNode(otherNode.id)}
                                        className="text-primary hover:underline truncate"
                                      >
                                        {otherNode.label}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>

                        {/* Link to item */}
                        {selectedNode.type !== 'tag' && (
                          <div className="pt-4 border-t">
                            <Link
                              href={getNodeLink(selectedNode)}
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View {selectedNode.type}
                            </Link>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gap Analysis Panel */}
            {showGapPanel && !selectedNode && (
              <div className="w-96 border-l">
                <Card className="h-full rounded-none border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Gap Analysis
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={toggleGapPanel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-14rem)]">
                      <div className="space-y-6">
                        {/* Health Metrics */}
                        {healthMetrics && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Graph Health</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Nodes:</span>{' '}
                                {healthMetrics.metrics.totalNodes}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Links:</span>{' '}
                                {healthMetrics.metrics.totalLinks}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Orphans:</span>{' '}
                                {healthMetrics.metrics.orphanCount}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Clusters:</span>{' '}
                                {healthMetrics.metrics.clusterCount}
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Avg connections:</span>{' '}
                                {healthMetrics.metrics.avgConnectionsPerNode.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Gap Suggestions */}
                        {gapSuggestions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">No gaps detected</p>
                            <p className="text-xs mt-1">Your knowledge graph is well connected</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Suggestions ({gapSuggestions.length})</h4>
                            {gapSuggestions.map((gap, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border ${
                                  gap.severity === 'high' ? 'border-red-500/50 bg-red-500/5' :
                                  gap.severity === 'medium' ? 'border-yellow-500/50 bg-yellow-500/5' :
                                  'border-blue-500/50 bg-blue-500/5'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                                    gap.severity === 'high' ? 'text-red-500' :
                                    gap.severity === 'medium' ? 'text-yellow-500' :
                                    'text-blue-500'
                                  }`} />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{gap.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {gap.suggestion}
                                    </p>
                                    {gap.nodes.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {gap.nodes.slice(0, 5).map(node => (
                                          <button
                                            key={node.id}
                                            onClick={() => {
                                              selectNode(node.id)
                                              toggleGapPanel()
                                            }}
                                            className="text-xs px-2 py-0.5 bg-muted rounded hover:bg-muted/80"
                                          >
                                            {node.label.length > 15
                                              ? node.label.slice(0, 15) + '...'
                                              : node.label}
                                          </button>
                                        ))}
                                        {gap.nodes.length > 5 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{gap.nodes.length - 5} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
