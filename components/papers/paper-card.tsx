"use client"

import { usePapersStore, type PaperRecord } from '@/store/papers-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Calendar,
  ExternalLink,
  MoreVertical,
  Trash2,
  FolderOpen,
  Tag,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface PaperCardProps {
  paper: PaperRecord
  viewMode: 'grid' | 'list'
}

export function PaperCard({ paper, viewMode }: PaperCardProps) {
  const { deletePaper } = usePapersStore()
  const { title, authors, year, abstract, tags, readProgress, arxivId, folder } = paper.paper

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this paper?')) {
      await deletePaper(paper.id)
    }
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/papers/${paper.id}`} className="group">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {arxivId && (
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://arxiv.org/abs/${arxivId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on arXiv
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {authors.slice(0, 3).join(', ')}
            {authors.length > 3 && ` +${authors.length - 3} more`}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {year}
            </span>
            {folder && (
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {folder}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {readProgress}%
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/papers/${paper.id}`}>
            <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
              {title}
            </CardTitle>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {arxivId && (
                <DropdownMenuItem asChild>
                  <a
                    href={`https://arxiv.org/abs/${arxivId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on arXiv
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {authors.slice(0, 2).join(', ')}
          {authors.length > 2 && ` +${authors.length - 2}`}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
          {abstract}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${readProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{readProgress}%</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
