"use client"

import { useState, useCallback, useRef } from 'react';
import { Upload, FileJson, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJsonStore } from '@/store/json-store';
import { parseJson } from '@/lib/json-parser';

export function JsonImport() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setJsonData, setError, setLoading, jsonData, clearData } = useJsonStore();

  const processJsonText = useCallback(
    (text: string, fileName?: string) => {
      setLoading(true);
      
      // Use setTimeout to allow UI to update
      setTimeout(() => {
        const result = parseJson(text);
        
        if (result.success && result.data !== undefined) {
          setJsonData(result.data, text, fileName);
        } else if (result.error) {
          setError(result.error);
        }
        
        setLoading(false);
      }, 10);
    },
    [setJsonData, setError, setLoading]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.json')) {
        setError({
          message: 'Please select a valid JSON file',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processJsonText(text, file.name);
      };
      reader.onerror = () => {
        setError({
          message: 'Failed to read file',
        });
      };
      reader.readAsText(file);
    },
    [processJsonText, setError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      processJsonText(text);
    } catch {
      setError({
        message: 'Failed to read from clipboard. Please check permissions.',
      });
    }
  }, [processJsonText, setError]);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleStartFresh = useCallback(() => {
    if (confirm('This will clear the current data and start fresh. Are you sure?')) {
      clearData();
    }
  }, [clearData]);

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-import-area
        className={`
          relative rounded-lg border-2 border-dashed transition-all duration-200
          ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center p-12 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <FileJson className="relative w-16 h-16 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              {jsonData ? 'Load New JSON Data' : 'Import JSON Data'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {jsonData 
                ? 'Load a different JSON file to replace the current data'
                : 'Drag and drop a JSON file here, paste from clipboard, or browse your files'
              }
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleBrowse} size="lg">
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
            <Button onClick={handlePaste} variant="outline" size="lg">
              <Clipboard className="mr-2 h-4 w-4" />
              Paste JSON
            </Button>
            {jsonData && (
              <Button onClick={handleStartFresh} variant="destructive" size="lg">
                <FileJson className="mr-2 h-4 w-4" />
                Start Fresh
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Supports files up to 100MB</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Local processing only</span>
        </div>
      </div>
    </div>
  );
}
