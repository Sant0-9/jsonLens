"use client"

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJsonStore, JsonError as JsonErrorType } from '@/store/json-store';

interface JsonErrorProps {
  error: JsonErrorType;
}

export function JsonError({ error }: JsonErrorProps) {
  const { setError, clearData } = useJsonStore();

  const handleDismiss = () => {
    setError(null);
  };

  const handleClear = () => {
    clearData();
  };

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-destructive">JSON Parse Error</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {(error.line !== undefined || error.column !== undefined) && (
            <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded">
              {error.line !== undefined && (
                <span>Line {error.line}</span>
              )}
              {error.line !== undefined && error.column !== undefined && (
                <span>, </span>
              )}
              {error.column !== undefined && (
                <span>Column {error.column}</span>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Try Again
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
