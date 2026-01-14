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
import {
  MoreVertical,
  Edit,
  Trash,
  Archive,
  HelpCircle,
  FileText,
  StickyNote,
  FlaskConical,
} from 'lucide-react'
import type { ResearchQuestion } from '@/lib/db/schema'

interface QuestionCardProps {
  question: ResearchQuestion
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onClick: () => void
}

const statusColors: Record<ResearchQuestion['status'], string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  exploring: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  partially_answered: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  answered: 'bg-green-500/10 text-green-500 border-green-500/30',
  archived: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
}

const statusLabels: Record<ResearchQuestion['status'], string> = {
  open: 'Open',
  exploring: 'Exploring',
  partially_answered: 'Partial',
  answered: 'Answered',
  archived: 'Archived',
}

const priorityColors: Record<ResearchQuestion['priority'], string> = {
  critical: 'bg-red-500/10 text-red-500',
  high: 'bg-orange-500/10 text-orange-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  low: 'bg-gray-500/10 text-gray-500',
}

export function QuestionCard({
  question,
  onEdit,
  onDelete,
  onArchive,
  onClick,
}: QuestionCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const totalLinks =
    question.linkedPapers.length +
    question.linkedNotes.length +
    question.linkedExperiments.length

  return (
    <Card className="hover:bg-accent/50 transition-colors group cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <CardTitle className="text-base font-medium leading-snug">
              {question.question}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Badge variant="outline" className={priorityColors[question.priority]}>
              {question.priority}
            </Badge>
            <Badge variant="outline" className={statusColors[question.status]}>
              {statusLabels[question.status]}
            </Badge>
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
                {question.status !== 'archived' && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
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
        </div>
      </CardHeader>
      <CardContent>
        {question.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {question.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            {question.linkedPapers.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {question.linkedPapers.length}
              </span>
            )}
            {question.linkedNotes.length > 0 && (
              <span className="flex items-center gap-1">
                <StickyNote className="h-3 w-3" />
                {question.linkedNotes.length}
              </span>
            )}
            {question.linkedExperiments.length > 0 && (
              <span className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" />
                {question.linkedExperiments.length}
              </span>
            )}
            {totalLinks === 0 && <span className="text-xs">No links</span>}
          </div>

          <div className="flex items-center gap-2">
            {question.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              {formatDate(question.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
