"use client"

import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Copy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { isJsonObject, isJsonArray } from '@/lib/json-parser';
import { useJsonStore } from '@/store/json-store';

interface TreeNodeProps {
  keyName: string;
  value: JsonValue;
  path: string;
  level: number;
  searchQuery?: string;
}

function TreeNode({ keyName, value, path, level, searchQuery }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      keyName.toLowerCase().includes(query) ||
      (typeof value === 'string' && value.toLowerCase().includes(query)) ||
      (typeof value === 'number' && value.toString().includes(query))
    );
  }, [keyName, value, searchQuery]);

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(path);
  }, [path]);

  const handleCopyValue = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
  }, [value]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const isExpandable = isJsonObject(value) || isJsonArray(value);
  const valueType = typeof value;
  const isNull = value === null;

  if (!matchesSearch && !isExpandable) {
    return null;
  }

  return (
    <div className="font-mono text-sm">
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-accent/50 rounded group transition-colors"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {isExpandable ? (
          <button
            onClick={toggleExpand}
            className="flex items-center justify-center w-4 h-4 hover:bg-accent rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="text-blue-600 dark:text-blue-400 font-medium">
          {keyName}
        </span>
        <span className="text-muted-foreground">:</span>

        {!isExpandable && (
          <>
            {isNull && (
              <span className="text-orange-600 dark:text-orange-400">null</span>
            )}
            {valueType === 'string' && (
              <span className="text-green-600 dark:text-green-400">
                &quot;{value as string}&quot;
              </span>
            )}
            {valueType === 'number' && (
              <span className="text-purple-600 dark:text-purple-400">
                {value as number}
              </span>
            )}
            {valueType === 'boolean' && (
              <span className="text-red-600 dark:text-red-400">
                {String(value)}
              </span>
            )}
          </>
        )}

        {isExpandable && (
          <span className="text-muted-foreground text-xs">
            {isJsonArray(value)
              ? `Array[${value.length}]`
              : `Object{${Object.keys(value).length}}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopyPath}
            title="Copy path"
          >
            <Search className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopyValue}
            title="Copy value"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded && isExpandable && (
        <div>
          {isJsonArray(value) &&
            value.map((item, index) => (
              <TreeNode
                key={index}
                keyName={`[${index}]`}
                value={item}
                path={`${path}[${index}]`}
                level={level + 1}
                searchQuery={searchQuery}
              />
            ))}
          {isJsonObject(value) &&
            Object.entries(value).map(([key, val]) => (
              <TreeNode
                key={key}
                keyName={key}
                value={val}
                path={`${path}.${key}`}
                level={level + 1}
                searchQuery={searchQuery}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface TreeViewProps {
  data: JsonValue;
}

export function TreeView({ data }: TreeViewProps) {
  const { searchQuery, setSearchQuery } = useJsonStore();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    setSearchQuery(value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keys or values..."
            value={localSearch}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isJsonArray(data) ? (
          data.map((item, index) => (
            <TreeNode
              key={index}
              keyName={`[${index}]`}
              value={item}
              path={`$[${index}]`}
              level={0}
              searchQuery={searchQuery}
            />
          ))
        ) : isJsonObject(data) ? (
          Object.entries(data).map(([key, value]) => (
            <TreeNode
              key={key}
              keyName={key}
              value={value}
              path={`$.${key}`}
              level={0}
              searchQuery={searchQuery}
            />
          ))
        ) : (
          <TreeNode
            keyName="root"
            value={data}
            path="$"
            level={0}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
}
