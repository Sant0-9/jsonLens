/**
 * Gap Detection for Knowledge Graph
 * Identifies disconnected nodes and suggests potential connections
 */

import type { GraphData, GraphNode } from '@/store/graph-store'

export interface GapSuggestion {
  type: 'orphan' | 'weak_connection' | 'missing_link' | 'isolated_cluster'
  severity: 'high' | 'medium' | 'low'
  nodes: GraphNode[]
  message: string
  suggestion: string
}

export interface ClusterInfo {
  id: number
  nodes: GraphNode[]
  size: number
  types: Record<GraphNode['type'], number>
}

/**
 * Find all disconnected (orphan) nodes that have no connections
 */
export function findOrphanNodes(data: GraphData): GraphNode[] {
  const connectedNodeIds = new Set<string>()

  for (const link of data.links) {
    connectedNodeIds.add(link.source as string)
    connectedNodeIds.add(link.target as string)
  }

  return data.nodes.filter(node => !connectedNodeIds.has(node.id))
}

/**
 * Find nodes with weak connections (only 1 connection)
 */
export function findWeaklyConnectedNodes(data: GraphData): GraphNode[] {
  const connectionCount = new Map<string, number>()

  for (const node of data.nodes) {
    connectionCount.set(node.id, 0)
  }

  for (const link of data.links) {
    const sourceId = link.source as string
    const targetId = link.target as string
    connectionCount.set(sourceId, (connectionCount.get(sourceId) || 0) + 1)
    connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1)
  }

  return data.nodes.filter(node => {
    const count = connectionCount.get(node.id) || 0
    // Consider nodes with only 1 connection as weakly connected
    // Exclude tags since they naturally have few connections
    return count === 1 && node.type !== 'tag'
  })
}

/**
 * Find isolated clusters using Union-Find algorithm
 */
export function findClusters(data: GraphData): ClusterInfo[] {
  if (data.nodes.length === 0) return []

  // Initialize Union-Find
  const parent = new Map<string, string>()
  const rank = new Map<string, number>()

  for (const node of data.nodes) {
    parent.set(node.id, node.id)
    rank.set(node.id, 0)
  }

  // Find with path compression
  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!))
    }
    return parent.get(x)!
  }

  // Union by rank
  function union(x: string, y: string): void {
    const rootX = find(x)
    const rootY = find(y)

    if (rootX !== rootY) {
      const rankX = rank.get(rootX) || 0
      const rankY = rank.get(rootY) || 0

      if (rankX < rankY) {
        parent.set(rootX, rootY)
      } else if (rankX > rankY) {
        parent.set(rootY, rootX)
      } else {
        parent.set(rootY, rootX)
        rank.set(rootX, rankX + 1)
      }
    }
  }

  // Union all connected nodes
  for (const link of data.links) {
    union(link.source as string, link.target as string)
  }

  // Group nodes by their root
  const clusters = new Map<string, GraphNode[]>()
  for (const node of data.nodes) {
    const root = find(node.id)
    if (!clusters.has(root)) {
      clusters.set(root, [])
    }
    clusters.get(root)!.push(node)
  }

  // Convert to ClusterInfo array
  let clusterId = 0
  const result: ClusterInfo[] = []

  for (const nodes of clusters.values()) {
    const types: Record<GraphNode['type'], number> = {
      paper: 0,
      note: 0,
      question: 0,
      experiment: 0,
      tag: 0,
    }

    for (const node of nodes) {
      types[node.type]++
    }

    result.push({
      id: clusterId++,
      nodes,
      size: nodes.length,
      types,
    })
  }

  // Sort by size descending
  return result.sort((a, b) => b.size - a.size)
}

/**
 * Suggest potential connections between nodes based on shared tags or similar content
 */
export function suggestConnections(
  data: GraphData,
  maxSuggestions: number = 10
): Array<{ source: GraphNode; target: GraphNode; reason: string }> {
  const suggestions: Array<{ source: GraphNode; target: GraphNode; reason: string; score: number }> = []
  const existingLinks = new Set<string>()

  // Build set of existing links
  for (const link of data.links) {
    existingLinks.add(`${link.source}-${link.target}`)
    existingLinks.add(`${link.target}-${link.source}`)
  }

  // Get tag connections for each node
  const nodesByTag = new Map<string, GraphNode[]>()
  for (const node of data.nodes) {
    if (node.type === 'tag') continue

    // Find tags connected to this node
    for (const link of data.links) {
      if (link.type === 'tagged') {
        const tagId = link.target as string
        if (link.source === node.id) {
          if (!nodesByTag.has(tagId)) {
            nodesByTag.set(tagId, [])
          }
          nodesByTag.get(tagId)!.push(node)
        }
      }
    }
  }

  // Suggest connections between nodes sharing tags
  for (const nodes of nodesByTag.values()) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i]
        const target = nodes[j]

        // Skip if already connected
        if (existingLinks.has(`${source.id}-${target.id}`)) continue

        // Skip if same type (e.g., two papers)
        if (source.type === target.type && source.type === 'paper') continue

        suggestions.push({
          source,
          target,
          reason: 'Share common tags',
          score: 1,
        })
      }
    }
  }

  // Suggest connections between questions and papers/notes
  const questions = data.nodes.filter(n => n.type === 'question')
  const papersAndNotes = data.nodes.filter(n => n.type === 'paper' || n.type === 'note')

  for (const question of questions) {
    const connectedIds = new Set<string>()
    for (const link of data.links) {
      if (link.source === question.id) {
        connectedIds.add(link.target as string)
      }
      if (link.target === question.id) {
        connectedIds.add(link.source as string)
      }
    }

    // Find unconnected papers/notes
    for (const node of papersAndNotes) {
      if (!connectedIds.has(node.id) && !existingLinks.has(`${question.id}-${node.id}`)) {
        suggestions.push({
          source: question,
          target: node,
          reason: `Question may be related to this ${node.type}`,
          score: 0.5,
        })
      }
    }
  }

  // Sort by score and return top N
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(({ source, target, reason }) => ({ source, target, reason }))
}

