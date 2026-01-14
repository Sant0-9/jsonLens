/**
 * Data import functionality for Research Workbench
 * Imports data from exported JSON files with validation
 */

import { openDB } from 'idb'
import { DB_NAME, DB_VERSION, STORES } from '@/lib/db/schema'
import type { ExportData } from './data-export'

export interface ImportResult {
  success: boolean
  importedCounts: Record<string, number>
  errors: string[]
  warnings: string[]
}

export interface ImportOptions {
  mergeMode: 'replace' | 'merge' | 'skip'
  selectedStores?: string[]
}

/**
 * Validate export data structure
 */
export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (typeof d.version !== 'number') return false
  if (typeof d.exportedAt !== 'number') return false
  if (!d.stores || typeof d.stores !== 'object') return false

  return true
}

/**
 * Read and parse import file
 */
export async function readImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)

        if (!validateExportData(data)) {
          reject(new Error('Invalid export file format'))
          return
        }

        resolve(data)
      } catch {
        reject(new Error('Failed to parse import file'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read import file'))
    reader.readAsText(file)
  })
}

/**
 * Import data into IndexedDB
 */
export async function importData(
  data: ExportData,
  options: ImportOptions = { mergeMode: 'merge' }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedCounts: {},
    errors: [],
    warnings: [],
  }

  // Check version compatibility
  if (data.version > DB_VERSION) {
    result.errors.push(`Export version (${data.version}) is newer than current version (${DB_VERSION}). Please update the application.`)
    return result
  }

  if (data.version < DB_VERSION) {
    result.warnings.push(`Export version (${data.version}) is older than current version (${DB_VERSION}). Some data might need migration.`)
  }

  try {
    const db = await openDB(DB_NAME, DB_VERSION)
    const validStoreNames = Object.values(STORES)
    const storesToImport = options.selectedStores || Object.keys(data.stores)

    for (const storeName of storesToImport) {
      // Skip invalid store names
      if (!validStoreNames.includes(storeName as typeof validStoreNames[number])) {
        result.warnings.push(`Unknown store "${storeName}" - skipped`)
        continue
      }

      const storeData = data.stores[storeName]
      if (!Array.isArray(storeData)) {
        result.warnings.push(`Invalid data for store "${storeName}" - skipped`)
        continue
      }

      try {
        // Check if store exists in database
        if (!db.objectStoreNames.contains(storeName)) {
          result.warnings.push(`Store "${storeName}" doesn't exist in database - skipped`)
          continue
        }

        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)

        // Clear existing data if replace mode
        if (options.mergeMode === 'replace') {
          await store.clear()
        }

        let importedCount = 0

        for (const item of storeData) {
          if (typeof item !== 'object' || !item) continue

          try {
            if (options.mergeMode === 'skip') {
              // Check if item exists
              const existingKey = (item as Record<string, unknown>).id as IDBValidKey | undefined
              if (existingKey !== undefined) {
                const existing = await store.get(existingKey)
                if (existing) continue
              }
            }

            await store.put(item)
            importedCount++
          } catch (itemError) {
            result.warnings.push(`Failed to import item in "${storeName}": ${itemError}`)
          }
        }

        await tx.done
        result.importedCounts[storeName] = importedCount
      } catch (storeError) {
        result.errors.push(`Failed to import store "${storeName}": ${storeError}`)
      }
    }

    db.close()
    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Database error: ${error}`)
  }

  return result
}

/**
 * Preview import data before actual import
 */
export function previewImportData(data: ExportData): {
  stores: { name: string; count: number }[]
  version: number
  exportedAt: Date
} {
  return {
    stores: Object.entries(data.stores).map(([name, items]) => ({
      name,
      count: Array.isArray(items) ? items.length : 0,
    })),
    version: data.version,
    exportedAt: new Date(data.exportedAt),
  }
}

/**
 * Clear all data (dangerous - for testing)
 */
export async function clearAllData(): Promise<void> {
  const db = await openDB(DB_NAME, DB_VERSION)
  const storeNames = [...db.objectStoreNames]

  for (const storeName of storeNames) {
    const tx = db.transaction(storeName, 'readwrite')
    await tx.objectStore(storeName).clear()
    await tx.done
  }

  db.close()
}
