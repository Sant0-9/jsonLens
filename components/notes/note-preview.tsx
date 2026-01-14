"use client"

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Edit, Calendar, Tag, Link2, ArrowLeft } from 'lucide-react'
import { useNotesStore } from '@/store/notes-store'
import { parseWikiLinks, parsePaperReferences } from '@/lib/notes/link-parser'
import type { Note } from '@/lib/db/schema'
import Link from 'next/link'
import 'katex/dist/katex.min.css'

interface NotePreviewProps {
  note: Note
  onEdit: () => void
}

export function NotePreview({ note, onEdit }: NotePreviewProps) {
  const { notes, getBacklinksForNote, getLinkedNotes } = useNotesStore()

  const backlinks = getBacklinksForNote(note.id)
  const linkedNotes = getLinkedNotes(note.id)

  // Process content to convert wikilinks and paper refs
  const processedContent = useMemo(() => {
    let content = note.content

    // Replace wikilinks with markdown links
    const wikiLinks = parseWikiLinks(content)
    for (const link of wikiLinks.reverse()) {
      const linkedNote = notes.find(
        n => n.title.toLowerCase() === link.noteTitle.toLowerCase()
      )
      if (linkedNote) {
        const replacement = `[${link.displayText}](/notes/${linkedNote.id})`
        content =
          content.substring(0, link.startIndex) +
          replacement +
          content.substring(link.endIndex)
      } else {
        // Non-existent note - create link style
        const replacement = `[${link.displayText}](/notes/new?title=${encodeURIComponent(link.noteTitle)})`
        content =
          content.substring(0, link.startIndex) +
          replacement +
          content.substring(link.endIndex)
      }
    }

    // Replace paper references
    const paperRefs = parsePaperReferences(content)
    for (const ref of paperRefs.reverse()) {
      let replacement: string
      if (ref.type === 'arxiv') {
        replacement = `[arXiv:${ref.paperId}](https://arxiv.org/abs/${ref.paperId})`
      } else if (ref.type === 'doi') {
        replacement = `[DOI:${ref.paperId}](https://doi.org/${ref.paperId})`
      } else {
        replacement = `[Paper:${ref.paperId}](/papers/${ref.paperId})`
      }
      content =
        content.substring(0, ref.startIndex) + replacement + content.substring(ref.endIndex)
    }

    return content
  }, [note.content, notes])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Link href="/notes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{note.title}</h1>
        </div>
        <Button size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Updated {formatDate(note.updatedAt)}</span>
        </div>
        {note.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {note.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                a: ({ href, children }) => {
                  if (href?.startsWith('/')) {
                    return (
                      <Link href={href} className="text-primary hover:underline">
                        {children}
                      </Link>
                    )
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  )
                },
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="border-collapse border border-border">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-4 py-2 bg-muted font-medium">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-4 py-2">{children}</td>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </article>
        </ScrollArea>

        {/* Sidebar - Links */}
        {(linkedNotes.length > 0 || backlinks.length > 0 || note.linkedPapers.length > 0) && (
          <div className="w-64 border-l p-4 overflow-auto">
            {/* Linked Notes */}
            {linkedNotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Links ({linkedNotes.length})
                </h3>
                <div className="space-y-1">
                  {linkedNotes.map(linkedNote => (
                    <Link
                      key={linkedNote.id}
                      href={`/notes/${linkedNote.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground truncate"
                    >
                      {linkedNote.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Backlinks */}
            {backlinks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Backlinks ({backlinks.length})
                </h3>
                <div className="space-y-1">
                  {backlinks.map(backlink => (
                    <Link
                      key={backlink.id}
                      href={`/notes/${backlink.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground truncate"
                    >
                      {backlink.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Paper References */}
            {note.linkedPapers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Papers ({note.linkedPapers.length})
                </h3>
                <div className="space-y-1">
                  {note.linkedPapers.map(paperId => (
                    <Link
                      key={paperId}
                      href={`/papers/${paperId}`}
                      className="block text-sm text-muted-foreground hover:text-foreground truncate"
                    >
                      {paperId}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
