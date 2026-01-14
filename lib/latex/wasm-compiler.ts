/**
 * SwiftLaTeX WASM Compiler
 *
 * In-browser LaTeX compilation using WebAssembly.
 * No server required - works completely offline after initial load.
 */

import type { CompilationResult, CompilerOptions } from './types'
import { parseCompilationLog } from './types'

type EngineType = 'pdftex' | 'xetex'

interface EngineStatus {
  Init: 1
  Ready: 2
  Busy: 3
  Error: 4
}

const ENGINE_STATUS: EngineStatus = {
  Init: 1,
  Ready: 2,
  Busy: 3,
  Error: 4,
}

interface WASMCompileResult {
  pdf?: Uint8Array
  status: number
  log: string
}

class LaTeXEngine {
  private worker: Worker | null = null
  private status: number = ENGINE_STATUS.Init
  private engineType: EngineType
  private basePath: string

  constructor(engineType: EngineType = 'pdftex', basePath = '/swiftlatex') {
    this.engineType = engineType
    this.basePath = basePath
  }

  async loadEngine(): Promise<void> {
    if (this.worker !== null) {
      throw new Error('Engine already loaded')
    }

    this.status = ENGINE_STATUS.Init

    const workerPath = this.engineType === 'pdftex'
      ? `${this.basePath}/swiftlatexpdftex.js`
      : `${this.basePath}/swiftlatexxetex.js`

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(workerPath)

        this.worker.onmessage = (ev) => {
          const data = ev.data
          const cmd = data.result

          if (cmd === 'ok') {
            this.status = ENGINE_STATUS.Ready
            resolve()
          } else {
            this.status = ENGINE_STATUS.Error
            reject(new Error('Failed to initialize WASM engine'))
          }
        }

        this.worker.onerror = (error) => {
          this.status = ENGINE_STATUS.Error
          reject(new Error(`Worker error: ${error.message}`))
        }
      } catch (error) {
        this.status = ENGINE_STATUS.Error
        reject(error)
      }
    })
  }

  isReady(): boolean {
    return this.status === ENGINE_STATUS.Ready
  }

  private checkStatus(): void {
    if (!this.isReady()) {
      throw new Error('Engine is not ready')
    }
  }

  setMainFile(filename: string): void {
    this.checkStatus()
    this.worker?.postMessage({ cmd: 'setmainfile', url: filename })
  }

  writeFile(filename: string, content: string | Uint8Array): void {
    this.checkStatus()
    this.worker?.postMessage({ cmd: 'writefile', url: filename, src: content })
  }

  makeFolder(folder: string): void {
    this.checkStatus()
    if (folder === '' || folder === '/') return
    this.worker?.postMessage({ cmd: 'mkdir', url: folder })
  }

  async compile(): Promise<WASMCompileResult> {
    this.checkStatus()
    this.status = ENGINE_STATUS.Busy

    return new Promise((resolve) => {
      if (!this.worker) {
        resolve({ status: -1, log: 'No worker available' })
        return
      }

      this.worker.onmessage = (ev) => {
        const data = ev.data
        const cmd = data.cmd

        if (cmd !== 'compile') return

        const result = data.result
        const log = data.log
        const status = data.status

        this.status = ENGINE_STATUS.Ready

        const compileResult: WASMCompileResult = {
          status,
          log,
        }

        if (result === 'ok' && data.pdf) {
          compileResult.pdf = new Uint8Array(data.pdf)
        }

        resolve(compileResult)
      }

      this.worker.postMessage({ cmd: 'compilelatex' })
    })
  }

  flushCache(): void {
    this.checkStatus()
    this.worker?.postMessage({ cmd: 'flushcache' })
  }

  close(): void {
    if (this.worker) {
      this.worker.postMessage({ cmd: 'grace' })
      this.worker = null
    }
    this.status = ENGINE_STATUS.Init
  }
}

// Singleton engines for reuse
let pdfTexEngine: LaTeXEngine | null = null
let xeTexEngine: LaTeXEngine | null = null
let initPromise: Promise<boolean> | null = null

/**
 * Check if WASM compilation is available (browser environment)
 */
export function isWASMSupported(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined'
}

/**
 * Initialize the WASM LaTeX engine
 */
