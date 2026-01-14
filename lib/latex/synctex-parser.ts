/**
 * SyncTeX Parser and Utilities
 *
 * Provides bidirectional navigation between LaTeX source and PDF output.
 * Supports both actual SyncTeX data (when available) and heuristic-based mapping.
 */

// SyncTeX record types
export interface SyncTeXSourceLocation {
  file: string
  line: number
  column: number
}

export interface SyncTeXPDFLocation {
  page: number
  x: number  // horizontal position (0-1 normalized)
  y: number  // vertical position (0-1 normalized)
  width: number
  height: number
}

export interface SyncTeXMapping {
  source: SyncTeXSourceLocation
  pdf: SyncTeXPDFLocation
}

export interface SyncTeXData {
  version: number
  inputFiles: Map<number, string>  // file index -> filename
  mappings: SyncTeXMapping[]
  isHeuristic: boolean  // true if using heuristic mode
}

// Heuristic-based mapping for when actual SyncTeX is unavailable
export interface HeuristicDocumentInfo {
  totalPages: number
  linesPerPage: number
  files: Array<{
    name: string
    startLine: number
    endLine: number
  }>
  pageBreaks: number[]  // line numbers where page breaks occur
}

/**
 * Parse SyncTeX file content
 * SyncTeX format is line-based with different record types
 */
export function parseSyncTeX(content: string): SyncTeXData | null {
  try {
    const lines = content.split('\n')
    const data: SyncTeXData = {
      version: 1,
      inputFiles: new Map(),
      mappings: [],
      isHeuristic: false
    }

    let currentFile = 0
    let currentPage = 0

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('%')) continue

      // Input file declaration: Input:index:filepath
      if (trimmed.startsWith('Input:')) {
        const parts = trimmed.substring(6).split(':')
        if (parts.length >= 2) {
          const index = parseInt(parts[0], 10)
          const filepath = parts.slice(1).join(':')
          data.inputFiles.set(index, filepath)
        }
        continue
      }

      // Page marker: {pagenum
      if (trimmed.startsWith('{')) {
        currentPage = parseInt(trimmed.substring(1), 10) || currentPage
        continue
      }

      // File switch: f:fileindex:line
      if (trimmed.startsWith('f:')) {
        const parts = trimmed.substring(2).split(':')
        if (parts.length >= 1) {
          currentFile = parseInt(parts[0], 10) || currentFile
        }
        continue
      }

      // Vertical position: v:y (points from bottom)
      // Horizontal position: h:x
      // Width: w:width, Height: d:depth, Height: H:height

      // Node records: x:line:column:x:y:w:h
      // Simplified parsing for common formats
      if (trimmed.startsWith('x:') || trimmed.startsWith('k:') || trimmed.startsWith('g:')) {
        const parts = trimmed.substring(2).split(':')
        if (parts.length >= 4) {
          const line = parseInt(parts[0], 10)
          const column = parseInt(parts[1], 10) || 0
          const x = parseFloat(parts[2]) || 0
          const y = parseFloat(parts[3]) || 0

          if (!isNaN(line) && !isNaN(x) && !isNaN(y)) {
            const filename = data.inputFiles.get(currentFile) || `file${currentFile}`
            data.mappings.push({
              source: { file: filename, line, column },
              pdf: {
                page: currentPage,
                x: x / 612,  // normalize to 0-1 (assuming letter size)
                y: y / 792,
                width: 0.1,
                height: 0.02
              }
            })
          }
        }
      }
    }

    return data.mappings.length > 0 ? data : null
  } catch (error) {
    console.error('Failed to parse SyncTeX:', error)
    return null
  }
}

/**
 * Parse compressed SyncTeX (.synctex.gz)
 * Returns null if pako (zlib) is not available
 */
export async function parseCompressedSyncTeX(data: Uint8Array): Promise<SyncTeXData | null> {
  try {
    // Try to decompress using pako if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pako = (window as any).pako
    if (pako) {
      const decompressed = pako.inflate(data, { to: 'string' })
      return parseSyncTeX(decompressed)
    }

    // Try native DecompressionStream (modern browsers)
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new DecompressionStream('gzip')
      const writer = stream.writable.getWriter()
      // Convert to standard ArrayBuffer to satisfy TypeScript
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
      writer.write(new Uint8Array(buffer))
      writer.close()

      const reader = stream.readable.getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      // Combine chunks and decode
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const combined = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }

      const decoded = new TextDecoder().decode(combined)
      return parseSyncTeX(decoded)
    }

    return null
  } catch (error) {
    console.error('Failed to decompress SyncTeX:', error)
    return null
  }
}

/**
 * Create heuristic-based SyncTeX data from document structure
 * Used when actual SyncTeX is not available
 */
