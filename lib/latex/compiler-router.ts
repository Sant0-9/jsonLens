/**
 * LaTeX Compiler Router
 *
 * Routes compilation requests to the appropriate compiler based on settings:
 * 1. Docker (local) - No limits, requires Docker
 * 2. Remote - User's own server
 * 3. Online - latex.ytotech.com API (free tier: 1000/month)
 */

import type { CompilationResult, CompilerOptions } from './compiler'
import { compileWithLatexOnline, compileProjectWithLatexOnline } from './latex-online-compiler'
import { compileWithDocker, compileProjectWithDocker, isDockerAvailable } from './docker-compiler'
import type { Settings } from '@/lib/db/schema'

interface ProjectFile {
  name: string
  path: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
}

// Compilation method type derived from Settings
// type CompilationMethod = Settings['compilation']['method']

/**
 * Compile a single LaTeX file using the configured method
 */
export async function routeCompilation(
  content: string,
  options: CompilerOptions = {},
  settings?: Settings['compilation']
): Promise<CompilationResult> {
  const method = settings?.method || 'online'
  const engine = options.engine || settings?.defaultEngine || 'pdflatex'

  const compilerOptions: CompilerOptions = {
    ...options,
    engine
  }

  // Try compilation methods in order of preference
  switch (method) {
    case 'docker':
      return tryDockerWithFallback(content, compilerOptions)

    case 'remote':
      return tryRemoteWithFallback(content, compilerOptions, settings)

    case 'online':
    default:
      return compileWithLatexOnline(content, compilerOptions)
  }
}

/**
 * Compile a multi-file project using the configured method
 */
export async function routeProjectCompilation(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions = {},
  settings?: Settings['compilation']
): Promise<CompilationResult> {
  const method = settings?.method || 'online'
  const engine = options.engine || settings?.defaultEngine || 'pdflatex'

  const compilerOptions: CompilerOptions = {
    ...options,
    engine
  }

  switch (method) {
    case 'docker':
      return tryDockerProjectWithFallback(files, mainFile, compilerOptions)

    case 'remote':
      return tryRemoteProjectWithFallback(files, mainFile, compilerOptions, settings)

    case 'online':
    default:
      return compileProjectWithLatexOnline(files, mainFile, compilerOptions)
  }
}

/**
 * Try Docker compilation with fallback to online
 */
async function tryDockerWithFallback(
  content: string,
  options: CompilerOptions
): Promise<CompilationResult> {
  // Check if Docker is available
  const dockerAvailable = await isDockerAvailable()

  if (dockerAvailable) {
    const result = await compileWithDocker(content, options)
    if (result.success || !shouldFallback(result)) {
      return result
    }
    // Docker failed, add fallback note and try online
    console.warn('Docker compilation failed, falling back to online')
  }

  // Fallback to online
  const onlineResult = await compileWithLatexOnline(content, options)
  if (!dockerAvailable) {
    onlineResult.log = [
      'Docker not available, using online compilation',
      ...onlineResult.log
    ]
  }
  return onlineResult
}

/**
 * Try Docker project compilation with fallback
 */
async function tryDockerProjectWithFallback(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions
): Promise<CompilationResult> {
  const dockerAvailable = await isDockerAvailable()

  if (dockerAvailable) {
    const result = await compileProjectWithDocker(files, mainFile, options)
    if (result.success || !shouldFallback(result)) {
      return result
    }
    console.warn('Docker compilation failed, falling back to online')
  }

  // Fallback to online
  const onlineResult = await compileProjectWithLatexOnline(files, mainFile, options)
  if (!dockerAvailable) {
    onlineResult.log = [
      'Docker not available, using online compilation',
      ...onlineResult.log
    ]
  }
  return onlineResult
}

/**
 * Try remote server compilation with fallback
 */
