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
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
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
    schema?: any;
    description?: string;
  }>;
  requestBody?: {
    content: Record<string, any>;
    required?: boolean;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, any>;
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
    schema: any;
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
  static parseSpec(spec: any): OpenApiSpec {
    // Basic validation
    if (!spec.openapi && !spec.swagger) {
      throw new Error('Invalid OpenAPI specification: missing openapi/swagger version');
    }
    
    if (!spec.info) {
      throw new Error('Invalid OpenAPI specification: missing info section');
    }
    
    if (!spec.paths) {
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
  
  private static extractParameters(parameters: any[]): ParsedEndpoint['parameters'] {
    return parameters.map(param => ({
      name: param.name,
      in: param.in,
      required: param.required || false,
      type: this.getParameterType(param.schema),
      description: param.description || '',
    }));
  }
  
  private static extractResponses(responses: any): ParsedEndpoint['responses'] {
    return Object.entries(responses).map(([status, response]: [string, any]) => ({
      status,
      description: response.description || '',
      contentType: this.getResponseContentType(response.content),
    }));
  }
  
  private static extractRequestBody(requestBody: any): ParsedEndpoint['requestBody'] {
    const contentTypes = Object.keys(requestBody.content || {});
    const primaryContentType = contentTypes[0] || 'application/json';
    
    return {
      contentType: primaryContentType,
      schema: requestBody.content?.[primaryContentType]?.schema,
      required: requestBody.required || false,
    };
  }
  
  private static extractSecurity(
    security: any[] | undefined,
    securitySchemes: any
  ): ParsedEndpoint['security'] {
    if (!security || !securitySchemes) return [];
    
    return security.flatMap(sec => 
      Object.entries(sec).map(([name, scopes]) => ({
        type: securitySchemes[name]?.type || 'unknown',
        name,
      }))
    );
  }
  
  private static getParameterType(schema: any): string {
    if (!schema) return 'string';
    
    if (schema.type) {
      return schema.type;
    }
    
    if (schema.$ref) {
      return 'object';
    }
    
    return 'string';
  }
  
  private static getResponseContentType(content: any): string | undefined {
    if (!content) return undefined;
    
    const contentTypes = Object.keys(content);
    return contentTypes[0];
  }
  
  static generateRequestFromEndpoint(
    endpoint: ParsedEndpoint,
    baseUrl: string = '',
    values: Record<string, any> = {}
  ): { url: string; method: string; headers: Record<string, string>; body?: string } {
    let url = `${baseUrl}${endpoint.path}`;
    
    // Replace path parameters
    endpoint.parameters
      .filter(p => p.in === 'path')
      .forEach(param => {
        const value = values[param.name] || `{${param.name}}`;
        url = url.replace(`{${param.name}}`, encodeURIComponent(value));
      });
    
    // Add query parameters
    const queryParams = endpoint.parameters
      .filter(p => p.in === 'query' && values[p.name] !== undefined)
      .map(p => `${p.name}=${encodeURIComponent(values[p.name])}`);
    
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
        headers[param.name] = values[param.name];
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
        body = values.body;
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