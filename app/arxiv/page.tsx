"use client"

import { useEffect, useState } from 'react'
import { useArxivStore } from '@/store/arxiv-store'
import { FilterCard } from '@/components/arxiv/filter-card'
import { FilterBuilder } from '@/components/arxiv/filter-builder'
import { PaperPreview } from '@/components/arxiv/paper-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  RefreshCw,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { ArxivFilter } from '@/lib/db/schema'

export default function ArxivPage() {
  const {
    filters,
    currentDigest,
    isLoadingFilters,
    isGeneratingDigest,
    digestError,
    showFilterDialog,
    loadFilters,
    loadLatestDigest,
    generateDigest,
    setShowFilterDialog,
  } = useArxivStore()

  const [mounted, setMounted] = useState(false)
  const [editingFilter, setEditingFilter] = useState<ArxivFilter | undefined>()

  useEffect(() => {
    setMounted(true)
    loadFilters()
    loadLatestDigest()
  }, [loadFilters, loadLatestDigest])

  const enabledFilters = filters.filter(f => f.enabled)

  const handleEditFilter = (filter: ArxivFilter) => {
    setEditingFilter(filter)
    setShowFilterDialog(true)
  }

  const handleCloseDialog = () => {
    setShowFilterDialog(false)
    setEditingFilter(undefined)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Filters */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Filters</h2>
            <Button size="sm" onClick={() => setShowFilterDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {enabledFilters.length} of {filters.length} filters enabled
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoadingFilters ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading filters...
              </p>
            ) : filters.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No filters yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a filter to start receiving paper recommendations
                </p>
              </div>
            ) : (
              filters.map(filter => (
                <FilterCard
                  key={filter.id}
                  filter={filter}
                  onEdit={() => handleEditFilter(filter)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Digest */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-lg font-semibold">ArXiv Radar</h1>
            <p className="text-sm text-muted-foreground">
              AI-filtered paper recommendations based on your interests
            </p>
          </div>
          <Button
            onClick={generateDigest}
            disabled={isGeneratingDigest || enabledFilters.length === 0}
          >
            {isGeneratingDigest ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Digest
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {digestError && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{digestError}</p>
          </div>
        )}

        {/* Digest Content */}
        <div className="flex-1 overflow-auto p-4">
          {!currentDigest ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4" />
              <p className="text-lg">No digest yet</p>
              <p className="text-sm mt-2">
                {filters.length === 0
                  ? 'Create filters to define your interests, then generate a digest'
                  : enabledFilters.length === 0
                  ? 'Enable at least one filter, then generate a digest'
                  : 'Click "Generate Digest" to fetch the latest papers'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Digest Info */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Digest for {currentDigest.date}
                    </CardTitle>
                    <Badge variant="secondary">
                      {currentDigest.papers.length} papers
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Papers matching your enabled filters, sorted by relevance score
                  </p>
                </CardContent>
              </Card>

              {/* Paper List */}
              {currentDigest.papers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No papers match your filters</p>
                  <p className="text-sm mt-2">
                    Try adjusting your filter criteria or lowering the minimum relevance score
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentDigest.papers.map(paper => (
                    <PaperPreview
                      key={paper.id}
                      paper={paper}
                      onAddToLibrary={() => {
                        // TODO: Add to Paper Lens library
                        console.log('Add to library:', paper.id)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Dialog */}
      <FilterBuilder
        open={showFilterDialog}
        onClose={handleCloseDialog}
        editingFilter={editingFilter}
      />
    </div>
  )
}
