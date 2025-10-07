import { JsonValue } from '@/store/json-store';

export type JsonSchemaType = 
  | 'string' 
  | 'number' 
  | 'integer' 
  | 'boolean' 
  | 'null' 
  | 'array' 
  | 'object';

export interface InferredField {
  name: string;
  types: Set<JsonSchemaType>;
  optional: boolean;
  nullable: boolean;
  format?: string;
  pattern?: string;
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  examples: unknown[];
  count: number;
  nullCount: number;
}

export interface InferredSchema {
  type: JsonSchemaType;
  fields?: Map<string, InferredField>;
  items?: InferredSchema;
  nullable: boolean;
  optional: boolean;
  enum?: unknown[];
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  examples: unknown[];
}

function detectDateFormat(value: string): string | undefined {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  const timestampRegex = /^\d{10,13}$/;
  
  if (isoDateTimeRegex.test(value)) return 'date-time';
  if (isoDateRegex.test(value)) return 'date';
  if (timestampRegex.test(value)) return 'timestamp';
  
  const date = new Date(value);
  if (!isNaN(date.getTime())) return 'date-time';
  
  return undefined;
}

function detectStringFormat(value: string): string | undefined {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const urlRegex = /^https?:\/\/.+/;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const hexColorRegex = /^#[0-9a-f]{6}$/i;
  
  if (emailRegex.test(value)) return 'email';
  if (urlRegex.test(value)) return 'uri';
  if (uuidRegex.test(value)) return 'uuid';
  if (ipv4Regex.test(value)) return 'ipv4';
  if (hexColorRegex.test(value)) return 'color';
  
  const dateFormat = detectDateFormat(value);
  if (dateFormat) return dateFormat;
  
  return undefined;
}

function getJsonSchemaType(value: JsonValue): JsonSchemaType {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return 'array';
  return 'object';
}

function inferArraySchema(arr: JsonValue[], maxSamples: number = 100): InferredSchema {
  const samples = arr.slice(0, maxSamples);
  const typeSet = new Set<JsonSchemaType>();
  let itemSchema: InferredSchema | null = null;
  
  if (samples.length === 0) {
    return {
      type: 'array',
      nullable: false,
      optional: false,
      examples: [],
    };
  }
  
  const firstType = getJsonSchemaType(samples[0]);
  const isHomogeneous = samples.every(item => getJsonSchemaType(item) === firstType);
  
  if (isHomogeneous && firstType === 'object') {
    const combinedFields = new Map<string, InferredField>();
    
    samples.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.entries(item).forEach(([key, value]) => {
          if (!combinedFields.has(key)) {
            combinedFields.set(key, {
              name: key,
              types: new Set(),
              optional: false,
              nullable: false,
              examples: [],
              count: 0,
              nullCount: 0,
            });
          }
          
          const field = combinedFields.get(key)!;
          const type = getJsonSchemaType(value);
          field.types.add(type);
          field.count++;
          
          if (value === null) {
            field.nullable = true;
            field.nullCount++;
          }
          
          if (field.examples.length < 3 && value !== null) {
            field.examples.push(value);
          }
          
          if (typeof value === 'string') {
            const format = detectStringFormat(value);
            if (format && !field.format) field.format = format;
            
            const len = value.length;
            field.minLength = field.minLength !== undefined ? Math.min(field.minLength, len) : len;
            field.maxLength = field.maxLength !== undefined ? Math.max(field.maxLength, len) : len;
          }
          
          if (typeof value === 'number') {
            field.minimum = field.minimum !== undefined ? Math.min(field.minimum, value) : value;
            field.maximum = field.maximum !== undefined ? Math.max(field.maximum, value) : value;
          }
        });
      }
    });
    
    combinedFields.forEach(field => {
      field.optional = field.count < samples.length;
      
      if (field.examples.length >= 2 && field.examples.length <= 10) {
        const uniqueValues = [...new Set(field.examples)];
        if (uniqueValues.length === field.examples.length && uniqueValues.length <= 10) {
          field.enum = uniqueValues;
        }
      }
    });
    
    itemSchema = {
      type: 'object',
      fields: combinedFields,
      nullable: false,
      optional: false,
      examples: samples.slice(0, 2),
    };
  } else {
    samples.forEach(item => {
      typeSet.add(getJsonSchemaType(item));
    });
    
    itemSchema = {
      type: typeSet.size === 1 ? Array.from(typeSet)[0] : 'object',
      nullable: typeSet.has('null'),
      optional: false,
      examples: samples.slice(0, 3),
    };
  }
  
  return {
    type: 'array',
    items: itemSchema,
    nullable: false,
    optional: false,
    examples: [arr.slice(0, 2)],
  };
}

