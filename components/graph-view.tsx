"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Download, Search, ZoomIn, ZoomOut, Maximize2, Expand, Minimize, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { inferGraphFromData, exportGraphAsJson, GraphNode, GraphEdge } from '@/lib/graph-inference';
import * as d3 from 'd3';

interface GraphViewProps {
  data: JsonValue;
}

export function GraphView({ data }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [overrideLimit, setOverrideLimit] = useState(false);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const svgSelRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const groupSelRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const graph = useMemo(() => {
    return inferGraphFromData(data);
  }, [data]);

  const filteredGraph = useMemo(() => {
    if (!searchQuery) return graph;
    
    const query = searchQuery.toLowerCase();
    const matchingNodes = graph.nodes.filter(node => 
      node.label.toLowerCase().includes(query) ||
      node.id.toLowerCase().includes(query) ||
      node.group?.toLowerCase().includes(query)
    );
    
    const nodeIds = new Set(matchingNodes.map(n => n.id));
    const filteredEdges = graph.edges.filter(edge => 
      nodeIds.has(edge.source) || nodeIds.has(edge.target)
    );
    
    return {
      nodes: matchingNodes,
      edges: filteredEdges,
    };
  }, [graph, searchQuery]);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 250);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Soft limit to avoid huge graphs locking UI
  useEffect(() => {
    const tooLarge = filteredGraph.nodes.length > 500 || filteredGraph.edges.length > 1000;
    setLimitExceeded(tooLarge && !overrideLimit);
  }, [filteredGraph, overrideLimit]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    svgSelRef.current = svg as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    
    const g = svg.append('g');
    groupSelRef.current = g as unknown as d3.Selection<SVGGElement, unknown, null, undefined>;
    
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });
    
    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;
    
    const simulation = d3.forceSimulation<GraphNode>(filteredGraph.nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(filteredGraph.edges)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as GraphNode).size + 10));
    simulationRef.current = simulation;
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    const link = g.append('g')
      .selectAll('line')
      .data(filteredGraph.edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.type === 'reference' ? 2 : 1)
      .attr('stroke-dasharray', d => d.type === 'reference' ? '5,5' : 'none');
    
    const dragBehavior = d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    
    const node = g.append('g')
      .selectAll('circle')
      .data(filteredGraph.nodes)
      .join('circle')
      .attr('r', d => d.size)
      .attr('fill', d => colorScale(d.group || 'default'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');
    
    node.call(dragBehavior as never);
    
    node.on('click', (event, d) => {
      setSelectedNode(d);
    });
    
    const label = g.append('g')
      .selectAll('text')
      .data(filteredGraph.nodes)
      .join('text')
      .text(d => d.label.substring(0, 20))
      .attr('font-size', '10px')
      .attr('dx', 15)
      .attr('dy', 4)
      .style('pointer-events', 'none');
    
    let ticks = 0;
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as unknown as GraphNode).x || 0)
        .attr('y1', d => (d.source as unknown as GraphNode).y || 0)
        .attr('x2', d => (d.target as unknown as GraphNode).x || 0)
        .attr('y2', d => (d.target as unknown as GraphNode).y || 0);
      
      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
      
      label
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);

      ticks += 1;
      if (!isPaused && (ticks > 300 || simulation.alpha() < 0.03)) {
        simulation.alphaTarget(0);
        simulation.stop();
        setIsPaused(true);
      }
    });
    
    return () => {
      simulation.stop();
    };
  }, [filteredGraph, renderTick, isPaused]);

  // Keep the SVG sized when the container changes (resize/fullscreen)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRenderTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    svg.transition().call(zoom.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    svg.transition().call(zoom.scaleBy, 0.7);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    svg.transition().call(zoom.transform, d3.zoomIdentity);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleFit = useCallback(() => {
    const svg = svgSelRef.current;
    const g = groupSelRef.current;
    const zoomB = zoomBehaviorRef.current;
    if (!svg || !g || !zoomB) return;
    const nodes = filteredGraph.nodes;
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map(n => n.x ?? 0));
    const maxX = Math.max(...nodes.map(n => n.x ?? 0));
    const minY = Math.min(...nodes.map(n => n.y ?? 0));
    const maxY = Math.max(...nodes.map(n => n.y ?? 0));
    const bboxWidth = Math.max(10, maxX - minX);
    const bboxHeight = Math.max(10, maxY - minY);
    const width = (svgRef.current?.clientWidth || 800);
    const height = (svgRef.current?.clientHeight || 600);
    const scale = Math.min(4, Math.max(0.1, 0.9 * Math.min(width / bboxWidth, height / bboxHeight)));
    const tx = (width - scale * (minX + maxX)) / 2;
    const ty = (height - scale * (minY + maxY)) / 2;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
    const svgSel = svgSelRef.current;
    if (svgSel && zoomB) {
      svgSel.transition().duration(400);
      zoomB.transform(svgSel as d3.Selection<SVGSVGElement, unknown, null, undefined>, transform);
    }
  }, [filteredGraph]);

  const handlePauseResume = useCallback(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    if (isPaused) {
      setIsPaused(false);
      sim.alpha(0.7).restart();
    } else {
      sim.stop();
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleExportSVG = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'graph.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const handleExportJSON = useCallback(() => {
    const json = exportGraphAsJson(graph);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [graph]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Graph View</h3>
            <p className="text-sm text-muted-foreground">
              Entity relationships and data structure
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFit}>
              <Maximize2 className="h-3 w-3 rotate-45" />
            </Button>
            <Button variant="outline" size="sm" onClick={handlePauseResume}>
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-3 w-3" />
              ) : (
                <Expand className="h-3 w-3" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSVG}>
              <Download className="h-3 w-3 mr-1" />
              SVG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPNG}>
              <Download className="h-3 w-3 mr-1" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-3 w-3 mr-1" />
              JSON
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredGraph.nodes.length} nodes, {filteredGraph.edges.length} edges | Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {limitExceeded && !overrideLimit ? (
          <div className="flex-1 border rounded-lg bg-muted/30 p-6 flex items-center justify-center text-center">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Graph is large ({filteredGraph.nodes.length} nodes). Rendering is limited to prevent slowdowns.
              </div>
              <Button onClick={() => setOverrideLimit(true)} size="sm" variant="secondary">Render anyway</Button>
            </div>
          </div>
        ) : (
        <div ref={containerRef} className="flex-1 border rounded-lg bg-muted/30 overflow-hidden relative">
          <svg ref={svgRef} className="w-full h-full" />
          
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border rounded-lg p-2 text-xs space-y-1">
            <div className="font-semibold">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Entity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Collection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-400" />
              <span>Contains</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-400 border-dashed" style={{ borderTop: '1px dashed #999' }} />
              <span>Reference</span>
            </div>
          </div>
        </div>
        )}

        {selectedNode && (
          <div className="w-80 border rounded-lg p-4 bg-card space-y-3 overflow-auto">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{selectedNode.label}</h4>
                <p className="text-xs text-muted-foreground">{selectedNode.type}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground">ID</div>
                <div className="text-sm font-mono">{selectedNode.id}</div>
              </div>
              
              {selectedNode.group && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Group</div>
                  <div className="text-sm">{selectedNode.group}</div>
                </div>
              )}
              
              <div>
                <div className="text-xs font-medium text-muted-foreground">Data</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
