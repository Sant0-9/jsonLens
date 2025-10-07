"use client"

import { useState, useCallback, useEffect } from 'react';
import { Search, Save, Trash2, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import {
  executeQuery,
  QueryEngine,
  QueryResult,
  getSavedQueries,
  saveQuery,
  deleteQuery,
  updateQueryLastUsed,
  SavedQuery,
} from '@/lib/json-query';
import { TreeView } from './tree-view';
import { TableView } from './table-view';

interface QueryViewProps {
  data: JsonValue;
}

export function QueryView({ data }: QueryViewProps) {
  const [query, setQuery] = useState('$');
  const [engine, setEngine] = useState<QueryEngine>('jsonpath');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [resultView, setResultView] = useState<'tree' | 'table'>('tree');

  useEffect(() => {
    setSavedQueries(getSavedQueries());
  }, []);

  const handleExecuteQuery = useCallback(() => {
    if (!query.trim()) return;
    
    const queryResult = executeQuery(data, query, engine);
    setResult(queryResult);
  }, [data, query, engine]);

  const handleSaveQuery = useCallback(() => {
    const name = prompt('Enter a name for this query:');
    if (!name) return;

    const newQuery: SavedQuery = {
      id: `query-${Date.now()}`,
      name,
      query,
      engine,
      createdAt: Date.now(),
    };

    saveQuery(newQuery);
    setSavedQueries(getSavedQueries());
  }, [query, engine]);

  const handleLoadQuery = useCallback((savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
    setEngine(savedQuery.engine);
    updateQueryLastUsed(savedQuery.id);
    setSavedQueries(getSavedQueries());
    setShowSaved(false);
  }, []);

  const handleDeleteQuery = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this query?')) {
      deleteQuery(id);
      setSavedQueries(getSavedQueries());
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteQuery();
      }
    },
    [handleExecuteQuery]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Query JSON</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={engine === 'jsonpath' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setEngine('jsonpath')}
            >
              JSONPath
            </Button>
            <Button
              variant={engine === 'jmespath' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setEngine('jmespath')}
            >
              JMESPath
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                engine === 'jsonpath'
                  ? 'e.g., $.store.book[*].author'
                  : 'e.g., store.book[*].author'
              }
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
            />
          </div>
          <Button onClick={handleExecuteQuery}>
            <Play className="h-4 w-4 mr-1" />
            Run
          </Button>
          <Button variant="outline" onClick={handleSaveQuery}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSaved(!showSaved)}
          >
            <Clock className="h-4 w-4 mr-1" />
            History ({savedQueries.length})
          </Button>
        </div>

        {showSaved && savedQueries.length > 0 && (
          <div className="border rounded-lg p-2 max-h-48 overflow-auto">
            <div className="space-y-1">
              {savedQueries
                .sort((a, b) => (b.lastUsed || b.createdAt) - (a.lastUsed || a.createdAt))
                .map((sq) => (
                  <div
                    key={sq.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded group"
                  >
                    <button
                      onClick={() => handleLoadQuery(sq)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm">{sq.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {sq.query}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sq.engine} • {new Date(sq.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteQuery(sq.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Tip: Press <kbd className="px-1 py-0.5 bg-muted rounded">Cmd/Ctrl + Enter</kbd> to run query
        </div>
      </div>

      {result && (
        <div className="flex-1 overflow-auto">
          {result.success ? (
            <div className="h-full flex flex-col">
              <div className="border-b p-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Found {result.count} result{result.count !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={resultView === 'tree' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setResultView('tree')}
                  >
                    Tree
                  </Button>
                  <Button
                    variant={resultView === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setResultView('table')}
                  >
                    Table
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {result.count > 0 ? (
                  resultView === 'tree' ? (
                    <TreeView data={result.data as JsonValue} />
                  ) : (
                    <TableView data={result.data as JsonValue} />
                  )
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No results found
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                <h4 className="font-semibold text-destructive mb-2">Query Error</h4>
                <p className="text-sm text-muted-foreground">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <Search className="h-12 w-12 mx-auto opacity-50" />
            <p>Enter a query and click Run to search</p>
            <div className="text-xs space-y-1">
              <p>
                <strong>JSONPath examples:</strong>
              </p>
              <p className="font-mono">$.store.book[*].title</p>
              <p className="font-mono">$..author</p>
              <p className="font-mono">$.store.book[?(@.price &lt; 10)]</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