function inferObjectSchema(obj: Record<string, JsonValue>): InferredSchema {
  const fields = new Map<string, InferredField>();
  
  Object.entries(obj).forEach(([key, value]) => {
    const type = getJsonSchemaType(value);
    const field: InferredField = {
      name: key,
      types: new Set([type]),
      optional: false,
      nullable: value === null,
      examples: value !== null ? [value] : [],
      count: 1,
      nullCount: value === null ? 1 : 0,
    };
    
    if (typeof value === 'string') {
      const format = detectStringFormat(value);
      if (format) field.format = format;
      field.minLength = value.length;
      field.maxLength = value.length;
    }
    
    if (typeof value === 'number') {
      field.minimum = value;
      field.maximum = value;
    }
    
    if (Array.isArray(value)) {
      // Don't add arrays to examples as they can be large
      field.examples = [];
    }
    
    fields.set(key, field);
  });
  
  return {
    type: 'object',
    fields,
    nullable: false,
    optional: false,
    examples: [obj],
  };
}

export function inferSchema(data: JsonValue, maxSamples: number = 100): InferredSchema {
  const type = getJsonSchemaType(data);
  
  if (type === 'null') {
    return {
      type: 'null',
      nullable: true,
      optional: false,
      examples: [null],
    };
  }
  
  if (type === 'boolean') {
    return {
      type: 'boolean',
      nullable: false,
      optional: false,
      examples: [data],
    };
  }
  
  if (type === 'number' || type === 'integer') {
    return {
      type,
      nullable: false,
      optional: false,
      minimum: data as number,
      maximum: data as number,
      examples: [data],
    };
  }
  
  if (type === 'string') {
    const str = data as string;
    const format = detectStringFormat(str);
    return {
      type: 'string',
      format,
      nullable: false,
      optional: false,
      minLength: str.length,
      maxLength: str.length,
      examples: [data],
    };
  }
  
  if (type === 'array') {
    return inferArraySchema(data as JsonValue[], maxSamples);
  }
  
  if (type === 'object') {
    return inferObjectSchema(data as Record<string, JsonValue>);
  }
  
  return {
    type: 'object',
    nullable: false,
    optional: false,
    examples: [],
  };
}

export function schemaToJsonSchema(schema: InferredSchema, name: string = 'Root'): Record<string, unknown> {
  const jsonSchema: Record<string, unknown> = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: name,
  };
  
  if (schema.type === 'object' && schema.fields) {
    jsonSchema.type = 'object';
    jsonSchema.properties = {};
    const required: string[] = [];
    
    schema.fields.forEach((field, key) => {
      const prop: Record<string, unknown> = {};
      
      if (field.types.size === 1) {
        const type = Array.from(field.types)[0];
        prop.type = field.nullable ? [type, 'null'] : type;
      } else {
        prop.type = Array.from(field.types);
      }
      
      if (field.format) prop.format = field.format;
      if (field.pattern) prop.pattern = field.pattern;
      if (field.enum) prop.enum = field.enum;
      if (field.minLength !== undefined) prop.minLength = field.minLength;
      if (field.maxLength !== undefined) prop.maxLength = field.maxLength;
      if (field.minimum !== undefined) prop.minimum = field.minimum;
      if (field.maximum !== undefined) prop.maximum = field.maximum;
      if (field.examples.length > 0) prop.examples = field.examples;
      
      (jsonSchema.properties as Record<string, unknown>)[key] = prop;
      
      if (!field.optional) {
        required.push(key);
      }
    });
    
    if (required.length > 0) {
      jsonSchema.required = required;
    }
  } else if (schema.type === 'array' && schema.items) {
    jsonSchema.type = 'array';
    jsonSchema.items = schemaToJsonSchema(schema.items, `${name}Item`);
  } else {
    jsonSchema.type = schema.type;
    if (schema.format) jsonSchema.format = schema.format;
    if (schema.pattern) jsonSchema.pattern = schema.pattern;
    if (schema.enum) jsonSchema.enum = schema.enum;
    if (schema.minLength !== undefined) jsonSchema.minLength = schema.minLength;
    if (schema.maxLength !== undefined) jsonSchema.maxLength = schema.maxLength;
    if (schema.minimum !== undefined) jsonSchema.minimum = schema.minimum;
    if (schema.maximum !== undefined) jsonSchema.maximum = schema.maximum;
  }
  
  return jsonSchema;
}

