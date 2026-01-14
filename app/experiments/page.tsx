"use client"

import { useEffect, useState } from 'react'
import { useExperimentsStore } from '@/store/experiments-store'
import { ExperimentCard } from '@/components/experiments/experiment-card'
import { ExperimentForm } from '@/components/experiments/experiment-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, FlaskConical, SortAsc, SortDesc } from 'lucide-react'
import type { Experiment } from '@/lib/db/schema'

export default function ExperimentsPage() {
  const {
    isLoading,
    filterStatus,
    searchQuery,
    sortBy,
    sortOrder,
    loadExperiments,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    setFilterStatus,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    getFilteredExperiments,
  } = useExperimentsStore()

  const [mounted, setMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<Experiment | undefined>()

  useEffect(() => {
    setMounted(true)
    loadExperiments()
  }, [loadExperiments])

  const filteredExperiments = getFilteredExperiments()

  const handleCreate = async (data: Partial<Experiment>) => {
    await createExperiment(data)
    setShowForm(false)
  }

  const handleEdit = async (data: Partial<Experiment>) => {
    if (editingExperiment) {
      await updateExperiment(editingExperiment.id, data)
      setEditingExperiment(undefined)
      setShowForm(false)
    }
  }

  const handleDelete = async (id: string) => {
    const experiment = getFilteredExperiments().find(e => e.id === id)
    if (experiment && confirm(`Delete "${experiment.name}"? This will also delete all runs.`)) {
      await deleteExperiment(id)
    }
  }

  const handleArchive = async (id: string) => {
    await updateExperiment(id, { status: 'archived' })
  }

  const openEdit = (experiment: Experiment) => {
    setEditingExperiment(experiment)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingExperiment(undefined)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Experiment Log</h1>
          <p className="text-sm text-muted-foreground">
            Track experiments, runs, and metrics
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Experiment
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search experiments..."
            className="pl-9"
          />
        </div>

        <Select
          value={filterStatus}
          onValueChange={(v: Experiment['status'] | 'all') => setFilterStatus(v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v: 'updated' | 'created' | 'name') => setSortBy(v)}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Modified</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Experiments List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Loading experiments...
            </div>
          ) : filteredExperiments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mb-4" />
              {searchQuery || filterStatus !== 'all' ? (
                <>
                  <p className="text-lg">No experiments found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No experiments yet</p>
                  <p className="text-sm mt-1">Create your first experiment to get started</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredExperiments.map(experiment => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onEdit={() => openEdit(experiment)}
                  onDelete={() => handleDelete(experiment.id)}
                  onArchive={() => handleArchive(experiment.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Form Dialog */}
      <ExperimentForm
        open={showForm}
        onClose={closeForm}
        onSubmit={editingExperiment ? handleEdit : handleCreate}
        initialData={editingExperiment}
      />
    </div>
  )
}
