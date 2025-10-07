"use client"

import { useJsonStore } from '@/store/json-store';
import { JsonImport } from './json-import';
import { JsonError } from './json-error';
import { JsonToolbar } from './json-toolbar';
import { TreeView } from './tree-view';
import { TableView } from './table-view';
import { RawView } from './raw-view';

export function JsonViewer() {
  const { jsonData, error, isLoading, view } = useJsonStore();

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
      </div>
    </div>
  );
}
