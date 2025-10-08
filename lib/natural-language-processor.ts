import { JsonValue, JsonObject } from '@/store/json-store';

export interface QueryIntent {
  action: 'visualize' | 'filter' | 'aggregate' | 'transform' | 'analyze';
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'treemap' | 'table' | 'graph';
  fields?: string[];
  filters?: Array<{ field: string; operator: string; value: string }>;
  aggregation?: {
    field: string;
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
  groupBy?: string[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  confidence: number;
}

export interface VisualizationSuggestion {
  chartType: string;
  title: string;
  description: string;
  fields: string[];
  config: Record<string, unknown>;
  confidence: number;
}

class NaturalLanguageProcessor {
  private chartKeywords = {
    bar: ['bar', 'bars', 'column', 'columns', 'vertical', 'compare', 'comparison'],
    line: ['line', 'lines', 'trend', 'trends', 'time', 'temporal', 'over time'],
    pie: ['pie', 'circle', 'proportion', 'percentage', 'share', 'distribution'],
    scatter: ['scatter', 'correlation', 'relationship', 'plot', 'points'],
    area: ['area', 'filled', 'stacked', 'cumulative'],
    heatmap: ['heatmap', 'heat', 'matrix', 'grid', 'density'],
    treemap: ['treemap', 'tree', 'hierarchy', 'nested', 'squares'],
    table: ['table', 'list', 'grid', 'tabular', 'data'],
    graph: ['graph', 'network', 'nodes', 'edges', 'connections', 'relationships']
  };

  private actionKeywords = {
    visualize: ['show', 'display', 'visualize', 'chart', 'graph', 'plot', 'create'],
    filter: ['filter', 'where', 'only', 'exclude', 'include', 'remove'],
    aggregate: ['sum', 'total', 'average', 'mean', 'count', 'group', 'aggregate'],
    transform: ['transform', 'convert', 'change', 'modify', 'process'],
    analyze: ['analyze', 'find', 'detect', 'identify', 'discover', 'insights']
  };

  private fieldKeywords = {
    numeric: ['number', 'numeric', 'amount', 'value', 'price', 'cost', 'revenue', 'sales', 'count', 'quantity'],
    temporal: ['date', 'time', 'year', 'month', 'day', 'timestamp', 'created', 'updated'],
    categorical: ['category', 'type', 'status', 'name', 'label', 'group', 'class']
  };

  parseQuery(query: string, data: JsonValue): QueryIntent {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Determine action
    const action = this.detectAction(normalizedQuery);
    
    // Determine chart type
    const chartType = this.detectChartType(normalizedQuery);
    
    // Extract fields from query and data
    const fields = this.extractFields(normalizedQuery, data);
    
    // Extract filters
    const filters = this.extractFilters(normalizedQuery);
    
    // Extract aggregation
    const aggregation = this.extractAggregation(normalizedQuery);
    
    // Extract group by
    const groupBy = this.extractGroupBy(normalizedQuery);
    
    // Extract sort
    const sortBy = this.extractSortBy(normalizedQuery);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(action, chartType, fields, normalizedQuery);
    
    return {
      action,
      chartType,
      fields,
      filters,
      aggregation,
      groupBy,
      sortBy,
      confidence
    };
  }

  generateVisualizationSuggestions(data: JsonValue): VisualizationSuggestion[] {
    const suggestions: VisualizationSuggestion[] = [];
    
    if (Array.isArray(data) && data.length > 0) {
      const sampleItem = data[0];
      if (typeof sampleItem === 'object' && sampleItem !== null) {
        const fields = Object.keys(sampleItem);
        const numericFields = this.getNumericFields(data);
        const categoricalFields = this.getCategoricalFields(data);
        const temporalFields = this.getTemporalFields(data);
        
        // Bar chart suggestions
        if (numericFields.length > 0 && categoricalFields.length > 0) {
          suggestions.push({
            chartType: 'bar',
            title: `Bar Chart: ${categoricalFields[0]} vs ${numericFields[0]}`,
            description: `Compare ${numericFields[0]} across different ${categoricalFields[0]} values`,
            fields: [categoricalFields[0], numericFields[0]],
            config: { xField: categoricalFields[0], yField: numericFields[0] },
            confidence: 0.9
          });
        }
        
        // Line chart suggestions
        if (temporalFields.length > 0 && numericFields.length > 0) {
          suggestions.push({
            chartType: 'line',
            title: `Line Chart: ${numericFields[0]} over ${temporalFields[0]}`,
            description: `Show trends of ${numericFields[0]} over time`,
            fields: [temporalFields[0], numericFields[0]],
            config: { xField: temporalFields[0], yField: numericFields[0] },
            confidence: 0.9
          });
        }
        
        // Pie chart suggestions
        if (categoricalFields.length > 0) {
          suggestions.push({
            chartType: 'pie',
            title: `Pie Chart: Distribution of ${categoricalFields[0]}`,
            description: `Show the proportion of different ${categoricalFields[0]} values`,
            fields: [categoricalFields[0]],
            config: { field: categoricalFields[0] },
            confidence: 0.8
          });
        }
        
        // Scatter plot suggestions
        if (numericFields.length >= 2) {
          suggestions.push({
            chartType: 'scatter',
            title: `Scatter Plot: ${numericFields[0]} vs ${numericFields[1]}`,
            description: `Explore the relationship between ${numericFields[0]} and ${numericFields[1]}`,
            fields: [numericFields[0], numericFields[1]],
            config: { xField: numericFields[0], yField: numericFields[1] },
            confidence: 0.8
          });
        }
        
        // Heatmap suggestions
        if (categoricalFields.length >= 2 && numericFields.length > 0) {
          suggestions.push({
            chartType: 'heatmap',
            title: `Heatmap: ${categoricalFields[0]} vs ${categoricalFields[1]}`,
            description: `Show ${numericFields[0]} intensity across ${categoricalFields[0]} and ${categoricalFields[1]}`,
            fields: [categoricalFields[0], categoricalFields[1], numericFields[0]],
            config: { 
              xField: categoricalFields[0], 
              yField: categoricalFields[1], 
              valueField: numericFields[0] 
            },
            confidence: 0.7
          });
        }
        
        // Table suggestion
        suggestions.push({
          chartType: 'table',
          title: `Data Table`,
          description: `View all data in tabular format`,
          fields: fields.slice(0, 10), // Limit to first 10 fields
          config: { fields: fields.slice(0, 10) },
          confidence: 0.6
        });
      }
    }
    
    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private detectAction(query: string): QueryIntent['action'] {
    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return action as QueryIntent['action'];
      }
    }
    return 'visualize';
  }

  private detectChartType(query: string): QueryIntent['chartType'] | undefined {
    for (const [chartType, keywords] of Object.entries(this.chartKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return chartType as QueryIntent['chartType'];
      }
    }
    return undefined;
  }

  private extractFields(query: string, data: JsonValue): string[] {
    const fields: string[] = [];
    
    if (Array.isArray(data) && data.length > 0) {
      const sampleItem = data[0];
      if (typeof sampleItem === 'object' && sampleItem !== null) {
        const availableFields = Object.keys(sampleItem);
        
        // Look for field names in the query
        for (const field of availableFields) {
          if (query.includes(field.toLowerCase())) {
            fields.push(field);
          }
        }
        
        // If no specific fields mentioned, try to infer from keywords
        if (fields.length === 0) {
          const numericFields = this.getNumericFields(data);
          const categoricalFields = this.getCategoricalFields(data);
          const temporalFields = this.getTemporalFields(data);
          
          // Add relevant fields based on query content
          if (this.fieldKeywords.numeric.some(keyword => query.includes(keyword))) {
            fields.push(...numericFields.slice(0, 2));
          }
          if (this.fieldKeywords.temporal.some(keyword => query.includes(keyword))) {
            fields.push(...temporalFields.slice(0, 1));
          }
          if (this.fieldKeywords.categorical.some(keyword => query.includes(keyword))) {
            fields.push(...categoricalFields.slice(0, 2));
          }
        }
      }
    }
    
    return fields.slice(0, 5); // Limit to 5 fields
  }

  private extractFilters(query: string): Array<{ field: string; operator: string; value: string }> {
    const filters: Array<{ field: string; operator: string; value: string }> = [];
    
    // Simple filter extraction - look for "field operator value" patterns
    const filterPatterns = [
      /(\w+)\s+(equals?|is|==)\s+([^\s]+)/gi,
      /(\w+)\s+(greater than|>|more than)\s+([^\s]+)/gi,
      /(\w+)\s+(less than|<|fewer than)\s+([^\s]+)/gi,
      /(\w+)\s+(contains?|includes?)\s+([^\s]+)/gi
    ];
    
    for (const pattern of filterPatterns) {
      const matches = query.matchAll(pattern);
      for (const match of matches) {
        const field = match[1];
        const operator = this.normalizeOperator(match[2]);
        const value = match[3];
        filters.push({ field, operator, value });
      }
    }
    
    return filters;
  }

  private extractAggregation(query: string): QueryIntent['aggregation'] {
    const aggregationKeywords = {
      sum: ['sum', 'total', 'add'],
      avg: ['average', 'mean', 'avg'],
      count: ['count', 'number', 'how many'],
      min: ['minimum', 'min', 'lowest'],
      max: ['maximum', 'max', 'highest']
    };
    
    for (const [operation, keywords] of Object.entries(aggregationKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        // Try to extract field name
        const fieldMatch = query.match(/(\w+)\s+(?:sum|total|average|mean|count|min|max)/i);
        if (fieldMatch) {
          return {
            field: fieldMatch[1],
            operation: operation as 'sum' | 'avg' | 'count' | 'min' | 'max'
          };
        }
      }
    }
    
    return undefined;
  }

  private extractGroupBy(query: string): string[] {
    const groupKeywords = ['group by', 'group', 'by', 'categorize'];
    
    if (groupKeywords.some(keyword => query.includes(keyword))) {
      // Simple extraction - look for field names after group keywords
      const words = query.split(/\s+/);
      const groupIndex = words.findIndex(word => groupKeywords.includes(word));
      if (groupIndex !== -1 && groupIndex + 1 < words.length) {
        return [words[groupIndex + 1]];
      }
    }
    
    return [];
  }

  private extractSortBy(query: string): QueryIntent['sortBy'] | undefined {
    const sortKeywords = ['sort by', 'order by', 'sort', 'order'];
    const directionKeywords = {
      asc: ['ascending', 'asc', 'up', 'high to low'],
      desc: ['descending', 'desc', 'down', 'low to high']
    };
    
    for (const keyword of sortKeywords) {
      if (query.includes(keyword)) {
        const words = query.split(/\s+/);
        const sortIndex = words.findIndex(word => keyword.includes(word));
        if (sortIndex !== -1 && sortIndex + 1 < words.length) {
          const field = words[sortIndex + 1];
          let direction: 'asc' | 'desc' = 'asc';
          
          for (const [dir, dirKeywords] of Object.entries(directionKeywords)) {
            if (dirKeywords.some(dirKeyword => query.includes(dirKeyword))) {
              direction = dir as 'asc' | 'desc';
              break;
            }
          }
          
          return { field, direction };
        }
      }
    }
    
    return undefined;
  }

  private calculateConfidence(
    action: string, 
    chartType: string | undefined, 
    fields: string[], 
    query: string
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on action detection
    if (action !== 'visualize') confidence += 0.2;
    
    // Increase confidence if chart type is detected
    if (chartType) confidence += 0.2;
    
    // Increase confidence if fields are identified
    if (fields.length > 0) confidence += 0.1 * Math.min(fields.length, 3);
    
    // Increase confidence for longer, more specific queries
    if (query.length > 20) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private getNumericFields(data: JsonValue): string[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const sampleItem = data[0];
    if (typeof sampleItem !== 'object' || sampleItem === null) return [];
    
    return Object.keys(sampleItem).filter(field => {
      const values = data.map(item => 
        typeof item === 'object' && item !== null ? (item as JsonObject)[field] : null
      ).filter(v => v !== null && v !== undefined);
      
      return values.length > 0 && values.every(v => typeof v === 'number' && !isNaN(v));
    });
  }

  private getCategoricalFields(data: JsonValue): string[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const sampleItem = data[0];
    if (typeof sampleItem !== 'object' || sampleItem === null) return [];
    
    return Object.keys(sampleItem).filter(field => {
      const values = data.map(item => 
        typeof item === 'object' && item !== null ? (item as JsonObject)[field] : null
      ).filter(v => v !== null && v !== undefined);
      
      return values.length > 0 && values.every(v => typeof v === 'string' || typeof v === 'boolean');
    });
  }

  private getTemporalFields(data: JsonValue): string[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const sampleItem = data[0];
    if (typeof sampleItem !== 'object' || sampleItem === null) return [];
    
    return Object.keys(sampleItem).filter(field => {
      const values = data.map(item => 
        typeof item === 'object' && item !== null ? (item as JsonObject)[field] : null
      ).filter(v => v !== null && v !== undefined);
      
      return values.length > 0 && values.some(v => {
        if (typeof v === 'string') {
          const date = new Date(v);
          return !isNaN(date.getTime());
        }
        return false;
      });
    });
  }

  private normalizeOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      'equals': '=',
      'is': '=',
      '==': '=',
      'greater than': '>',
      'more than': '>',
      '>': '>',
      'less than': '<',
      'fewer than': '<',
      '<': '<',
      'contains': 'contains',
      'includes': 'contains'
    };
    
    return operatorMap[operator.toLowerCase()] || operator;
  }
}

export const naturalLanguageProcessor = new NaturalLanguageProcessor();