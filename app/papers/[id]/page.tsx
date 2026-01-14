"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePapersStore } from '@/store/papers-store'
import { PaperReader } from '@/components/papers/paper-reader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Calendar,
  Users,
  ExternalLink,
  Tag,
  FolderOpen,
  BookOpen,
  Plus,
  X,
  Copy,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function PaperViewPage() {
  const params = useParams()
  const router = useRouter()
  const paperId = params.id as string

  const {
    currentPaper,
    loadPaper,
    addTag,
    removeTag,
    setFolder,
  } = usePapersStore()

  const [newTag, setNewTag] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [copiedBibtex, setCopiedBibtex] = useState(false)

  useEffect(() => {
    if (paperId) {
      loadPaper(paperId)
    }
  }, [paperId, loadPaper])

  if (!currentPaper) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground">Loading paper...</div>
      </div>
    )
  }

  const { paper, pdfBlob } = currentPaper

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(paperId, newTag.trim())
      setNewTag('')
    }
  }

  const handleSetFolder = () => {
    setFolder(paperId, newFolder.trim() || undefined)
    setShowFolderDialog(false)
  }

  const handleCopyBibtex = async () => {
    await navigator.clipboard.writeText(paper.bibtex)
    setCopiedBibtex(true)
    setTimeout(() => setCopiedBibtex(false), 2000)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Paper info sidebar */}
      <div className="w-80 border-r overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => router.push('/papers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>

          {/* Title */}
          <div>
            <h1 className="text-lg font-semibold">{paper.title}</h1>
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Authors
            </div>
            <p className="text-sm">{paper.authors.join(', ')}</p>
          </div>

          {/* Year and Venue */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {paper.year}
            </div>
            {paper.venue && (
              <div className="text-muted-foreground">{paper.venue}</div>
            )}
          </div>

          {/* External links */}
          <div className="flex flex-wrap gap-2">
            {paper.arxivId && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://arxiv.org/abs/${paper.arxivId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  arXiv
                </a>
              </Button>
            )}
            {paper.doi && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  DOI
                </a>
              </Button>
            )}
          </div>

          {/* Reading progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Reading Progress
              </span>
              <span>{paper.readProgress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${paper.readProgress}%` }}
              />
            </div>
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              Folder
            </div>
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  {paper.folder || 'No folder'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter folder name"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSetFolder}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {paper.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="group">
                  {tag}
                  <button
                    onClick={() => removeTag(paperId, tag)}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="h-8"
              />
              <Button size="sm" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Abstract</h3>
            <p className="text-sm text-muted-foreground">{paper.abstract}</p>
          </div>

          {/* BibTeX */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">BibTeX</h3>
              <Button variant="ghost" size="sm" onClick={handleCopyBibtex}>
                {copiedBibtex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={paper.bibtex}
              readOnly
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <PaperReader pdfBlob={pdfBlob} paperId={paperId} />
      </div>
    </div>
  )
}