export async function initializeWASMEngine(
  engineType: EngineType = 'pdftex'
): Promise<boolean> {
  if (!isWASMSupported()) {
    return false
  }

  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      if (engineType === 'pdftex') {
        if (!pdfTexEngine) {
          pdfTexEngine = new LaTeXEngine('pdftex')
          await pdfTexEngine.loadEngine()
        }
        return pdfTexEngine.isReady()
      } else {
        if (!xeTexEngine) {
          xeTexEngine = new LaTeXEngine('xetex')
          await xeTexEngine.loadEngine()
        }
        return xeTexEngine.isReady()
      }
    } catch (error) {
      console.warn('Failed to initialize WASM engine:', error)
      return false
    } finally {
      initPromise = null
    }
  })()

  return initPromise
}

/**
 * Get the current engine instance
 */
function getEngine(engineType: EngineType): LaTeXEngine | null {
  return engineType === 'pdftex' ? pdfTexEngine : xeTexEngine
}

/**
 * Compile LaTeX using WASM (fully offline)
 */
export async function compileWithWASM(
  content: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  // Determine engine type from options
  const engineType: EngineType = options.engine === 'xelatex' ? 'xetex' : 'pdftex'

  // Initialize if needed
  const initialized = await initializeWASMEngine(engineType)

  if (!initialized) {
    return {
      success: false,
      log: ['WASM engine not available'],
      errors: [{
        message: 'WASM LaTeX compilation is not available. Please check your browser supports WebAssembly.'
      }],
      warnings: [],
    }
  }

  const engine = getEngine(engineType)

  if (!engine || !engine.isReady()) {
    return {
      success: false,
      log: ['Engine not ready'],
      errors: [{ message: 'LaTeX engine is not ready' }],
      warnings: [],
    }
  }

  try {
    // Clear previous compilation
    engine.flushCache()

    // Write the main file
    engine.writeFile('main.tex', content)
    engine.setMainFile('main.tex')

    // Compile
    const result = await engine.compile()

    // Parse log for errors and warnings
    const { errors, warnings } = parseCompilationLog(result.log)

    return {
      success: result.status === 0 && result.pdf !== undefined,
      pdf: result.pdf,
      log: result.log.split('\n'),
      errors,
      warnings,
    }
  } catch (error) {
    return {
      success: false,
      log: [`Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown compilation error'
      }],
      warnings: [],
    }
  }
}

/**
 * Compile a multi-file LaTeX project using WASM
 */
export async function compileProjectWithWASM(
  files: Array<{ path: string; content: string }>,
  mainFile: string,
  options: CompilerOptions = {}
): Promise<CompilationResult> {
  const engineType: EngineType = options.engine === 'xelatex' ? 'xetex' : 'pdftex'
  const initialized = await initializeWASMEngine(engineType)

  if (!initialized) {
    return {
      success: false,
      log: ['WASM engine not available'],
      errors: [{ message: 'WASM LaTeX compilation is not available' }],
      warnings: [],
    }
  }

  const engine = getEngine(engineType)

  if (!engine || !engine.isReady()) {
    return {
      success: false,
      log: ['Engine not ready'],
      errors: [{ message: 'LaTeX engine is not ready' }],
      warnings: [],
    }
  }

  try {
    engine.flushCache()

    // Create directories and write all files
    const directories = new Set<string>()

    for (const file of files) {
      // Extract directory path
      const dir = file.path.substring(0, file.path.lastIndexOf('/'))
      if (dir && !directories.has(dir)) {
        engine.makeFolder(dir)
        directories.add(dir)
      }

      engine.writeFile(file.path, file.content)
    }

    // Set main file and compile
    engine.setMainFile(mainFile)
    const result = await engine.compile()

    const { errors, warnings } = parseCompilationLog(result.log)

    return {
      success: result.status === 0 && result.pdf !== undefined,
      pdf: result.pdf,
      log: result.log.split('\n'),
      errors,
      warnings,
    }
  } catch (error) {
    return {
      success: false,
      log: [`Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown compilation error'
      }],
      warnings: [],
    }
  }
}

/**
 * Check if WASM engine is loaded and ready
 */
export function isWASMEngineReady(engineType: EngineType = 'pdftex'): boolean {
  const engine = getEngine(engineType)
  return engine !== null && engine.isReady()
}

/**
 * Cleanup WASM engines
 */
export function cleanupWASMEngines(): void {
  if (pdfTexEngine) {
    pdfTexEngine.close()
    pdfTexEngine = null
  }
  if (xeTexEngine) {
    xeTexEngine.close()
    xeTexEngine = null
  }
}