/**
 * Analyze graph and return all gap suggestions
 */
export function analyzeGaps(data: GraphData): GapSuggestion[] {
  const suggestions: GapSuggestion[] = []

  // Check for orphan nodes
  const orphans = findOrphanNodes(data)
  if (orphans.length > 0) {
    // Group orphans by type
    const orphansByType = new Map<GraphNode['type'], GraphNode[]>()
    for (const node of orphans) {
      if (!orphansByType.has(node.type)) {
        orphansByType.set(node.type, [])
      }
      orphansByType.get(node.type)!.push(node)
    }

    for (const [type, nodes] of orphansByType) {
      if (type === 'tag') continue // Tags can be orphans naturally

      suggestions.push({
        type: 'orphan',
        severity: nodes.length > 3 ? 'high' : 'medium',
        nodes,
        message: `${nodes.length} ${type}${nodes.length > 1 ? 's' : ''} with no connections`,
        suggestion: `Consider linking these ${type}s to related notes, papers, or questions`,
      })
    }
  }

  // Check for weakly connected nodes
  const weakNodes = findWeaklyConnectedNodes(data)
  if (weakNodes.length > 0) {
    suggestions.push({
      type: 'weak_connection',
      severity: 'low',
      nodes: weakNodes,
      message: `${weakNodes.length} items with only one connection`,
      suggestion: 'Adding more connections will improve knowledge discovery',
    })
  }

  // Check for isolated clusters
  const clusters = findClusters(data)
  if (clusters.length > 1) {
    // Exclude single-node clusters (orphans) and very small clusters
    const significantClusters = clusters.filter(c => c.size >= 2)

    if (significantClusters.length > 1) {
      suggestions.push({
        type: 'isolated_cluster',
        severity: 'medium',
        nodes: significantClusters.flatMap(c => c.nodes.slice(0, 3)), // Sample nodes from each cluster
        message: `Knowledge graph has ${significantClusters.length} separate clusters`,
        suggestion: 'Look for connections between clusters using common themes or shared concepts',
      })
    }
  }

  return suggestions
}

/**
 * Get a summary of graph health
 */
export function getGraphHealthScore(data: GraphData): {
  score: number // 0-100
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  metrics: {
    totalNodes: number
    totalLinks: number
    orphanCount: number
    weakConnectionCount: number
    clusterCount: number
    avgConnectionsPerNode: number
  }
} {
  const orphans = findOrphanNodes(data)
  const weakNodes = findWeaklyConnectedNodes(data)
  const clusters = findClusters(data)

  const metrics = {
    totalNodes: data.nodes.length,
    totalLinks: data.links.length,
    orphanCount: orphans.length,
    weakConnectionCount: weakNodes.length,
    clusterCount: clusters.length,
    avgConnectionsPerNode: data.nodes.length > 0
      ? (data.links.length * 2) / data.nodes.length
      : 0,
  }

  // Calculate score
  let score = 100

  // Penalize orphans (except tags)
  const nonTagOrphans = orphans.filter(n => n.type !== 'tag')
  const orphanPenalty = Math.min(30, nonTagOrphans.length * 5)
  score -= orphanPenalty

  // Penalize weak connections
  const weakPenalty = Math.min(20, weakNodes.length * 2)
  score -= weakPenalty

  // Penalize multiple clusters
  if (clusters.length > 1) {
    score -= Math.min(20, (clusters.length - 1) * 10)
  }

  // Bonus for good avg connections
  if (metrics.avgConnectionsPerNode >= 2) {
    score = Math.min(100, score + 10)
  }

  score = Math.max(0, Math.min(100, score))

  let rating: 'excellent' | 'good' | 'fair' | 'poor'
  if (score >= 80) rating = 'excellent'
  else if (score >= 60) rating = 'good'
  else if (score >= 40) rating = 'fair'
  else rating = 'poor'

  return { score, rating, metrics }
}
