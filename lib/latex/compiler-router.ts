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
 * Compile with Docker - no fallback
 * If user selected Docker, they want Docker. Show errors directly.
 */
async function tryDockerWithFallback(
  content: string,
  options: CompilerOptions
): Promise<CompilationResult> {
  // Check if Docker is available
  const dockerAvailable = await isDockerAvailable()

  if (!dockerAvailable) {
    return {
      success: false,
      log: [
        'Docker is not available.',
        'Please ensure Docker Desktop is installed and running.',
        'Then pull the TexLive image: docker pull texlive/texlive:latest-full'
      ],
      errors: [{
        message: 'Docker is not available. Install Docker Desktop and pull texlive/texlive:latest-full'
      }],
      warnings: []
    }
  }

  // Use Docker directly - no fallback
  return compileWithDocker(content, options)
}

/**
 * Compile project with Docker - no fallback
 * If user selected Docker, they want Docker. Show errors directly.
 */
async function tryDockerProjectWithFallback(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions
): Promise<CompilationResult> {
  const dockerAvailable = await isDockerAvailable()

  if (!dockerAvailable) {
    return {
      success: false,
      log: [
        'Docker is not available.',
        'Please ensure Docker Desktop is installed and running.',
        'Then pull the TexLive image: docker pull texlive/texlive:latest-full'
      ],
      errors: [{
        message: 'Docker is not available. Install Docker Desktop and pull texlive/texlive:latest-full'
      }],
      warnings: []
    }
  }

  // Use Docker directly - no fallback
  return compileProjectWithDocker(files, mainFile, options)
}

/**
 * Compile with remote server - no fallback
 * If user selected remote, they want remote. Show errors if URL not configured.
 */
async function tryRemoteWithFallback(
  content: string,
  options: CompilerOptions,
  settings?: Settings['compilation']
): Promise<CompilationResult> {
  const remoteUrl = settings?.remoteUrl

  if (!remoteUrl) {
    return {
      success: false,
      log: [
        'Remote server URL not configured.',
        'Go to Settings > Compilation and enter your TexLive server URL.'
      ],
      errors: [{
        message: 'Remote server URL not configured. Configure it in Settings.'
      }],
      warnings: []
    }
  }

  // Use remote directly - no fallback
  return compileWithRemote(content, options, remoteUrl)
}

/**
 * Compile project with remote server - no fallback
 * If user selected remote, they want remote. Show errors if URL not configured.
 */
async function tryRemoteProjectWithFallback(
  files: ProjectFile[],
  mainFile: string,
  options: CompilerOptions,
  settings?: Settings['compilation']
): Promise<CompilationResult> {
  const remoteUrl = settings?.remoteUrl

  if (!remoteUrl) {
    return {
      success: false,
      log: [
        'Remote server URL not configured.',
        'Go to Settings > Compilation and enter your TexLive server URL.'
      ],
      errors: [{
        message: 'Remote server URL not configured. Configure it in Settings.'
      }],
      warnings: []
    }
  }

  // Use remote directly - no fallback
  return compileProjectWithRemote(files, mainFile, options, remoteUrl)
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

// Note: Fallback behavior has been removed.
// If user selects Docker, they get Docker - errors are shown directly.
// If user selects Remote, they get Remote - with clear error if URL not configured.

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
