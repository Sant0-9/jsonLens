/**
 * Version Manager for LaTeX Projects
 *
 * Provides auto-save and version history functionality.
 */

import { put, get, remove, getAllByIndex, STORES } from '@/lib/db'
import type { VersionRecord } from '@/lib/db/schema'

// Re-export VersionRecord for use in components
export type { VersionRecord } from '@/lib/db/schema'

const MAX_VERSIONS_PER_PROJECT = 50
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a unique version ID
 */
function generateVersionId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Save a new version of a project
 */
export async function saveVersion(
  projectId: string,
  content: Record<string, string>,
  label?: string
): Promise<VersionRecord> {
  const version: VersionRecord = {
    projectId,
    versionId: generateVersionId(),
    content,
    timestamp: Date.now(),
    label
  }

  await put(STORES.VERSIONS, version)

  // Cleanup old versions to stay under the limit
  await cleanupOldVersions(projectId)

  return version
}

/**
 * Get all versions for a project
 */
export async function getProjectVersions(projectId: string): Promise<VersionRecord[]> {
  const versions = await getAllByIndex<VersionRecord>(STORES.VERSIONS, 'projectId', projectId)

  // Sort by timestamp descending (newest first)
  return versions.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get a specific version
 */
export async function getVersion(
  projectId: string,
  versionId: string
): Promise<VersionRecord | undefined> {
  return get<VersionRecord>(STORES.VERSIONS, versionId)
}

/**
 * Delete a specific version
 */
export async function deleteVersion(
  projectId: string,
  versionId: string
): Promise<void> {
  await remove(STORES.VERSIONS, versionId)
}

/**
 * Update version label
 */
export async function updateVersionLabel(
  projectId: string,
  versionId: string,
  label: string | undefined
): Promise<void> {
  const version = await get<VersionRecord>(STORES.VERSIONS, versionId)

  if (version) {
    version.label = label
    await put(STORES.VERSIONS, version)
  }
}

/**
 * Delete all versions for a project
 */
export async function deleteAllProjectVersions(projectId: string): Promise<void> {
  const versions = await getProjectVersions(projectId)

  for (const version of versions) {
    await remove(STORES.VERSIONS, version.versionId)
  }
}

/**
 * Cleanup old versions, keeping only the most recent ones
 */
async function cleanupOldVersions(projectId: string): Promise<void> {
  const versions = await getProjectVersions(projectId)

  // If over limit, delete oldest versions
  if (versions.length > MAX_VERSIONS_PER_PROJECT) {
    const toDelete = versions.slice(MAX_VERSIONS_PER_PROJECT)

    for (const version of toDelete) {
      await remove(STORES.VERSIONS, version.versionId)
    }
  }
}

/**
 * Compare two versions and return the diff
 */
export function compareVersions(
  oldVersion: VersionRecord,
  newVersion: VersionRecord
): VersionDiff {
  const diff: VersionDiff = {
    oldVersionId: oldVersion.versionId,
    newVersionId: newVersion.versionId,
    oldTimestamp: oldVersion.timestamp,
    newTimestamp: newVersion.timestamp,
    files: []
  }

  const allFiles = new Set([
    ...Object.keys(oldVersion.content),
    ...Object.keys(newVersion.content)
  ])

  for (const fileName of allFiles) {
    const oldContent = oldVersion.content[fileName]
    const newContent = newVersion.content[fileName]

    if (!oldContent && newContent) {
      diff.files.push({
        fileName,
        status: 'added',
        oldContent: '',
        newContent
      })
    } else if (oldContent && !newContent) {
      diff.files.push({
        fileName,
        status: 'deleted',
        oldContent,
        newContent: ''
      })
    } else if (oldContent !== newContent) {
      diff.files.push({
        fileName,
        status: 'modified',
        oldContent: oldContent || '',
        newContent: newContent || ''
      })
    }
  }

  return diff
}

/**
 * Generate line-by-line diff for a single file
 */
export function generateLineDiff(oldContent: string, newContent: string): LineDiff[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const result: LineDiff[] = []

  // Simple LCS-based diff algorithm
  const lcs = computeLCS(oldLines, newLines)

  let oldIdx = 0
  let newIdx = 0
  let lcsIdx = 0

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length) {
      // Output removed lines until we hit the next LCS match
      while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcs[lcsIdx]) {
        result.push({
          type: 'removed',
          lineNumber: oldIdx + 1,
          content: oldLines[oldIdx]
        })
        oldIdx++
      }

      // Output added lines until we hit the next LCS match
      while (newIdx < newLines.length && newLines[newIdx] !== lcs[lcsIdx]) {
        result.push({
          type: 'added',
          lineNumber: newIdx + 1,
          content: newLines[newIdx]
        })
        newIdx++
      }

      // Output the matching line
      if (oldIdx < oldLines.length && newIdx < newLines.length) {
        result.push({
          type: 'unchanged',
          lineNumber: newIdx + 1,
          content: newLines[newIdx]
        })
        oldIdx++
        newIdx++
        lcsIdx++
      }
    } else {
      // No more LCS matches, output remaining lines
      while (oldIdx < oldLines.length) {
        result.push({
          type: 'removed',
          lineNumber: oldIdx + 1,
          content: oldLines[oldIdx]
        })
        oldIdx++
      }
      while (newIdx < newLines.length) {
        result.push({
          type: 'added',
          lineNumber: newIdx + 1,
          content: newLines[newIdx]
        })
        newIdx++
      }
    }
  }

  return result
}

