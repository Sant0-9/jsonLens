"use client"

import { useJsonStore } from "@/store/json-store"
import type { JsonState, JsonValue } from "@/store/json-store"

interface CrashRecoveryData {
  jsonData: JsonValue
  rawJson: string
  fileName: string | null
  fileSize: number
  view: JsonState["view"]
  timestamp: number
  sessionId: string
}

const SESSION_KEY = 'jsonlens-session'
const CRASH_RECOVERY_KEY = 'jsonlens-crash-recovery'

export function initializeCrashRecovery() {
  if (typeof window === 'undefined') return

  // Generate a unique session ID
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  sessionStorage.setItem(SESSION_KEY, sessionId)

  // Set up beforeunload handler to save state
  const handleBeforeUnload = () => {
    const state = useJsonStore.getState()
    if (state.jsonData) {
      const recoveryData: CrashRecoveryData = {
        jsonData: state.jsonData,
        rawJson: state.rawJson,
        fileName: state.fileName,
        fileSize: state.fileSize,
        view: state.view,
        timestamp: Date.now(),
        sessionId
      }
      localStorage.setItem(CRASH_RECOVERY_KEY, JSON.stringify(recoveryData))
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  // Check for crash recovery data on load
  const checkForCrashRecovery = () => {
    try {
      const recoveryDataStr = localStorage.getItem(CRASH_RECOVERY_KEY)
      if (recoveryDataStr) {
        const recoveryData: CrashRecoveryData = JSON.parse(recoveryDataStr)
        
        // Check if this is from a different session (crash)
        const currentSessionId = sessionStorage.getItem(SESSION_KEY)
        if (recoveryData.sessionId !== currentSessionId) {
          // Show recovery dialog
          const shouldRecover = confirm(
            `JSONLens detected an unexpected closure. Would you like to recover your last session?\n\n` +
            `File: ${recoveryData.fileName || 'Untitled'}\n` +
            `Size: ${(recoveryData.fileSize / 1024).toFixed(1)} KB\n` +
            `Last saved: ${new Date(recoveryData.timestamp).toLocaleString()}`
          )
          
          if (shouldRecover) {
            const { setJsonData, setView } = useJsonStore.getState()
            setJsonData(
              recoveryData.jsonData,
              recoveryData.rawJson,
              recoveryData.fileName || undefined
            )
            setView(recoveryData.view)
          }
          
          // Clear recovery data after showing dialog
          localStorage.removeItem(CRASH_RECOVERY_KEY)
        }
      }
    } catch (error) {
      console.error('Error during crash recovery:', error)
      localStorage.removeItem(CRASH_RECOVERY_KEY)
    }
  }

  // Check for recovery data after a short delay to ensure store is initialized
  setTimeout(checkForCrashRecovery, 100)

  // Clean up old recovery data (older than 24 hours)
  const cleanupOldRecoveryData = () => {
    try {
      const recoveryDataStr = localStorage.getItem(CRASH_RECOVERY_KEY)
      if (recoveryDataStr) {
        const recoveryData: CrashRecoveryData = JSON.parse(recoveryDataStr)
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
        
        if (recoveryData.timestamp < twentyFourHoursAgo) {
          localStorage.removeItem(CRASH_RECOVERY_KEY)
        }
      }
    } catch (error) {
      console.error('Error cleaning up old recovery data:', error)
      localStorage.removeItem(CRASH_RECOVERY_KEY)
    }
  }

  cleanupOldRecoveryData()

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}

export function saveRecoverySnapshot() {
  if (typeof window === 'undefined') return

  const state = useJsonStore.getState()
  if (state.jsonData) {
    const sessionId = sessionStorage.getItem(SESSION_KEY) || 'unknown'
    const recoveryData: CrashRecoveryData = {
      jsonData: state.jsonData,
      rawJson: state.rawJson,
      fileName: state.fileName,
      fileSize: state.fileSize,
      view: state.view,
      timestamp: Date.now(),
      sessionId
    }
    
    try {
      localStorage.setItem(CRASH_RECOVERY_KEY, JSON.stringify(recoveryData))
    } catch (error) {
      console.error('Failed to save recovery snapshot:', error)
    }
  }
}

export function clearRecoveryData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CRASH_RECOVERY_KEY)
}
