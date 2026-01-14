/**
 * LaTeX Online Compiler
 *
 * Uses the latex.ytotech.com API for LaTeX compilation.
 * Free tier: 1000 compilations per month.
 *
 * API Documentation: https://github.com/YtoTech/latex-on-http
 */

import type { CompilationResult, CompilationError, CompilerOptions } from './types'
import { parseCompilationLog } from './types'

interface LatexOnlineResource {
  path: string
  content?: string
  url?: string
}

interface LatexOnlineRequest {
  compiler: 'pdflatex' | 'xelatex' | 'lualatex'
  resources: LatexOnlineResource[]
}

interface ProjectFile {
  name: string
  path: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
}

const LATEX_ONLINE_API = 'https://latex.ytotech.com/builds/sync'

/**
 * Compile a single LaTeX file using latex.online API
 */
export async function compileWithLatexOnline(
  content: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  const engine = options.engine || 'pdflatex'

  const request: LatexOnlineRequest = {
    compiler: engine,
    resources: [
      {
        path: 'main.tex',
        content: content
      }
    ]
  }

  return sendCompilationRequest(request)
}

/**
 * Compile a multi-file LaTeX project using latex.online API
 */
export async function compileProjectWithLatexOnline(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  const engine = options.engine || 'pdflatex'

  // Convert project files to latex.online resources
  const resources: LatexOnlineResource[] = files
    .filter(f => f.type !== 'image') // Images need special handling
    .map(f => ({
      path: f.path || f.name,
      content: f.content
    }))

  // Ensure main file is named correctly for compilation
  const mainFileResource = resources.find(r =>
    r.path === mainFile || r.path === mainFile.replace(/^\//, '')
  )

  if (!mainFileResource) {
    return {
      success: false,
      log: ['Main file not found in project'],
      errors: [{ message: `Main file "${mainFile}" not found in project files` }],
      warnings: []
    }
  }

  // Move main file to first position (latex.online compiles first .tex file)
  const sortedResources = [
    { ...mainFileResource, path: 'main.tex' },
    ...resources.filter(r => r !== mainFileResource)
  ]

  const request: LatexOnlineRequest = {
    compiler: engine,
    resources: sortedResources
  }

  return sendCompilationRequest(request)
}

/**
 * Send compilation request to latex.online API
 */
async function sendCompilationRequest(
  request: LatexOnlineRequest
): Promise<CompilationResult> {
  try {
    const response = await fetch(LATEX_ONLINE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    // latex.online returns PDF directly on success, or JSON error on failure
    const contentType = response.headers.get('content-type') || ''

    if (response.ok && contentType.includes('application/pdf')) {
      // Success - PDF returned directly
      const arrayBuffer = await response.arrayBuffer()
      const pdf = new Uint8Array(arrayBuffer)

      return {
        success: true,
        pdf,
        log: ['Compilation successful'],
        errors: [],
        warnings: []
      }
    }

    // Error case - try to parse JSON error
    if (contentType.includes('application/json')) {
      const errorData = await response.json()
      return handleErrorResponse(errorData)
    }

    // Text error (compilation log)
    const textResponse = await response.text()
    return parseCompilationOutput(textResponse)

  } catch (error) {
    return {
      success: false,
      log: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{
        message: error instanceof Error
          ? `Failed to connect to compilation service: ${error.message}`
          : 'Failed to connect to compilation service'
      }],
      warnings: []
    }
  }
}

/**
 * Handle error response from latex.online
 */
function handleErrorResponse(errorData: Record<string, unknown>): CompilationResult {
  const errors: CompilationError[] = []
  const log: string[] = []

  // Extract error message
  if (errorData.error) {
    errors.push({ message: String(errorData.error) })
    log.push(`Error: ${errorData.error}`)
  }

  // Extract compilation log if available
  if (errorData.logs && typeof errorData.logs === 'string') {
    const logLines = errorData.logs.split('\n')
    log.push(...logLines)

    // Parse log for additional errors
    const { errors: logErrors, warnings } = parseCompilationLog(errorData.logs)
    errors.push(...logErrors)

    return {
      success: false,
      log,
      errors: errors.length > 0 ? errors : [{ message: 'Compilation failed' }],
      warnings
    }
  }

  return {
    success: false,
    log: log.length > 0 ? log : ['Compilation failed'],
    errors: errors.length > 0 ? errors : [{ message: 'Unknown compilation error' }],
    warnings: []
  }
}

/**
 * Parse compilation output text for errors and warnings
 */
function parseCompilationOutput(output: string): CompilationResult {
  const lines = output.split('\n')
  const { errors, warnings } = parseCompilationLog(output)

  // Check if it looks like a successful compilation without PDF
  // (This shouldn't happen with latex.online but handle it)
  const hasOutput = output.includes('Output written on')

  return {
    success: hasOutput && errors.length === 0,
    log: lines,
    errors: errors.length > 0 ? errors : (hasOutput ? [] : [{ message: 'Compilation produced no output' }]),
    warnings
  }
}

/**
 * Check if latex.online service is available
 */
export async function checkLatexOnlineStatus(): Promise<{
  available: boolean
  message: string
}> {
  try {
    // Send a minimal test request
    const response = await fetch(LATEX_ONLINE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiler: 'pdflatex',
        resources: [
          {
            path: 'test.tex',
            content: '\\documentclass{article}\\begin{document}test\\end{document}'
          }
        ]
      })
    })

    if (response.ok) {
      return {
        available: true,
        message: 'latex.online service is available'
      }
    }

    return {
      available: false,
      message: `Service returned status ${response.status}`
    }
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}
