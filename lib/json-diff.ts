import { JsonValue } from '@/store/json-store';

export type DiffOperation = 'add' | 'remove' | 'change' | 'unchanged';

export interface DiffNode {
  path: string;
  operation: DiffOperation;
  oldValue?: JsonValue;
  newValue?: JsonValue;
  type: string;
}

export interface DiffOptions {
  ignoreKeyOrder?: boolean;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

function getValueType(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function normalizeValue(value: JsonValue, options: DiffOptions): JsonValue {
  if (options.ignoreWhitespace && typeof value === 'string') {
    return value.trim().replace(/\s+/g, ' ');
  }
  if (options.ignoreCase && typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
}

function deepEqual(a: JsonValue, b: JsonValue, options: DiffOptions = {}): boolean {
  const normalizedA = normalizeValue(a, options);
  const normalizedB = normalizeValue(b, options);

  if (normalizedA === normalizedB) return true;
  
  if (typeof normalizedA !== typeof normalizedB) return false;
  if (normalizedA === null || normalizedB === null) return false;
  
  if (Array.isArray(normalizedA) && Array.isArray(normalizedB)) {
    if (normalizedA.length !== normalizedB.length) return false;
    return normalizedA.every((item, index) => deepEqual(item, normalizedB[index], options));
  }
  
  if (typeof normalizedA === 'object' && typeof normalizedB === 'object') {
    const keysA = Object.keys(normalizedA as object);
    const keysB = Object.keys(normalizedB as object);
    
    if (keysA.length !== keysB.length) return false;
    
    if (options.ignoreKeyOrder) {
      const sortedKeysA = keysA.sort();
      const sortedKeysB = keysB.sort();
      if (!deepEqual(sortedKeysA, sortedKeysB, {})) return false;
      return sortedKeysA.every(key => 
        deepEqual(
          (normalizedA as Record<string, JsonValue>)[key],
          (normalizedB as Record<string, JsonValue>)[key],
          options
        )
      );
    }
    
    return keysA.every(key => 
      keysB.includes(key) && 
      deepEqual(
        (normalizedA as Record<string, JsonValue>)[key],
        (normalizedB as Record<string, JsonValue>)[key],
        options
      )
    );
  }
  
  return false;
}

function diffObjects(
  oldObj: Record<string, JsonValue>,
  newObj: Record<string, JsonValue>,
  path: string,
  options: DiffOptions
): DiffNode[] {
  const diffs: DiffNode[] = [];
  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);
  const allKeys = new Set([...oldKeys, ...newKeys]);
  
  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    if (!(key in oldObj)) {
      diffs.push({
        path: currentPath,
        operation: 'add',
        newValue,
        type: getValueType(newValue),
      });
    } else if (!(key in newObj)) {
      diffs.push({
        path: currentPath,
        operation: 'remove',
        oldValue,
        type: getValueType(oldValue),
      });
    } else if (!deepEqual(oldValue, newValue, options)) {
      if (
        typeof oldValue === 'object' &&
        oldValue !== null &&
        typeof newValue === 'object' &&
        newValue !== null &&
        !Array.isArray(oldValue) &&
        !Array.isArray(newValue)
      ) {
        diffs.push(
          ...diffObjects(
            oldValue as Record<string, JsonValue>,
            newValue as Record<string, JsonValue>,
            currentPath,
            options
          )
        );
      } else {
        diffs.push({
          path: currentPath,
          operation: 'change',
          oldValue,
          newValue,
          type: getValueType(newValue),
        });
      }
    } else {
      diffs.push({
        path: currentPath,
        operation: 'unchanged',
        oldValue,
        newValue,
        type: getValueType(newValue),
      });
    }
  }
  
  return diffs;
}

function diffArrays(
  oldArr: JsonValue[],
  newArr: JsonValue[],
  path: string,
  options: DiffOptions
): DiffNode[] {
  const diffs: DiffNode[] = [];
  const maxLength = Math.max(oldArr.length, newArr.length);
  
  for (let i = 0; i < maxLength; i++) {
    const currentPath = `${path}[${i}]`;
    const oldValue = oldArr[i];
    const newValue = newArr[i];
    
    if (i >= oldArr.length) {
      diffs.push({
        path: currentPath,
        operation: 'add',
        newValue,
        type: getValueType(newValue),
      });
    } else if (i >= newArr.length) {
      diffs.push({
        path: currentPath,
        operation: 'remove',
        oldValue,
        type: getValueType(oldValue),
      });
    } else if (!deepEqual(oldValue, newValue, options)) {
      if (
        typeof oldValue === 'object' &&
        oldValue !== null &&
        typeof newValue === 'object' &&
        newValue !== null
      ) {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          diffs.push(...diffArrays(oldValue, newValue, currentPath, options));
        } else if (!Array.isArray(oldValue) && !Array.isArray(newValue)) {
          diffs.push(
            ...diffObjects(
              oldValue as Record<string, JsonValue>,
              newValue as Record<string, JsonValue>,
              currentPath,
              options
            )
          );
        } else {
          diffs.push({
            path: currentPath,
            operation: 'change',
            oldValue,
            newValue,
            type: getValueType(newValue),
          });
        }
      } else {
        diffs.push({
          path: currentPath,
          operation: 'change',
          oldValue,
          newValue,
          type: getValueType(newValue),
        });
      }
    } else {
      diffs.push({
        path: currentPath,
        operation: 'unchanged',
        oldValue,
        newValue,
        type: getValueType(newValue),
      });
    }
  }
  
  return diffs;
}

export function diffJson(
  oldJson: JsonValue,
  newJson: JsonValue,
  options: DiffOptions = {}
): DiffNode[] {
  if (deepEqual(oldJson, newJson, options)) {
    return [{
      path: '$',
      operation: 'unchanged',
      oldValue: oldJson,
      newValue: newJson,
      type: getValueType(newJson),
    }];
  }
  
  if (typeof oldJson !== typeof newJson) {
    return [{
      path: '$',
      operation: 'change',
      oldValue: oldJson,
      newValue: newJson,
      type: getValueType(newJson),
    }];
  }
  
  if (Array.isArray(oldJson) && Array.isArray(newJson)) {
    return diffArrays(oldJson, newJson, '$', options);
  }
  
  if (
    typeof oldJson === 'object' &&
    oldJson !== null &&
    typeof newJson === 'object' &&
    newJson !== null &&
    !Array.isArray(oldJson) &&
    !Array.isArray(newJson)
  ) {
    return diffObjects(
      oldJson as Record<string, JsonValue>,
      newJson as Record<string, JsonValue>,
      '$',
      options
    );
  }
  
  return [{
    path: '$',
    operation: 'change',
    oldValue: oldJson,
    newValue: newJson,
    type: getValueType(newJson),
  }];
}

export function getDiffStats(diffs: DiffNode[]): {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
} {
  return diffs.reduce(
    (stats, diff) => {
      if (diff.operation === 'add') stats.added++;
      else if (diff.operation === 'remove') stats.removed++;
      else if (diff.operation === 'change') stats.changed++;
      else if (diff.operation === 'unchanged') stats.unchanged++;
      return stats;
    },
    { added: 0, removed: 0, changed: 0, unchanged: 0 }
  );
}
