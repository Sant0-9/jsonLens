import { JsonValue } from '@/store/json-store';

export interface FieldProfile {
  name: string;
  type: string;
  count: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: unknown[];
  frequency: Map<string, number>;
  numericStats?: {
    min: number;
    max: number;
    avg: number;
    median: number;
    sum: number;
  };
  stringStats?: {
    minLength: number;
    maxLength: number;
    avgLength: number;
  };
  temporalStats?: {
    earliest: Date;
    latest: Date;
    format: string;
  };
}

export interface DataProfile {
  totalRecords: number;
  totalFields: number;
  fields: Map<string, FieldProfile>;
  structure: 'array' | 'object' | 'primitive';
  depth: number;
  size: number;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

export interface NumericHistogram {
  field: string;
  bins: HistogramBin[];
}

function detectDateFormat(value: string): string | null {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  
  if (isoDateTimeRegex.test(value)) return 'ISO DateTime';
  if (isoDateRegex.test(value)) return 'ISO Date';
  
  const date = new Date(value);
  if (!isNaN(date.getTime())) return 'Date String';
  
  return null;
}

function isTemporalValue(value: unknown): value is string | number {
  if (typeof value === 'number') {
    return value > 946684800000 && value < 4102444800000;
  }
  
  if (typeof value === 'string') {
    return detectDateFormat(value) !== null;
  }
  
  return false;
}

function profileField(values: unknown[]): Omit<FieldProfile, 'name'> {
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  const nullCount = values.length - nonNullValues.length;
  
  const types = new Set(nonNullValues.map(v => typeof v));
  const type = types.size === 1 ? Array.from(types)[0] : 'mixed';
  
  const frequency = new Map<string, number>();
  const uniqueValues = new Set();
  
  nonNullValues.forEach(value => {
    const key = typeof value === 'object' ? JSON.stringify(value) : String(value);
    frequency.set(key, (frequency.get(key) || 0) + 1);
    uniqueValues.add(key);
  });
  
  const profile: Omit<FieldProfile, 'name'> = {
    type,
    count: values.length,
    nullCount,
    uniqueCount: uniqueValues.size,
    sampleValues: Array.from(uniqueValues).slice(0, 5).map(k => {
      try {
        return JSON.parse(k as string);
      } catch {
        return k;
      }
    }),
    frequency,
  };
  
  if (type === 'number') {
    const numbers = nonNullValues as number[];
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    
    profile.numericStats = {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / numbers.length,
      median: sorted[Math.floor(sorted.length / 2)],
      sum,
    };
  }
  
  if (type === 'string') {
    const strings = nonNullValues as string[];
    const lengths = strings.map(s => s.length);
    
    profile.stringStats = {
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    };
    
    const temporalValues = strings.filter(isTemporalValue);
    if (temporalValues.length > 0) {
      const dates = temporalValues.map(v => new Date(v));
      const validDates = dates.filter(d => !isNaN(d.getTime()));
      
      if (validDates.length > 0) {
        profile.temporalStats = {
          earliest: new Date(Math.min(...validDates.map(d => d.getTime()))),
          latest: new Date(Math.max(...validDates.map(d => d.getTime()))),
          format: detectDateFormat(temporalValues[0]) || 'Unknown',
        };
      }
    }
  }
  
  return profile;
}

function getDepth(obj: unknown, currentDepth: number = 0): number {
  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return currentDepth + 1;
    return Math.max(...obj.map(item => getDepth(item, currentDepth + 1)));
  }
  
  const depths = Object.values(obj).map(value => getDepth(value, currentDepth + 1));
  return depths.length > 0 ? Math.max(...depths) : currentDepth + 1;
}

