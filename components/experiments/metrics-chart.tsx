"use client"

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExperimentRun } from '@/lib/db/schema'

interface MetricsChartProps {
  runs: ExperimentRun[]
  metric: string
  title?: string
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

export function MetricsChart({ runs, metric, title }: MetricsChartProps) {
  const chartData = useMemo(() => {
    // Collect all data points from all runs
    const allSteps = new Set<number>()
    const runData: Record<string, Record<number, number>> = {}

    runs.forEach(run => {
      const history = run.metricsHistory?.[metric]
      if (history) {
        const runName = run.name || `Run ${run.id.slice(-6)}`
        runData[runName] = {}
        history.forEach(point => {
          allSteps.add(point.step)
          runData[runName][point.step] = point.value
        })
      } else if (run.metrics[metric] !== undefined) {
        // If no history, use final metric as single point
        const runName = run.name || `Run ${run.id.slice(-6)}`
        runData[runName] = { 0: run.metrics[metric] }
        allSteps.add(0)
      }
    })

    // Convert to chart format
    const sortedSteps = [...allSteps].sort((a, b) => a - b)
    return sortedSteps.map(step => {
      const point: Record<string, number | string> = { step }
      Object.entries(runData).forEach(([runName, data]) => {
        if (data[step] !== undefined) {
          point[runName] = data[step]
        }
      })
      return point
    })
  }, [runs, metric])

  const runNames = useMemo(() => {
    return runs.map(run => run.name || `Run ${run.id.slice(-6)}`)
  }, [runs])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title || metric}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available for this metric
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title || metric}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="step"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
              tickFormatter={(value) => value.toFixed(3)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            {runNames.map((runName, index) => (
              <Line
                key={runName}
                type="monotone"
                dataKey={runName}
                stroke={COLORS[index % COLORS.length]}
                dot={chartData.length < 50}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface ComparisonChartProps {
  runs: ExperimentRun[]
  metrics: string[]
}

export function ComparisonBarChart({ runs, metrics }: ComparisonChartProps) {
  const chartData = useMemo(() => {
    return runs.map(run => {
      const data: Record<string, string | number> = {
        name: run.name || `Run ${run.id.slice(-6)}`,
      }
      metrics.forEach(metric => {
        data[metric] = run.metrics[metric] || 0
      })
      return data
    })
  }, [runs, metrics])

  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Run Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Select runs to compare
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Run Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => value.toFixed(3)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            {metrics.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
