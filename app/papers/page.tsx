"use client"

import { useEffect } from 'react'
import { usePapersStore } from '@/store/papers-store'
import { PaperList } from '@/components/papers/paper-list'
import { PaperSidebar } from '@/components/papers/paper-sidebar'
import { ImportPaper } from '@/components/papers/import-paper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PapersPage() {
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    showImportModal,
    setShowImportModal,
    loadPapers,
    getFilteredPapers,
  } = usePapersStore()

  useEffect(() => {
    loadPapers()
  }, [loadPapers])

  const filteredPapers = getFilteredPapers()

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <PaperSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addedAt">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="lastReadAt">Last Read</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => setShowImportModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Import Paper
            </Button>
          </div>
        </div>

        {/* Paper list */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading papers...</div>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg">No papers yet</p>
              <p className="text-sm mt-2">Import papers from arXiv or upload PDFs to get started</p>
              <Button className="mt-4" onClick={() => setShowImportModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Import Your First Paper
              </Button>
            </div>
          ) : (
            <PaperList papers={filteredPapers} viewMode={viewMode} />
          )}
        </div>
      </div>

      {/* Import modal */}
      <ImportPaper open={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  )
}
