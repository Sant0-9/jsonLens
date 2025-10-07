"use client"

import { useState, useCallback } from 'react';
import { Download, Undo, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue, useJsonStore } from '@/store/json-store';
import {
  flattenObject,
  unflattenObject,
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
import {
  generateMockDataFromSample,
  downloadMockData,
  MockDataOptions,
} from '@/lib/mock-generator';
import {
  exportToZip,
  exportToHtml,
  ExportOptions,
} from '@/lib/export-utils';

interface TransformViewProps {
  data: JsonValue;
}

type TransformType = 'flatten' | 'unflatten' | 'dedupe' | 'redact' | 'pivot' | 'sort' | 'filter' | 'remap' | 'mock';
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
  const [mockCount, setMockCount] = useState(10);
  const [mockOptions, setMockOptions] = useState<MockDataOptions>({
    count: 10,
    includeNulls: false,
    includeEmptyArrays: false,
    includeEmptyObjects: false,
    stringLength: { min: 3, max: 20 },
    numberRange: { min: 0, max: 100 },
    arrayLength: { min: 2, max: 8 },
  });

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
          
        case 'unflatten':
          if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            setError('Data must be a flat object for unflattening');
            return;
          }
          transformResult = {
            success: true,
            data: unflattenObject(data as Record<string, unknown>),
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
          
        case 'mock':
          const mockData = generateMockDataFromSample(data, { ...mockOptions, count: mockCount });
          transformResult = {
            success: true,
            data: mockData,
            stats: {
              before: Array.isArray(data) ? data.length : 1,
              after: mockData.length,
              changed: 0,
            },
          };
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
  }, [transformType, data, redactPatterns, pivotRow, pivotCol, pivotVal, sortKey, sortOrder, filterExpr, remapFrom, remapTo, history, mockCount, mockOptions]);

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

  const handleDownloadMock = useCallback(() => {
    if (!result) return;
    try {
      const mockData = JSON.parse(result);
      downloadMockData(mockData, 'mock-data');
    } catch {
      setError('Invalid mock data to download');
    }
  }, [result]);

  const handleExportZip = useCallback(async () => {
    try {
      const options: ExportOptions = {
        includeJson: true,
        includeCsv: true,
        includeYaml: true,
        includeNdjson: true,
        includeHtml: true,
        htmlTitle: 'JSONLens Export',
        htmlDescription: 'Data exported from JSONLens',
      };
      await exportToZip(data, 'jsonlens-export', options);
    } catch {
      setError('Failed to create ZIP export');
    }
  }, [data]);

  const handleExportHtml = useCallback(() => {
    try {
      exportToHtml(data, 'JSONLens Export', 'Data exported from JSONLens');
    } catch {
      setError('Failed to create HTML export');
    }
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
                variant={transformType === 'unflatten' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('unflatten')}
              >
                Unflatten
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
              <Button
                variant={transformType === 'mock' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTransformType('mock')}
              >
                Generate Mock
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

          {transformType === 'mock' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm">Number of records to generate:</label>
                <input
                  type="number"
                  value={mockCount}
                  onChange={(e) => setMockCount(parseInt(e.target.value) || 10)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  min="1"
                  max="1000"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm">String length (min-max):</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={mockOptions.stringLength.min}
                      onChange={(e) => setMockOptions(prev => ({
                        ...prev,
                        stringLength: { ...prev.stringLength, min: parseInt(e.target.value) || 3 }
                      }))}
                      className="flex-1 mt-1 px-2 py-1 border rounded text-sm"
                      min="1"
                    />
                    <input
                      type="number"
                      value={mockOptions.stringLength.max}
                      onChange={(e) => setMockOptions(prev => ({
                        ...prev,
                        stringLength: { ...prev.stringLength, max: parseInt(e.target.value) || 20 }
                      }))}
                      className="flex-1 mt-1 px-2 py-1 border rounded text-sm"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Number range (min-max):</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={mockOptions.numberRange.min}
                      onChange={(e) => setMockOptions(prev => ({
                        ...prev,
                        numberRange: { ...prev.numberRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="flex-1 mt-1 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      value={mockOptions.numberRange.max}
                      onChange={(e) => setMockOptions(prev => ({
                        ...prev,
                        numberRange: { ...prev.numberRange, max: parseInt(e.target.value) || 100 }
                      }))}
                      className="flex-1 mt-1 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mockOptions.includeNulls}
                    onChange={(e) => setMockOptions(prev => ({ ...prev, includeNulls: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Include nulls</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mockOptions.includeEmptyArrays}
                    onChange={(e) => setMockOptions(prev => ({ ...prev, includeEmptyArrays: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Empty arrays</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mockOptions.includeEmptyObjects}
                    onChange={(e) => setMockOptions(prev => ({ ...prev, includeEmptyObjects: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Empty objects</span>
                </label>
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
              {transformType === 'mock' && result && (
                <Button variant="outline" size="sm" onClick={handleDownloadMock}>
                  <Download className="h-3 w-3 mr-1" />
                  Mock Data
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Advanced Export:</div>
            <div className="flex gap-1 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportZip}>
                <Download className="h-3 w-3 mr-1" />
                Export as ZIP
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportHtml}>
                <Download className="h-3 w-3 mr-1" />
                Export as HTML
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
