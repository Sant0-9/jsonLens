"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Download, Copy, Check, Expand, Minimize } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { inferSchema } from '@/lib/schema-inference';
import { 
  getDiagramFromSchema, 
  getDiagramFromData,
  DiagramType 
} from '@/lib/mermaid-generator';
import mermaid from 'mermaid';

interface DiagramViewProps {
  data: JsonValue;
}

export function DiagramView({ data }: DiagramViewProps) {
  const [diagramType, setDiagramType] = useState<DiagramType>('class');
  const [mermaidCode, setMermaidCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
    setIsInitialized(true);
  }, [theme]);

  const schema = useMemo(() => {
    return inferSchema(data);
  }, [data]);

  useEffect(() => {
    try {
      let code = '';
      
      if (diagramType === 'flowchart') {
        code = getDiagramFromData(data, diagramType);
      } else {
        code = getDiagramFromSchema(schema, diagramType);
      }
      
      setMermaidCode(code);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate diagram');
    }
  }, [data, schema, diagramType]);

  useEffect(() => {
    if (!isInitialized || !mermaidCode || !diagramRef.current) return;

    const renderDiagram = async () => {
      try {
        diagramRef.current!.innerHTML = '';
        
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [mermaidCode, isInitialized, renderTick]);

  // Resize observer to rerender diagram when container size changes (e.g., fullscreen)
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

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mermaidCode]);

  const handleDownloadSVG = useCallback(() => {
    const svg = diagramRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${diagramType}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [diagramType]);

  const handleDownloadPNG = useCallback(() => {
    const svg = diagramRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
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
          a.download = `diagram-${diagramType}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [diagramType]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Mermaid Diagrams</h3>
            <p className="text-sm text-muted-foreground">
              Visual representation of your JSON structure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-3 w-3" />
              ) : (
                <Expand className="h-3 w-3" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Code
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([mermaidCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diagram-${diagramType}.mmd`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Code
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
              <Download className="h-3 w-3 mr-1" />
              SVG
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
              <Download className="h-3 w-3 mr-1" />
              PNG
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Diagram Type:</div>
          <div className="flex gap-1">
            <Button
              variant={diagramType === 'class' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDiagramType('class')}
            >
              Class Diagram
            </Button>
            <Button
              variant={diagramType === 'flowchart' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDiagramType('flowchart')}
            >
              Flowchart
            </Button>
            <Button
              variant={diagramType === 'er' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDiagramType('er')}
            >
              ER Diagram
            </Button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Mermaid Code</h4>
            <pre className="border rounded-lg p-3 bg-muted/30 overflow-auto text-xs font-mono max-h-[600px]">
              {mermaidCode}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Rendered Diagram</h4>
            {error ? (
              <div className="border rounded-lg p-4 bg-destructive/10 border-destructive/50">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30 overflow-auto flex items-center justify-center min-h-[400px]">
                <div ref={diagramRef} className="mermaid-diagram" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
