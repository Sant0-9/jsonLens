/**
 * DOI Lookup Service
 *
 * Fetch citation metadata from DOI using CrossRef API.
 * Free API, no key required.
 */

import { generateCitationKey, type BibEntry, type BibEntryType } from './bib-parser'

interface CrossRefWork {
  DOI: string
  type: string
  title: string[]
  author?: Array<{
    given?: string
    family?: string
    name?: string
  }>
  'container-title'?: string[]
  publisher?: string
  published?: {
    'date-parts': number[][]
  }
  'published-print'?: {
    'date-parts': number[][]
  }
  'published-online'?: {
    'date-parts': number[][]
  }
  volume?: string
  issue?: string
  page?: string
  abstract?: string
  ISBN?: string[]
  ISSN?: string[]
  URL?: string
  'event'?: {
    name?: string
  }
}

interface CrossRefResponse {
  status: string
  'message-type': string
  message: CrossRefWork
}

const CROSSREF_API = 'https://api.crossref.org/works'

/**
 * Fetch citation metadata from DOI
 */
export async function lookupDOI(doi: string): Promise<BibEntry | null> {
  // Clean DOI (remove URL prefix if present)
  const cleanDoi = extractDOI(doi)
  if (!cleanDoi) {
    throw new Error('Invalid DOI format')
  }

  try {
    const response = await fetch(`${CROSSREF_API}/${encodeURIComponent(cleanDoi)}`, {
      headers: {
        'Accept': 'application/json',
        // Polite pool - provide contact info
        'User-Agent': 'ResearchWorkbench/1.0 (https://github.com/example; mailto:user@example.com)'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('DOI not found')
      }
      throw new Error(`CrossRef API error: ${response.status}`)
    }

    const data: CrossRefResponse = await response.json()
    return crossRefToBibEntry(data.message)

  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch DOI metadata')
  }
}

/**
 * Extract DOI from various formats
 */
export function extractDOI(input: string): string | null {
  const trimmed = input.trim()

  // Already a clean DOI (10.xxx/xxx)
  if (/^10\.\d{4,}\/[^\s]+$/.test(trimmed)) {
    return trimmed
  }

  // DOI URL formats
  const urlPatterns = [
    /doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
    /dx\.doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
    /doi:\s*(10\.\d{4,}\/[^\s]+)/i
  ]

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Convert CrossRef response to BibEntry
 */
function crossRefToBibEntry(work: CrossRefWork): BibEntry {
  const type = mapCrossRefType(work.type)
  const fields: Record<string, string> = {}

  // Title
  if (work.title && work.title.length > 0) {
    fields.title = work.title[0]
  }

  // Authors
  if (work.author && work.author.length > 0) {
    fields.author = work.author
      .map(a => {
        if (a.name) return a.name
        if (a.family && a.given) return `${a.family}, ${a.given}`
        if (a.family) return a.family
        return ''
      })
      .filter(Boolean)
      .join(' and ')
  }

  // Year
  const date = work.published || work['published-print'] || work['published-online']
  if (date?.['date-parts']?.[0]?.[0]) {
    fields.year = String(date['date-parts'][0][0])
  }

  // Journal/booktitle
  if (work['container-title'] && work['container-title'].length > 0) {
    if (type === 'article') {
      fields.journal = work['container-title'][0]
    } else if (type === 'inproceedings' || type === 'incollection') {
      fields.booktitle = work['container-title'][0]
    }
  }

  // Conference name for proceedings
  if (work.event?.name && (type === 'inproceedings' || type === 'conference')) {
    fields.booktitle = work.event.name
  }

  // Publisher
  if (work.publisher) {
    fields.publisher = work.publisher
  }

  // Volume
  if (work.volume) {
    fields.volume = work.volume
  }

  // Issue/Number
  if (work.issue) {
    fields.number = work.issue
  }

  // Pages
  if (work.page) {
    fields.pages = work.page.replace('-', '--')
  }

  // DOI
  fields.doi = work.DOI

  // ISBN
  if (work.ISBN && work.ISBN.length > 0) {
    fields.isbn = work.ISBN[0]
  }

  // URL
  if (work.URL) {
    fields.url = work.URL
  }

  // Abstract
  if (work.abstract) {
    // Clean HTML tags from abstract
    fields.abstract = work.abstract.replace(/<[^>]*>/g, '')
  }

  // Generate citation key
  const id = generateCitationKey(fields)

  return {
    id,
    type,
    fields
  }
}

/**
 * Map CrossRef type to BibTeX type
 */
function mapCrossRefType(crossRefType: string): BibEntryType {
  const typeMap: Record<string, BibEntryType> = {
    'journal-article': 'article',
    'book': 'book',
    'book-chapter': 'incollection',
    'proceedings-article': 'inproceedings',
    'conference-paper': 'inproceedings',
    'dissertation': 'phdthesis',
    'report': 'techreport',
    'report-component': 'techreport',
    'posted-content': 'misc',
    'dataset': 'misc',
    'component': 'misc',
    'peer-review': 'misc'
  }

  return typeMap[crossRefType] || 'misc'
}

/**
 * Validate DOI format
 */
export function isValidDOI(doi: string): boolean {
  return extractDOI(doi) !== null
}

/**
 * Format DOI as URL
 */
export function doiToUrl(doi: string): string {
  const cleanDoi = extractDOI(doi)
  if (!cleanDoi) return ''
  return `https://doi.org/${cleanDoi}`
}

/**
 * Batch lookup multiple DOIs
 */
export async function lookupMultipleDOIs(dois: string[]): Promise<{
  entries: BibEntry[]
  errors: Array<{ doi: string; error: string }>
}> {
  const entries: BibEntry[] = []
  const errors: Array<{ doi: string; error: string }> = []

  for (const doi of dois) {
    try {
      const entry = await lookupDOI(doi)
      if (entry) {
        entries.push(entry)
      }
      // Add a small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      errors.push({
        doi,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { entries, errors }
}

/**
 * Lookup from arXiv ID
 */
export async function lookupArxiv(arxivId: string): Promise<BibEntry | null> {
  // Clean arXiv ID
  const cleanId = arxivId.replace(/^arxiv:/i, '').trim()

  try {
    const response = await fetch(
      `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`
    )

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`)
    }

    const xml = await response.text()
    return parseArxivResponse(xml, cleanId)

  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch arXiv metadata')
  }
}

/**
 * Parse arXiv API XML response
 */
function parseArxivResponse(xml: string, arxivId: string): BibEntry | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')

  const entry = doc.querySelector('entry')
  if (!entry) return null

  const fields: Record<string, string> = {}

  // Title
  const title = entry.querySelector('title')?.textContent?.trim()
  if (title) {
    fields.title = title.replace(/\s+/g, ' ')
  }

  // Authors
  const authors = entry.querySelectorAll('author name')
  if (authors.length > 0) {
    fields.author = Array.from(authors)
      .map(a => a.textContent?.trim())
      .filter(Boolean)
      .join(' and ')
  }

  // Abstract
  const abstract = entry.querySelector('summary')?.textContent?.trim()
  if (abstract) {
    fields.abstract = abstract.replace(/\s+/g, ' ')
  }

  // Published date
  const published = entry.querySelector('published')?.textContent
  if (published) {
    const year = new Date(published).getFullYear()
    fields.year = String(year)
  }

  // arXiv ID and URL
  fields.eprint = arxivId
  fields.archiveprefix = 'arXiv'
  fields.url = `https://arxiv.org/abs/${arxivId}`

  // Primary category
  const category = entry.querySelector('arxiv\\:primary_category, primary_category')
    ?.getAttribute('term')
  if (category) {
    fields.primaryclass = category
  }

  // Generate citation key
  const id = generateCitationKey(fields)

  return {
    id,
    type: 'misc',
    fields
  }
}
