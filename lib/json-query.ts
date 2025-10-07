import { JSONPath } from 'jsonpath-plus';
import jmespath from 'jmespath';
import { JsonValue } from '@/store/json-store';

export type QueryEngine = 'jsonpath' | 'jmespath';

export interface QueryResult {
  success: boolean;
  data?: JsonValue[];
  error?: string;
  count: number;
  engine: QueryEngine;
  query: string;
}

export function executeJsonPath(data: JsonValue, query: string): QueryResult {
  try {
    const result = JSONPath({ path: query, json: data, wrap: true });
    
    return {
      success: true,
      data: result as JsonValue[],
      count: Array.isArray(result) ? result.length : 0,
      engine: 'jsonpath',
      query,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
      engine: 'jsonpath',
      query,
    };
  }
}

export function executeJmesPath(data: JsonValue, query: string): QueryResult {
  try {
    const result = jmespath.search(data, query);
    const resultArray = Array.isArray(result) ? result : [result];
    
    return {
      success: true,
      data: resultArray as JsonValue[],
      count: resultArray.length,
      engine: 'jmespath',
      query,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
      engine: 'jmespath',
      query,
    };
  }
}

export function executeQuery(
  data: JsonValue,
  query: string,
  engine: QueryEngine = 'jsonpath'
): QueryResult {
  if (!query || query.trim() === '') {
    return {
      success: false,
      error: 'Query cannot be empty',
      count: 0,
      engine,
      query,
    };
  }

  if (engine === 'jsonpath') {
    return executeJsonPath(data, query);
  } else {
    return executeJmesPath(data, query);
  }
}

export function getJsonPathSuggestions(path: string, data: JsonValue): string[] {
  const suggestions: string[] = [];
  
  if (!path || path === '$') {
    suggestions.push('$');
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        suggestions.push('$[*]', '$[0]', '$.length');
      } else {
        Object.keys(data).forEach(key => {
          suggestions.push(`$.${key}`);
        });
      }
    }
    return suggestions;
  }
  
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];
  
  if (lastPart && !lastPart.includes('[')) {
    let current = data;
    for (let i = 1; i < parts.length - 1; i++) {
      const part = parts[i].replace(/\[.*\]/, '');
      if (typeof current === 'object' && current !== null && part in (current as object)) {
        current = (current as Record<string, JsonValue>)[part];
      } else {
        return suggestions;
      }
    }
    
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      Object.keys(current).forEach(key => {
        if (key.toLowerCase().startsWith(lastPart.toLowerCase())) {
          const newPath = parts.slice(0, -1).concat(key).join('.');
          suggestions.push(newPath);
        }
      });
    }
  }
  
  return suggestions;
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  engine: QueryEngine;
  createdAt: number;
  lastUsed?: number;
}

const SAVED_QUERIES_KEY = 'jsonlens-saved-queries';

export function getSavedQueries(): SavedQuery[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(SAVED_QUERIES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveQuery(query: SavedQuery): void {
  if (typeof window === 'undefined') return;
  
  const queries = getSavedQueries();
  const existingIndex = queries.findIndex(q => q.id === query.id);
  
  if (existingIndex >= 0) {
    queries[existingIndex] = query;
  } else {
    queries.push(query);
  }
  
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries));
}

export function deleteQuery(id: string): void {
  if (typeof window === 'undefined') return;
  
  const queries = getSavedQueries().filter(q => q.id !== id);
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries));
}

export function updateQueryLastUsed(id: string): void {
  if (typeof window === 'undefined') return;
  
  const queries = getSavedQueries();
  const query = queries.find(q => q.id === id);
  
  if (query) {
    query.lastUsed = Date.now();
    localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries));
  }
}
