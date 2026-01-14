/**
 * BibTeX Parser
 *
 * Parse and format .bib files for bibliography management.
 */

export interface BibEntry {
  id: string           // Citation key
  type: BibEntryType
  fields: Record<string, string>
}

export type BibEntryType =
  | 'article'
  | 'book'
  | 'inproceedings'
  | 'conference'
  | 'incollection'
  | 'inbook'
  | 'phdthesis'
  | 'mastersthesis'
  | 'techreport'
  | 'misc'
  | 'unpublished'
  | 'manual'
  | 'proceedings'
  | 'booklet'

const ENTRY_REGEX = /@(\w+)\s*\{\s*([^,]+)\s*,([^@]*)/gi

/**
 * Parse a BibTeX string into structured entries
 */
export function parseBibTeX(bibtex: string): BibEntry[] {
  const entries: BibEntry[] = []
  const cleanBibtex = removeComments(bibtex)

  // Match each entry
  const entryMatches = cleanBibtex.matchAll(ENTRY_REGEX)

  for (const match of entryMatches) {
    const rawType = match[1].toLowerCase()
    const id = match[2].trim()
    const fieldsStr = match[3]

    // Skip if type is 'string' or 'preamble' (special BibTeX directives)
    if (rawType === 'string' || rawType === 'preamble' || rawType === 'comment') {
      continue
    }

    const type = rawType as BibEntryType
    const fields = parseFields(fieldsStr)

    entries.push({
      id,
      type,
      fields
    })
  }

  return entries
}

/**
 * Remove BibTeX comments
 */
function removeComments(bibtex: string): string {
  const lines = bibtex.split('\n')
  return lines
    .filter(line => !line.trim().startsWith('%'))
    .join('\n')
}

/**
 * Parse the fields section of a BibTeX entry
 */
function parseFields(fieldsStr: string): Record<string, string> {
  const fields: Record<string, string> = {}

  // Handle various field formats:
  // field = {value}
  // field = "value"
  // field = number

  let currentField = ''
  let currentValue = ''
  let depth = 0
  let inValue = false
  let delimiter = ''

  for (let i = 0; i < fieldsStr.length; i++) {
    const char = fieldsStr[i]

    if (!inValue) {
      if (char === '=') {
        currentField = currentField.trim().toLowerCase()
        inValue = true
        delimiter = ''
        currentValue = ''
        depth = 0
      } else if (char !== ',' && char !== '\n') {
        currentField += char
      }
    } else {
      // In value
      if (!delimiter) {
        // Looking for value start
        if (char === '{') {
          delimiter = '}'
          depth = 1
        } else if (char === '"') {
          delimiter = '"'
        } else if (/\d/.test(char)) {
          // Numeric value
          currentValue += char
          // Continue until comma or end
          while (i + 1 < fieldsStr.length && /[\d\w]/.test(fieldsStr[i + 1])) {
            i++
            currentValue += fieldsStr[i]
          }
          if (currentField) {
            fields[currentField] = currentValue.trim()
          }
          currentField = ''
          currentValue = ''
          inValue = false
        }
      } else if (delimiter === '}') {
        if (char === '{') {
          depth++
          currentValue += char
        } else if (char === '}') {
          depth--
          if (depth === 0) {
            if (currentField) {
              fields[currentField] = cleanValue(currentValue)
            }
            currentField = ''
            currentValue = ''
            inValue = false
            delimiter = ''
          } else {
            currentValue += char
          }
        } else {
          currentValue += char
        }
      } else if (delimiter === '"') {
        if (char === '"') {
          if (currentField) {
            fields[currentField] = cleanValue(currentValue)
          }
          currentField = ''
          currentValue = ''
          inValue = false
          delimiter = ''
        } else {
          currentValue += char
        }
      }
    }
  }

  return fields
}

/**
 * Clean a BibTeX value (remove extra whitespace, handle special characters)
 */
function cleanValue(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\\&/g, '&')
    .replace(/\{([^}]*)\}/g, '$1') // Remove inner braces
    .trim()
}

/**
 * Format a BibEntry back to BibTeX string
 */
export function formatBibTeX(entry: BibEntry): string {
  const lines = [`@${entry.type}{${entry.id},`]

  const fieldOrder = getFieldOrder(entry.type)
  const orderedFields: [string, string][] = []
  const otherFields: [string, string][] = []

  for (const [key, value] of Object.entries(entry.fields)) {
    if (fieldOrder.includes(key)) {
      orderedFields.push([key, value])
    } else {
      otherFields.push([key, value])
    }
  }

  // Sort ordered fields
  orderedFields.sort((a, b) =>
    fieldOrder.indexOf(a[0]) - fieldOrder.indexOf(b[0])
  )

  // Add all fields
  const allFields = [...orderedFields, ...otherFields]
  for (let i = 0; i < allFields.length; i++) {
    const [key, value] = allFields[i]
    const comma = i < allFields.length - 1 ? ',' : ''
    lines.push(`  ${key} = {${value}}${comma}`)
  }

  lines.push('}')
  return lines.join('\n')
}

