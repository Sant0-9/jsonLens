/**
 * Docker-based LaTeX Compiler (Client-side)
 *
 * Uses local Docker with texlive/texlive:latest-full image for unlimited compilation.
 * Requires Docker to be installed and running on the server.
 *
 * Features:
 * - Full TexLive support (TikZ, PGFPlots, forest, etc.)
 * - Multi-pass compilation (biber, makeglossaries, makeindex)
 * - shell-escape support for minted
 * - No rate limits
 */

import type { CompilationResult, CompilationError, CompilerOptions } from './types'
import { parseCompilationLog } from './types'

// Default timeout for complex documents (3 minutes)
const DEFAULT_DOCKER_TIMEOUT = 180000

interface ProjectFile {
  name: string
  path: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
}

/**
 * Check if Docker is available on the system
 * This can only be checked server-side
 */
export async function isDockerAvailable(): Promise<boolean> {
  // This function should be called via API endpoint
  // Client-side cannot directly check Docker availability
  try {
    const response = await fetch('/api/latex/docker-status')
    if (response.ok) {
      const data = await response.json()
      return data.available === true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Compile LaTeX using Docker
 * Sends request to server-side endpoint that handles Docker execution
 */
export async function compileWithDocker(
  content: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  const engine = options.engine || 'pdflatex'

  try {
    const response = await fetch('/api/latex/compile-docker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        engine,
        timeout: options.timeout || DEFAULT_DOCKER_TIMEOUT
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Docker compilation failed' }))
      return {
        success: false,
        log: [errorData.error || 'Docker compilation failed'],
        errors: [{ message: errorData.error || 'Docker compilation failed' }],
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
      log: [`Docker compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{ message: error instanceof Error ? error.message : 'Docker compilation failed' }],
      warnings: []
    }
  }
}

/**
 * Compile a multi-file project using Docker
 */
export async function compileProjectWithDocker(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  const engine = options.engine || 'pdflatex'

  try {
    const response = await fetch('/api/latex/compile-docker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: files.map(f => ({
          path: f.path || f.name,
          content: f.content,
          type: f.type
        })),
        mainFile,
        engine,
        timeout: options.timeout || DEFAULT_DOCKER_TIMEOUT
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Docker compilation failed' }))
      return {
        success: false,
        log: [errorData.error || 'Docker compilation failed'],
        errors: [{ message: errorData.error || 'Docker compilation failed' }],
        warnings: []
      }
    }

    const data = await response.json()

    // Decode base64 PDF
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
      log: [`Docker compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{ message: error instanceof Error ? error.message : 'Docker compilation failed' }],
      warnings: []
    }
  }
}

/**
 * Server-side Docker compilation implementation
 * This should be called from the API route, not directly from client
 *
 * Note: This is a reference implementation. The actual server-side code
 * would be in the API route file.
 */
export function getDockerCompileScript(
  engine: string,
  mainFile: string = 'main.tex',
  runBibtex: boolean = false
): string {
  const commands = [
    `cd /workdir`,
    `${engine} -interaction=nonstopmode -halt-on-error ${mainFile}`
  ]

  if (runBibtex) {
    const auxFile = mainFile.replace('.tex', '')
    commands.push(`bibtex ${auxFile}`)
    commands.push(`${engine} -interaction=nonstopmode ${mainFile}`)
    commands.push(`${engine} -interaction=nonstopmode ${mainFile}`)
  }

  return commands.join(' && ')
}

/**
 * Parse Docker compilation output
 */
export function parseDockerOutput(output: string): {
  errors: CompilationError[]
  warnings: string[]
  log: string[]
} {
  const lines = output.split('\n')
  const { errors, warnings } = parseCompilationLog(output)

  return {
    errors,
    warnings,
    log: lines
  }
}
