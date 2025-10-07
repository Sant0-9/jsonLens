"use client"

import { List, Table2, FileText, Download, Trash2, GitCompare, Search, FileType, Network, Share2, BarChart2, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJsonStore } from '@/store/json-store';
import { formatBytes } from '@/lib/json-parser';

export function JsonToolbar() {
  const { view, setView, fileName, fileSize, clearData, jsonData, rawJson } = useJsonStore();

  const handleExport = () => {
    const blob = new Blob([rawJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the current JSON data?')) {
      clearData();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
      <div className="space-y-1">
        {fileName && (
          <h2 className="text-lg font-semibold">{fileName}</h2>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatBytes(fileSize)}</span>
          {Array.isArray(jsonData) && (
            <span>{jsonData.length} items</span>
          )}
          {jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData) && (
            <span>{Object.keys(jsonData).length} keys</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={view === 'tree' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('tree')}
          >
            <List className="h-4 w-4 mr-1" />
            Tree
          </Button>
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
          >
            <Table2 className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button
            variant={view === 'raw' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('raw')}
          >
            <FileText className="h-4 w-4 mr-1" />
            Raw
          </Button>
          <Button
            variant={view === 'diff' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('diff')}
          >
            <GitCompare className="h-4 w-4 mr-1" />
            Diff
          </Button>
          <Button
            variant={view === 'query' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('query')}
          >
            <Search className="h-4 w-4 mr-1" />
            Query
          </Button>
          <Button
            variant={view === 'schema' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('schema')}
          >
            <FileType className="h-4 w-4 mr-1" />
            Schema
          </Button>
          <Button
            variant={view === 'diagram' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('diagram')}
          >
            <Network className="h-4 w-4 mr-1" />
            Diagram
          </Button>
          <Button
            variant={view === 'graph' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('graph')}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Graph
          </Button>
          <Button
            variant={view === 'visualize' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('visualize')}
          >
            <BarChart2 className="h-4 w-4 mr-1" />
            Visualize
          </Button>
          <Button
            variant={view === 'transform' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('transform')}
          >
            <Shuffle className="h-4 w-4 mr-1" />
            Transform
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>

        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
