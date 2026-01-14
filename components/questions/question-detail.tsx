"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Edit,
  X,
  Calendar,
  Tag,
  FileText,
  StickyNote,
  FlaskConical,
  CheckCircle,
  Link2,
  ExternalLink,
} from 'lucide-react'
import type { ResearchQuestion } from '@/lib/db/schema'
import Link from 'next/link'

interface QuestionDetailProps {
  question: ResearchQuestion
  onEdit: () => void
  onClose: () => void
  linkedData: {
    papers: Array<{ id: string; title: string }>
    notes: Array<{ id: string; title: string }>
    experiments: Array<{ id: string; name: string }>
  }
}

const statusColors: Record<ResearchQuestion['status'], string> = {
  open: 'bg-blue-500/10 text-blue-500',
  exploring: 'bg-yellow-500/10 text-yellow-500',
  partially_answered: 'bg-orange-500/10 text-orange-500',
  answered: 'bg-green-500/10 text-green-500',
  archived: 'bg-gray-500/10 text-gray-500',
}

const statusLabels: Record<ResearchQuestion['status'], string> = {
  open: 'Open',
  exploring: 'Exploring',
  partially_answered: 'Partially Answered',
  answered: 'Answered',
  archived: 'Archived',
}

const priorityColors: Record<ResearchQuestion['priority'], string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-gray-500',
}

export function QuestionDetail({ question, onEdit, onClose, linkedData }: QuestionDetailProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={statusColors[question.status]}>
                {statusLabels[question.status]}
              </Badge>
              <Badge variant="outline" className={priorityColors[question.priority]}>
                {question.priority}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-snug">{question.question}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="space-y-4">
          {/* Description */}
          {question.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Context</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {question.description}
              </p>
            </div>
          )}

          {/* Answer */}
          {question.answer && (
            <div>
              <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Answer
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {question.answer}
              </p>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(question.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Updated {formatDate(question.updatedAt)}</span>
            </div>
            {question.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-3 w-3 text-muted-foreground" />
                {question.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Linked Items */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              Linked Resources
            </h4>

            {/* Papers */}
            {linkedData.papers.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Papers ({linkedData.papers.length})
                </h5>
                <div className="space-y-1">
                  {linkedData.papers.map(paper => (
                    <Link
                      key={paper.id}
                      href={`/papers/${paper.id}`}
                      className="block text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {paper.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {linkedData.notes.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <StickyNote className="h-3 w-3" />
                  Notes ({linkedData.notes.length})
                </h5>
                <div className="space-y-1">
                  {linkedData.notes.map(note => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="block text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {note.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Experiments */}
            {linkedData.experiments.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  Experiments ({linkedData.experiments.length})
                </h5>
                <div className="space-y-1">
                  {linkedData.experiments.map(exp => (
                    <Link
                      key={exp.id}
                      href={`/experiments/${exp.id}`}
                      className="block text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {exp.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {linkedData.papers.length === 0 &&
              linkedData.notes.length === 0 &&
              linkedData.experiments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No linked resources yet
                </p>
              )}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
