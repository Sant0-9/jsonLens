"use client"

import { useEffect } from 'react';
import { useJsonStore } from '@/store/json-store';
import { JsonImport } from './json-import';
import { JsonError } from './json-error';
import { JsonToolbar } from './json-toolbar';
import { TreeView } from './tree-view';
import { TableView } from './table-view';
import { RawView } from './raw-view';
import { DiffView } from './diff-view';
import { QueryView } from './query-view';
import { SchemaView } from './schema-view';
import { DiagramView } from './diagram-view';
import { GraphView } from './graph-view';
import { VisualizationView } from './visualization-view';
import { TransformView } from './transform-view';

export function JsonViewer() {
  const { jsonData, error, isLoading, view, loadFromIndexedDB, fileName } = useJsonStore();
  
  useEffect(() => {
    if (!jsonData && !error) {
      loadFromIndexedDB();
    }
  }, [loadFromIndexedDB, jsonData, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Processing JSON...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <JsonError error={error} />;
  }

  if (!jsonData) {
    return <JsonImport />;
  }

  return (
    <div className="space-y-4">
      <JsonToolbar />
      
      <div className="rounded-lg border bg-card">
        {view === 'tree' && <TreeView data={jsonData} />}
        {view === 'table' && <TableView data={jsonData} />}
        {view === 'raw' && <RawView />}
        {view === 'diff' && <DiffView leftData={jsonData} leftLabel={fileName || 'Current JSON'} />}
        {view === 'query' && <QueryView data={jsonData} />}
        {view === 'schema' && <SchemaView data={jsonData} />}
        {view === 'diagram' && <DiagramView data={jsonData} />}
        {view === 'graph' && <GraphView data={jsonData} />}
        {view === 'visualize' && <VisualizationView data={jsonData} />}
        {view === 'transform' && <TransformView data={jsonData} />}
      </div>
    </div>
  );
}
