import { JsonValue } from '@/store/json-store';

export type TransformerType = 
  | 'flatten' 
  | 'unflatten' 
  | 'dedupe' 
  | 'redact' 
  | 'pivot'
  | 'sort'
  | 'filter'
  | 'remap';

export interface TransformResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
  stats?: {
    before: number;
    after: number;
    changed: number;
  };
}

export function flattenObject(obj: JsonValue, prefix: string = ''): JsonValue {
  const result: Record<string, unknown> = {};
  
  function flatten(current: unknown, path: string): void {
    if (current === null || current === undefined) {
      result[path] = current;
      return;
    }
    
    if (typeof current !== 'object') {
      result[path] = current;
      return;
    }
    
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        flatten(item, path ? `${path}[${index}]` : `[${index}]`);
      });
    } else {
      Object.entries(current).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        flatten(value, newPath);
      });
    }
  }
  
  flatten(obj, prefix);
  return result as JsonValue;
}

export function unflattenObject(obj: Record<string, unknown>): JsonValue {
  const result: Record<string, unknown> = {};
  
  Object.entries(obj).forEach(([path, value]) => {
    const parts = path.split('.');
    let current: unknown = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const key = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        
        if (!(current as Record<string, unknown>)[key]) {
          (current as Record<string, unknown>)[key] = [];
        }
        
        const arr = (current as Record<string, unknown>)[key] as unknown[];
        if (!arr[index]) {
          arr[index] = {};
        }
        current = arr[index];
      } else {
        if (!(current as Record<string, unknown>)[part]) {
          (current as Record<string, unknown>)[part] = {};
        }
        current = (current as Record<string, unknown>)[part];
      }
    }
    
    const lastPart = parts[parts.length - 1];
    (current as Record<string, unknown>)[lastPart] = value;
  });
  
  return result as JsonValue;
}

export function dedupeArray(data: JsonValue): TransformResult {
  if (!Array.isArray(data)) {
    return {
      success: false,
      error: 'Data must be an array for deduplication',
    };
  }
  
  const seen = new Set<string>();
  const unique: JsonValue[] = [];
  
  data.forEach(item => {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });
  
  return {
    success: true,
    data: unique,
    stats: {
      before: data.length,
      after: unique.length,
      changed: data.length - unique.length,
    },
  };
}

export function redactData(data: JsonValue, patterns: string[]): TransformResult {
  const redactPatterns = patterns.map(p => new RegExp(p, 'gi'));
  
  function redact(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      let redacted = obj;
      redactPatterns.forEach(pattern => {
        redacted = redacted.replace(pattern, '***REDACTED***');
      });
      return redacted;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(redact);
    }
    
    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const shouldRedactKey = patterns.some(p => 
          key.toLowerCase().includes(p.toLowerCase())
        );
        result[key] = shouldRedactKey ? '***REDACTED***' : redact(value);
      });
      return result;
    }
    
    return obj;
  }
  
  return {
    success: true,
    data: redact(data) as JsonValue,
  };
}

export function pivotData(data: JsonValue, rowKey: string, columnKey: string, valueKey: string): TransformResult {
  if (!Array.isArray(data)) {
    return {
      success: false,
      error: 'Data must be an array for pivoting',
    };
  }
  
  const result: Record<string, Record<string, unknown>> = {};
  
  data.forEach(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return;
    }
    
    const row = String((item as Record<string, unknown>)[rowKey]);
    const col = String((item as Record<string, unknown>)[columnKey]);
    const val = (item as Record<string, unknown>)[valueKey];
    
    if (!result[row]) {
      result[row] = {};
    }
    
    result[row][col] = val;
  });
  
  return {
    success: true,
    data: result as JsonValue,
  };
}

export function sortData(data: JsonValue, key: string, order: 'asc' | 'desc' = 'asc'): TransformResult {
  if (!Array.isArray(data)) {
    return {
      success: false,
      error: 'Data must be an array for sorting',
    };
  }
  
  const sorted = [...data].sort((a, b) => {
    if (typeof a !== 'object' || typeof b !== 'object') {
      return 0;
    }
    
    const aVal = (a as Record<string, unknown>)[key];
    const bVal = (b as Record<string, unknown>)[key];
    
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
  
  return {
    success: true,
    data: sorted,
  };
}

export function filterData(data: JsonValue, predicate: string): TransformResult {
  if (!Array.isArray(data)) {
    return {
      success: false,
      error: 'Data must be an array for filtering',
    };
  }
  
  try {
    const filterFn = new Function('item', `return ${predicate}`);
    const filtered = data.filter(item => {
      try {
        return filterFn(item);
      } catch {
        return false;
      }
    });
    
    return {
      success: true,
      data: filtered,
      stats: {
        before: data.length,
        after: filtered.length,
        changed: data.length - filtered.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid filter expression',
    };
  }
}

export function remapKeys(data: JsonValue, mapping: Record<string, string>): TransformResult {
  function remap(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(remap);
    }
    
    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = mapping[key] || key;
        result[newKey] = remap(value);
      });
      return result;
    }
    
    return obj;
  }
  
  return {
    success: true,
    data: remap(data) as JsonValue,
  };
}
