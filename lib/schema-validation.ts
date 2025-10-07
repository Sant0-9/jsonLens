import { JsonValue } from '@/store/json-store';
import { InferredSchema, JsonSchemaType } from './schema-inference';

export interface ValidationError {
  path: string;
  message: string;
  expected: string;
  actual: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

function getValueType(value: JsonValue): JsonSchemaType {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return 'array';
  return 'object';
}

function validateValue(
  value: JsonValue,
  schema: InferredSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const actualType = getValueType(value);
  
  if (value === null) {
    if (!schema.nullable) {
      errors.push({
        path,
        message: 'Value cannot be null',
        expected: schema.type,
        actual: 'null',
        severity: 'error',
      });
    }
    return;
  }
  
  if (actualType !== schema.type) {
    errors.push({
      path,
      message: `Type mismatch`,
      expected: schema.type,
      actual: actualType,
      severity: 'error',
    });
    return;
  }
  
  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String too short (min: ${schema.minLength})`,
        expected: `length >= ${schema.minLength}`,
        actual: `length = ${value.length}`,
        severity: 'error',
      });
    }
    
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String too long (max: ${schema.maxLength})`,
        expected: `length <= ${schema.maxLength}`,
        actual: `length = ${value.length}`,
        severity: 'error',
      });
    }
    
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern`,
          expected: schema.pattern,
          actual: value,
          severity: 'error',
        });
      }
    }
    
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value not in enum`,
        expected: schema.enum.join(', '),
        actual: value,
        severity: 'error',
      });
    }
  }
  
  if ((schema.type === 'number' || schema.type === 'integer') && typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Number too small (min: ${schema.minimum})`,
        expected: `>= ${schema.minimum}`,
        actual: String(value),
        severity: 'error',
      });
    }
    
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path,
        message: `Number too large (max: ${schema.maximum})`,
        expected: `<= ${schema.maximum}`,
        actual: String(value),
        severity: 'error',
      });
    }
    
    if (schema.type === 'integer' && !Number.isInteger(value)) {
      errors.push({
        path,
        message: `Expected integer, got float`,
        expected: 'integer',
        actual: String(value),
        severity: 'error',
      });
    }
  }
  
  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.items) {
      value.forEach((item, index) => {
        validateValue(item, schema.items!, `${path}[${index}]`, errors, warnings);
      });
    }
  }
  
  if (schema.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, JsonValue>;
    
    if (schema.fields) {
      schema.fields.forEach((fieldSchema, fieldName) => {
        const fieldValue = obj[fieldName];
        const fieldPath = path ? `${path}.${fieldName}` : fieldName;
        
        if (fieldValue === undefined) {
          if (!fieldSchema.optional) {
            errors.push({
              path: fieldPath,
              message: 'Required field is missing',
              expected: Array.from(fieldSchema.types).join(' | '),
              actual: 'undefined',
              severity: 'error',
            });
          }
        } else {
          const fieldType = getValueType(fieldValue);
          
          if (!fieldSchema.types.has(fieldType)) {
            if (fieldValue === null && fieldSchema.nullable) {
              // Null is allowed
            } else {
              errors.push({
                path: fieldPath,
                message: 'Field type mismatch',
                expected: Array.from(fieldSchema.types).join(' | '),
                actual: fieldType,
                severity: 'error',
              });
            }
          } else {
            if (fieldType === 'string' && typeof fieldValue === 'string') {
              if (fieldSchema.minLength !== undefined && fieldValue.length < fieldSchema.minLength) {
                warnings.push({
                  path: fieldPath,
                  message: `String shorter than typical (min: ${fieldSchema.minLength})`,
                  expected: `length >= ${fieldSchema.minLength}`,
                  actual: `length = ${fieldValue.length}`,
                  severity: 'warning',
                });
              }
              
              if (fieldSchema.maxLength !== undefined && fieldValue.length > fieldSchema.maxLength) {
                warnings.push({
                  path: fieldPath,
                  message: `String longer than typical (max: ${fieldSchema.maxLength})`,
                  expected: `length <= ${fieldSchema.maxLength}`,
                  actual: `length = ${fieldValue.length}`,
                  severity: 'warning',
                });
              }
            }
            
            if ((fieldType === 'number' || fieldType === 'integer') && typeof fieldValue === 'number') {
              if (fieldSchema.minimum !== undefined && fieldValue < fieldSchema.minimum) {
                warnings.push({
                  path: fieldPath,
                  message: `Number smaller than typical (min: ${fieldSchema.minimum})`,
                  expected: `>= ${fieldSchema.minimum}`,
                  actual: String(fieldValue),
                  severity: 'warning',
                });
              }
              
              if (fieldSchema.maximum !== undefined && fieldValue > fieldSchema.maximum) {
                warnings.push({
                  path: fieldPath,
                  message: `Number larger than typical (max: ${fieldSchema.maximum})`,
                  expected: `<= ${fieldSchema.maximum}`,
                  actual: String(fieldValue),
                  severity: 'warning',
                });
              }
            }
          }
        }
      });
      
      Object.keys(obj).forEach(key => {
        if (!schema.fields!.has(key)) {
          warnings.push({
            path: path ? `${path}.${key}` : key,
            message: 'Unexpected field not in schema',
            expected: 'field not present',
            actual: 'field exists',
            severity: 'warning',
          });
        }
      });
    }
  }
}

export function validateAgainstSchema(
  data: JsonValue,
  schema: InferredSchema
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  validateValue(data, schema, '$', errors, warnings);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getValidationSummary(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return 'All data is valid';
  }
  
  if (result.valid && result.warnings.length > 0) {
    return `Valid with ${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`;
  }
  
  return `${result.errors.length} error${result.errors.length > 1 ? 's' : ''}, ${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`;
}
