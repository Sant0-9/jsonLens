import { JsonValue } from '@/store/json-store';
import { InferredSchema, InferredField } from './schema-inference';

export type DiagramType = 'class' | 'flowchart' | 'er';

function sanitizeMermaidText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/"/g, "'")
    .replace(/\n/g, ' ')
    .substring(0, 50);
}

function getFieldTypeName(field: InferredField): string {
  const types = Array.from(field.types);
  if (types.length === 1) {
    return types[0];
  }
  return types.join('|');
}

export function generateClassDiagram(schema: InferredSchema, name: string = 'Root'): string {
  const lines: string[] = ['classDiagram'];
  
  if (schema.type === 'object' && schema.fields) {
    lines.push(`  class ${name} {`);
    
    schema.fields.forEach((field, fieldName) => {
      const typeName = getFieldTypeName(field);
      const optional = field.optional ? '?' : '';
      const sanitizedName = sanitizeMermaidText(fieldName);
      lines.push(`    +${typeName} ${sanitizedName}${optional}`);
    });
    
    lines.push('  }');
    
    schema.fields.forEach((field, fieldName) => {
      if (field.types.has('object')) {
        const relatedClassName = sanitizeMermaidText(fieldName);
        lines.push(`  ${name} --> ${relatedClassName}`);
      } else if (field.types.has('array')) {
        const relatedClassName = `${sanitizeMermaidText(fieldName)}Item`;
        lines.push(`  ${name} --> "*" ${relatedClassName}`);
      }
    });
  } else if (schema.type === 'array' && schema.items) {
    if (schema.items.type === 'object' && schema.items.fields) {
      const itemName = `${name}Item`;
      lines.push(`  class ${itemName} {`);
      
      schema.items.fields.forEach((field, fieldName) => {
        const typeName = getFieldTypeName(field);
        const optional = field.optional ? '?' : '';
        const sanitizedName = sanitizeMermaidText(fieldName);
        lines.push(`    +${typeName} ${sanitizedName}${optional}`);
      });
      
      lines.push('  }');
    }
  }
  
  return lines.join('\n');
}

export function generateFlowchart(data: JsonValue, maxDepth: number = 3): string {
  const lines: string[] = ['flowchart TD'];
  let nodeId = 0;
  
  function getNodeId(): string {
    return `node${nodeId++}`;
  }
  
  function addNode(value: JsonValue, parentId: string | null, key: string, depth: number): string {
    if (depth > maxDepth) {
      return parentId || getNodeId();
    }
    
    const currentId = getNodeId();
    const sanitizedKey = sanitizeMermaidText(key);
    
    if (value === null) {
      lines.push(`  ${currentId}["${sanitizedKey}: null"]`);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`  ${currentId}["${sanitizedKey}: ${value}"]`);
    } else if (typeof value === 'string') {
      const sanitizedValue = sanitizeMermaidText(value);
      lines.push(`  ${currentId}["${sanitizedKey}: '${sanitizedValue}'"]`);
    } else if (Array.isArray(value)) {
      lines.push(`  ${currentId}{"${sanitizedKey} [${value.length}]"}`);
      
      if (depth < maxDepth && value.length > 0) {
        const samples = value.slice(0, 3);
        samples.forEach((item, index) => {
          const childId = addNode(item, currentId, `[${index}]`, depth + 1);
          lines.push(`  ${currentId} --> ${childId}`);
        });
        
        if (value.length > 3) {
          const moreId = getNodeId();
          lines.push(`  ${moreId}["... ${value.length - 3} more"]`);
          lines.push(`  ${currentId} --> ${moreId}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`  ${currentId}("${sanitizedKey}")`);
      
      if (depth < maxDepth) {
        const entries = Object.entries(value).slice(0, 5);
        entries.forEach(([k, v]) => {
          const childId = addNode(v, currentId, k, depth + 1);
          lines.push(`  ${currentId} --> ${childId}`);
        });
        
        if (Object.keys(value).length > 5) {
          const moreId = getNodeId();
          lines.push(`  ${moreId}["... ${Object.keys(value).length - 5} more"]`);
          lines.push(`  ${currentId} --> ${moreId}`);
        }
      }
    }
    
    if (parentId && depth === 0) {
      lines.push(`  ${parentId} --> ${currentId}`);
    }
    
    return currentId;
  }
  
  addNode(data, null, 'root', 0);
  
  return lines.join('\n');
}

export function generateERDiagram(schema: InferredSchema, name: string = 'Root'): string {
  const lines: string[] = ['erDiagram'];
  const entities: Set<string> = new Set();
  const relationships: string[] = [];
  
  if (schema.type === 'object' && schema.fields) {
    entities.add(name);
    
    const entityFields: string[] = [];
    schema.fields.forEach((field, fieldName) => {
      const typeName = getFieldTypeName(field);
      const sanitizedName = sanitizeMermaidText(fieldName);
      
      if (field.types.has('object')) {
        const relatedEntity = sanitizeMermaidText(fieldName);
        entities.add(relatedEntity);
        relationships.push(`  ${name} ||--o{ ${relatedEntity} : has`);
      } else if (field.types.has('array')) {
        const relatedEntity = `${sanitizeMermaidText(fieldName)}Item`;
        entities.add(relatedEntity);
        relationships.push(`  ${name} ||--o{ ${relatedEntity} : contains`);
      } else {
        entityFields.push(`    ${typeName} ${sanitizedName}`);
      }
    });
    
    if (entityFields.length > 0) {
      lines.push(`  ${name} {`);
      lines.push(...entityFields);
      lines.push('  }');
    }
  }
  
  lines.push(...relationships);
  
  return lines.join('\n');
}

export function getDiagramFromSchema(
  schema: InferredSchema,
  type: DiagramType,
  name: string = 'Root'
): string {
  switch (type) {
    case 'class':
      return generateClassDiagram(schema, name);
    case 'er':
      return generateERDiagram(schema, name);
    default:
      return generateClassDiagram(schema, name);
  }
}

export function getDiagramFromData(
  data: JsonValue,
  type: DiagramType
): string {
  if (type === 'flowchart') {
    return generateFlowchart(data);
  }
  return '';
}