async function tryRemoteWithFallback(
  content: string,
  options: CompilerOptions,
  settings?: Settings['compilation']
): Promise<CompilationResult> {
  const remoteUrl = settings?.remoteUrl

  if (remoteUrl) {
    const result = await compileWithRemote(content, options, remoteUrl)
    if (result.success || !shouldFallback(result)) {
      return result
    }
    console.warn('Remote compilation failed, falling back to online')
  }

  // Fallback to online
  const onlineResult = await compileWithLatexOnline(content, options)
  if (!remoteUrl) {
    onlineResult.log = [
      'Remote URL not configured, using online compilation',
      ...onlineResult.log
    ]
  }
  return onlineResult
}

/**
 * Try remote project compilation with fallback
 */
async function tryRemoteProjectWithFallback(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions,
  settings?: Settings['compilation']
): Promise<CompilationResult> {
  const remoteUrl = settings?.remoteUrl

  if (remoteUrl) {
    const result = await compileProjectWithRemote(files, mainFile, options, remoteUrl)
    if (result.success || !shouldFallback(result)) {
      return result
    }
    console.warn('Remote compilation failed, falling back to online')
  }

  // Fallback to online
  const onlineResult = await compileProjectWithLatexOnline(files, mainFile, options)
  if (!remoteUrl) {
    onlineResult.log = [
      'Remote URL not configured, using online compilation',
      ...onlineResult.log
    ]
  }
  return onlineResult
}

/**
 * Compile using a remote server
 */
async function compileWithRemote(
  content: string,
  options: CompilerOptions,
  remoteUrl: string
): Promise<CompilationResult> {
  try {
    const response = await fetch(remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        engine: options.engine || 'pdflatex',
        timeout: options.timeout || 60000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Remote server error' }))
      return {
        success: false,
        log: [errorData.error || 'Remote compilation failed'],
        errors: [{ message: errorData.error || 'Remote compilation failed' }],
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
      log: [`Remote compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{ message: error instanceof Error ? error.message : 'Remote compilation failed' }],
      warnings: []
    }
  }
}

/**
 * Compile project using a remote server
 */
async function compileProjectWithRemote(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions,
  remoteUrl: string
): Promise<CompilationResult> {
  try {
    const response = await fetch(remoteUrl, {
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
        engine: options.engine || 'pdflatex',
        timeout: options.timeout || 60000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Remote server error' }))
      return {
        success: false,
        log: [errorData.error || 'Remote compilation failed'],
        errors: [{ message: errorData.error || 'Remote compilation failed' }],
        warnings: []
      }
    }

    const data = await response.json()

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
      log: [`Remote compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{ message: error instanceof Error ? error.message : 'Remote compilation failed' }],
      warnings: []
    }
  }
}

/**
 * Determine if we should fallback to another compiler
 * Don't fallback for LaTeX errors (those are user errors, not system errors)
 */
function shouldFallback(result: CompilationResult): boolean {
  // If there are LaTeX errors (syntax, packages, etc.), don't fallback
  // These errors would occur with any compiler
  const hasLatexErrors = result.errors.some(e =>
    e.message.includes('LaTeX Error') ||
    e.message.includes('Undefined control sequence') ||
    e.message.includes('Missing') ||
    e.message.includes('Extra') ||
    e.line !== undefined
  )

  if (hasLatexErrors) {
    return false
  }

  // Fallback for system/network errors
  const hasSystemErrors = result.errors.some(e =>
    e.message.includes('Docker') ||
    e.message.includes('not available') ||
    e.message.includes('Network') ||
    e.message.includes('timeout') ||
    e.message.includes('Connection')
  )

  return hasSystemErrors
}

/**
 * Get available compilation methods
 */
export async function getAvailableCompilers(): Promise<{
  docker: boolean
  remote: boolean
  online: boolean
}> {
  const dockerAvailable = await isDockerAvailable()

  return {
    docker: dockerAvailable,
    remote: true, // Remote is always "available" if URL is configured
    online: true  // Online is always available (subject to rate limits)
  }
}
