/**
 * Link Parser for Research Notes
 *
 * Parses and extracts:
 * - Wikilinks: [[Note Title]] or [[Note Title|Display Text]]
 * - Paper references: @paper:paper-id or @paper:arxiv:2301.00001
 * - Note references: @note:note-id
 * - Question references: @question:question-id
 */

export interface WikiLink {
  fullMatch: string
  noteTitle: string
  displayText: string
  startIndex: number
  endIndex: number
}

export interface PaperReference {
  fullMatch: string
  paperId: string
  type: 'internal' | 'arxiv' | 'doi'
  startIndex: number
  endIndex: number
}

export interface NoteReference {
  fullMatch: string
  noteId: string
  startIndex: number
  endIndex: number
}

export interface QuestionReference {
  fullMatch: string
  questionId: string
  startIndex: number
  endIndex: number
}

export interface ParsedLinks {
  wikiLinks: WikiLink[]
  paperRefs: PaperReference[]
  noteRefs: NoteReference[]
  questionRefs: QuestionReference[]
}

// Regex patterns
const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
const PAPER_REF_PATTERN = /@paper:(arxiv:|doi:)?([a-zA-Z0-9._-]+)/g
const NOTE_REF_PATTERN = /@note:([a-zA-Z0-9_-]+)/g
const QUESTION_REF_PATTERN = /@question:([a-zA-Z0-9_-]+)/g

/**
 * Parse all links from markdown content
 */
export function parseLinks(content: string): ParsedLinks {
  return {
    wikiLinks: parseWikiLinks(content),
    paperRefs: parsePaperReferences(content),
    noteRefs: parseNoteReferences(content),
    questionRefs: parseQuestionReferences(content),
  }
}

/**
 * Parse wikilinks [[Note Title]] or [[Note Title|Display Text]]
 */
