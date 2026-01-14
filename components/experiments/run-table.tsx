"use client"

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash, FileText, ArrowUpDown } from 'lucide-react'
import type { ExperimentRun } from '@/lib/db/schema'

interface RunTableProps {
  runs: ExperimentRun[]
  selectedRunIds: string[]
  onToggleSelection: (runId: string) => void
  onSelectAll: () => void
  onDeleteRun: (runId: string) => void
  onViewRun: (runId: string) => void
}

const statusColors: Record<ExperimentRun['status'], string> = {
  running: 'bg-yellow-500/10 text-yellow-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-gray-500/10 text-gray-500',
}

export function RunTable({
  runs,
  selectedRunIds,
  onToggleSelection,
  onSelectAll,
  onDeleteRun,
  onViewRun,
}: RunTableProps) {
  const [sortField, setSortField] = useState<'timestamp' | 'duration' | string>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Get all unique metrics across runs
  const allMetrics = new Set<string>()
  runs.forEach(run => {
    Object.keys(run.metrics).forEach(m => allMetrics.add(m))
  })
  const metricColumns = [...allMetrics].slice(0, 4) // Show up to 4 metrics

  // Get all unique hyperparameters
  const allParams = new Set<string>()
  runs.forEach(run => {
    Object.keys(run.hyperparameters).forEach(p => allParams.add(p))
  })
  const paramColumns = [...allParams].slice(0, 3) // Show up to 3 params

  // Sort runs
  const sortedRuns = [...runs].sort((a, b) => {
    let comparison = 0
    if (sortField === 'timestamp') {
      comparison = a.timestamp - b.timestamp
    } else if (sortField === 'duration') {
      comparison = (a.duration || 0) - (b.duration || 0)
    } else if (allMetrics.has(sortField)) {
      const aVal = a.metrics[sortField] || 0
      const bVal = b.metrics[sortField] || 0
      comparison = aVal - bVal
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const allSelected = runs.length > 0 && runs.every(r => selectedRunIds.includes(r.id))
  const someSelected = runs.some(r => selectedRunIds.includes(r.id)) && !allSelected

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                // indeterminate doesn't exist, we handle it via aria-checked
                aria-checked={someSelected ? 'mixed' : allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('timestamp')}>
              <div className="flex items-center gap-1">
                Time
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('duration')}>
              <div className="flex items-center gap-1">
                Duration
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            {paramColumns.map(param => (
              <TableHead key={param} className="text-xs">
                {param}
              </TableHead>
            ))}
            {metricColumns.map(metric => (
              <TableHead
                key={metric}
                className="cursor-pointer text-xs"
                onClick={() => handleSort(metric)}
              >
                <div className="flex items-center gap-1">
                  {metric}
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRuns.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6 + paramColumns.length + metricColumns.length}
                className="text-center text-muted-foreground py-8"
              >
                No runs yet. Add a run to get started.
              </TableCell>
            </TableRow>
          ) : (
            sortedRuns.map(run => (
              <TableRow key={run.id} className={selectedRunIds.includes(run.id) ? 'bg-accent/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedRunIds.includes(run.id)}
                    onCheckedChange={() => onToggleSelection(run.id)}
                  />
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onViewRun(run.id)}
                    className="font-medium hover:text-primary"
                  >
                    {run.name || `Run ${run.id.slice(-6)}`}
                  </button>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[run.status]}>
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(run.timestamp)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDuration(run.duration)}
                </TableCell>
                {paramColumns.map(param => (
                  <TableCell key={param} className="text-sm font-mono">
                    {run.hyperparameters[param]?.toString() || '-'}
                  </TableCell>
                ))}
                {metricColumns.map(metric => (
                  <TableCell key={metric} className="text-sm font-mono">
                    {run.metrics[metric]?.toFixed(4) || '-'}
                  </TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewRun(run.id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteRun(run.id)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
