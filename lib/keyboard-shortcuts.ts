"use client"

import { useEffect } from "react"
import { useJsonStore } from "@/store/json-store"

export function useKeyboardShortcuts() {
  const { view, setView, clearData, jsonData, searchQuery, setSearchQuery } = useJsonStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Cmd/Ctrl + number keys for view switching
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault()
        const viewMap: Record<string, typeof view> = {
          "1": "tree",
          "2": "table", 
          "3": "raw",
          "4": "diff",
          "5": "query",
          "6": "schema",
          "7": "diagram",
          "8": "graph",
          "9": "visualize"
        }
        const newView = viewMap[e.key]
        if (newView) {
          setView(newView)
        }
      }

      // Cmd/Ctrl + Shift + number for additional views
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key >= "1" && e.key <= "2") {
        e.preventDefault()
        const viewMap: Record<string, typeof view> = {
          "1": "transform",
          "2": "api"
        }
        const newView = viewMap[e.key]
        if (newView) {
          setView(newView)
        }
      }

      // Cmd/Ctrl + K for command palette (handled by command palette component)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        // This is handled by the command palette component
      }

      // Cmd/Ctrl + F for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }

      // Cmd/Ctrl + A for select all (in tree/table views)
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        // This could be implemented to select all items in the current view
        // For now, we'll let the default behavior handle it
      }

      // Cmd/Ctrl + C for copy (if data is selected)
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        // This could be implemented to copy selected data
        // For now, we'll let the default behavior handle it
      }

      // Escape to clear search
      if (e.key === "Escape") {
        if (searchQuery) {
          e.preventDefault()
          setSearchQuery("")
        }
      }

      // Delete key to clear data (with confirmation)
      if (e.key === "Delete" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (jsonData && confirm("Are you sure you want to clear all data?")) {
          clearData()
        }
      }

      // Space to toggle expand/collapse in tree view
      if (e.key === " " && view === "tree") {
        e.preventDefault()
        // This would need to be implemented in the tree view component
        // to toggle the currently focused node
      }

      // Arrow keys for navigation (in tree/table views)
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        // This would need to be implemented in the respective view components
        // to navigate between items
      }

      // Enter to expand/collapse in tree view
      if (e.key === "Enter" && view === "tree") {
        e.preventDefault()
        // This would need to be implemented in the tree view component
        // to expand/collapse the currently focused node
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [view, setView, clearData, jsonData, searchQuery, setSearchQuery])
}

export const keyboardShortcuts = {
  "Cmd+1-9": "Switch to view (Tree, Table, Raw, Diff, Query, Schema, Diagram, Graph, Visualize)",
  "Cmd+Shift+1-2": "Switch to additional views (Transform, API)",
  "Cmd+K": "Open command palette",
  "Cmd+F": "Focus search",
  "Escape": "Clear search or close modals",
  "Cmd+Delete": "Clear all data",
  "Space": "Toggle expand/collapse (Tree view)",
  "Arrow Keys": "Navigate items (Tree/Table views)",
  "Enter": "Expand/collapse node (Tree view)"
}