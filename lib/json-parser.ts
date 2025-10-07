export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
}

export interface ParseResult {
  success: boolean;
  data?: JsonValue;
  error?: JsonError;
}

export function parseJson(input: string): ParseResult {
  if (!input || input.trim() === '') {
    return {
      success: false,
      error: {
        message: 'Input is empty',
      },
    };
  }

  try {
    const data = JSON.parse(input);
    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Extract line and column from error message if available
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1], 10);
        const lines = input.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        return {
          success: false,
          error: {
            message: error.message,
            line,
            column,
          },
        };
      }
      
      return {
        success: false,
        error: {
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

export function formatJson(data: JsonValue, indent: number = 2): string {
  return JSON.stringify(data, null, indent);
}

export function getJsonType(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function getJsonSize(value: JsonValue): number {
  return new Blob([JSON.stringify(value)]).size;
}

export function isJsonObject(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isJsonArray(value: JsonValue): value is JsonValue[] {
  return Array.isArray(value);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function countItems(value: JsonValue): number {
  if (isJsonArray(value)) {
    return value.length;
  }
  if (isJsonObject(value)) {
    return Object.keys(value).length;
  }
  return 0;
}
