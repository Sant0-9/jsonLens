"use client"

import { useEffect } from "react"
import { initializeCrashRecovery } from "@/lib/crash-recovery"

export function CrashRecovery() {
  useEffect(() => {
    const cleanup = initializeCrashRecovery()
    return cleanup
  }, [])

  return null
}