/**
 * Get the preferred field order for an entry type
 */
function getFieldOrder(type: BibEntryType): string[] {
  switch (type) {
    case 'article':
      return ['author', 'title', 'journal', 'year', 'volume', 'number', 'pages', 'doi']
    case 'book':
      return ['author', 'editor', 'title', 'publisher', 'year', 'isbn', 'doi']
    case 'inproceedings':
    case 'conference':
      return ['author', 'title', 'booktitle', 'year', 'pages', 'publisher', 'doi']
    case 'phdthesis':
    case 'mastersthesis':
      return ['author', 'title', 'school', 'year']
    case 'techreport':
      return ['author', 'title', 'institution', 'year', 'number']
    default:
      return ['author', 'title', 'year']
  }
}

/**
 * Generate a citation key from entry fields
 */
export function generateCitationKey(fields: Record<string, string>): string {
  let author = ''
  if (fields.author) {
    // Extract first author's last name
    const firstAuthor = fields.author.split(' and ')[0]
    const nameParts = firstAuthor.split(/[,\s]+/)
    author = nameParts[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
  }

  const year = fields.year || new Date().getFullYear().toString()

  // Extract first significant word from title
  let titleWord = ''
  if (fields.title) {
    const words = fields.title.split(/\s+/)
    const skipWords = ['a', 'an', 'the', 'on', 'of', 'for', 'and', 'in', 'to']
    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
      if (clean.length > 2 && !skipWords.includes(clean)) {
        titleWord = clean
        break
      }
    }
  }

  return `${author}${year}${titleWord}`.substring(0, 30) || `entry${Date.now()}`
}

/**
 * Get required fields for an entry type
 */
export function getRequiredFields(type: BibEntryType): string[] {
  switch (type) {
    case 'article':
      return ['author', 'title', 'journal', 'year']
    case 'book':
      return ['author', 'title', 'publisher', 'year']
    case 'inproceedings':
    case 'conference':
      return ['author', 'title', 'booktitle', 'year']
    case 'phdthesis':
    case 'mastersthesis':
      return ['author', 'title', 'school', 'year']
    case 'techreport':
      return ['author', 'title', 'institution', 'year']
    case 'misc':
      return ['title']
    default:
      return ['title', 'year']
  }
}

/**
 * Get optional fields for an entry type
 */
export function getOptionalFields(type: BibEntryType): string[] {
  switch (type) {
    case 'article':
      return ['volume', 'number', 'pages', 'month', 'doi', 'url', 'note']
    case 'book':
      return ['editor', 'volume', 'series', 'address', 'edition', 'month', 'isbn', 'doi', 'url', 'note']
    case 'inproceedings':
    case 'conference':
      return ['editor', 'volume', 'series', 'pages', 'address', 'month', 'organization', 'publisher', 'doi', 'url', 'note']
    case 'phdthesis':
    case 'mastersthesis':
      return ['address', 'month', 'doi', 'url', 'note']
    case 'techreport':
      return ['type', 'address', 'month', 'doi', 'url', 'note']
    case 'misc':
      return ['author', 'year', 'howpublished', 'month', 'doi', 'url', 'note']
    default:
      return ['author', 'editor', 'doi', 'url', 'note']
  }
}

/**
 * Validate a BibTeX entry
 */
export function validateEntry(entry: BibEntry): string[] {
  const errors: string[] = []
  const required = getRequiredFields(entry.type)

  for (const field of required) {
    if (!entry.fields[field] || entry.fields[field].trim() === '') {
      errors.push(`Missing required field: ${field}`)
    }
  }

  if (!entry.id || entry.id.trim() === '') {
    errors.push('Missing citation key')
  }

  // Check for invalid characters in citation key
  if (entry.id && !/^[a-zA-Z0-9_:-]+$/.test(entry.id)) {
    errors.push('Citation key contains invalid characters')
  }

  return errors
}

/**
 * Find duplicate entries in a bibliography
 */
export function findDuplicates(entries: BibEntry[]): Map<string, BibEntry[]> {
  const duplicates = new Map<string, BibEntry[]>()

  // Check for duplicate citation keys
  const byKey = new Map<string, BibEntry[]>()
  for (const entry of entries) {
    const existing = byKey.get(entry.id) || []
    existing.push(entry)
    byKey.set(entry.id, existing)
  }

  for (const [key, entries] of byKey) {
    if (entries.length > 1) {
      duplicates.set(`key:${key}`, entries)
    }
  }

  // Check for duplicate DOIs
  const byDoi = new Map<string, BibEntry[]>()
  for (const entry of entries) {
    if (entry.fields.doi) {
      const doi = entry.fields.doi.toLowerCase()
      const existing = byDoi.get(doi) || []
      existing.push(entry)
      byDoi.set(doi, existing)
    }
  }

  for (const [doi, entries] of byDoi) {
    if (entries.length > 1) {
      duplicates.set(`doi:${doi}`, entries)
    }
  }

  return duplicates
}
