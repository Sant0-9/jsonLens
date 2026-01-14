/**
 * LaTeX Compiler Types
 *
 * Shared types for all LaTeX compilation modules.
 */

export interface CompilationResult {
  success: boolean
  pdf?: Uint8Array
  log: string[]
  errors: CompilationError[]
  warnings: string[]
}

export interface CompilationError {
  line?: number
  column?: number
  message: string
  file?: string
}

export interface CompilerOptions {
  engine?: 'pdflatex' | 'xelatex' | 'lualatex'
  outputFormat?: 'pdf' | 'dvi'
  timeout?: number
}

/**
 * Parse LaTeX compilation log to extract errors and warnings
 */
export function parseCompilationLog(log: string): { errors: CompilationError[]; warnings: string[] } {
  const errors: CompilationError[] = []
  const warnings: string[] = []
  const lines = log.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Error patterns
    const errorMatch = line.match(/^! (.+)$/)
    if (errorMatch) {
      // Look for line number in following lines
      let lineNumber: number | undefined
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const lineNumMatch = lines[j].match(/l\.(\d+)/)
        if (lineNumMatch) {
          lineNumber = parseInt(lineNumMatch[1], 10)
          break
        }
      }
      errors.push({
        message: errorMatch[1],
        line: lineNumber
      })
    }

    // LaTeX Error pattern
    const latexErrorMatch = line.match(/^LaTeX Error: (.+)$/)
    if (latexErrorMatch) {
      errors.push({ message: latexErrorMatch[1] })
    }

    // Warning patterns
    const warningMatch = line.match(/^(?:LaTeX |Package )?Warning: (.+)$/)
    if (warningMatch) {
      warnings.push(warningMatch[1])
    }

    // Overfull/Underfull box warnings
    const boxMatch = line.match(/^(Overfull|Underfull) \\[hv]box .+$/)
    if (boxMatch) {
      warnings.push(line)
    }
  }

  return { errors, warnings }
}
