import { JsonValue } from '@/store/json-store';
import yaml from 'js-yaml';
import Papa from 'papaparse';

export type ConversionFormat = 'json' | 'csv' | 'yaml' | 'ndjson';

export interface ConversionResult {
  success: boolean;
  data?: string | JsonValue;
  error?: string;
  format: ConversionFormat;
}

export function convertToCSV(data: JsonValue): ConversionResult {
  if (!Array.isArray(data)) {
    return {
      success: false,
      error: 'Data must be an array for CSV conversion',
      format: 'csv',
    };
  }
  
  if (data.length === 0) {
    return {
      success: true,
      data: '',
      format: 'csv',
    };
  }
  
  if (typeof data[0] !== 'object' || data[0] === null || Array.isArray(data[0])) {
    const simpleData = data.map(item => ({ value: item }));
    const csv = Papa.unparse(simpleData);
    return {
      success: true,
      data: csv,
      format: 'csv',
    };
  }
  
  try {
    const csv = Papa.unparse(data as Array<Record<string, unknown>>);
    return {
      success: true,
      data: csv,
      format: 'csv',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to CSV',
      format: 'csv',
    };
  }
}

export function convertFromCSV(csv: string): ConversionResult {
  try {
    const result = Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    
    if (result.errors.length > 0) {
      return {
        success: false,
        error: result.errors[0].message,
        format: 'csv',
      };
    }
    
    return {
      success: true,
      data: result.data as JsonValue,
      format: 'csv',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV',
      format: 'csv',
    };
  }
}

export function convertToYAML(data: JsonValue): ConversionResult {
  try {
    const yamlStr = yaml.dump(data, {
      indent: 2,
      noRefs: true,
      sortKeys: false,
    });
    
    return {
      success: true,
      data: yamlStr,
      format: 'yaml',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to YAML',
      format: 'yaml',
    };
  }
}

export function convertFromYAML(yamlStr: string): ConversionResult {
  try {
    const data = yaml.load(yamlStr) as JsonValue;
    return {
      success: true,
      data,
      format: 'yaml',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse YAML',
      format: 'yaml',
    };
  }
}

export function convertToNDJSON(data: JsonValue): ConversionResult {
  if (!Array.isArray(data)) {
    return {
      success: false,
      error: 'Data must be an array for NDJSON conversion',
      format: 'ndjson',
    };
  }
  
  try {
    const ndjson = data.map(item => JSON.stringify(item)).join('\n');
    return {
      success: true,
      data: ndjson,
      format: 'ndjson',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to NDJSON',
      format: 'ndjson',
    };
  }
}

export function convertFromNDJSON(ndjson: string): ConversionResult {
  try {
    const lines = ndjson.split('\n').filter(line => line.trim());
    const data = lines.map(line => JSON.parse(line));
    return {
      success: true,
      data,
      format: 'ndjson',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse NDJSON',
      format: 'ndjson',
    };
  }
}

export function convertFormat(
  data: JsonValue,
  fromFormat: ConversionFormat,
  toFormat: ConversionFormat
): ConversionResult {
  if (fromFormat === toFormat) {
    return {
      success: true,
      data,
      format: toFormat,
    };
  }
  
  if (toFormat === 'json') {
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      format: 'json',
    };
  }
  
  if (toFormat === 'csv') {
    return convertToCSV(data);
  }
  
  if (toFormat === 'yaml') {
    return convertToYAML(data);
  }
  
  if (toFormat === 'ndjson') {
    return convertToNDJSON(data);
  }
  
  return {
    success: false,
    error: `Unsupported conversion: ${fromFormat} to ${toFormat}`,
    format: toFormat,
  };
}

export function downloadAsFormat(
  data: JsonValue,
  format: ConversionFormat,
  filename: string
): void {
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'csv': {
      const result = convertToCSV(data);
      if (!result.success || typeof result.data !== 'string') {
        alert('Failed to convert to CSV');
        return;
      }
      content = result.data;
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    }
    case 'yaml': {
      const result = convertToYAML(data);
      if (!result.success || typeof result.data !== 'string') {
        alert('Failed to convert to YAML');
        return;
      }
      content = result.data;
      mimeType = 'application/x-yaml';
      extension = 'yaml';
      break;
    }
    case 'ndjson': {
      const result = convertToNDJSON(data);
      if (!result.success || typeof result.data !== 'string') {
        alert('Failed to convert to NDJSON');
        return;
      }
      content = result.data;
      mimeType = 'application/x-ndjson';
      extension = 'ndjson';
      break;
    }
    default:
      alert('Unsupported format');
      return;
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
