"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash } from 'lucide-react'
import type { ExperimentRun } from '@/lib/db/schema'

interface RunFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Partial<ExperimentRun>) => Promise<void>
  initialData?: ExperimentRun
}

interface ParamEntry {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean'
}

interface MetricEntry {
  key: string
  value: string
}

export function RunForm({ open, onClose, onSubmit, initialData }: RunFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [status, setStatus] = useState<ExperimentRun['status']>(initialData?.status || 'completed')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [duration, setDuration] = useState(initialData?.duration?.toString() || '')

  // Initialize hyperparameters
  const [params, setParams] = useState<ParamEntry[]>(() => {
    if (initialData?.hyperparameters) {
      return Object.entries(initialData.hyperparameters).map(([key, value]) => ({
        key,
        value: value.toString(),
        type: typeof value as 'string' | 'number' | 'boolean',
      }))
    }
    return [{ key: '', value: '', type: 'string' as const }]
  })

  // Initialize metrics
  const [metrics, setMetrics] = useState<MetricEntry[]>(() => {
    if (initialData?.metrics) {
      return Object.entries(initialData.metrics).map(([key, value]) => ({
        key,
        value: value.toString(),
      }))
    }
    return [{ key: '', value: '' }]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert params to Record
      const hyperparameters: Record<string, string | number | boolean> = {}
      params.forEach(p => {
        if (p.key.trim()) {
          if (p.type === 'number') {
            hyperparameters[p.key.trim()] = parseFloat(p.value) || 0
          } else if (p.type === 'boolean') {
            hyperparameters[p.key.trim()] = p.value.toLowerCase() === 'true'
          } else {
            hyperparameters[p.key.trim()] = p.value
          }
        }
      })

      // Convert metrics to Record
      const metricsRecord: Record<string, number> = {}
      metrics.forEach(m => {
        if (m.key.trim()) {
          metricsRecord[m.key.trim()] = parseFloat(m.value) || 0
        }
      })

      await onSubmit({
        name: name.trim() || undefined,
        status,
        notes: notes.trim(),
        duration: duration ? parseInt(duration) : undefined,
        hyperparameters,
        metrics: metricsRecord,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const addParam = () => {
    setParams([...params, { key: '', value: '', type: 'string' }])
  }

  const updateParam = (index: number, field: keyof ParamEntry, value: string) => {
    const updated = [...params]
    updated[index] = { ...updated[index], [field]: value }
    setParams(updated)
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const addMetric = () => {
    setMetrics([...metrics, { key: '', value: '' }])
  }

  const updateMetric = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metrics]
    updated[index] = { ...updated[index], [field]: value }
    setMetrics(updated)
  }

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Run' : 'Add Run'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Run Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., baseline, v2..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: ExperimentRun['status']) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (ms)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g., 3600000 for 1 hour"
            />
          </div>

          {/* Hyperparameters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Hyperparameters</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addParam}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {params.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={param.key}
                    onChange={e => updateParam(index, 'key', e.target.value)}
                    placeholder="Name"
                    className="flex-1"
                  />
                  <Input
                    value={param.value}
                    onChange={e => updateParam(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Select
                    value={param.type}
                    onValueChange={(v: 'string' | 'number' | 'boolean') => updateParam(index, 'type', v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParam(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Metrics</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addMetric}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={metric.key}
                    onChange={e => updateMetric(index, 'key', e.target.value)}
                    placeholder="Metric name (e.g., accuracy)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={metric.value}
                    onChange={e => updateMetric(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMetric(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, issues, insights..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Save' : 'Add Run'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
