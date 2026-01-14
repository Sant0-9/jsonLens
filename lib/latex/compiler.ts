/**
 * LaTeX Compiler Module
 *
 * Provides both client-side (WASM) and server-side compilation options.
 * WASM compilation works completely offline - no server needed.
 * Falls back to server compilation for complex documents (TikZ, bibliography, etc.)
 */

import {
  compileWithWASM as wasmCompile,
  compileProjectWithWASM,
  initializeWASMEngine,
  isWASMEngineReady,
  isWASMSupported,
} from './wasm-compiler'

// Re-export types from shared types module
export type {
  CompilationResult,
  CompilationError,
  CompilerOptions,
} from './types'

export { parseCompilationLog } from './types'

import type { CompilationResult, CompilerOptions } from './types'

/**
 * Initialize the WebAssembly LaTeX compiler
 * This loads SwiftLaTeX WASM files on demand
 */
export async function initializeWASM(): Promise<boolean> {
  if (!isWASMSupported()) {
    return false
  }
  return initializeWASMEngine('pdftex')
}

/**
 * Check if WASM compilation is available
 */
export function isWASMAvailable(): boolean {
  return isWASMSupported() && isWASMEngineReady('pdftex')
}

/**
 * Compile LaTeX using WebAssembly (client-side)
 * Works completely offline - no server needed
 */
export async function compileWithWASM(
  content: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  return wasmCompile(content, options)
}

/**
 * Compile multi-file project using WASM
 */
export { compileProjectWithWASM }

/**
 * Compile LaTeX using server-side API
 * Supports complex documents, TikZ, bibliography, etc.
 */
export async function compileWithServer(
  content: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  try {
    const response = await fetch('/api/latex/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        engine: options.engine || 'pdflatex',
        format: options.outputFormat || 'pdf',
        timeout: options.timeout || 60000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Server error' }))
      return {
        success: false,
        log: [errorData.error || 'Server compilation failed'],
        errors: [{ message: errorData.error || 'Server compilation failed' }],
        warnings: []
      }
    }

    const data = await response.json()

    // Decode base64 PDF if present
    let pdf: Uint8Array | undefined
    if (data.pdf) {
      const binaryString = atob(data.pdf)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      pdf = bytes
    }

    return {
      success: data.success,
      pdf,
      log: data.log || [],
      errors: data.errors || [],
      warnings: data.warnings || []
    }
  } catch (error) {
    return {
      success: false,
      log: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{ message: error instanceof Error ? error.message : 'Network error' }],
      warnings: []
    }
  }
}

/**
 * Compile LaTeX with automatic fallback
 * Priority: WASM (offline) -> Server (online)
 * WASM works completely offline - no server required
 */
export async function compile(
  content: string,
  options: CompilerOptions = {},
  preferServer = false
): Promise<CompilationResult> {
  // Check if document is complex (may need server for TikZ, bibliography, etc.)
  const needsServer = preferServer || documentNeedsServer(content)

  // Always try WASM first for offline capability
  if (!needsServer) {
    // Initialize WASM if not ready
    if (!isWASMAvailable()) {
      await initializeWASM()
    }

    if (isWASMAvailable()) {
      const result = await compileWithWASM(content, options)
      if (result.success) {
        return result
      }
      // If WASM fails but we're offline, return the error
      if (!navigator.onLine) {
        return result
      }
      // Fall back to server on WASM failure (if online)
    }
  }

  // Try server compilation (requires network)
  if (!navigator.onLine) {
    return {
      success: false,
      log: ['No network connection and document requires server compilation'],
      errors: [{
        message: 'This document requires server compilation (TikZ, bibliography, etc.) but you are offline.'
      }],
      warnings: [],
    }
  }

  return compileWithServer(content, options)
}

/**
 * Compile LaTeX with explicit settings
 * Allows passing compilation settings for router
 */
export async function compileWithSettings(
  content: string,
  options: CompilerOptions = {},
  settings?: { method: 'docker' | 'remote' | 'online'; remoteUrl?: string; defaultEngine?: 'pdflatex' | 'xelatex' | 'lualatex' }
): Promise<CompilationResult> {
  try {
    const response = await fetch('/api/latex/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        engine: options.engine || settings?.defaultEngine || 'pdflatex',
        format: options.outputFormat || 'pdf',
        timeout: options.timeout || 60000,
        settings
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Server error' }))
      return {
        success: false,
        log: [errorData.error || 'Server compilation failed'],
        errors: [{ message: errorData.error || 'Server compilation failed' }],
        warnings: []
      }
    }

    const data = await response.json()

    // Decode base64 PDF if present
    let pdf: Uint8Array | undefined
    if (data.pdf) {
      const binaryString = atob(data.pdf)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      pdf = bytes
    }

    return {
      success: data.success,
      pdf,
      log: data.log || [],
      errors: data.errors || [],
      warnings: data.warnings || []
    }
  } catch (error) {
    return {
      success: false,
      log: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{ message: error instanceof Error ? error.message : 'Network error' }],
      warnings: []
    }
  }
}

/**
 * Check if document requires server-side compilation
 * (complex packages, TikZ, bibliography, etc.)
 */
function documentNeedsServer(content: string): boolean {
  const serverOnlyPatterns = [
    /\\usepackage\{tikz\}/,
    /\\usepackage\{pgfplots\}/,
    /\\bibliography\{/,
    /\\addbibresource\{/,
    /\\usepackage\{biblatex\}/,
    /\\includegraphics/,
    /\\input\{/,
    /\\include\{/,
    /\\usepackage\{minted\}/,
    /\\usepackage\{listings\}/,
  ]

  return serverOnlyPatterns.some(pattern => pattern.test(content))
}

/**
 * Download compiled PDF
 */
export function downloadPDF(pdf: Uint8Array, filename = 'document.pdf'): void {
  // Create a new ArrayBuffer and copy data to ensure compatibility with Blob
  const buffer = new ArrayBuffer(pdf.length)
  const view = new Uint8Array(buffer)
  view.set(pdf)

  const blob = new Blob([buffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
