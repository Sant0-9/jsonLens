"use client"

import { useJsonStore } from "@/store/json-store"
import { StatusBar } from "@/components/status-bar"

export function ConditionalStatusBar() {
  const { jsonData, error, isLoading } = useJsonStore()

  // Only show the status bar when there's data, an error, or loading
  if (!jsonData && !error && !isLoading) {
    return null
  }

  return <StatusBar />
}