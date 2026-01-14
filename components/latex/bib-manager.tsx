"use client"

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLatexStore } from '@/store/latex-store'
import {
  parseBibTeX,
  formatBibTeX,
  validateEntry,
  type BibEntry,
  type BibEntryType
} from '@/lib/latex/bib-parser'
import { lookupDOI, doiToUrl } from '@/lib/latex/doi-lookup'

interface BibManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function BibManager({ isOpen, onClose }: BibManagerProps) {
  const { files, activeFile, setContent, content } = useLatexStore()

  const [entries, setEntries] = useState<BibEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingEntry, setEditingEntry] = useState<BibEntry | null>(null)
  const [doiInput, setDoiInput] = useState('')
  const [isLoadingDoi, setIsLoadingDoi] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Find .bib file in project
  const bibFile = files.find(f => f.name.endsWith('.bib'))

  // Parse entries when bib file content changes
  useEffect(() => {
    if (bibFile && activeFile === bibFile.name) {
      const parsed = parseBibTeX(content)
      setEntries(parsed)
    } else if (bibFile) {
      const parsed = parseBibTeX(bibFile.content)
      setEntries(parsed)
    } else {
      setEntries([])
    }
  }, [bibFile, content, activeFile])

  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      entry.id.toLowerCase().includes(query) ||
      entry.fields.title?.toLowerCase().includes(query) ||
      entry.fields.author?.toLowerCase().includes(query)
    )
  })

  const handleDoiLookup = async () => {
    if (!doiInput.trim()) return

    setError('')
    setIsLoadingDoi(true)

    try {
      const entry = await lookupDOI(doiInput.trim())
      if (entry) {
        // Check for duplicate
        if (entries.some(e => e.id === entry.id)) {
          entry.id = `${entry.id}_${Date.now().toString(36)}`
        }
        addEntry(entry)
        setDoiInput('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup DOI')
    } finally {
      setIsLoadingDoi(false)
    }
  }

  const addEntry = (entry: BibEntry) => {
    const newEntries = [...entries, entry]
    setEntries(newEntries)
    updateBibFile(newEntries)
  }

  const handleUpdateEntry = (updated: BibEntry) => {
    const newEntries = entries.map(e =>
      e.id === editingEntry?.id ? updated : e
    )
    setEntries(newEntries)
    updateBibFile(newEntries)
    setEditingEntry(null)
  }
  // Export for use in edit form
  void handleUpdateEntry

  const deleteEntry = (id: string) => {
    if (!confirm('Delete this bibliography entry?')) return
    const newEntries = entries.filter(e => e.id !== id)
    setEntries(newEntries)
    updateBibFile(newEntries)
  }

  const updateBibFile = (newEntries: BibEntry[]) => {
    const bibContent = newEntries.map(formatBibTeX).join('\n\n')

    if (bibFile && activeFile === bibFile.name) {
      setContent(bibContent)
    }
    // TODO: Update bib file even if not active
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getEntryTypeLabel = (type: BibEntryType): string => {
    const labels: Record<BibEntryType, string> = {
      article: 'Journal Article',
      book: 'Book',
      inproceedings: 'Conference Paper',
      conference: 'Conference Paper',
      incollection: 'Book Chapter',
      inbook: 'Book Section',
      phdthesis: 'PhD Thesis',
      mastersthesis: 'Masters Thesis',
      techreport: 'Technical Report',
      misc: 'Miscellaneous',
      unpublished: 'Unpublished',
      manual: 'Manual',
      proceedings: 'Proceedings',
      booklet: 'Booklet'
    }
    return labels[type] || type
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Bibliography Manager</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* DOI Import */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste DOI (e.g., 10.1000/xyz123 or https://doi.org/...)"
              value={doiInput}
              onChange={(e) => {
                setDoiInput(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDoiLookup()
              }}
            />
            <Button
              onClick={handleDoiLookup}
              disabled={isLoadingDoi || !doiInput.trim()}
            >
              {isLoadingDoi ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Import
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto p-4">
          {!bibFile ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No .bib file in project</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  // TODO: Create new .bib file
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create references.bib
              </Button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No entries found</p>
              <p className="text-sm mt-1">Import from DOI or add manually</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const errors = validateEntry(entry)
                const hasErrors = errors.length > 0

                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border ${
                      hasErrors ? 'border-destructive/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Citation key */}
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                            {entry.id}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {getEntryTypeLabel(entry.type)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(`\\cite{${entry.id}}`, entry.id)}
                            title="Copy citation"
                          >
                            {copiedId === entry.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* Title */}
                        <div className="font-medium truncate">
                          {entry.fields.title || 'Untitled'}
                        </div>

                        {/* Authors */}
                        {entry.fields.author && (
                          <div className="text-sm text-muted-foreground truncate">
                            {entry.fields.author}
                          </div>
                        )}

                        {/* Year and venue */}
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {entry.fields.year && <span>{entry.fields.year}</span>}
                          {(entry.fields.journal || entry.fields.booktitle) && (
                            <>
                              <span>-</span>
                              <span className="truncate">
                                {entry.fields.journal || entry.fields.booktitle}
                              </span>
                            </>
                          )}
                        </div>

                        {/* DOI link */}
                        {entry.fields.doi && (
                          <a
                            href={doiToUrl(entry.fields.doi)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            DOI: {entry.fields.doi}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {/* Validation errors */}
                        {hasErrors && (
                          <div className="mt-2 text-sm text-destructive">
                            {errors.map((err, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {err}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingEntry(entry)}
                          title="Edit entry"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteEntry(entry.id)}
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {entries.length} entries
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import .bib
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export .bib
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
