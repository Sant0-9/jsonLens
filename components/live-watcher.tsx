"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useJsonStore } from '@/store/json-store';
import { parseJson } from '@/lib/json-parser';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

type FileHandleWithName = FileSystemFileHandle;

export function LiveWatcher() {
  const { setJsonData } = useJsonStore();
  const [watching, setWatching] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [lastModified, setLastModified] = useState<number | null>(null);
  const handleRef = useRef<FileHandleWithName | null>(null);
  const intervalRef = useRef<number | null>(null);

  const pickFile = useCallback(async () => {
    try {
      // @ts-expect-error File System Access API - may not exist in all browsers
      const [handle]: FileHandleWithName[] = await window.showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: false,
        multiple: false,
      });
      handleRef.current = handle;
      // Some TS DOM lib versions type `name` on FileSystemFileHandle; fall back defensively
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h: any = handle;
      setFileName((h.name as string) || 'watched.json');
      setWatching(true);
    } catch {
      // user cancelled
    }
  }, []);

  const stopWatching = useCallback(() => {
    setWatching(false);
    handleRef.current = null;
    setFileName('');
    setLastModified(null);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const checkForChanges = useCallback(async () => {
    const handle = handleRef.current;
    if (!handle) return;
    try {
      const file = await handle.getFile();
      if (!lastModified || file.lastModified !== lastModified) {
        const text = await file.text();
        const res = parseJson(text);
        if (res.success && res.data) {
          setJsonData(res.data, text, handle.name);
          setLastModified(file.lastModified);
        }
      }
    } catch {
      // If permission revoked or error, stop watching
      stopWatching();
    }
  }, [lastModified, setJsonData, stopWatching]);

  useEffect(() => {
    if (watching) {
      checkForChanges();
      intervalRef.current = window.setInterval(checkForChanges, 2000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
  }, [watching, checkForChanges]);

  return (
    <div className="flex items-center gap-2">
      {watching ? (
        <>
          <Button variant="outline" size="sm" onClick={checkForChanges} title="Refresh now">
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={stopWatching} title="Stop watching">
            <EyeOff className="h-3 w-3 mr-1" /> Stop {fileName && <span className="ml-1 truncate max-w-[120px]">{fileName}</span>}
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={pickFile} title="Watch a local JSON file for changes">
          <Eye className="h-3 w-3 mr-1" /> Watch File
        </Button>
      )}
    </div>
  );
}
