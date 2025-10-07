"use client"

import { useState, useCallback, useMemo } from 'react';
import { Upload, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { diffJson, DiffOptions, getDiffStats } from '@/lib/json-diff';
import { parseJson } from '@/lib/json-parser';
import { JsonValue, JsonError } from '@/store/json-store';

interface DiffViewProps {
  leftData?: JsonValue;
  leftLabel?: string;
}

type DiffViewMode = 'side-by-side' | 'unified';

export function DiffView({ leftData, leftLabel = 'Original' }: DiffViewProps) {
  const [rightData, setRightData] = useState<JsonValue | null>(null);
  const [rightLabel, setRightLabel] = useState('Comparison');
  const [error, setError] = useState<JsonError | null>(null);
  const [viewMode, setViewMode] = useState<DiffViewMode>('side-by-side');
  const [options, setOptions] = useState<DiffOptions>({
    ignoreKeyOrder: false,
    ignoreWhitespace: false,
    ignoreCase: false,
  });
  const [showUnchanged, setShowUnchanged] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseJson(text);
      
      if (result.success && result.data !== undefined) {
        setRightData(result.data);
        setRightLabel(file.name);
        setError(null);
      } else if (result.error) {
        setError(result.error);
      }
    };
    reader.onerror = () => {
      setError({ message: 'Failed to read file' });
    };
    reader.readAsText(file);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const result = parseJson(text);
      
      if (result.success && result.data !== undefined) {
        setRightData(result.data);
        setRightLabel('Pasted JSON');
        setError(null);
      } else if (result.error) {
        setError(result.error);
      }
    } catch {
      setError({ message: 'Failed to read from clipboard' });
    }
  }, []);

  const diffs = useMemo(() => {
    if (!leftData || !rightData) return [];
    return diffJson(leftData, rightData, options);
  }, [leftData, rightData, options]);

  const filteredDiffs = useMemo(() => {
    if (showUnchanged) return diffs;
    return diffs.filter(diff => diff.operation !== 'unchanged');
  }, [diffs, showUnchanged]);

  const stats = useMemo(() => getDiffStats(diffs), [diffs]);

  const formatValue = (value: JsonValue): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'add':
        return 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100';
      case 'remove':
        return 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100';
      case 'change':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-muted/30';
    }
  };

  const getOperationSymbol = (operation: string) => {
    switch (operation) {
      case 'add':
        return '+';
      case 'remove':
        return '-';
      case 'change':
        return '~';
      default:
        return ' ';
    }
  };

  if (!leftData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Load JSON data first to use the diff view.</p>
      </div>
    );
  }

  if (!rightData) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Load Comparison Data</h3>
          <p className="text-sm text-muted-foreground">
            Upload or paste JSON to compare with {leftLabel}
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => document.getElementById('diff-file-input')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button onClick={handlePaste} variant="outline">
              <Clipboard className="mr-2 h-4 w-4" />
              Paste JSON
            </Button>
          </div>

          <input
            id="diff-file-input"
            type="file"
            accept=".json"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Diff View</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
                +{stats.added}
              </span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded">
                -{stats.removed}
              </span>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                ~{stats.changed}
              </span>
              <span className="px-2 py-1 bg-muted rounded">
                ={stats.unchanged}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'side-by-side' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </Button>
            <Button
              variant={viewMode === 'unified' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('unified')}
            >
              Unified
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.ignoreKeyOrder}
              onChange={(e) => setOptions(prev => ({ ...prev, ignoreKeyOrder: e.target.checked }))}
              className="rounded"
            />
            Ignore key order
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.ignoreWhitespace}
              onChange={(e) => setOptions(prev => ({ ...prev, ignoreWhitespace: e.target.checked }))}
              className="rounded"
            />
            Ignore whitespace
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={(e) => setOptions(prev => ({ ...prev, ignoreCase: e.target.checked }))}
              className="rounded"
            />
            Ignore case
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.target.checked)}
              className="rounded"
            />
            Show unchanged
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-sm">{leftLabel}</h4>
              <pre className="text-xs font-mono overflow-auto">
                {JSON.stringify(leftData, null, 2)}
              </pre>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-sm">{rightLabel}</h4>
              <pre className="text-xs font-mono overflow-auto">
                {JSON.stringify(rightData, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-1 font-mono text-sm">
            {filteredDiffs.map((diff, index) => (
              <div
                key={index}
                className={`p-2 rounded ${getOperationColor(diff.operation)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold w-4">
                    {getOperationSymbol(diff.operation)}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {diff.path}
                  </span>
                </div>
                {diff.operation === 'change' && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="text-red-700 dark:text-red-300">
                      - {formatValue(diff.oldValue as JsonValue)}
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      + {formatValue(diff.newValue as JsonValue)}
                    </div>
                  </div>
                )}
                {diff.operation === 'add' && (
                  <div className="ml-6 mt-1">
                    + {formatValue(diff.newValue as JsonValue)}
                  </div>
                )}
                {diff.operation === 'remove' && (
                  <div className="ml-6 mt-1">
                    - {formatValue(diff.oldValue as JsonValue)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
