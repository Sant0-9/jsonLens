export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    schema?: unknown;
    description?: string;
  }>;
  requestBody?: {
    content: Record<string, unknown>;
    required?: boolean;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, unknown>;
  }>;
  security?: Array<Record<string, string[]>>;
}

export interface ParsedEndpoint {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  parameters: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required: boolean;
    type: string;
    description: string;
  }>;
  requestBody?: {
    contentType: string;
    schema: unknown;
    required: boolean;
  };
  responses: Array<{
    status: string;
    description: string;
    contentType?: string;
  }>;
  security?: Array<{
    type: string;
    name: string;
  }>;
}

export class OpenApiParser {
  static parseSpec(spec: unknown): OpenApiSpec {
    // Basic validation
    const s = spec as Record<string, unknown>;
    if (!s.openapi && !s.swagger) {
      throw new Error('Invalid OpenAPI specification: missing openapi/swagger version');
    }
    
    if (!s.info) {
      throw new Error('Invalid OpenAPI specification: missing info section');
    }
    
    if (!s.paths) {
      throw new Error('Invalid OpenAPI specification: missing paths section');
    }
    
    return spec as OpenApiSpec;
  }
  
  static extractEndpoints(spec: OpenApiSpec): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      
      methods.forEach(method => {
        const operation = pathItem[method];
        if (operation) {
          const endpoint: ParsedEndpoint = {
            id: operation.operationId || `${method.toUpperCase()} ${path}`,
            method: method.toUpperCase(),
            path,
            summary: operation.summary || `${method.toUpperCase()} ${path}`,
            description: operation.description || '',
            parameters: this.extractParameters(operation.parameters || []),
            responses: this.extractResponses(operation.responses),
            security: this.extractSecurity(operation.security, spec.components?.securitySchemes),
          };
          
          if (operation.requestBody) {
            endpoint.requestBody = this.extractRequestBody(operation.requestBody);
          }
          
          endpoints.push(endpoint);
        }
      });
    });
    
    return endpoints;
  }
  
  private static extractParameters(parameters: unknown[]): ParsedEndpoint['parameters'] {
    return parameters.map(param => {
      const p = param as Record<string, unknown>;
      return {
        name: p.name as string,
        in: p.in as 'query' | 'header' | 'path' | 'cookie',
        required: p.required as boolean || false,
        type: this.getParameterType(p.schema),
        description: p.description as string || '',
      };
    });
  }
  
  private static extractResponses(responses: unknown): ParsedEndpoint['responses'] {
    return Object.entries(responses as Record<string, unknown>).map(([status, response]) => ({
      status,
      description: String((response as Record<string, unknown>).description || ''),
      contentType: this.getResponseContentType((response as Record<string, unknown>).content),
    }));
  }
  
  private static extractRequestBody(requestBody: unknown): ParsedEndpoint['requestBody'] {
    const body = requestBody as Record<string, unknown>;
    const content = body.content as Record<string, unknown> || {};
    const contentTypes = Object.keys(content);
    const primaryContentType = contentTypes[0] || 'application/json';
    
    return {
      contentType: primaryContentType,
      schema: (content[primaryContentType] as Record<string, unknown>)?.schema,
      required: Boolean(body.required),
    };
  }
  
  private static extractSecurity(
    security: unknown[] | undefined,
    securitySchemes: unknown
  ): ParsedEndpoint['security'] {
    if (!security || !securitySchemes) return [];
    
    return security.flatMap(sec => 
      Object.entries(sec as Record<string, unknown>).map(([name]) => ({
        type: String(((securitySchemes as Record<string, unknown>)[name] as Record<string, unknown>)?.type || 'unknown'),
        name,
      }))
    );
  }
  
  private static getParameterType(schema: unknown): string {
    if (!schema) return 'string';
    
    const s = schema as Record<string, unknown>;
    if (s.type) {
      return s.type as string;
    }
    
    if (s.$ref) {
      return 'object';
    }
    
    return 'string';
  }
  
  private static getResponseContentType(content: unknown): string | undefined {
    if (!content) return undefined;
    
    const contentTypes = Object.keys(content as Record<string, unknown>);
    return contentTypes[0];
  }
  
  static generateRequestFromEndpoint(
    endpoint: ParsedEndpoint,
    baseUrl: string = '',
    values: Record<string, unknown> = {}
  ): { url: string; method: string; headers: Record<string, string>; body?: string } {
    let url = `${baseUrl}${endpoint.path}`;
    
    // Replace path parameters
    endpoint.parameters
      .filter(p => p.in === 'path')
      .forEach(param => {
        const value = values[param.name] || `{${param.name}}`;
        url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
      });
    
    // Add query parameters
    const queryParams = endpoint.parameters
      .filter(p => p.in === 'query' && values[p.name] !== undefined)
      .map(p => `${p.name}=${encodeURIComponent(String(values[p.name]))}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    // Build headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    endpoint.parameters
      .filter(p => p.in === 'header' && values[p.name] !== undefined)
      .forEach(param => {
        headers[param.name] = String(values[param.name]);
      });
    
    // Add content type for request body
    if (endpoint.requestBody) {
      headers['Content-Type'] = endpoint.requestBody.contentType;
    }
    
    // Generate request body
    let body: string | undefined;
    if (endpoint.requestBody && values.body !== undefined) {
      if (endpoint.requestBody.contentType.includes('application/json')) {
        body = JSON.stringify(values.body, null, 2);
      } else {
        body = String(values.body);
      }
    }
    
    return {
      url,
      method: endpoint.method,
      headers,
      body,
    };
  }
}