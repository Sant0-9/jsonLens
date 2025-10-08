"use client"

import Link from 'next/link';
import { useMemo } from 'react';
import { useJsonStore } from '@/store/json-store';
import { profileData } from '@/lib/data-profiler';

export default function DiagnosticsPage() {
  const { jsonData, fileName, fileSize, view, error } = useJsonStore();
  const profile = useMemo(() => (jsonData ? profileData(jsonData) : null), [jsonData]);
  const memoryEstimate = useMemo(() => (jsonData ? new Blob([JSON.stringify(jsonData)]).size : 0), [jsonData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Diagnostics</h1>
        <p className="text-sm text-muted-foreground">Local-only observability and basic runtime info</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Dataset</h2>
          <div className="text-sm space-y-1">
            <div>File: {fileName || 'N/A'}</div>
            <div>Size on disk: {(fileSize / 1024).toFixed(2)} KB</div>
            <div>In-memory estimate: {(memoryEstimate / 1024).toFixed(2)} KB</div>
            <div>Current view: {view}</div>
            {error && <div className="text-red-600">Error: {error.message}</div>}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Profile</h2>
          {profile ? (
            <div className="text-sm space-y-1">
              <div>Records: {profile.totalRecords.toLocaleString()}</div>
              <div>Fields: {profile.totalFields.toLocaleString()}</div>
              <div>Depth: {profile.depth}</div>
              <div>Serialized length: {profile.size.toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data loaded</div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm underline">Back to app</Link>
      </div>
    </div>
  );
}

