"use client"

import { useState, useCallback } from 'react';
import { Download, Undo, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue, useJsonStore } from '@/store/json-store';
import {
  flattenObject,
  dedupeArray,
  redactData,
  pivotData,
  sortData,
  filterData,
  remapKeys,
  TransformResult,
} from '@/lib/transformers';
import {
  convertToCSV,
  convertToYAML,
  convertToNDJSON,
  downloadAsFormat,
  ConversionFormat,
} from '@/lib/converters';

interface TransformViewProps {
  data: JsonValue;
}

type TransformType = 'flatten' | 'dedupe' | 'redact' | 'pivot' | 'sort' | 'filter' | 'remap';
type ConvertType = 'csv' | 'yaml' | 'ndjson';

export function TransformView({ data }: TransformViewProps) {
  const { setJsonData } = useJsonStore();
  const [transformType, setTransformType] = useState<TransformType>('flatten');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<JsonValue[]>([]);
  
  const [redactPatterns, setRedactPatterns] = useState('email,password,token,key,secret');
  const [pivotRow, setPivotRow] = useState('');
  const [pivotCol, setPivotCol] = useState('');
  const [pivotVal, setPivotVal] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterExpr, setFilterExpr] = useState('');
  const [remapFrom, setRemapFrom] = useState('');
  const [remapTo, setRemapTo] = useState('');

  const applyTransform = useCallback(() => {
    let transformResult: TransformResult | null = null;
    
    try {
      switch (transformType) {
        case 'flatten':
          transformResult = {
            success: true,
            data: flattenObject(data),
          };
          break;
          
        case 'dedupe':
          transformResult = dedupeArray(data);
          break;
          
        case 'redact':
          const patterns = redactPatterns.split(',').map(p => p.trim()).filter(Boolean);
          transformResult = redactData(data, patterns);
          break;
          
        case 'pivot':
          if (!pivotRow || !pivotCol || !pivotVal) {
            setError('Please specify row, column, and value keys for pivot');
            return;
          }
          transformResult = pivotData(data, pivotRow, pivotCol, pivotVal);
          break;
          
        case 'sort':
          if (!sortKey) {
            setError('Please specify a key to sort by');
            return;
          }
          transformResult = sortData(data, sortKey, sortOrder);
          break;
          
        case 'filter':
          if (!filterExpr) {
            setError('Please provide a filter expression');
            return;
          }
          transformResult = filterData(data, filterExpr);
          break;
          
        case 'remap':
          if (!remapFrom || !remapTo) {
            setError('Please specify keys to remap');
            return;
          }
          const mapping: Record<string, string> = {};
          const fromKeys = remapFrom.split(',').map(k => k.trim());
          const toKeys = remapTo.split(',').map(k => k.trim());
          fromKeys.forEach((key, i) => {
            if (toKeys[i]) {
              mapping[key] = toKeys[i];
            }
          });
          transformResult = remapKeys(data, mapping);
          break;
      }
      
      if (transformResult && transformResult.success && transformResult.data) {
        const newData = transformResult.data;
        setResult(JSON.stringify(newData, null, 2));
        setError('');
        setHistory([...history, data]);
      } else if (transformResult && transformResult.error) {
        setError(transformResult.error);
        setResult('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transform failed');
      setResult('');
    }
  }, [transformType, data, redactPatterns, pivotRow, pivotCol, pivotVal, sortKey, sortOrder, filterExpr, remapFrom, remapTo, history]);

  const applyToData = useCallback(() => {
    if (!result) return;
    
    try {
      const newData = JSON.parse(result);
      setJsonData(newData, JSON.stringify(newData, null, 2));
      setResult('');
      setError('Transform applied to data!');
      setTimeout(() => setError(''), 2000);
    } catch {
      setError('Invalid JSON result');
    }
  }, [result, setJsonData]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setJsonData(previous, JSON.stringify(previous, null, 2));
    setError('Undid last transform');
    setTimeout(() => setError(''), 2000);
  }, [history, setJsonData]);

  const handleConvert = useCallback((format: ConvertType) => {
    let convResult;
    
    switch (format) {
      case 'csv':
        convResult = convertToCSV(data);
        break;
      case 'yaml':
        convResult = convertToYAML(data);
        break;
      case 'ndjson':
        convResult = convertToNDJSON(data);
        break;
    }
    
    if (convResult.success && typeof convResult.data === 'string') {
      setResult(convResult.data);
      setError('');
    } else if (convResult.error) {
      setError(convResult.error);
    }
  }, [data]);

  const handleDownload = useCallback((format: ConversionFormat) => {
    downloadAsFormat(data, format, 'export');
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Transform & Convert</h3>
            <p className="text-sm text-muted-foreground">
              Transform data structure and convert formats
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={undo}>
                <Undo className="h-3 w-3 mr-1" />
                Undo ({history.length})
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium mb-2">Transform:</div>
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={transformType === 'flatten' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('flatten')}
              >
                Flatten
              </Button>
              <Button
                variant={transformType === 'dedupe' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('dedupe')}
              >
                Dedupe
              </Button>
              <Button
                variant={transformType === 'redact' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('redact')}
              >
                Redact
              </Button>
              <Button
                variant={transformType === 'pivot' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('pivot')}
              >
                Pivot
              </Button>
              <Button
                variant={transformType === 'sort' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('sort')}
              >
                Sort
              </Button>
              <Button
                variant={transformType === 'filter' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('filter')}
              >
                Filter
              </Button>
              <Button
                variant={transformType === 'remap' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('remap')}
              >
                Remap Keys
              </Button>
            </div>
          </div>

          {transformType === 'redact' && (
            <div>
              <label className="text-sm">Patterns to redact (comma-separated):</label>
              <input
                type="text"
                value={redactPatterns}
                onChange={(e) => setRedactPatterns(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                placeholder="email,password,token"
              />
            </div>
          )}

          {transformType === 'pivot' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Row Key:</label>
                <input
                  type="text"
                  value={pivotRow}
                  onChange={(e) => setPivotRow(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm">Column Key:</label>
                <input
                  type="text"
                  value={pivotCol}
                  onChange={(e) => setPivotCol(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm">Value Key:</label>
                <input
                  type="text"
                  value={pivotVal}
                  onChange={(e) => setPivotVal(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {transformType === 'sort' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm">Sort by key:</label>
                <input
                  type="text"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="w-32">
                <label className="text-sm">Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          )}

          {transformType === 'filter' && (
            <div>
              <label className="text-sm">Filter expression (JavaScript):</label>
              <input
                type="text"
                value={filterExpr}
                onChange={(e) => setFilterExpr(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono"
                placeholder="item.age > 18"
              />
            </div>
          )}

          {transformType === 'remap' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">From keys (comma-separated):</label>
                <input
                  type="text"
                  value={remapFrom}
                  onChange={(e) => setRemapFrom(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  placeholder="oldKey1,oldKey2"
                />
              </div>
              <div>
                <label className="text-sm">To keys (comma-separated):</label>
                <input
                  type="text"
                  value={remapTo}
                  onChange={(e) => setRemapTo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  placeholder="newKey1,newKey2"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={applyTransform}>
              <Code2 className="h-4 w-4 mr-1" />
              Apply Transform
            </Button>
            {result && (
              <Button onClick={applyToData} variant="secondary">
                Use This Result
              </Button>
            )}
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Convert & Download:</div>
            <div className="flex gap-1 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleConvert('csv')}>
                View as CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleConvert('yaml')}>
                View as YAML
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleConvert('ndjson')}>
                View as NDJSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload('json')}>
                <Download className="h-3 w-3 mr-1" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload('csv')}>
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload('yaml')}>
                <Download className="h-3 w-3 mr-1" />
                YAML
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload('ndjson')}>
                <Download className="h-3 w-3 mr-1" />
                NDJSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        {result ? (
          <div>
            <h4 className="text-sm font-semibold mb-2">Result:</h4>
            <pre className="p-4 bg-muted/30 rounded-lg overflow-auto text-xs font-mono max-h-[600px]">
              {result}
            </pre>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Select a transform or conversion above to see results here
          </div>
        )}
      </div>
    </div>
  );
}
