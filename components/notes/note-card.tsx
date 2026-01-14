"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash, Link2, ArrowLeft, FolderInput } from 'lucide-react'
import type { Note } from '@/lib/db/schema'
import Link from 'next/link'

interface NoteCardProps {
  note: Note
  backlinksCount: number
  onEdit: () => void
  onDelete: () => void
  onMoveToFolder?: () => void
}

export function NoteCard({
  note,
  backlinksCount,
  onEdit,
  onDelete,
  onMoveToFolder,
}: NoteCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get preview from content (first 150 chars, strip markdown)
  const getPreview = (content: string) => {
    const stripped = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*|__/g, '') // Remove bold
      .replace(/\*|_/g, '') // Remove italic
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$1') // Replace wikilinks with text
      .replace(/@paper:\S+/g, '[paper]') // Replace paper refs
      .replace(/```[\s\S]*?```/g, '[code]') // Replace code blocks
      .replace(/`[^`]+`/g, '[code]') // Replace inline code
      .replace(/\$\$[\s\S]*?\$\$/g, '[math]') // Replace block math
      .replace(/\$[^$]+\$/g, '[math]') // Replace inline math
      .replace(/\n+/g, ' ') // Replace newlines
      .trim()

    return stripped.length > 150 ? stripped.substring(0, 150) + '...' : stripped
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link href={`/notes/${note.id}`} className="flex-1">
            <CardTitle className="text-base font-medium hover:text-primary cursor-pointer">
              {note.title}
            </CardTitle>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {onMoveToFolder && (
                <DropdownMenuItem onClick={onMoveToFolder}>
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to Folder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Link href={`/notes/${note.id}`}>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 cursor-pointer">
            {getPreview(note.content) || 'Empty note'}
          </p>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {note.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{note.tags.length - 3}</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {note.linkedNotes.length > 0 && (
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {note.linkedNotes.length}
              </span>
            )}
            {backlinksCount > 0 && (
              <span className="flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                {backlinksCount}
              </span>
            )}
            <span>{formatDate(note.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
