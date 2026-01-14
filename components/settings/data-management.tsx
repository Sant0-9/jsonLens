'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Download, Upload, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { downloadExport, getExportStats, type ExportData } from '@/lib/settings/data-export'
import { readImportFile, importData, previewImportData, clearAllData, type ImportOptions } from '@/lib/settings/data-import'

type ImportMode = ImportOptions['mergeMode']

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportStats, setExportStats] = useState<Record<string, number> | null>(null)
  const [importPreview, setImportPreview] = useState<{
    stores: { name: string; count: number }[]
    version: number
    exportedAt: Date
    file: File
    data: ExportData
  } | null>(null)
  const [importResult, setImportResult] = useState<{
    success: boolean
    counts: Record<string, number>
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load export stats on mount
  useEffect(() => {
    getExportStats().then(setExportStats).catch(console.error)
  }, [])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      await downloadExport()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await readImportFile(file)
      const preview = previewImportData(data)
      setImportPreview({
        ...preview,
        file,
        data,
      })
    } catch (error) {
      console.error('Failed to read import file:', error)
      alert(error instanceof Error ? error.message : 'Failed to read import file')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!importPreview) return

    setIsImporting(true)
    try {
      const result = await importData(importPreview.data, { mergeMode: importMode })
      setImportResult({
        success: result.success,
        counts: result.importedCounts,
        errors: result.errors,
        warnings: result.warnings,
      })

      // Refresh stats
      const stats = await getExportStats()
      setExportStats(stats)
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: false,
        counts: {},
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: [],
      })
    } finally {
      setIsImporting(false)
      setImportPreview(null)
    }
  }, [importPreview, importMode])

  const handleClearAll = useCallback(async () => {
    setIsClearing(true)
    try {
      await clearAllData()
      const stats = await getExportStats()
      setExportStats(stats)
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear data:', error)
    } finally {
      setIsClearing(false)
    }
  }, [])

  const totalItems = exportStats
    ? Object.values(exportStats).reduce((sum, count) => sum + count, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Data</CardTitle>
          <CardDescription>
            Download all your data as a JSON file. This includes papers, notes, experiments,
            questions, settings, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportStats && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Data to export:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(exportStats).map(([store, count]) => (
                  <div key={store} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {store.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                Total: {totalItems} items
              </p>
            </div>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export All Data
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Data</CardTitle>
          <CardDescription>
            Restore data from a previously exported JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Select Import File
          </Button>
        </CardContent>
      </Card>

      {/* Clear Data Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete all data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowClearConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog open={!!importPreview} onOpenChange={() => setImportPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review the data before importing
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              <div className="text-sm">
                <p>
                  <span className="text-muted-foreground">File:</span>{' '}
                  {importPreview.file.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Exported:</span>{' '}
                  {importPreview.exportedAt.toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Version:</span>{' '}
                  {importPreview.version}
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Data to import:</p>
                <div className="space-y-1 text-sm">
                  {importPreview.stores.map(({ name, count }) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {name.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-mono">{count} items</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Import Mode</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={importMode === 'merge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('merge')}
                  >
                    Merge
                  </Button>
                  <Button
                    variant={importMode === 'replace' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('replace')}
                  >
                    Replace
                  </Button>
                  <Button
                    variant={importMode === 'skip' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('skip')}
                  >
                    Skip Existing
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {importMode === 'merge' && 'Update existing items and add new ones'}
                  {importMode === 'replace' && 'Clear existing data and import all'}
                  {importMode === 'skip' && 'Only import items that do not exist'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportPreview(null)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={!!importResult} onOpenChange={() => setImportResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult?.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              {importResult?.success ? 'Import Successful' : 'Import Completed with Issues'}
            </DialogTitle>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Imported:</p>
                <div className="space-y-1 text-sm">
                  {Object.entries(importResult.counts).map(([name, count]) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {name.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-mono">{count} items</span>
                    </div>
                  ))}
                </div>
              </div>

              {importResult.warnings.length > 0 && (
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Warnings:</p>
                  <ul className="text-sm text-yellow-600 list-disc list-inside">
                    {importResult.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">Errors:</p>
                  <ul className="text-sm text-destructive list-disc list-inside">
                    {importResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setImportResult(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your data including papers, notes, experiments,
              questions, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-destructive/10 rounded-lg text-sm text-destructive">
            We recommend exporting your data before clearing.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={isClearing}
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Yes, Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
