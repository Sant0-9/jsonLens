"use client"

import { useState, useMemo, useCallback } from 'react';
import { Download, Copy, Check, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { 
  inferSchema, 
  InferredSchema, 
  InferredField,
  schemaToJsonSchema, 
  schemaToTypeScript, 
  schemaToZod 
} from '@/lib/schema-inference';
import { validateAgainstSchema, getValidationSummary } from '@/lib/schema-validation';

interface SchemaViewProps {
  data: JsonValue;
}

type ExportFormat = 'json-schema' | 'typescript' | 'zod';

export function SchemaView({ data }: SchemaViewProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json-schema');
  const [copied, setCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const schema = useMemo(() => {
    return inferSchema(data);
  }, [data]);

  const validationResult = useMemo(() => {
    return validateAgainstSchema(data, schema);
  }, [data, schema]);

  const exportedSchema = useMemo(() => {
    if (exportFormat === 'json-schema') {
      return JSON.stringify(schemaToJsonSchema(schema), null, 2);
    } else if (exportFormat === 'typescript') {
      return schemaToTypeScript(schema);
    } else {
      return schemaToZod(schema);
    }
  }, [schema, exportFormat]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(exportedSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportedSchema]);

  const handleDownload = useCallback(() => {
    const extensions = {
      'json-schema': 'json',
      'typescript': 'ts',
      'zod': 'ts',
    };
    const ext = extensions[exportFormat];
    const filename = `schema.${ext}`;
    
    const blob = new Blob([exportedSchema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportedSchema, exportFormat]);

  const renderField = (field: InferredField, depth: number = 0) => {
    const indentClass = `ml-${depth * 4}`;
    const types = Array.from(field.types).join(' | ');
    
    return (
      <div key={field.name} className={`py-2 px-3 hover:bg-accent/30 rounded ${indentClass}`}>
        <div className="flex items-start gap-2">
          <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
            {field.name}
          </span>
          {field.optional && (
            <span className="text-xs px-1 py-0.5 bg-muted rounded">optional</span>
          )}
          {field.nullable && (
            <span className="text-xs px-1 py-0.5 bg-muted rounded">nullable</span>
          )}
        </div>
        
        <div className="mt-1 text-xs text-muted-foreground space-y-1">
          <div>
            <span className="font-medium">Type:</span>{' '}
            <span className="font-mono">{types}</span>
          </div>
          
          {field.format && (
            <div>
              <span className="font-medium">Format:</span>{' '}
              <span className="font-mono">{field.format}</span>
            </div>
          )}
          
          {field.enum && (
            <div>
              <span className="font-medium">Enum:</span>{' '}
              <span className="font-mono">{field.enum.map(v => JSON.stringify(v)).join(', ')}</span>
            </div>
          )}
          
          {(field.minLength !== undefined || field.maxLength !== undefined) && (
            <div>
              <span className="font-medium">Length:</span>{' '}
              {field.minLength !== undefined && <span>{field.minLength}</span>}
              {field.minLength !== undefined && field.maxLength !== undefined && <span> - </span>}
              {field.maxLength !== undefined && <span>{field.maxLength}</span>}
            </div>
          )}
          
          {(field.minimum !== undefined || field.maximum !== undefined) && (
            <div>
              <span className="font-medium">Range:</span>{' '}
              {field.minimum !== undefined && <span>{field.minimum}</span>}
              {field.minimum !== undefined && field.maximum !== undefined && <span> - </span>}
              {field.maximum !== undefined && <span>{field.maximum}</span>}
            </div>
          )}
          
          {field.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>{' '}
              <span className="font-mono">
                {field.examples.slice(0, 2).map(ex => JSON.stringify(ex)).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSchema = (schema: InferredSchema, depth: number = 0): JSX.Element => {
    if (schema.type === 'object' && schema.fields) {
      return (
        <div className="space-y-1">
          {Array.from(schema.fields.values()).map(field => renderField(field, depth))}
        </div>
      );
    } else if (schema.type === 'array' && schema.items) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium">Array Items:</div>
          {renderSchema(schema.items, depth + 1)}
        </div>
      );
    } else {
      return (
        <div className="text-sm text-muted-foreground">
          Type: {schema.type}
          {schema.format && ` (${schema.format})`}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Inferred Schema</h3>
            <p className="text-sm text-muted-foreground">
              Automatically detected types and constraints
            </p>
          </div>
          
          <Button
            variant={showValidation ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowValidation(!showValidation)}
          >
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
            )}
            Validation
          </Button>
        </div>

        {showValidation && (
          <div className="space-y-2">
            <div className={`p-3 rounded-lg border ${
              validationResult.valid 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="font-medium text-sm">
                {getValidationSummary(validationResult)}
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-auto">
                <div className="text-sm font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Errors
                </div>
                {validationResult.errors.map((error, idx) => (
                  <div key={idx} className="text-xs p-2 bg-destructive/10 rounded">
                    <div className="font-mono font-medium">{error.path}</div>
                    <div className="text-muted-foreground">{error.message}</div>
                    <div className="mt-1">
                      <span className="text-muted-foreground">Expected:</span>{' '}
                      <span className="font-mono">{error.expected}</span>
                      {' | '}
                      <span className="text-muted-foreground">Got:</span>{' '}
                      <span className="font-mono">{error.actual}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-auto">
                <div className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Warnings
                </div>
                {validationResult.warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <div className="font-mono font-medium">{warning.path}</div>
                    <div className="text-muted-foreground">{warning.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Export as:</div>
          <div className="flex gap-1">
            <Button
              variant={exportFormat === 'json-schema' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setExportFormat('json-schema')}
            >
              JSON Schema
            </Button>
            <Button
              variant={exportFormat === 'typescript' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setExportFormat('typescript')}
            >
              TypeScript
            </Button>
            <Button
              variant={exportFormat === 'zod' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setExportFormat('zod')}
            >
              Zod
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Schema Structure</h4>
            <div className="border rounded-lg p-3 bg-muted/30">
              {renderSchema(schema)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Exported Schema</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="border rounded-lg p-3 bg-muted/30 overflow-auto text-xs font-mono max-h-[600px]">
              {exportedSchema}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
