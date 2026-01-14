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
import { MoreVertical, Edit, Trash, Play, Archive, FlaskConical } from 'lucide-react'
import type { Experiment } from '@/lib/db/schema'
import Link from 'next/link'

interface ExperimentCardProps {
  experiment: Experiment
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
}

const statusColors: Record<Experiment['status'], string> = {
  planning: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  running: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  completed: 'bg-green-500/10 text-green-500 border-green-500/30',
  failed: 'bg-red-500/10 text-red-500 border-red-500/30',
  archived: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
}

const statusLabels: Record<Experiment['status'], string> = {
  planning: 'Planning',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  archived: 'Archived',
}

export function ExperimentCard({ experiment, onEdit, onDelete, onArchive }: ExperimentCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const completedRuns = experiment.runs.filter(r => r.status === 'completed').length
  const totalRuns = experiment.runs.length

  // Get best metric if available
  const getBestMetric = () => {
    if (experiment.runs.length === 0) return null
    const allMetrics = new Set<string>()
    experiment.runs.forEach(r => Object.keys(r.metrics).forEach(m => allMetrics.add(m)))

    // Look for common metrics like accuracy, loss, f1
    const priorityMetrics = ['accuracy', 'f1', 'loss', 'mse', 'mae']
    for (const metric of priorityMetrics) {
      if (allMetrics.has(metric)) {
        const values = experiment.runs
          .filter(r => r.metrics[metric] !== undefined)
          .map(r => r.metrics[metric])
        if (values.length > 0) {
          const best = metric === 'loss' || metric === 'mse' || metric === 'mae'
            ? Math.min(...values)
            : Math.max(...values)
          return { name: metric, value: best }
        }
      }
    }
    return null
  }

  const bestMetric = getBestMetric()

  return (
    <Card className="hover:bg-accent/50 transition-colors group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link href={`/experiments/${experiment.id}`} className="flex-1">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-medium hover:text-primary cursor-pointer">
                {experiment.name}
              </CardTitle>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[experiment.status]}>
              {statusLabels[experiment.status]}
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
                {experiment.status !== 'archived' && (
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
        <Link href={`/experiments/${experiment.id}`}>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 cursor-pointer">
            {experiment.description || experiment.hypothesis || 'No description'}
          </p>
        </Link>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Play className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {completedRuns}/{totalRuns} runs
              </span>
            </div>
            {bestMetric && (
              <span className="text-muted-foreground">
                Best {bestMetric.name}: {bestMetric.value.toFixed(4)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {experiment.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              {formatDate(experiment.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
