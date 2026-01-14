/**
 * ArXiv API Client
 *
 * Fetch papers from arXiv.org API
 */

export interface ArxivPaperData {
  arxivId: string
  title: string
  authors: string[]
  abstract: string
  year: number
  published: string
  updated: string
  categories: string[]
  primaryCategory: string
  pdfUrl: string
  doi?: string
  journalRef?: string
  comment?: string
}

/**
 * Extract arXiv ID from various URL formats
 */
export function extractArxivId(input: string): string | null {
  // Clean the input
  const cleaned = input.trim()

  // Already an ID (e.g., "2301.00001" or "2301.00001v2")
  if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(cleaned)) {
    return cleaned
  }

  // Old format ID (e.g., "cs.AI/0601001")
  if (/^[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?$/i.test(cleaned)) {
    return cleaned
  }

  // URL formats
  const patterns = [
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5}(?:v\d+)?)/i,
    /arxiv\.org\/abs\/([a-z-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?)/i,
    /arxiv\.org\/pdf\/(\d{4}\.\d{4,5}(?:v\d+)?)/i,
    /arxiv\.org\/pdf\/([a-z-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?)/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Fetch paper metadata from arXiv API
 */
export async function fetchArxivPaper(arxivId: string): Promise<ArxivPaperData | null> {
  try {
    const response = await fetch(
      `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`
    )

    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.status}`)
    }

    const xmlText = await response.text()
    return parseArxivResponse(xmlText)
  } catch (error) {
    console.error('Failed to fetch from arXiv:', error)
    return null
  }
}

/**
 * Search arXiv papers
 */
export async function searchArxiv(
  query: string,
  options: {
    maxResults?: number
    start?: number
    sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate'
    sortOrder?: 'ascending' | 'descending'
    categories?: string[]
  } = {}
): Promise<ArxivPaperData[]> {
  const {
    maxResults = 10,
    start = 0,
    sortBy = 'relevance',
    sortOrder = 'descending',
    categories = [],
  } = options

  // Build search query
  let searchQuery = query
  if (categories.length > 0) {
    const catQuery = categories.map(c => `cat:${c}`).join(' OR ')
    searchQuery = `(${query}) AND (${catQuery})`
  }

  const params = new URLSearchParams({
    search_query: searchQuery,
    start: start.toString(),
    max_results: maxResults.toString(),
    sortBy,
    sortOrder,
  })

  try {
    const response = await fetch(
      `https://export.arxiv.org/api/query?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.status}`)
    }

    const xmlText = await response.text()
    return parseArxivSearchResponse(xmlText)
  } catch (error) {
    console.error('Failed to search arXiv:', error)
    return []
  }
}

/**
 * Parse single paper response from arXiv API
 */
function parseArxivResponse(xml: string): ArxivPaperData | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    const entry = doc.querySelector('entry')
    if (!entry) return null

    return parseEntry(entry)
  } catch (error) {
    console.error('Failed to parse arXiv response:', error)
    return null
  }
}

/**
 * Parse search response from arXiv API
 */
function parseArxivSearchResponse(xml: string): ArxivPaperData[] {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    const entries = doc.querySelectorAll('entry')
    const papers: ArxivPaperData[] = []

    entries.forEach(entry => {
      const paper = parseEntry(entry)
      if (paper) {
        papers.push(paper)
      }
    })

    return papers
  } catch (error) {
    console.error('Failed to parse arXiv search response:', error)
    return []
  }
}

/**
 * Parse a single entry element
 */
