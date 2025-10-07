import { JsonValue } from '@/store/json-store';

export interface MockDataOptions {
  count: number;
  includeNulls: boolean;
  includeEmptyArrays: boolean;
  includeEmptyObjects: boolean;
  stringLength: { min: number; max: number };
  numberRange: { min: number; max: number };
  arrayLength: { min: number; max: number };
}

const defaultOptions: MockDataOptions = {
  count: 10,
  includeNulls: false,
  includeEmptyArrays: false,
  includeEmptyObjects: false,
  stringLength: { min: 3, max: 20 },
  numberRange: { min: 0, max: 100 },
  arrayLength: { min: 2, max: 8 },
};

const sampleNames = [
  'John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma',
  'Alex', 'Maria', 'Tom', 'Anna', 'Sam', 'Kate', 'Ben', 'Lucy'
];

const sampleEmails = [
  'john@example.com', 'jane@test.com', 'mike@demo.org', 'sarah@sample.net',
  'david@example.com', 'lisa@test.org', 'chris@demo.com', 'emma@sample.net'
];

const sampleCities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville'
];

const sampleCompanies = [
  'Acme Corp', 'Tech Solutions', 'Global Systems', 'Innovation Labs',
  'Data Dynamics', 'Cloud Services', 'Digital Works', 'Future Tech'
];

const sampleProducts = [
  'Laptop', 'Phone', 'Tablet', 'Headphones', 'Monitor', 'Keyboard',
  'Mouse', 'Camera', 'Speaker', 'Charger', 'Case', 'Stand'
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomBoolean(): boolean {
  return Math.random() < 0.5;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function generateMockValue(type: string, options: MockDataOptions): JsonValue {
  if (options.includeNulls && Math.random() < 0.1) {
    return null;
  }

  switch (type.toLowerCase()) {
    case 'string':
      if (Math.random() < 0.3) {
        return randomChoice(sampleNames);
      }
      if (Math.random() < 0.2) {
        return randomChoice(sampleEmails);
      }
      if (Math.random() < 0.2) {
        return randomChoice(sampleCities);
      }
      if (Math.random() < 0.1) {
        return randomChoice(sampleCompanies);
      }
      if (Math.random() < 0.1) {
        return randomChoice(sampleProducts);
      }
      return randomString(randomInt(options.stringLength.min, options.stringLength.max));
    
    case 'number':
    case 'integer':
      return type === 'integer' 
        ? randomInt(options.numberRange.min, options.numberRange.max)
        : randomFloat(options.numberRange.min, options.numberRange.max);
    
    case 'boolean':
      return randomBoolean();
    
    case 'date':
    case 'datetime':
      const start = new Date('2020-01-01');
      const end = new Date();
      return randomDate(start, end);
    
    case 'array':
      if (options.includeEmptyArrays && Math.random() < 0.2) {
        return [];
      }
      const arrayLength = randomInt(options.arrayLength.min, options.arrayLength.max);
      return Array.from({ length: arrayLength }, () => 
        generateMockValue('string', options)
      );
    
    case 'object':
      if (options.includeEmptyObjects && Math.random() < 0.2) {
        return {};
      }
      return {
        id: randomInt(1, 1000),
        name: randomChoice(sampleNames),
        email: randomChoice(sampleEmails),
        active: randomBoolean(),
        score: randomFloat(0, 100),
      };
    
    default:
      return randomString(randomInt(options.stringLength.min, options.stringLength.max));
  }
}

function inferFieldType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'string') {
    // Try to detect common patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    if (/@/.test(value)) return 'email';
    if (/^[a-f0-9-]{36}$/i.test(value)) return 'uuid';
    return 'string';
  }
  return 'string';
}

export function generateMockDataFromSchema(schema: any, options: Partial<MockDataOptions> = {}): JsonValue[] {
  const opts = { ...defaultOptions, ...options };
  const result: JsonValue[] = [];
  
  if (!schema || !schema.properties) {
    // Generate simple array of objects if no schema
    for (let i = 0; i < opts.count; i++) {
      result.push({
        id: i + 1,
        name: randomChoice(sampleNames),
        email: randomChoice(sampleEmails),
        age: randomInt(18, 65),
        active: randomBoolean(),
        score: randomFloat(0, 100),
        tags: Array.from({ length: randomInt(1, 5) }, () => randomString(6)),
        created_at: randomDate(new Date('2020-01-01'), new Date()),
      });
    }
    return result;
  }
  
  for (let i = 0; i < opts.count; i++) {
    const item: Record<string, unknown> = {};
    
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      const fieldType = prop.type || 'string';
      item[key] = generateMockValue(fieldType, opts);
    });
    
    result.push(item);
  }
  
  return result;
}

export function generateMockDataFromSample(sample: JsonValue, options: Partial<MockDataOptions> = {}): JsonValue[] {
  const opts = { ...defaultOptions, ...options };
  const result: JsonValue[] = [];
  
  if (Array.isArray(sample)) {
    // Generate array of similar objects
    const sampleItem = sample[0];
    if (typeof sampleItem === 'object' && sampleItem !== null) {
      const schema = inferSchemaFromSample(sampleItem);
      
      for (let i = 0; i < opts.count; i++) {
        const item: Record<string, unknown> = {};
        
        Object.entries(schema).forEach(([key, type]) => {
          item[key] = generateMockValue(type, opts);
        });
        
        result.push(item);
      }
    } else {
      // Generate array of simple values
      for (let i = 0; i < opts.count; i++) {
        result.push(generateMockValue(inferFieldType(sampleItem), opts));
      }
    }
  } else if (typeof sample === 'object' && sample !== null) {
    // Generate array of similar objects
    const schema = inferSchemaFromSample(sample);
    
    for (let i = 0; i < opts.count; i++) {
      const item: Record<string, unknown> = {};
      
      Object.entries(schema).forEach(([key, type]) => {
        item[key] = generateMockValue(type, opts);
      });
      
      result.push(item);
    }
  } else {
    // Generate array of simple values
    for (let i = 0; i < opts.count; i++) {
      result.push(generateMockValue(inferFieldType(sample), opts));
    }
  }
  
  return result;
}

function inferSchemaFromSample(sample: any): Record<string, string> {
  const schema: Record<string, string> = {};
  
  if (typeof sample === 'object' && sample !== null && !Array.isArray(sample)) {
    Object.entries(sample).forEach(([key, value]) => {
      schema[key] = inferFieldType(value);
    });
  }
  
  return schema;
}

export function downloadMockData(data: JsonValue[], filename: string = 'mock-data'): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}