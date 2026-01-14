"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Image,
  Table,
  Save,
  X,
  Plus,
} from 'lucide-react'
import { useNotesStore } from '@/store/notes-store'
import { isInsideWikiLink, getWikiLinkSuggestions } from '@/lib/notes/link-parser'
import type { Note } from '@/lib/db/schema'

interface NoteEditorProps {
  note: Note
  onSave: (updates: Partial<Note>) => Promise<void>
  onCancel: () => void
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [tags, setTags] = useState<string[]>(note.tags)
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string }>>([])
  const [cursorPosition, setCursorPosition] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { notes, setUnsavedChanges } = useNotesStore()

  // Track unsaved changes
  useEffect(() => {
    const hasChanges =
      title !== note.title ||
      content !== note.content ||
      JSON.stringify(tags) !== JSON.stringify(note.tags)
    setUnsavedChanges(hasChanges)
  }, [title, content, tags, note, setUnsavedChanges])

  // Handle wikilink autocomplete
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent)

      if (textareaRef.current) {
        const pos = textareaRef.current.selectionStart
        setCursorPosition(pos)

        const wikiLinkState = isInsideWikiLink(newContent, pos)
        if (wikiLinkState.isInside && wikiLinkState.currentText.length >= 1) {
          const noteSuggestions = getWikiLinkSuggestions(
            wikiLinkState.currentText,
            notes.map(n => ({ id: n.id, title: n.title }))
          )
          setSuggestions(noteSuggestions)
          setShowSuggestions(noteSuggestions.length > 0)
        } else {
          setShowSuggestions(false)
        }
      }
    },
    [notes]
  )

  // Insert suggestion
  const insertSuggestion = (noteTitle: string) => {
    if (!textareaRef.current) return

    const wikiLinkState = isInsideWikiLink(content, cursorPosition)
    if (!wikiLinkState.isInside) return

    // Replace the partial text with the full note title
    const before = content.substring(0, wikiLinkState.startIndex + 2)
    const after = content.substring(cursorPosition)
    const newContent = `${before}${noteTitle}]]${after}`

    setContent(newContent)
    setShowSuggestions(false)

    // Move cursor after the closing brackets
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = wikiLinkState.startIndex + 2 + noteTitle.length + 2
        textareaRef.current.selectionStart = newPos
        textareaRef.current.selectionEnd = newPos
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Insert markdown formatting
  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = content.substring(start, end)

    const newContent =
      content.substring(0, start) + prefix + selectedText + suffix + content.substring(end)
    setContent(newContent)

    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        if (selectedText) {
          textareaRef.current.selectionStart = start + prefix.length
          textareaRef.current.selectionEnd = start + prefix.length + selectedText.length
        } else {
          textareaRef.current.selectionStart = start + prefix.length
          textareaRef.current.selectionEnd = start + prefix.length
        }
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Toolbar actions
  const toolbarActions = [
    { icon: Bold, action: () => insertMarkdown('**'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => insertMarkdown('*'), title: 'Italic (Ctrl+I)' },
    { icon: Code, action: () => insertMarkdown('`'), title: 'Inline Code' },
    { icon: Heading1, action: () => insertMarkdown('# ', ''), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## ', ''), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### ', ''), title: 'Heading 3' },
    { icon: Quote, action: () => insertMarkdown('> ', ''), title: 'Quote' },
    { icon: List, action: () => insertMarkdown('- ', ''), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. ', ''), title: 'Numbered List' },
    { icon: Link, action: () => insertMarkdown('[[', ']]'), title: 'Wikilink' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
    {
      icon: Table,
      action: () =>
        insertMarkdown(
          '| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |',
          ''
        ),
      title: 'Table',
    },
  ]

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertMarkdown('**')
          break
        case 'i':
          e.preventDefault()
          insertMarkdown('*')
          break
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'k':
          e.preventDefault()
          insertMarkdown('[[', ']]')
          break
      }
    }

    // Handle suggestion selection with arrow keys and enter
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }
  }

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Save note
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ title, content, tags })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        {toolbarActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action.action}
            title={action.title}
            className="h-8 w-8 p-0"
          >
            <action.icon className="h-4 w-4" />
          </Button>
        ))}
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('$', '$')}
          title="Inline Math"
          className="h-8 px-2 text-xs font-mono"
        >
          $x$
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('\n$$\n', '\n$$\n')}
          title="Block Math"
          className="h-8 px-2 text-xs font-mono"
        >
          $$
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start writing...

Use [[Note Title]] to link to other notes
Use @paper:id to reference papers
Use $...$ for inline math and $$...$$ for block math"
          className="h-full resize-none border-none rounded-none focus-visible:ring-0 font-mono text-sm"
        />

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bg-popover border rounded-md shadow-lg z-10 max-h-48 overflow-auto w-64">
            {suggestions.map(suggestion => (
              <button
                key={suggestion.id}
                onClick={() => insertSuggestion(suggestion.title)}
                className="w-full text-left px-3 py-2 hover:bg-accent text-sm truncate"
              >
                {suggestion.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Tags:</span>
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="Add tag..."
              className="h-6 w-24 text-xs"
            />
            <Button variant="ghost" size="sm" onClick={addTag} className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