export function schemaToTypeScript(schema: InferredSchema, name: string = 'Root', indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  
  if (schema.type === 'object' && schema.fields) {
    const fields: string[] = [];
    
    schema.fields.forEach((field, key) => {
      const types: string[] = [];
      field.types.forEach(type => {
        if (type === 'string') types.push('string');
        else if (type === 'number' || type === 'integer') types.push('number');
        else if (type === 'boolean') types.push('boolean');
        else if (type === 'null') types.push('null');
        else if (type === 'array') types.push('unknown[]');
        else if (type === 'object') types.push('object');
      });
      
      if (field.nullable && !types.includes('null')) {
        types.push('null');
      }
      
      const optional = field.optional ? '?' : '';
      const typeUnion = types.join(' | ');
      fields.push(`${indentStr}  ${key}${optional}: ${typeUnion};`);
    });
    
    return `${indentStr}export interface ${name} {\n${fields.join('\n')}\n${indentStr}}`;
  } else if (schema.type === 'array' && schema.items) {
    const itemType = schemaToTypeScript(schema.items, `${name}Item`, indent);
    return `${indentStr}export type ${name} = Array<${itemType}>;`;
  } else {
    let type = 'unknown';
    if (schema.type === 'string') type = 'string';
    else if (schema.type === 'number' || schema.type === 'integer') type = 'number';
    else if (schema.type === 'boolean') type = 'boolean';
    else if (schema.type === 'null') type = 'null';
    
    return type;
  }
}

export function schemaToZod(schema: InferredSchema, name: string = 'schema'): string {
  if (schema.type === 'object' && schema.fields) {
    const fields: string[] = [];
    
    schema.fields.forEach((field, key) => {
      let zodType = 'z.unknown()';
      
      if (field.types.size === 1) {
        const type = Array.from(field.types)[0];
        if (type === 'string') zodType = 'z.string()';
        else if (type === 'number') zodType = 'z.number()';
        else if (type === 'integer') zodType = 'z.number().int()';
        else if (type === 'boolean') zodType = 'z.boolean()';
        else if (type === 'null') zodType = 'z.null()';
        else if (type === 'array') zodType = 'z.array(z.unknown())';
        else if (type === 'object') zodType = 'z.object({})';
        
        if (type === 'string') {
          if (field.format === 'email') zodType = 'z.string().email()';
          else if (field.format === 'uri') zodType = 'z.string().url()';
          else if (field.format === 'uuid') zodType = 'z.string().uuid()';
          else if (field.minLength !== undefined && field.maxLength !== undefined) {
            zodType = `z.string().min(${field.minLength}).max(${field.maxLength})`;
          }
        }
        
        if (type === 'number' || type === 'integer') {
          const constraints: string[] = [];
          if (field.minimum !== undefined) constraints.push(`min(${field.minimum})`);
          if (field.maximum !== undefined) constraints.push(`max(${field.maximum})`);
          if (constraints.length > 0) {
            zodType = `${zodType}.${constraints.join('.')}`;
          }
        }
      } else {
        const types = Array.from(field.types).map(type => {
          if (type === 'string') return 'z.string()';
          if (type === 'number' || type === 'integer') return 'z.number()';
          if (type === 'boolean') return 'z.boolean()';
          if (type === 'null') return 'z.null()';
          return 'z.unknown()';
        });
        zodType = `z.union([${types.join(', ')}])`;
      }
      
      if (field.nullable) {
        zodType = `${zodType}.nullable()`;
      }
      
      if (field.optional) {
        zodType = `${zodType}.optional()`;
      }
      
      fields.push(`  ${key}: ${zodType}`);
    });
    
    return `export const ${name} = z.object({\n${fields.join(',\n')}\n});`;
  } else if (schema.type === 'array' && schema.items) {
    return `export const ${name} = z.array(z.unknown());`;
  } else {
    let zodType = 'z.unknown()';
    if (schema.type === 'string') zodType = 'z.string()';
    else if (schema.type === 'number') zodType = 'z.number()';
    else if (schema.type === 'integer') zodType = 'z.number().int()';
    else if (schema.type === 'boolean') zodType = 'z.boolean()';
    else if (schema.type === 'null') zodType = 'z.null()';
    
    return `export const ${name} = ${zodType};`;
  }
}