export function parseWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = []
  let match: RegExpExecArray | null

  const pattern = new RegExp(WIKILINK_PATTERN.source, 'g')
  while ((match = pattern.exec(content)) !== null) {
    links.push({
      fullMatch: match[0],
      noteTitle: match[1].trim(),
      displayText: (match[2] || match[1]).trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return links
}

/**
 * Parse paper references @paper:id or @paper:arxiv:id or @paper:doi:id
 */
export function parsePaperReferences(content: string): PaperReference[] {
  const refs: PaperReference[] = []
  let match: RegExpExecArray | null

  const pattern = new RegExp(PAPER_REF_PATTERN.source, 'g')
  while ((match = pattern.exec(content)) !== null) {
    const prefix = match[1] || ''
    let type: PaperReference['type'] = 'internal'
    if (prefix === 'arxiv:') type = 'arxiv'
    else if (prefix === 'doi:') type = 'doi'

    refs.push({
      fullMatch: match[0],
      paperId: match[2],
      type,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return refs
}

/**
 * Parse note references @note:id
 */
export function parseNoteReferences(content: string): NoteReference[] {
  const refs: NoteReference[] = []
  let match: RegExpExecArray | null

  const pattern = new RegExp(NOTE_REF_PATTERN.source, 'g')
  while ((match = pattern.exec(content)) !== null) {
    refs.push({
      fullMatch: match[0],
      noteId: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return refs
}

/**
 * Parse question references @question:id
 */
export function parseQuestionReferences(content: string): QuestionReference[] {
  const refs: QuestionReference[] = []
  let match: RegExpExecArray | null

  const pattern = new RegExp(QUESTION_REF_PATTERN.source, 'g')
  while ((match = pattern.exec(content)) !== null) {
    refs.push({
      fullMatch: match[0],
      questionId: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return refs
}

/**
 * Extract unique note titles from wikilinks
 */
export function extractLinkedNoteTitles(content: string): string[] {
  const links = parseWikiLinks(content)
  return [...new Set(links.map(l => l.noteTitle))]
}

/**
 * Extract unique paper IDs from paper references
 */
export function extractLinkedPaperIds(content: string): string[] {
  const refs = parsePaperReferences(content)
  return [...new Set(refs.map(r => r.paperId))]
}

/**
 * Replace wikilinks with actual links (for rendering)
 */
export function replaceWikiLinks(
  content: string,
  noteMap: Map<string, { id: string; exists: boolean }>
): string {
  return content.replace(WIKILINK_PATTERN, (match, title, displayText) => {
    const noteTitle = title.trim()
    const display = (displayText || title).trim()
    const noteInfo = noteMap.get(noteTitle.toLowerCase())

    if (noteInfo?.exists) {
      return `[${display}](/notes/${noteInfo.id})`
    } else {
      // Non-existent note - show as red link
      return `[${display}](/notes/new?title=${encodeURIComponent(noteTitle)})`
    }
  })
}

/**
 * Replace paper references with links
 */
export function replacePaperRefs(
  content: string,
  paperMap: Map<string, { title: string; exists: boolean }>
): string {
  return content.replace(PAPER_REF_PATTERN, (match, prefix, paperId) => {
    const type = prefix === 'arxiv:' ? 'arxiv' : prefix === 'doi:' ? 'doi' : 'internal'
    const paperInfo = paperMap.get(paperId)

    if (type === 'arxiv') {
      return `[arXiv:${paperId}](https://arxiv.org/abs/${paperId})`
    } else if (type === 'doi') {
      return `[DOI:${paperId}](https://doi.org/${paperId})`
    } else if (paperInfo?.exists) {
      return `[${paperInfo.title}](/papers/${paperId})`
    } else {
      return `[Paper: ${paperId}](/papers?search=${paperId})`
    }
  })
}

/**
 * Generate autocomplete suggestions for wikilinks
 */
export function getWikiLinkSuggestions(
  partialTitle: string,
  existingNotes: Array<{ id: string; title: string }>
): Array<{ id: string; title: string; score: number }> {
  const query = partialTitle.toLowerCase()

  return existingNotes
    .map(note => {
      const titleLower = note.title.toLowerCase()
      let score = 0

      // Exact match
      if (titleLower === query) score = 100
      // Starts with query
      else if (titleLower.startsWith(query)) score = 80
      // Contains query
      else if (titleLower.includes(query)) score = 60
      // Word starts with query
      else if (titleLower.split(/\s+/).some(w => w.startsWith(query))) score = 40

      return { ...note, score }
    })
    .filter(n => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

/**
 * Check if cursor is inside a wikilink
 */
export function isInsideWikiLink(content: string, cursorPosition: number): {
  isInside: boolean
  startIndex: number
  currentText: string
} {
  // Look backwards for [[
  let openIndex = -1
  for (let i = cursorPosition - 1; i >= 0 && i >= cursorPosition - 100; i--) {
    if (content.substring(i, i + 2) === '[[') {
      openIndex = i
      break
    }
    if (content.substring(i, i + 2) === ']]') {
      break // Found closing before opening
    }
  }

  if (openIndex === -1) {
    return { isInside: false, startIndex: -1, currentText: '' }
  }

  // Check if there's a ]] between openIndex and cursor
  const betweenText = content.substring(openIndex + 2, cursorPosition)
  if (betweenText.includes(']]')) {
    return { isInside: false, startIndex: -1, currentText: '' }
  }

  return {
    isInside: true,
    startIndex: openIndex,
    currentText: betweenText.split('|')[0], // Get text before pipe if any
  }
}

/**
 * Format links for display in preview
 */
export function formatLinksForPreview(content: string): string {
  // This will be called after markdown processing
  // Highlight wikilinks and references with special styling
  let formatted = content

  // Style wikilinks as internal links
  formatted = formatted.replace(
    WIKILINK_PATTERN,
    '<span class="wikilink" data-note="$1">$2</span>'
  )

  // Style paper refs
  formatted = formatted.replace(
    PAPER_REF_PATTERN,
    '<span class="paper-ref" data-paper="$2" data-type="$1">$&</span>'
  )

  return formatted
}
