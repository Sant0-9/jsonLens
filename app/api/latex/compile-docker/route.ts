import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { randomUUID } from 'crypto'
import { parseCompilationLog } from '@/lib/latex/types'

const execAsync = promisify(exec)

const DOCKER_IMAGE = 'texlive/texlive:latest-full'
const DEFAULT_TIMEOUT = 180000 // 3 minutes for complex docs

interface ProjectFile {
  path: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'image' | 'other'
}

interface DockerCompileRequest {
  content?: string
  files?: ProjectFile[]
  mainFile?: string
  engine?: 'pdflatex' | 'xelatex' | 'lualatex'
  timeout?: number
  /** When true, only checks for errors without generating full PDF (faster) */
  checkOnly?: boolean
}

interface CompilationPlan {
  engine: string
  needsBiber: boolean
  needsBibtex: boolean
  needsMakeglossaries: boolean
  needsMakeindex: boolean
  needsShellEscape: boolean
}

interface CompilationError {
  line?: number
  column?: number
  message: string
  file?: string
}

interface DockerCompileResponse {
  success: boolean
  pdf?: string // base64
  log: string[]
  errors: CompilationError[]
  warnings: string[]
}

/**
 * Analyze document content to determine required compilation tools
 */
function analyzeDocument(content: string, engine: string): CompilationPlan {
  const plan: CompilationPlan = {
    engine,
    needsBiber: false,
    needsBibtex: false,
    needsMakeglossaries: false,
    needsMakeindex: false,
    needsShellEscape: false,
  }

  // biblatex uses biber
  if (/\\usepackage(\[.*?\])?\{biblatex\}/.test(content)) {
    plan.needsBiber = true
  }
  // Traditional bibliography uses bibtex (only if biblatex not detected)
  if (!plan.needsBiber && (/\\bibliography\{/.test(content) || /\\bibliographystyle\{/.test(content))) {
    plan.needsBibtex = true
  }
  // glossaries package
  if (/\\usepackage(\[.*?\])?\{glossaries\}/.test(content) || /\\makeglossaries/.test(content)) {
    plan.needsMakeglossaries = true
  }
  // makeindex
  if (/\\makeindex/.test(content) || /\\usepackage(\[.*?\])?\{makeidx\}/.test(content)) {
    plan.needsMakeindex = true
  }
  // minted needs shell-escape
  if (/\\usepackage(\[.*?\])?\{minted\}/.test(content)) {
    plan.needsShellEscape = true
  }

  return plan
}

/**
 * Build the multi-pass compilation script
 * When checkOnly is true, only runs a single pass for error checking (faster)
 */
function buildCompilationScript(mainFile: string, plan: CompilationPlan, checkOnly: boolean = false): string {
  const baseFile = mainFile.replace('.tex', '')
  const engineFlags = plan.needsShellEscape
    ? '-shell-escape -interaction=nonstopmode -file-line-error'
    : '-interaction=nonstopmode -file-line-error'

  const commands: string[] = []

  // Pass 1: Initial compilation (generates .aux, .bcf, .glo, .idx files)
  commands.push(`${plan.engine} ${engineFlags} ${mainFile}`)

  // If checkOnly, skip multi-pass compilation (just check for errors)
  if (checkOnly) {
    return commands.join(' && ')
  }

  // Bibliography processing
  if (plan.needsBiber) {
    // biber may fail on first run if .bcf doesn't exist, continue anyway
    commands.push(`biber ${baseFile} || true`)
  } else if (plan.needsBibtex) {
    commands.push(`bibtex ${baseFile} || true`)
  }

  // Glossaries processing
  if (plan.needsMakeglossaries) {
    commands.push(`makeglossaries ${baseFile} || true`)
  }

  // Index processing
  if (plan.needsMakeindex) {
    commands.push(`makeindex ${baseFile} || true`)
  }

  // Pass 2 & 3: Resolve references (needed if any auxiliary tools ran)
  const needsExtraPasses = plan.needsBiber || plan.needsBibtex || plan.needsMakeglossaries || plan.needsMakeindex
  if (needsExtraPasses) {
    commands.push(`${plan.engine} ${engineFlags} ${mainFile}`)
    commands.push(`${plan.engine} ${engineFlags} ${mainFile}`)
  }

  return commands.join(' && ')
}

/**
 * Docker-based LaTeX compilation endpoint
 * Supports full TexLive with TikZ, PGFPlots, biblatex, glossaries, etc.
 *
 * POST /api/latex/compile-docker
 */
export async function POST(request: NextRequest): Promise<NextResponse<DockerCompileResponse>> {
  let tempDir: string | null = null

  try {
    const body: DockerCompileRequest = await request.json()
    const {
      content,
      files,
      mainFile = 'main.tex',
      engine = 'pdflatex',
      timeout = DEFAULT_TIMEOUT,
      checkOnly = false
    } = body

    // Validate input
    const isSingleFile = content && typeof content === 'string'
    const isMultiFile = files && Array.isArray(files) && files.length > 0

    if (!isSingleFile && !isMultiFile) {
      return NextResponse.json({
        success: false,
        log: ['No content provided'],
        errors: [{ message: 'LaTeX content or project files are required' }],
        warnings: []
      }, { status: 400 })
    }

    // Create temp directory
    const uuid = randomUUID().slice(0, 8)
    tempDir = path.join(os.tmpdir(), `latex-docker-${uuid}`)
    await fs.mkdir(tempDir, { recursive: true })

    // Write files to temp directory
    let mainContent = ''
    if (isSingleFile) {
      await fs.writeFile(path.join(tempDir, 'main.tex'), content!)
      mainContent = content!
    } else if (isMultiFile) {
      for (const file of files!) {
        const filePath = path.join(tempDir, file.path)
        const fileDir = path.dirname(filePath)

        // Create subdirectories if needed
        await fs.mkdir(fileDir, { recursive: true })

        if (file.type === 'image') {
          // Handle base64 encoded images
          await fs.writeFile(filePath, Buffer.from(file.content, 'base64'))
        } else {
          await fs.writeFile(filePath, file.content)
        }

        // Get main file content for analysis
        if (file.path === mainFile) {
          mainContent = file.content
        }
      }
    }

    // If main content not found in multi-file mode, try to read it
    if (!mainContent && isMultiFile) {
      try {
        mainContent = await fs.readFile(path.join(tempDir, mainFile), 'utf-8')
      } catch {
        // Main file not found
        return NextResponse.json({
          success: false,
          log: [`Main file '${mainFile}' not found in project`],
          errors: [{ message: `Main file '${mainFile}' not found` }],
          warnings: []
        }, { status: 400 })
      }
    }

    // Analyze document and build compilation plan
    const plan = analyzeDocument(mainContent, engine)

    // Build compilation script (checkOnly = single pass, no auxiliary tools)
    const script = buildCompilationScript(mainFile, plan, checkOnly)

    // Build Docker command
    // --rm: Remove container after execution
    // -v: Mount temp directory to /workdir
    // -w: Set working directory
    // --network=none: Disable network for security
    const dockerCmd = `docker run --rm -v "${tempDir}:/workdir" -w /workdir --network=none ${DOCKER_IMAGE} sh -c "${script}"`

    // Execute Docker command
    let stdout = ''
    let stderr = ''

    try {
      const result = await execAsync(dockerCmd, {
        timeout,
        maxBuffer: 20 * 1024 * 1024, // 20MB buffer for large logs
        encoding: 'utf-8'
      })
      stdout = result.stdout || ''
      stderr = result.stderr || ''
    } catch (execError) {
      // exec throws on non-zero exit code, but LaTeX often exits with error
      // We still want to check if PDF was generated
      const err = execError as { stdout?: string; stderr?: string; killed?: boolean; message?: string }
      stdout = err.stdout || ''
      stderr = err.stderr || ''

      // Check if it was a timeout
      if (err.killed) {
        return NextResponse.json({
          success: false,
          log: [`Compilation timed out after ${timeout / 1000} seconds`],
          errors: [{ message: 'Compilation timed out. Document may be too complex.' }],
          warnings: []
        }, { status: 408 })
      }

      // Check for Docker-specific errors
      if (err.message?.includes('docker: not found') || err.message?.includes('Cannot connect')) {
        return NextResponse.json({
          success: false,
          log: ['Docker is not available'],
          errors: [{ message: 'Docker is not running or not installed' }],
          warnings: []
        }, { status: 503 })
      }
    }

    // Combine logs
    const fullLog = `${stdout}\n${stderr}`.trim()
    const logLines = fullLog.split('\n').filter(line => line.trim())

    // Parse log for errors and warnings
    const { errors, warnings } = parseCompilationLog(fullLog)

    // Try to read compiled PDF (skip if checkOnly - saves time and bandwidth)
    let pdfBase64: string | undefined
    let pdfExists = false

    if (!checkOnly) {
      const pdfPath = path.join(tempDir, mainFile.replace('.tex', '.pdf'))
      try {
        const pdfBuffer = await fs.readFile(pdfPath)
        pdfBase64 = pdfBuffer.toString('base64')
        pdfExists = true
      } catch {
        // PDF not generated - compilation failed
      }
    } else {
      // For checkOnly, just verify PDF file exists (don't read it)
      const pdfPath = path.join(tempDir, mainFile.replace('.tex', '.pdf'))
      try {
        await fs.access(pdfPath)
        pdfExists = true
      } catch {
        // PDF not generated
      }
    }

    // Determine success
    // For checkOnly: success = no fatal errors (PDF may exist)
    // For full build: success = PDF exists with content
    // We prioritize the PDF existing over error messages because:
    // - Multi-pass compilation may have errors in later passes but still produce valid PDF
    // - minted/fancyvrb can cause issues in subsequent passes but first pass PDF is valid
    const success = checkOnly ? (errors.length === 0 || pdfExists) : !!pdfBase64

    return NextResponse.json({
      success,
      pdf: pdfBase64,
      log: logLines,
      errors,
      warnings
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Docker compilation error:', error)

    return NextResponse.json({
      success: false,
      log: [`Server error: ${message}`],
      errors: [{ message: `Internal server error: ${message}` }],
      warnings: []
    }, { status: 500 })

  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
        console.warn(`Failed to cleanup temp directory: ${tempDir}`)
      }
    }
  }
}

/**
 * GET handler for checking Docker compilation status
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ready',
    message: 'Docker compilation endpoint',
    supportedEngines: ['pdflatex', 'xelatex', 'lualatex'],
    features: [
      'TikZ/PGF',
      'PGFPlots',
      'biblatex + biber',
      'BibTeX',
      'glossaries',
      'makeindex',
      'minted (shell-escape)',
      'forest',
      'Full TexLive package support'
    ],
    dockerImage: DOCKER_IMAGE,
    defaultTimeout: DEFAULT_TIMEOUT
  })
}
