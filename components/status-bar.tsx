"use client"

import { useJsonStore } from "@/store/json-store"
import { FileText, AlertCircle, CheckCircle, Clock, Save } from "lucide-react"

export function StatusBar() {
  const { jsonData, fileName, fileSize, error, isLoading, lastSaved, hasUnsavedChanges } = useJsonStore()

  const getItemCount = () => {
    if (!jsonData) return 0
    if (Array.isArray(jsonData)) return jsonData.length
    if (typeof jsonData === "object") return Object.keys(jsonData).length
    return 1
  }

  const getFileSizeFormatted = () => {
    if (fileSize === 0) return "No file"
    const kb = fileSize / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    return `${kb.toFixed(1)} KB`
  }

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-3 w-3 animate-spin text-blue-500" />
    if (error) return <AlertCircle className="h-3 w-3 text-red-500" />
    if (jsonData) return <CheckCircle className="h-3 w-3 text-green-500" />
    return <FileText className="h-3 w-3 text-muted-foreground" />
  }

  const getStatusText = () => {
    if (isLoading) return "Loading..."
    if (error) return `Error: ${error.message}`
    if (jsonData) return "Ready"
    return "No data loaded"
  }

  return (
    <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground" data-status-bar>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          
          {fileName && (
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-32">{fileName}</span>
            </div>
          )}
          
          {fileSize > 0 && (
            <div className="flex items-center space-x-1">
              <span>Size: {getFileSizeFormatted()}</span>
            </div>
          )}
          
          {jsonData && (
            <div className="flex items-center space-x-1">
              <span>Items: {getItemCount().toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {error && error.line && (
            <div className="flex items-center space-x-1 text-red-500">
              <span>Line {error.line}</span>
              {error.column && <span>Col {error.column}</span>}
            </div>
          )}
          
          {jsonData && (
            <div className="flex items-center space-x-1">
              {hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-yellow-600">Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">
                    Saved {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                </>
              ) : null}
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <span>Press Cmd+K for commands</span>
          </div>
        </div>
      </div>
    </div>
  )
}