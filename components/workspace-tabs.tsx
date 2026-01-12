"use client"

import React, { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Plus, FileText } from "lucide-react"
import { useJsonStore } from "@/store/json-store"
import type { JsonState, JsonValue } from "@/store/json-store"

interface WorkspaceTab {
  id: string
  name: string
  fileName: string | null
  fileSize: number
  jsonData: JsonValue | null
  rawJson: string
  view: JsonState["view"]
  searchQuery: string
  filterPath: string
  lastModified: number
}

export function WorkspaceTabs() {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  
  const {
    jsonData,
    rawJson,
    fileName,
    fileSize,
    view,
    searchQuery,
    filterPath,
    setJsonData,
    setView,
    setSearchQuery,
    setFilterPath,
    clearData
  } = useJsonStore()

  // Save current state to active tab when data changes
  const saveToActiveTab = useCallback(() => {
    if (activeTabId && jsonData) {
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId
          ? {
              ...tab,
              jsonData,
              rawJson,
              fileName,
              fileSize,
              view,
              searchQuery,
              filterPath,
              lastModified: Date.now()
            }
          : tab
      ))
    }
  }, [activeTabId, jsonData, rawJson, fileName, fileSize, view, searchQuery, filterPath])

  // Create new tab
  const createNewTab = () => {
    const newTab: WorkspaceTab = {
      id: `tab-${Date.now()}`,
      name: "New Tab",
      fileName: null,
      fileSize: 0,
      jsonData: null,
      rawJson: "",
      view: "tree",
      searchQuery: "",
      filterPath: "",
      lastModified: Date.now()
    }

    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    clearData()
    setSearchQuery("")
    setFilterPath("")
  }

  // Switch to tab
  const switchToTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setActiveTabId(tabId)
      if (tab.jsonData) {
        setJsonData(tab.jsonData, tab.rawJson, tab.fileName ?? undefined)
        setView(tab.view)
      } else {
        clearData()
      }
      // Restore search/filter state
      setSearchQuery(tab.searchQuery)
      setFilterPath(tab.filterPath)
    }
  }

  // Close tab
  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          const nextTab = newTabs[newTabs.length - 1]
          setActiveTabId(nextTab.id)
          if (nextTab.jsonData) {
            setJsonData(nextTab.jsonData, nextTab.rawJson, nextTab.fileName ?? undefined)
            setView(nextTab.view)
          } else {
            clearData()
          }
          // Restore search/filter state
          setSearchQuery(nextTab.searchQuery)
          setFilterPath(nextTab.filterPath)
        } else {
          setActiveTabId(null)
          clearData()
          setSearchQuery("")
          setFilterPath("")
        }
      }
      return newTabs
    })
  }

  // Update tab name when data changes
  const updateTabName = (tabId: string, name: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, name } : tab
    ))
  }

  // Auto-save current state when switching away
  const handleTabClick = (tabId: string) => {
    saveToActiveTab()
    switchToTab(tabId)
  }

  // Auto-save when data changes
  React.useEffect(() => {
    saveToActiveTab()
  }, [saveToActiveTab])

  // Update tab name when file name changes
  React.useEffect(() => {
    if (activeTabId && fileName) {
      updateTabName(activeTabId, fileName)
    }
  }, [fileName, activeTabId])

  if (tabs.length === 0) {
    return (
      <div className="border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">No open tabs</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewTab}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Tab
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center space-x-2 px-3 py-2 border-r border-border min-w-0 flex-shrink-0
              ${activeTabId === tab.id 
                ? 'bg-background border-b-2 border-b-primary' 
                : 'hover:bg-muted/50 cursor-pointer'
              }
            `}
            onClick={() => handleTabClick(tab.id)}
          >
            <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate max-w-32">
              {tab.name}
            </span>
            {tab.fileSize > 0 && (
              <span className="text-xs text-muted-foreground">
                ({(tab.fileSize / 1024).toFixed(1)}KB)
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={createNewTab}
          className="h-8 px-2 mx-2 flex-shrink-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