function parseEntry(entry: Element): ArxivPaperData | null {
  try {
    // Get ID and extract arxiv ID
    const idElement = entry.querySelector('id')
    if (!idElement) return null

    const idUrl = idElement.textContent || ''
    const arxivIdMatch = idUrl.match(/arxiv\.org\/abs\/(.+)$/)
    if (!arxivIdMatch) return null

    const arxivId = arxivIdMatch[1]

    // Get title
    const titleElement = entry.querySelector('title')
    const title = cleanText(titleElement?.textContent || '')

    // Get authors
    const authorElements = entry.querySelectorAll('author name')
    const authors: string[] = []
    authorElements.forEach(el => {
      const name = el.textContent?.trim()
      if (name) authors.push(name)
    })

    // Get abstract
    const summaryElement = entry.querySelector('summary')
    const abstract = cleanText(summaryElement?.textContent || '')

    // Get dates
    const publishedElement = entry.querySelector('published')
    const updatedElement = entry.querySelector('updated')
    const published = publishedElement?.textContent || ''
    const updated = updatedElement?.textContent || ''
    const year = new Date(published).getFullYear()

    // Get categories
    const categoryElements = entry.querySelectorAll('category')
    const categories: string[] = []
    let primaryCategory = ''
    categoryElements.forEach((el, index) => {
      const term = el.getAttribute('term')
      if (term) {
        categories.push(term)
        if (index === 0) primaryCategory = term
      }
    })

    // Get PDF URL
    const pdfLink = entry.querySelector('link[title="pdf"]')
    const pdfUrl = pdfLink?.getAttribute('href') || `https://arxiv.org/pdf/${arxivId}.pdf`

    // Get DOI
    const doiElement = entry.querySelector('doi')
    const doi = doiElement?.textContent || undefined

    // Get journal reference
    const journalRefElement = entry.querySelector('journal_ref')
    const journalRef = journalRefElement?.textContent || undefined

    // Get comment
    const commentElement = entry.querySelector('comment')
    const comment = commentElement?.textContent || undefined

    return {
      arxivId,
      title,
      authors,
      abstract,
      year,
      published,
      updated,
      categories,
      primaryCategory,
      pdfUrl,
      doi,
      journalRef,
      comment,
    }
  } catch (error) {
    console.error('Failed to parse entry:', error)
    return null
  }
}

/**
 * Clean text content (remove extra whitespace, newlines)
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Download PDF from arXiv
 */
export async function downloadArxivPdf(arxivId: string): Promise<Blob | null> {
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`

  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`)
    }

    return await response.blob()
  } catch (error) {
    console.error('Failed to download arXiv PDF:', error)
    return null
  }
}

/**
 * Generate BibTeX entry for an arXiv paper
 */
export function generateArxivBibtex(paper: ArxivPaperData): string {
  // Generate citation key: first author last name + year
  const firstAuthor = paper.authors[0] || 'unknown'
  const lastName = firstAuthor.split(' ').pop()?.toLowerCase() || 'unknown'
  const key = `${lastName}${paper.year}${paper.arxivId.split('.')[0]}`

  const authors = paper.authors.join(' and ')

  let bibtex = `@article{${key},
  title = {${paper.title}},
  author = {${authors}},
  year = {${paper.year}},
  eprint = {${paper.arxivId}},
  archiveprefix = {arXiv},
  primaryclass = {${paper.primaryCategory}},`

  if (paper.doi) {
    bibtex += `
  doi = {${paper.doi}},`
  }

  if (paper.journalRef) {
    bibtex += `
  journal = {${paper.journalRef}},`
  }

  bibtex += `
  url = {https://arxiv.org/abs/${paper.arxivId}},
}`

  return bibtex
}

/**
 * Common arXiv categories
 */
export const ARXIV_CATEGORIES = {
  'cs.AI': 'Artificial Intelligence',
  'cs.CL': 'Computation and Language',
  'cs.CV': 'Computer Vision',
  'cs.LG': 'Machine Learning',
  'cs.NE': 'Neural and Evolutionary Computing',
  'cs.RO': 'Robotics',
  'cs.SE': 'Software Engineering',
  'stat.ML': 'Machine Learning (Statistics)',
  'math.OC': 'Optimization and Control',
  'physics.comp-ph': 'Computational Physics',
  'q-bio.NC': 'Neurons and Cognition',
  'eess.SP': 'Signal Processing',
} as const