/**
 * Compute Longest Common Subsequence of two string arrays
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length
  const n = b.length

  // DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find LCS
  const result: string[] = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return result
}

// Type definitions
export interface VersionDiff {
  oldVersionId: string
  newVersionId: string
  oldTimestamp: number
  newTimestamp: number
  files: FileDiff[]
}

export interface FileDiff {
  fileName: string
  status: 'added' | 'deleted' | 'modified'
  oldContent: string
  newContent: string
}

export interface LineDiff {
  type: 'added' | 'removed' | 'unchanged'
  lineNumber: number
  content: string
}

// Auto-save manager class
export class AutoSaveManager {
  private projectId: string | null = null
  private intervalId: number | null = null
  private lastContent: Record<string, string> = {}
  private getContent: () => Record<string, string>

  constructor(getContentFn: () => Record<string, string>) {
    this.getContent = getContentFn
  }

  start(projectId: string): void {
    this.stop()
    this.projectId = projectId
    this.lastContent = this.getContent()

    this.intervalId = window.setInterval(() => {
      this.checkAndSave()
    }, AUTO_SAVE_INTERVAL)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.projectId = null
  }

  private async checkAndSave(): Promise<void> {
    if (!this.projectId) return

    const currentContent = this.getContent()

    // Check if content has changed
    const hasChanged = this.hasContentChanged(currentContent)

    if (hasChanged) {
      await saveVersion(this.projectId, currentContent)
      this.lastContent = currentContent
    }
  }

  private hasContentChanged(current: Record<string, string>): boolean {
    const lastKeys = Object.keys(this.lastContent)
    const currentKeys = Object.keys(current)

    if (lastKeys.length !== currentKeys.length) return true

    for (const key of currentKeys) {
      if (this.lastContent[key] !== current[key]) return true
    }

    return false
  }

  // Manual save
  async saveNow(label?: string): Promise<VersionRecord | null> {
    if (!this.projectId) return null

    const currentContent = this.getContent()
    const version = await saveVersion(this.projectId, currentContent, label)
    this.lastContent = currentContent
    return version
  }
}

/**
 * Format timestamp as relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }
  return 'Just now'
}

/**
 * Format timestamp as absolute date
 */
export function formatAbsoluteTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
