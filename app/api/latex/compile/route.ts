import { NextRequest, NextResponse } from 'next/server'
import { routeCompilation, routeProjectCompilation } from '@/lib/latex/compiler-router'
import type { Settings } from '@/lib/db/schema'

interface CompileRequest {
  content?: string
  files?: Array<{
    path: string
    content: string
    type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
  }>
  mainFile?: string
  engine?: 'pdflatex' | 'xelatex' | 'lualatex'
  format?: 'pdf' | 'dvi'
  timeout?: number
  settings?: Settings['compilation']
}

interface CompilationError {
  line?: number
  column?: number
  message: string
  file?: string
}

interface CompileResponse {
  success: boolean
  pdf?: string // base64 encoded
  log: string[]
  errors: CompilationError[]
  warnings: string[]
}

/**
 * Server-side LaTeX compilation endpoint
 *
 * Routes to:
 * - latex.online API (default, free tier)
 * - Docker compilation (if configured)
 * - Remote server (if configured)
 */
export async function POST(request: NextRequest): Promise<NextResponse<CompileResponse>> {
  try {
    const body: CompileRequest = await request.json()
    const { content, files, mainFile, engine = 'pdflatex', timeout = 60000, settings } = body

    // Validate: need either content (single file) or files (multi-file project)
    const isSingleFile = content && typeof content === 'string'
    const isMultiFile = files && Array.isArray(files) && files.length > 0

    if (!isSingleFile && !isMultiFile) {
      return NextResponse.json(
        {
          success: false,
          log: ['No content provided'],
          errors: [{ message: 'LaTeX content or project files are required' }],
          warnings: []
        },
        { status: 400 }
      )
    }

    // Calculate total size
    const totalSize = isSingleFile
      ? content!.length
      : files!.reduce((sum, f) => sum + (f.content?.length || 0), 0)

    // Validate content length (prevent abuse)
    if (totalSize > 2000000) { // 2MB limit for projects
      return NextResponse.json(
        {
          success: false,
          log: ['Content too large'],
          errors: [{ message: 'LaTeX content exceeds maximum size (2MB)' }],
          warnings: []
        },
        { status: 400 }
      )
    }

    // Validate single file has document class
    if (isSingleFile && !content!.includes('\\documentclass')) {
      return NextResponse.json(
        {
          success: false,
          log: ['Missing \\documentclass'],
          errors: [{ message: 'LaTeX document must include \\documentclass' }],
          warnings: []
        },
        { status: 400 }
      )
    }

    // Route to appropriate compiler
    let result
    if (isMultiFile) {
      // Multi-file project compilation
      const projectFiles = files!.map(f => ({
        name: f.path.split('/').pop() || f.path,
        path: f.path,
        content: f.content,
        type: f.type
      }))

      result = await routeProjectCompilation(
        projectFiles,
        mainFile || 'main.tex',
        { engine, timeout },
        settings
      )
    } else {
      // Single file compilation
      result = await routeCompilation(
        content!,
        { engine, timeout },
        settings
      )
    }

    // Encode PDF as base64 for JSON response
    let pdfBase64: string | undefined
    if (result.pdf) {
      const binaryString = Array.from(result.pdf)
        .map(byte => String.fromCharCode(byte))
        .join('')
      pdfBase64 = btoa(binaryString)
    }

    return NextResponse.json({
      success: result.success,
      pdf: pdfBase64,
      log: result.log,
      errors: result.errors,
      warnings: result.warnings
    })

  } catch (error) {
    console.error('Compilation error:', error)
    return NextResponse.json(
      {
        success: false,
        log: [`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        errors: [{ message: 'Internal server error during compilation' }],
        warnings: []
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for checking compilation service status
 */
export async function GET(): Promise<NextResponse> {
  // Check latex.online availability
  let onlineAvailable = true
  try {
    const response = await fetch('https://latex.ytotech.com/builds/sync', {
      method: 'HEAD'
    })
    onlineAvailable = response.status !== 503
  } catch {
    onlineAvailable = false
  }

  return NextResponse.json({
    status: onlineAvailable ? 'ready' : 'degraded',
    message: onlineAvailable
      ? 'LaTeX compilation service is ready'
      : 'Online compilation may be unavailable',
    supportedEngines: ['pdflatex', 'xelatex', 'lualatex'],
    maxContentSize: 2000000,
    methods: {
      online: onlineAvailable,
      docker: 'check /api/latex/docker-status',
      remote: 'configure in settings'
    }
  })
}