export function createHeuristicMapping(
  source: string,
  fileName: string,
  totalPages: number
): SyncTeXData {
  const data: SyncTeXData = {
    version: 1,
    inputFiles: new Map([[0, fileName]]),
    mappings: [],
    isHeuristic: true
  }

  const lines = source.split('\n')
  const totalLines = lines.length

  // Find structural elements that typically cause page breaks
  const structuralElements: Array<{ line: number; type: string; weight: number }> = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Document start
    if (trimmed.includes('\\begin{document}')) {
      structuralElements.push({ line: index + 1, type: 'document_start', weight: 1 })
    }

    // Sections (major breaks)
    if (trimmed.match(/\\(chapter|section)\{/)) {
      structuralElements.push({ line: index + 1, type: 'section', weight: 0.8 })
    }

    // Subsections (minor breaks)
    if (trimmed.match(/\\subsection\{/)) {
      structuralElements.push({ line: index + 1, type: 'subsection', weight: 0.3 })
    }

    // Page break commands
    if (trimmed.includes('\\newpage') || trimmed.includes('\\clearpage') || trimmed.includes('\\pagebreak')) {
      structuralElements.push({ line: index + 1, type: 'pagebreak', weight: 1 })
    }

    // Floats (figures, tables)
    if (trimmed.match(/\\begin\{(figure|table)\}/)) {
      structuralElements.push({ line: index + 1, type: 'float', weight: 0.4 })
    }

    // Display math environments
    if (trimmed.match(/\\begin\{(equation|align|gather)\}/)) {
      structuralElements.push({ line: index + 1, type: 'math', weight: 0.2 })
    }
  })

  // If no structural elements, use simple linear mapping
  if (structuralElements.length === 0 || totalPages === 1) {
    // Simple linear distribution
    const linesPerPage = Math.ceil(totalLines / Math.max(1, totalPages))

    for (let i = 0; i < totalLines; i++) {
      const page = Math.min(Math.floor(i / linesPerPage) + 1, totalPages)
      const positionInPage = (i % linesPerPage) / linesPerPage

      data.mappings.push({
        source: { file: fileName, line: i + 1, column: 0 },
        pdf: {
          page,
          x: 0.1,  // left margin
          y: 0.1 + positionInPage * 0.8,  // top to bottom
          width: 0.8,
          height: 1 / linesPerPage
        }
      })
    }

    return data
  }

  // Use structural elements to estimate page breaks
  const pageBreakLines: number[] = [1]  // page 1 starts at line 1
  let accumulatedWeight = 0
  const weightPerPage = structuralElements.reduce((sum, el) => sum + el.weight, 0) / totalPages

  for (const element of structuralElements) {
    accumulatedWeight += element.weight
    if (accumulatedWeight >= weightPerPage && pageBreakLines.length < totalPages) {
      pageBreakLines.push(element.line)
      accumulatedWeight = 0
    }
  }

  // Ensure we have page breaks for all pages
  while (pageBreakLines.length < totalPages) {
    const lastBreak = pageBreakLines[pageBreakLines.length - 1]
    const remaining = totalLines - lastBreak
    const remainingPages = totalPages - pageBreakLines.length + 1
    const nextBreak = lastBreak + Math.floor(remaining / remainingPages)
    pageBreakLines.push(nextBreak)
  }

  // Create mappings
  for (let i = 0; i < totalLines; i++) {
    const lineNum = i + 1

    // Find which page this line belongs to
    let page = 1
    for (let p = 1; p < pageBreakLines.length; p++) {
      if (lineNum >= pageBreakLines[p]) {
        page = p + 1
      } else {
        break
      }
    }

    // Calculate position within page
    const pageStart = pageBreakLines[page - 1] || 1
    const pageEnd = pageBreakLines[page] || totalLines + 1
    const linesInPage = pageEnd - pageStart
    const positionInPage = linesInPage > 0 ? (lineNum - pageStart) / linesInPage : 0

    data.mappings.push({
      source: { file: fileName, line: lineNum, column: 0 },
      pdf: {
        page,
        x: 0.1,
        y: 0.08 + positionInPage * 0.84,
        width: 0.8,
        height: Math.min(0.05, 1 / Math.max(1, linesInPage))
      }
    })
  }

  return data
}

/**
 * Find PDF location for a source position
 */
export function sourceToPDF(
  syncData: SyncTeXData,
  file: string,
  line: number,
  column = 0
): SyncTeXPDFLocation | null {
  // Exact match
  const exact = syncData.mappings.find(
    m => m.source.file === file &&
         m.source.line === line &&
         (column === 0 || m.source.column === column)
  )
  if (exact) return exact.pdf

  // Find closest line in same file
  const sameFile = syncData.mappings.filter(m =>
    m.source.file === file || m.source.file.endsWith(file)
  )

  if (sameFile.length === 0) return null

  // Find closest line
  let closest = sameFile[0]
  let minDist = Math.abs(sameFile[0].source.line - line)

  for (const mapping of sameFile) {
    const dist = Math.abs(mapping.source.line - line)
    if (dist < minDist) {
      minDist = dist
      closest = mapping
    }
  }

  return closest.pdf
}

/**
 * Find source location for a PDF position
 */
export function pdfToSource(
  syncData: SyncTeXData,
  page: number,
  x: number,
  y: number
): SyncTeXSourceLocation | null {
  // Find all mappings on the same page
  const samePage = syncData.mappings.filter(m => m.pdf.page === page)

  if (samePage.length === 0) return null

  // Find closest position
  let closest = samePage[0]
  let minDist = Infinity

  for (const mapping of samePage) {
    // Calculate distance (weighted more heavily on y since that's vertical position)
    const dx = mapping.pdf.x - x
    const dy = (mapping.pdf.y - y) * 2  // weight y more
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < minDist) {
      minDist = dist
      closest = mapping
    }
  }

  return closest.source
}

/**
 * Get page for a source line
 */
export function getPageForLine(
  syncData: SyncTeXData,
  file: string,
  line: number
): number | null {
  const location = sourceToPDF(syncData, file, line)
  return location?.page ?? null
}

/**
 * Get line range for a page
 */
export function getLinesForPage(
  syncData: SyncTeXData,
  page: number,
  file?: string
): { start: number; end: number } | null {
  let mappings = syncData.mappings.filter(m => m.pdf.page === page)

  if (file) {
    mappings = mappings.filter(m =>
      m.source.file === file || m.source.file.endsWith(file)
    )
  }

  if (mappings.length === 0) return null

  const lines = mappings.map(m => m.source.line)
  return {
    start: Math.min(...lines),
    end: Math.max(...lines)
  }
}

