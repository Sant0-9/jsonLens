"use client"

import { useState } from 'react'
import { usePapersStore } from '@/store/papers-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  extractArxivId,
  fetchArxivPaper,
  downloadArxivPdf,
  generateArxivBibtex,
} from '@/lib/papers/arxiv-api'
import {
  Loader2,
  Link as LinkIcon,
  Upload,
  Check,
  AlertCircle,
} from 'lucide-react'

interface ImportPaperProps {
  open: boolean
  onClose: () => void
}

export function ImportPaper({ open, onClose }: ImportPaperProps) {
  const { addPaper } = usePapersStore()
  const [activeTab, setActiveTab] = useState('arxiv')

  // ArXiv import state
  const [arxivUrl, setArxivUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Manual import state
  const [manualData, setManualData] = useState({
    title: '',
    authors: '',
    year: new Date().getFullYear().toString(),
    abstract: '',
    doi: '',
    venue: '',
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const handleArxivImport = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const arxivId = extractArxivId(arxivUrl)
      if (!arxivId) {
        throw new Error('Invalid arXiv URL or ID')
      }

      const paper = await fetchArxivPaper(arxivId)
      if (!paper) {
        throw new Error('Could not fetch paper from arXiv')
      }

      // Download PDF
      const pdfBlob = await downloadArxivPdf(arxivId)

      // Generate BibTeX
      const bibtex = generateArxivBibtex(paper)

      // Add to library
      await addPaper(
        {
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          year: paper.year,
          venue: paper.journalRef,
          doi: paper.doi,
          arxivId: paper.arxivId,
          tags: paper.categories.slice(0, 3),
          bibtex,
        },
        pdfBlob || undefined
      )

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setArxivUrl('')
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import paper')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualImport = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!manualData.title) {
        throw new Error('Title is required')
      }

      const authors = manualData.authors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      // Read PDF file if provided
      let pdfBlob: Blob | undefined
      if (pdfFile) {
        pdfBlob = pdfFile
      }

      // Generate basic BibTeX
      const firstAuthor = authors[0] || 'unknown'
      const lastName = firstAuthor.split(' ').pop()?.toLowerCase() || 'unknown'
      const key = `${lastName}${manualData.year}`

      let bibtex = `@article{${key},
  title = {${manualData.title}},
  author = {${authors.join(' and ')}},
  year = {${manualData.year}},`

      if (manualData.doi) {
        bibtex += `
  doi = {${manualData.doi}},`
      }

      if (manualData.venue) {
        bibtex += `
  journal = {${manualData.venue}},`
      }

      bibtex += '\n}'

      await addPaper(
        {
          title: manualData.title,
          authors,
          abstract: manualData.abstract,
          year: parseInt(manualData.year) || new Date().getFullYear(),
          venue: manualData.venue || undefined,
          doi: manualData.doi || undefined,
          tags: [],
          bibtex,
        },
        pdfBlob
      )

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setManualData({
          title: '',
          authors: '',
          year: new Date().getFullYear().toString(),
          abstract: '',
          doi: '',
          venue: '',
        })
        setPdfFile(null)
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import paper')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Paper</DialogTitle>
          <DialogDescription>
            Import a paper from arXiv or add it manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="arxiv">
              <LinkIcon className="h-4 w-4 mr-2" />
              From arXiv
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Upload className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arxiv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="arxiv-url">arXiv URL or ID</Label>
              <Input
                id="arxiv-url"
                placeholder="https://arxiv.org/abs/2301.00001 or 2301.00001"
                value={arxivUrl}
                onChange={(e) => setArxivUrl(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Paste the arXiv URL or paper ID (e.g., 2301.00001)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Paper imported successfully!
              </div>
            )}

            <Button
              onClick={handleArxivImport}
              disabled={isLoading || !arxivUrl}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import from arXiv'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={manualData.title}
                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authors">Authors (comma-separated)</Label>
              <Input
                id="authors"
                placeholder="John Doe, Jane Smith"
                value={manualData.authors}
                onChange={(e) => setManualData({ ...manualData, authors: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={manualData.year}
                  onChange={(e) => setManualData({ ...manualData, year: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue/Journal</Label>
                <Input
                  id="venue"
                  placeholder="NeurIPS 2024"
                  value={manualData.venue}
                  onChange={(e) => setManualData({ ...manualData, venue: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                placeholder="10.1234/example"
                value={manualData.doi}
                onChange={(e) => setManualData({ ...manualData, doi: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                rows={4}
                value={manualData.abstract}
                onChange={(e) => setManualData({ ...manualData, abstract: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf">PDF File (optional)</Label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {pdfFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {pdfFile.name}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Paper imported successfully!
              </div>
            )}

            <Button
              onClick={handleManualImport}
              disabled={isLoading || !manualData.title}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Add Paper'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
