"use client"

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJsonStore } from '@/store/json-store';

export function RawView() {
  const { rawJson } = useJsonStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rawJson]);

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="shadow-lg"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <pre className="p-6 overflow-auto font-mono text-sm bg-muted/30 rounded-lg">
        <code className="language-json">{rawJson}</code>
      </pre>
    </div>
  );
}
