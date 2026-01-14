"use client"

import { ArxivPaper } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, Plus, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { generateArxivBibtex } from '@/lib/papers/arxiv-api'

interface PaperPreviewProps {
  paper: ArxivPaper
  onAddToLibrary?: () => void
}

export function PaperPreview({ paper, onAddToLibrary }: PaperPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopyBibtex = async () => {
    const bibtex = generateArxivBibtex({
      arxivId: paper.id,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      year: new Date(paper.published).getFullYear(),
      published: paper.published,
      updated: paper.updated,
      categories: paper.categories,
      primaryCategory: paper.categories[0] || '',
      pdfUrl: paper.pdfUrl,
    })
    await navigator.clipboard.writeText(bibtex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scoreColor =
    (paper.relevanceScore || 0) >= 80
      ? 'bg-green-500'
      : (paper.relevanceScore || 0) >= 60
      ? 'bg-yellow-500'
      : 'bg-gray-400'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium leading-tight">
              {paper.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {paper.authors.slice(0, 3).join(', ')}
              {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
            </p>
          </div>
          {paper.relevanceScore !== undefined && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-2 h-2 rounded-full ${scoreColor}`} />
              <span className="text-xs font-medium">{paper.relevanceScore}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {paper.categories.slice(0, 3).map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs py-0">
              {cat}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs py-0">
            {new Date(paper.published).toLocaleDateString()}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {expanded ? paper.abstract : paper.abstract.slice(0, 200)}
          {paper.abstract.length > 200 && !expanded && '...'}
          {paper.abstract.length > 200 && (
            <button
              className="text-primary ml-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => window.open(`https://arxiv.org/abs/${paper.id}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            arXiv
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => window.open(paper.pdfUrl, '_blank')}
          >
            <FileText className="h-3 w-3 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCopyBibtex}
          >
            {copied ? (
              <Check className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            BibTeX
          </Button>
          {onAddToLibrary && (
            <Button
              size="sm"
              className="h-7 text-xs ml-auto"
              onClick={onAddToLibrary}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Library
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
