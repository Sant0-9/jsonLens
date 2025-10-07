import { JsonValue } from '@/store/json-store';

export interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'collection';
  data: JsonValue;
  group?: string;
  size: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'reference' | 'contains' | 'related';
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function detectIdField(obj: Record<string, JsonValue>): string | null {
  const idPatterns = ['id', '_id', 'uuid', 'key', 'identifier'];
  
  for (const pattern of idPatterns) {
    if (pattern in obj) return pattern;
  }
  
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase().endsWith('id') || key.toLowerCase().endsWith('_id')) {
      return key;
    }
  }
  
  return null;
}

function detectEntityType(obj: Record<string, JsonValue>): string | null {
  if ('type' in obj && typeof obj.type === 'string') {
    return obj.type;
  }
  
  if ('__type' in obj && typeof obj.__type === 'string') {
    return obj.__type;
  }
  
  if ('_type' in obj && typeof obj._type === 'string') {
    return obj._type;
  }
  
  return null;
}

function detectReferences(obj: Record<string, JsonValue>): Map<string, JsonValue> {
  const refs = new Map<string, JsonValue>();
  
  Object.entries(obj).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.endsWith('id') || lowerKey.endsWith('_id') || lowerKey.endsWith('ref')) {
      if (typeof value === 'string' || typeof value === 'number') {
        refs.set(key, value);
      }
    }
    
    if (lowerKey.includes('foreign') || lowerKey.includes('parent')) {
      refs.set(key, value);
    }
  });
  
  return refs;
}

function inferEntityName(key: string, obj: Record<string, JsonValue>): string {
  const entityType = detectEntityType(obj);
  if (entityType) return entityType;
  
  const singularKey = key.replace(/s$/, '').replace(/ies$/, 'y');
  return singularKey.charAt(0).toUpperCase() + singularKey.slice(1);
}

export function inferGraphFromData(data: JsonValue, maxNodes: number = 100): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();
  let nodeCount = 0;
  
  function createNodeId(prefix: string, id: JsonValue): string {
    return `${prefix}:${String(id)}`;
  }
  
  function addNode(id: string, label: string, type: 'entity' | 'collection', data: JsonValue, group?: string): void {
    if (nodeCount >= maxNodes) return;
    
    if (!nodeMap.has(id)) {
      const node: GraphNode = {
        id,
        label,
        type,
        data,
        group,
        size: type === 'collection' ? 20 : 10,
      };
      nodes.push(node);
      nodeMap.set(id, node);
      nodeCount++;
    }
  }
  
  function addEdge(source: string, target: string, type: GraphEdge['type'], label?: string): void {
    if (!nodeMap.has(source) || !nodeMap.has(target)) return;
    
    edges.push({ source, target, type, label });
  }
  
  function processObject(obj: Record<string, JsonValue>, parentId: string | null, depth: number): void {
    if (nodeCount >= maxNodes || depth > 3) return;
    
    const idField = detectIdField(obj);
    const entityType = detectEntityType(obj);
    const objId = idField ? String(obj[idField]) : `obj_${nodeCount}`;
    const nodeId = createNodeId(entityType || 'Object', objId);
    
    const label = obj.name 
      ? String(obj.name)
      : obj.title 
      ? String(obj.title)
      : entityType 
      ? `${entityType} ${objId}`
      : objId;
    
    addNode(nodeId, label, 'entity', obj, entityType || undefined);
    
    if (parentId) {
      addEdge(parentId, nodeId, 'contains');
    }
    
    const refs = detectReferences(obj);
    refs.forEach((refValue, refKey) => {
      const refEntity = refKey.replace(/Id$|_id$|Ref$/i, '');
      const refNodeId = createNodeId(refEntity, refValue);
      
      if (nodeMap.has(refNodeId)) {
        addEdge(nodeId, refNodeId, 'reference', refKey);
      }
    });
    
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const collectionId = `${nodeId}:${key}`;
        const entityName = inferEntityName(key, value[0] as Record<string, JsonValue>);
        
        addNode(collectionId, key, 'collection', value, entityName);
        addEdge(nodeId, collectionId, 'contains', key);
        
        value.slice(0, 5).forEach((item) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            processObject(item as Record<string, JsonValue>, collectionId, depth + 1);
          }
        });
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        processObject(value as Record<string, JsonValue>, nodeId, depth + 1);
      }
    });
  }
  
  function processArray(arr: JsonValue[], parentId: string | null): void {
    if (nodeCount >= maxNodes) return;
    
    arr.slice(0, 20).forEach((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        processObject(item as Record<string, JsonValue>, parentId, 0);
      }
    });
  }
  
  if (Array.isArray(data)) {
    const rootId = 'root:collection';
    addNode(rootId, 'Root Collection', 'collection', data);
    processArray(data, rootId);
  } else if (typeof data === 'object' && data !== null) {
    processObject(data as Record<string, JsonValue>, null, 0);
  }
  
  return { nodes, edges };
}

export function clusterNodesByGroup(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const clusters = new Map<string, GraphNode[]>();
  
  nodes.forEach(node => {
    const group = node.group || 'default';
    if (!clusters.has(group)) {
      clusters.set(group, []);
    }
    clusters.get(group)!.push(node);
  });
  
  return clusters;
}

export function exportGraphAsJson(graph: GraphData): string {
  return JSON.stringify(graph, null, 2);
}
