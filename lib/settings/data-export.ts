/**
 * Data export functionality for Research Workbench
 * Exports all IndexedDB stores to a downloadable JSON file
 */

import { openDB } from 'idb'
import { DB_NAME, DB_VERSION, STORES } from '@/lib/db/schema'

export interface ExportData {
  version: number
  exportedAt: number
  stores: {
    [key: string]: unknown[]
  }
}

/**
 * Export all data from IndexedDB stores
 */
export async function exportAllData(): Promise<ExportData> {
  const db = await openDB(DB_NAME, DB_VERSION)

  const exportData: ExportData = {
    version: DB_VERSION,
    exportedAt: Date.now(),
    stores: {},
  }

  // Get all store names
  const storeNames = Object.values(STORES)

  for (const storeName of storeNames) {
    try {
      // Check if store exists
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const data = await store.getAll()
        exportData.stores[storeName] = data
      }
    } catch {
      // Store might not exist yet, skip it
      console.warn(`Store ${storeName} not accessible during export`)
      exportData.stores[storeName] = []
    }
  }

  db.close()
  return exportData
}

/**
 * Download exported data as JSON file
 */
export async function downloadExport(filename?: string): Promise<void> {
  const data = await exportAllData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const defaultFilename = `research-workbench-export-${timestamp}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename || defaultFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export specific stores only
 */
export async function exportStores(storeNames: string[]): Promise<ExportData> {
  const db = await openDB(DB_NAME, DB_VERSION)

  const exportData: ExportData = {
    version: DB_VERSION,
    exportedAt: Date.now(),
    stores: {},
  }

  for (const storeName of storeNames) {
    try {
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const data = await store.getAll()
        exportData.stores[storeName] = data
      }
    } catch {
      exportData.stores[storeName] = []
    }
  }

  db.close()
  return exportData
}

/**
 * Get data statistics for export preview
 */
export async function getExportStats(): Promise<Record<string, number>> {
  const db = await openDB(DB_NAME, DB_VERSION)
  const stats: Record<string, number> = {}

  const storeNames = Object.values(STORES)

  for (const storeName of storeNames) {
    try {
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const count = await store.count()
        stats[storeName] = count
      } else {
        stats[storeName] = 0
      }
    } catch {
      stats[storeName] = 0
    }
  }

  db.close()
  return stats
}