export function profileData(data: JsonValue): DataProfile {
  const fields = new Map<string, FieldProfile>();
  let totalRecords = 0;
  let structure: DataProfile['structure'] = 'primitive';
  
  if (Array.isArray(data)) {
    structure = 'array';
    totalRecords = data.length;
    
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const fieldValues = new Map<string, unknown[]>();
      
      data.forEach(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          Object.entries(item).forEach(([key, value]) => {
            if (!fieldValues.has(key)) {
              fieldValues.set(key, []);
            }
            fieldValues.get(key)!.push(value);
          });
        }
      });
      
      fieldValues.forEach((values, fieldName) => {
        const profile = profileField(values);
        fields.set(fieldName, {
          name: fieldName,
          ...profile,
        });
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    structure = 'object';
    totalRecords = 1;
    
    Object.entries(data).forEach(([key, value]) => {
      const profile = profileField([value]);
      fields.set(key, {
        name: key,
        ...profile,
      });
    });
  } else {
    totalRecords = 1;
    const profile = profileField([data]);
    fields.set('value', {
      name: 'value',
      ...profile,
    });
  }
  
  return {
    totalRecords,
    totalFields: fields.size,
    fields,
    structure,
    depth: getDepth(data),
    size: JSON.stringify(data).length,
  };
}

export function getFieldFrequencies(profile: DataProfile): Array<{ field: string; frequency: Map<string, number> }> {
  return Array.from(profile.fields.entries())
    .map(([field, fieldProfile]) => ({
      field,
      frequency: fieldProfile.frequency,
    }))
    .filter(f => f.frequency.size > 0);
}

export function getTemporalFields(profile: DataProfile): Array<{ field: string; stats: NonNullable<FieldProfile['temporalStats']> }> {
  return Array.from(profile.fields.entries())
    .filter(([, fieldProfile]) => fieldProfile.temporalStats)
    .map(([field, fieldProfile]) => ({
      field,
      stats: fieldProfile.temporalStats!,
    }));
}

export function getFieldSizes(profile: DataProfile): Array<{ field: string; size: number }> {
  return Array.from(profile.fields.entries())
    .map(([field, fieldProfile]) => ({
      field,
      size: fieldProfile.count - fieldProfile.nullCount,
    }))
    .sort((a, b) => b.size - a.size);
}

export function getTreemapData(data: JsonValue): Array<{ name: string; size: number; value?: number }> {
  const result: Array<{ name: string; size: number; value?: number }> = [];
  
  function traverse(obj: unknown, path: string = 'root'): void {
    if (obj === null || obj === undefined) {
      return;
    }
    
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        result.push({
          name: path,
          size: obj.length,
          value: obj.length,
        });
        
        obj.slice(0, 10).forEach((item, index) => {
          traverse(item, `${path}[${index}]`);
        });
      } else {
        const entries = Object.entries(obj);
        result.push({
          name: path,
          size: entries.length,
          value: entries.length,
        });
        
        entries.slice(0, 10).forEach(([key, value]) => {
          traverse(value, path === 'root' ? key : `${path}.${key}`);
        });
      }
    } else {
      const strValue = String(obj);
      result.push({
        name: path,
        size: strValue.length,
        value: strValue.length,
      });
    }
  }
  
  traverse(data);
  return result.filter(item => item.size > 0);
}

export function getNullRates(profile: DataProfile): Array<{ field: string; nullRate: number }> {
  return Array.from(profile.fields.entries())
    .map(([field, fp]) => ({
      field,
      nullRate: fp.count === 0 ? 0 : fp.nullCount / fp.count,
    }))
    .sort((a, b) => b.nullRate - a.nullRate);
}

export function getNumericHistograms(profile: DataProfile, binCount: number = 10): NumericHistogram[] {
  const result: NumericHistogram[] = [];

  profile.fields.forEach((fp, field) => {
    if (fp.numericStats) {
      const values: number[] = [];
      fp.frequency.forEach((count, key) => {
        const v = Number(key);
        if (!Number.isNaN(v)) {
          for (let i = 0; i < count; i++) values.push(v);
        }
      });
      if (values.length === 0) return;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      const step = range / binCount;
      const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
        x0: min + i * step,
        x1: min + (i + 1) * step,
        count: 0,
      }));
      values.forEach(v => {
        let idx = Math.floor((v - min) / step);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        bins[idx].count += 1;
      });
      result.push({ field, bins });
    }
  });

  return result;
}
