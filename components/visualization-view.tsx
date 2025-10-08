"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, BarChart3, Calendar, Expand, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { 
  profileData, 
  getFieldFrequencies, 
  getTemporalFields,
  getTreemapData,
  getFieldSizes
} from '@/lib/data-profiler';
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface VisualizationViewProps {
  data: JsonValue;
}

type VisualizationType = 'treemap' | 'heatmap' | 'timeline';

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

export function VisualizationView({ data }: VisualizationViewProps) {
  const [vizType, setVizType] = useState<VisualizationType>('treemap');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setResizeTick] = useState(0);
  const [showExplain, setShowExplain] = useState(false);

  const profile = useMemo(() => profileData(data), [data]);
  const treemapData = useMemo(() => getTreemapData(data), [data]);
  const frequencies = useMemo(() => getFieldFrequencies(profile), [profile]);
  const temporalFields = useMemo(() => getTemporalFields(profile), [profile]);
  const fieldSizes = useMemo(() => getFieldSizes(profile), [profile]);
  const explain = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Records: ${profile.totalRecords}, fields: ${profile.totalFields}, depth: ${profile.depth}.`);
    const topFields = frequencies.slice(0, 3).map(f => f.field).join(', ');
    if (topFields) parts.push(`Frequent/categorical fields: ${topFields}.`);
    if (temporalFields.length) parts.push(`${temporalFields.length} temporal field(s) detected for timeline.`);
    return parts.join(' ');
  }, [profile, frequencies, temporalFields]);

  const renderTreemap = () => {
    const limitedData = treemapData.slice(0, 50);
    
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Data Structure Size</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Visualization of data structure by size and nesting
          </p>
        </div>
        
        <ResponsiveContainer width="100%" height={500}>
          <Treemap
            data={limitedData}
            dataKey="size"
            stroke="#fff"
            fill="#8884d8"
          >
            {limitedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Treemap>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total Records</div>
            <div className="text-2xl font-bold">{profile.totalRecords}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total Fields</div>
            <div className="text-2xl font-bold">{profile.totalFields}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Structure Depth</div>
            <div className="text-2xl font-bold">{profile.depth}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Data Size</div>
            <div className="text-2xl font-bold">
              {(profile.size / 1024).toFixed(2)} KB
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHeatmap = () => {
    if (frequencies.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p>No frequency data available for heatmap visualization.</p>
          <p className="text-sm mt-2">Heatmaps work best with arrays of objects.</p>
        </div>
      );
    }

    const topFields = frequencies.slice(0, 5);
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2">Field Frequency Analysis</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Distribution of values across different fields
          </p>
        </div>

        {topFields.map((field) => {
          const topValues = Array.from(field.frequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([value, count]) => ({
              name: String(value).substring(0, 30),
              count,
            }));

          return (
            <div key={field.field} className="space-y-2">
              <h5 className="text-sm font-medium">{field.field}</h5>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topValues}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={10}
                  />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}

        <div className="pt-4">
          <h5 className="text-sm font-semibold mb-3">Field Coverage</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fieldSizes.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="field"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="size" fill="#82ca9d" name="Non-null Values" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    if (temporalFields.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p>No temporal data detected for timeline visualization.</p>
          <p className="text-sm mt-2">
            Timeline requires date fields like createdAt, updatedAt, timestamp, etc.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2">Temporal Data Analysis</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Timeline of date/time fields in your data
          </p>
        </div>

        {temporalFields.map((temporal) => {
          const fieldData = Array.from(profile.fields.get(temporal.field)?.frequency.entries() || [])
            .map(([dateStr, count]) => {
              const date = new Date(dateStr);
              return {
                date: date.getTime(),
                dateStr: date.toLocaleDateString(),
                count,
              };
            })
            .filter(item => !isNaN(item.date))
            .sort((a, b) => a.date - b.date);

          return (
            <div key={temporal.field} className="space-y-3">
              <div>
                <h5 className="text-sm font-medium">{temporal.field}</h5>
                <div className="text-xs text-muted-foreground mt-1">
                  Format: {temporal.stats.format} | 
                  Range: {temporal.stats.earliest.toLocaleDateString()} - {temporal.stats.latest.toLocaleDateString()}
                </div>
              </div>

              {fieldData.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={fieldData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dateStr"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      name="Occurrences"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })}

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Temporal Fields</div>
            <div className="text-2xl font-bold">{temporalFields.length}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Earliest Date</div>
            <div className="text-sm font-bold">
              {temporalFields[0]?.stats.earliest.toLocaleDateString()}
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Latest Date</div>
            <div className="text-sm font-bold">
              {temporalFields[0]?.stats.latest.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setResizeTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Data Visualizations</h3>
            <p className="text-sm text-muted-foreground">
              Visual analysis of data patterns and structure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-3 w-3" />
              ) : (
                <Expand className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Visualization:</div>
          <div className="flex gap-1">
            <Button
              variant={vizType === 'treemap' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setVizType('treemap')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Treemap
            </Button>
            <Button
              variant={vizType === 'heatmap' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setVizType('heatmap')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Heatmap
            </Button>
            <Button
              variant={vizType === 'timeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setVizType('timeline')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Timeline
            </Button>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => setShowExplain(v => !v)}>
              {showExplain ? 'Hide' : 'Explain'}
            </Button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-6">
        {showExplain && (
          <div className="mb-4 p-3 border rounded-md bg-muted/30 text-sm">{explain}</div>
        )}
        {vizType === 'treemap' && renderTreemap()}
        {vizType === 'heatmap' && renderHeatmap()}
        {vizType === 'timeline' && renderTimeline()}
      </div>
    </div>
  );
}
