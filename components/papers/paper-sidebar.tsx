"use client"

import { usePapersStore } from '@/store/papers-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen,
  FolderOpen,
  Tag,
  Library,
  Clock,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function PaperSidebar() {
  const {
    papers,
    selectedFolder,
    setSelectedFolder,
    selectedTags,
    setSelectedTags,
    getAllTags,
    getAllFolders,
  } = usePapersStore()

  const folders = getAllFolders()
  const tags = getAllTags()

  // Calculate stats
  const totalPapers = papers.length
  const readingPapers = papers.filter(p => p.paper.readProgress > 0 && p.paper.readProgress < 100).length
  const recentPapers = papers.filter(p => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return p.addedAt > sevenDaysAgo
  }).length

  return (
    <div className="w-60 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Library className="h-4 w-4" />
          Paper Library
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick filters */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Quick Filters
            </p>
            <Button
              variant={!selectedFolder && selectedTags.length === 0 ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedFolder(null)
                setSelectedTags([])
              }}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              All Papers
              <span className="ml-auto text-xs text-muted-foreground">
                {totalPapers}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedFolder(null)
                setSelectedTags([])
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Recent
              <span className="ml-auto text-xs text-muted-foreground">
                {recentPapers}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedFolder(null)
                setSelectedTags([])
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              Reading
              <span className="ml-auto text-xs text-muted-foreground">
                {readingPapers}
              </span>
            </Button>
          </div>

          {/* Folders */}
          {folders.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Folders
              </p>
              {folders.map((folder) => {
                const count = papers.filter(p => p.paper.folder === folder).length
                return (
                  <Button
                    key={folder}
                    variant={selectedFolder === folder ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedFolder(selectedFolder === folder ? null : folder)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    <span className="truncate">{folder}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {count}
                    </span>
                  </Button>
                )
              })}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <Button
                      key={tag}
                      variant={isSelected ? 'secondary' : 'outline'}
                      size="sm"
                      className={cn('h-7 text-xs', isSelected && 'bg-primary text-primary-foreground')}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag))
                        } else {
                          setSelectedTags([...selectedTags, tag])
                        }
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          {totalPapers} paper{totalPapers !== 1 ? 's' : ''} in library
        </p>
      </div>
    </div>
  )
}
