export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  size: number;
}

export interface ApiSnapshot {
  id: string;
  name: string;
  timestamp: number;
  request: ApiRequest;
  response: ApiResponse;
  environment: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  baseUrl?: string;
}

export class ApiClient {
  private static async makeRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeout || 30000);
      
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      const responseHeaders: Record<string, string> = {};
      
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      let data: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
      
      const size = new Blob([JSON.stringify(data)]).size;
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        duration,
        size,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${duration}ms`);
      }
      
      throw error;
    }
  }
  
  static async executeRequest(request: ApiRequest): Promise<ApiResponse> {
    return this.makeRequest(request);
  }
  
  static interpolateVariables(
    text: string, 
    variables: Record<string, string>
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
  
  static buildRequest(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    body?: string,
    environment?: Environment
  ): ApiRequest {
    let processedUrl = url;
    let processedHeaders = { ...headers };
    
    if (environment) {
      // Interpolate variables in URL
      processedUrl = this.interpolateVariables(url, environment.variables);
      
      // Interpolate variables in headers
      Object.keys(processedHeaders).forEach(key => {
        processedHeaders[key] = this.interpolateVariables(
          processedHeaders[key], 
          environment.variables
        );
      });
      
      // Add environment variables as headers if they start with HEADER_
      Object.entries(environment.variables).forEach(([key, value]) => {
        if (key.startsWith('HEADER_')) {
          const headerName = key.replace('HEADER_', '').toLowerCase().replace(/_/g, '-');
          processedHeaders[headerName] = value;
        }
      });
      
      // Use base URL if provided
      if (environment.baseUrl && !processedUrl.startsWith('http')) {
        processedUrl = `${environment.baseUrl}${processedUrl.startsWith('/') ? '' : '/'}${processedUrl}`;
      }
    }
    
    return {
      method: method as ApiRequest['method'],
      url: processedUrl,
      headers: processedHeaders,
      body,
    };
  }
}

export class SnapshotManager {
  private static STORAGE_KEY = 'jsonlens-api-snapshots';
  private static ENVIRONMENTS_KEY = 'jsonlens-api-environments';
  
  static saveSnapshot(snapshot: ApiSnapshot): void {
    const snapshots = this.getSnapshots();
    snapshots.unshift(snapshot);
    
    // Keep only last 100 snapshots
    if (snapshots.length > 100) {
      snapshots.splice(100);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshots));
  }
  
  static getSnapshots(): ApiSnapshot[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static deleteSnapshot(id: string): void {
    const snapshots = this.getSnapshots();
    const filtered = snapshots.filter(s => s.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }
  
  static saveEnvironment(environment: Environment): void {
    const environments = this.getEnvironments();
    const existingIndex = environments.findIndex(e => e.id === environment.id);
    
    if (existingIndex >= 0) {
      environments[existingIndex] = environment;
    } else {
      environments.push(environment);
    }
    
    localStorage.setItem(this.ENVIRONMENTS_KEY, JSON.stringify(environments));
  }
  
  static getEnvironments(): Environment[] {
    try {
      const stored = localStorage.getItem(this.ENVIRONMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static deleteEnvironment(id: string): void {
    const environments = this.getEnvironments();
    const filtered = environments.filter(e => e.id !== id);
    localStorage.setItem(this.ENVIRONMENTS_KEY, JSON.stringify(filtered));
  }
  
  static getDefaultEnvironment(): Environment {
    return {
      id: 'default',
      name: 'Default',
      variables: {},
    };
  }
}