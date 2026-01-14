"use client"

import { useEffect, useState, useMemo, use } from 'react'
import { useExperimentsStore } from '@/store/experiments-store'
import { RunTable } from '@/components/experiments/run-table'
import { RunForm } from '@/components/experiments/run-form'
import { MetricsChart, ComparisonBarChart } from '@/components/experiments/metrics-chart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Plus,
  GitCompare,
  BarChart3,
  Table,
  Loader2,
  FlaskConical,
} from 'lucide-react'
import Link from 'next/link'
import type { Experiment, ExperimentRun } from '@/lib/db/schema'

interface ExperimentDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<Experiment['status'], string> = {
  planning: 'bg-blue-500/10 text-blue-500',
  running: 'bg-yellow-500/10 text-yellow-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
  archived: 'bg-gray-500/10 text-gray-500',
}

export default function ExperimentDetailPage({ params }: ExperimentDetailPageProps) {
  const resolvedParams = use(params)

  const {
    experiments,
    selectedRunIds,
    isLoading,
    loadExperiments,
    addRun,
    updateRun,
    deleteRun,
    selectRuns,
    toggleRunSelection,
    getRunComparison,
  } = useExperimentsStore()

  const [mounted, setMounted] = useState(false)
  const [showRunForm, setShowRunForm] = useState(false)
  const [editingRun, setEditingRun] = useState<ExperimentRun | undefined>()
  const [activeTab, setActiveTab] = useState('runs')

  useEffect(() => {
    setMounted(true)
    loadExperiments()
  }, [loadExperiments])

  const experiment = experiments.find(e => e.id === resolvedParams.id)

  // Get all unique metrics
  const allMetrics = useMemo(() => {
    if (!experiment) return []
    const metrics = new Set<string>()
    experiment.runs.forEach(run => {
      Object.keys(run.metrics).forEach(m => metrics.add(m))
    })
    return [...metrics]
  }, [experiment])

  // Get comparison data for selected runs
  const comparisonData = useMemo(() => {
    return getRunComparison(selectedRunIds)
  }, [selectedRunIds, getRunComparison])

  const handleAddRun = async (data: Partial<ExperimentRun>) => {
    if (!experiment) return
    await addRun(experiment.id, data)
    setShowRunForm(false)
  }

  const handleEditRun = async (data: Partial<ExperimentRun>) => {
    if (!experiment || !editingRun) return
    await updateRun(experiment.id, editingRun.id, data)
    setEditingRun(undefined)
    setShowRunForm(false)
  }

  const handleDeleteRun = async (runId: string) => {
    if (!experiment) return
    const run = experiment.runs.find(r => r.id === runId)
    if (run && confirm(`Delete run "${run.name || runId.slice(-6)}"?`)) {
      await deleteRun(experiment.id, runId)
    }
  }

  const handleViewRun = (runId: string) => {
    // For now, just select the run
    selectRuns([runId])
    setActiveTab('charts')
  }

  const handleSelectAll = () => {
    if (!experiment) return
    if (selectedRunIds.length === experiment.runs.length) {
      selectRuns([])
    } else {
      selectRuns(experiment.runs.map(r => r.id))
    }
  }

  const closeRunForm = () => {
    setShowRunForm(false)
    setEditingRun(undefined)
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!experiment) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Experiment not found</p>
        <Link href="/experiments" className="mt-4 text-primary hover:underline">
          Back to Experiments
        </Link>
      </div>
    )
  }

  const completedRuns = experiment.runs.filter(r => r.status === 'completed').length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/experiments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{experiment.name}</h1>
              <Badge variant="outline" className={statusColors[experiment.status]}>
                {experiment.status}
              </Badge>
            </div>
            {experiment.description && (
              <p className="text-sm text-muted-foreground">{experiment.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedRunIds.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => setActiveTab('compare')}>
              <GitCompare className="h-4 w-4 mr-1" />
              Compare ({selectedRunIds.length})
            </Button>
          )}
          <Button size="sm" onClick={() => setShowRunForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Run
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{experiment.runs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedRuns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metrics Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allMetrics.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{selectedRunIds.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hypothesis */}
      {experiment.hypothesis && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <p className="text-sm">
            <span className="font-medium">Hypothesis:</span> {experiment.hypothesis}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="runs" className="gap-1">
              <Table className="h-4 w-4" />
              Runs
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-1" disabled={selectedRunIds.length < 2}>
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="runs" className="flex-1 overflow-auto p-4 mt-0">
          <RunTable
            runs={experiment.runs}
            selectedRunIds={selectedRunIds}
            onToggleSelection={toggleRunSelection}
            onSelectAll={handleSelectAll}
            onDeleteRun={handleDeleteRun}
            onViewRun={handleViewRun}
          />
        </TabsContent>

        <TabsContent value="charts" className="flex-1 overflow-auto p-4 mt-0">
          {allMetrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4" />
              <p className="text-lg">No metrics logged yet</p>
              <p className="text-sm mt-1">Add runs with metrics to see charts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {allMetrics.map(metric => (
                <MetricsChart
                  key={metric}
                  runs={selectedRunIds.length > 0
                    ? experiment.runs.filter(r => selectedRunIds.includes(r.id))
                    : experiment.runs
                  }
                  metric={metric}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare" className="flex-1 overflow-auto p-4 mt-0">
          {selectedRunIds.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GitCompare className="h-12 w-12 mb-4" />
              <p className="text-lg">Select at least 2 runs to compare</p>
              <p className="text-sm mt-1">Use the checkboxes in the Runs table</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ComparisonBarChart
                runs={comparisonData.runs}
                metrics={comparisonData.commonMetrics}
              />

              {/* Hyperparameters comparison table */}
              {comparisonData.commonHyperparams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Hyperparameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Parameter</th>
                            {comparisonData.runs.map(run => (
                              <th key={run.id} className="text-left p-2">
                                {run.name || `Run ${run.id.slice(-6)}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.commonHyperparams.map(param => (
                            <tr key={param} className="border-b">
                              <td className="p-2 font-medium">{param}</td>
                              {comparisonData.runs.map(run => (
                                <td key={run.id} className="p-2 font-mono">
                                  {run.hyperparameters[param]?.toString() || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Run Form Dialog */}
      <RunForm
        open={showRunForm}
        onClose={closeRunForm}
        onSubmit={editingRun ? handleEditRun : handleAddRun}
        initialData={editingRun}
      />
    </div>
  )
}
