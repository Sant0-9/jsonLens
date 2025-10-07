"use client"

import { useState, useCallback, useEffect } from 'react';
import { Play, Save, Upload, Settings, History, GitCompare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { ApiClient, SnapshotManager, ApiRequest, ApiResponse, ApiSnapshot, Environment } from '@/lib/api-client';
import { OpenApiParser, ParsedEndpoint } from '@/lib/openapi-parser';
import { SequenceGenerator } from '@/lib/sequence-generator';

interface ApiPlaygroundViewProps {
  data: JsonValue;
}

export function ApiPlaygroundView({ data }: ApiPlaygroundViewProps) {
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    url: '',
    headers: { 'Accept': 'application/json' },
  });
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [snapshots, setSnapshots] = useState<ApiSnapshot[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('default');
  const [openApiSpec, setOpenApiSpec] = useState<unknown>(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [sequenceDiagramType, setSequenceDiagramType] = useState<'flow' | 'errors' | 'performance'>('flow');

  // Load snapshots and environments on mount
  useEffect(() => {
    setSnapshots(SnapshotManager.getSnapshots());
    const envs = SnapshotManager.getEnvironments();
    if (envs.length === 0) {
      const defaultEnv = SnapshotManager.getDefaultEnvironment();
      setEnvironments([defaultEnv]);
    } else {
      setEnvironments(envs);
    }
  }, []);

  const handleOpenApiImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const spec = JSON.parse(e.target?.result as string);
        const parsedSpec = OpenApiParser.parseSpec(spec);
        const extractedEndpoints = OpenApiParser.extractEndpoints(parsedSpec);
        
        setOpenApiSpec(parsedSpec);
        setEndpoints(extractedEndpoints);
        setError('');
      } catch (err) {
        setError(`Failed to parse OpenAPI spec: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleEndpointSelect = useCallback((endpoint: ParsedEndpoint) => {
    setSelectedEndpoint(endpoint);
    
    const currentEnv = environments.find(e => e.id === selectedEnvironment) || environments[0];
    const baseUrl = currentEnv?.baseUrl || '';
    
    const generated = OpenApiParser.generateRequestFromEndpoint(endpoint, baseUrl);
    setRequest({
      method: generated.method as ApiRequest['method'],
      url: generated.url,
      headers: generated.headers,
      body: generated.body,
    });
  }, [environments, selectedEnvironment]);

  const handleExecuteRequest = useCallback(async () => {
    if (!request.url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const currentEnv = environments.find(e => e.id === selectedEnvironment);
      const processedRequest = ApiClient.buildRequest(
        request.method,
        request.url,
        request.headers,
        request.body,
        currentEnv
      );

      const apiResponse = await ApiClient.executeRequest(processedRequest);
      setResponse(apiResponse);

      // Save snapshot
      const snapshot: ApiSnapshot = {
        id: Date.now().toString(),
        name: `${request.method} ${request.url}`,
        timestamp: Date.now(),
        request: processedRequest,
        response: apiResponse,
        environment: selectedEnvironment,
      };
      
      SnapshotManager.saveSnapshot(snapshot);
      setSnapshots(SnapshotManager.getSnapshots());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [request, environments, selectedEnvironment]);

  const handleSaveSnapshot = useCallback(() => {
    if (!response) return;

    const name = prompt('Enter snapshot name:', `${request.method} ${request.url}`);
    if (!name) return;

    const snapshot: ApiSnapshot = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      request,
      response,
      environment: selectedEnvironment,
    };
    
    SnapshotManager.saveSnapshot(snapshot);
    setSnapshots(SnapshotManager.getSnapshots());
  }, [request, response, selectedEnvironment]);

  const handleEnvironmentChange = useCallback((envId: string) => {
    setSelectedEnvironment(envId);
  }, []);

  const handleAddEnvironment = useCallback(() => {
    const name = prompt('Enter environment name:');
    if (!name) return;

    const newEnv: Environment = {
      id: Date.now().toString(),
      name,
      variables: {},
    };
    
    SnapshotManager.saveEnvironment(newEnv);
    setEnvironments(SnapshotManager.getEnvironments());
  }, []);

  const handleDeleteSnapshot = useCallback((id: string) => {
    SnapshotManager.deleteSnapshot(id);
    setSnapshots(SnapshotManager.getSnapshots());
  }, []);

  const handleCompareSnapshots = useCallback(() => {
    if (selectedSnapshots.length !== 2) {
      setError('Please select exactly 2 snapshots to compare');
      return;
    }

    const snap1 = snapshots.find(s => s.id === selectedSnapshots[0]);
    const snap2 = snapshots.find(s => s.id === selectedSnapshots[1]);
    
    if (!snap1 || !snap2) return;

    // For now, just show a simple comparison
    const comparison = {
      request: {
        url: snap1.request.url === snap2.request.url ? 'Same' : 'Different',
        method: snap1.request.method === snap2.request.method ? 'Same' : 'Different',
        headers: JSON.stringify(snap1.request.headers) === JSON.stringify(snap2.request.headers) ? 'Same' : 'Different',
      },
      response: {
        status: snap1.response.status === snap2.response.status ? 'Same' : 'Different',
        duration: snap1.response.duration - snap2.response.duration,
        size: snap1.response.size - snap2.response.size,
      },
    };

    setResponse({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: comparison,
      duration: 0,
      size: 0,
    });
  }, [selectedSnapshots, snapshots]);

  const generateSequenceDiagram = useCallback(() => {
    if (snapshots.length === 0) {
      setError('No snapshots available to generate sequence diagram');
      return;
    }

    let mermaidCode: string;
    
    switch (sequenceDiagramType) {
      case 'errors':
        mermaidCode = SequenceGenerator.generateErrorFlow(snapshots);
        break;
      case 'performance':
        mermaidCode = SequenceGenerator.generatePerformanceFlow(snapshots);
        break;
      default:
        mermaidCode = SequenceGenerator.generateFromSnapshots(snapshots);
    }

    // Create a new response with the Mermaid diagram
    setResponse({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain' },
      data: mermaidCode,
      duration: 0,
      size: mermaidCode.length,
    });
  }, [snapshots, sequenceDiagramType]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">API Playground</h3>
            <p className="text-sm text-muted-foreground">
              Test APIs, save snapshots, and compare responses
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSnapshots(!showSnapshots)}>
              <History className="h-3 w-3 mr-1" />
              Snapshots ({snapshots.length})
            </Button>
            {selectedSnapshots.length === 2 && (
              <Button variant="outline" size="sm" onClick={handleCompareSnapshots}>
                <GitCompare className="h-3 w-3 mr-1" />
                Compare
              </Button>
            )}
            {snapshots.length > 0 && (
              <Button variant="outline" size="sm" onClick={generateSequenceDiagram}>
                <FileText className="h-3 w-3 mr-1" />
                Sequence Diagram
              </Button>
            )}
          </div>
        </div>

        {/* OpenAPI Import */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Import OpenAPI Specification:</div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleOpenApiImport}
              className="hidden"
              id="openapi-import"
            />
            <label htmlFor="openapi-import">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-3 w-3 mr-1" />
                  Import OpenAPI
                </span>
              </Button>
            </label>
            {openApiSpec && (
              <div className="text-sm text-muted-foreground flex items-center">
                Loaded: {openApiSpec.info?.title} v{openApiSpec.info?.version}
              </div>
            )}
          </div>
        </div>

        {/* Environment Selection */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Environment:</div>
          <select
            value={selectedEnvironment}
            onChange={(e) => handleEnvironmentChange(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            {environments.map(env => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleAddEnvironment}>
            <Settings className="h-3 w-3 mr-1" />
            Add Environment
          </Button>
        </div>

        {/* Sequence Diagram Controls */}
        {snapshots.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Sequence Diagram:</div>
            <select
              value={sequenceDiagramType}
              onChange={(e) => setSequenceDiagramType(e.target.value as 'flow' | 'errors' | 'performance')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="flow">API Flow</option>
              <option value="errors">Error Flow</option>
              <option value="performance">Performance Flow</option>
            </select>
            <Button variant="outline" size="sm" onClick={generateSequenceDiagram}>
              <FileText className="h-3 w-3 mr-1" />
              Generate
            </Button>
          </div>
        )}

        {/* Endpoints List */}
        {endpoints.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Available Endpoints:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {endpoints.map(endpoint => (
                <div
                  key={endpoint.id}
                  className={`p-2 border rounded cursor-pointer text-sm ${
                    selectedEndpoint?.id === endpoint.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleEndpointSelect(endpoint)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono">{endpoint.path}</span>
                    <span className="text-muted-foreground">{endpoint.summary}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Request Builder */}
        <div className="flex-1 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Request Builder</h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={request.method}
                  onChange={(e) => setRequest(prev => ({ ...prev, method: e.target.value as ApiRequest['method'] }))}
                  className="px-3 py-2 border rounded text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                <input
                  type="text"
                  value={request.url}
                  onChange={(e) => setRequest(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/endpoint"
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <Button onClick={handleExecuteRequest} disabled={loading}>
                  <Play className="h-4 w-4 mr-1" />
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Headers:</div>
                <textarea
                  value={JSON.stringify(request.headers, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setRequest(prev => ({ ...prev, headers }));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full h-20 px-3 py-2 border rounded text-sm font-mono"
                  placeholder='{"Accept": "application/json", "Authorization": "Bearer token"}'
                />
              </div>

              {(request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') && (
                <div>
                  <div className="text-sm font-medium mb-1">Body:</div>
                  <textarea
                    value={request.body || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full h-32 px-3 py-2 border rounded text-sm font-mono"
                    placeholder='{"key": "value"}'
                  />
                </div>
              )}
            </div>
          </div>

          {/* Response Display */}
          {response && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Response</h4>
                <Button variant="outline" size="sm" onClick={handleSaveSnapshot}>
                  <Save className="h-3 w-3 mr-1" />
                  Save Snapshot
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                  <span className={`px-2 py-1 rounded ${
                    response.status >= 200 && response.status < 300 ? 'bg-green-100 text-green-800' :
                    response.status >= 400 ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-muted-foreground">{response.duration}ms</span>
                  <span className="text-muted-foreground">{response.size} bytes</span>
                </div>
                
                <div className="bg-muted/30 rounded p-3 max-h-96 overflow-auto">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Snapshots Panel */}
        {showSnapshots && (
          <div className="w-80 border-l p-4 space-y-4">
            <h4 className="text-sm font-semibold">Snapshots</h4>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {snapshots.map(snapshot => (
                <div
                  key={snapshot.id}
                  className={`p-2 border rounded cursor-pointer text-sm ${
                    selectedSnapshots.includes(snapshot.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (selectedSnapshots.includes(snapshot.id)) {
                      setSelectedSnapshots(prev => prev.filter(id => id !== snapshot.id));
                    } else if (selectedSnapshots.length < 2) {
                      setSelectedSnapshots(prev => [...prev, snapshot.id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{snapshot.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSnapshot(snapshot.id);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {snapshot.request.method} {snapshot.request.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}