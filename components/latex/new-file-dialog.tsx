"use client"

import { useState } from 'react'
import { X, FileText, BookOpen, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLatexStore } from '@/store/latex-store'

interface NewFileDialogProps {
  isOpen: boolean
  onClose: () => void
}

const FILE_TEMPLATES = [
  {
    name: 'Empty .tex file',
    extension: '.tex',
    icon: FileText,
    content: ''
  },
  {
    name: 'Chapter template',
    extension: '.tex',
    icon: FileText,
    content: `% Chapter file
\\section{Section Title}

Your content here.
`
  },
  {
    name: 'Bibliography file',
    extension: '.bib',
    icon: BookOpen,
    content: `% Bibliography file
@article{example2024,
  author = {Author Name},
  title = {Article Title},
  journal = {Journal Name},
  year = {2024},
  volume = {1},
  pages = {1-10}
}
`
  },
  {
    name: 'Custom class',
    extension: '.cls',
    icon: FileCode,
    content: `% Custom document class
\\NeedsTeXFormat{LaTeX2e}
\\ProvidesClass{myclass}[2024/01/01 Custom class]

\\LoadClass{article}

% Your customizations here
`
  },
  {
    name: 'Custom package',
    extension: '.sty',
    icon: FileCode,
    content: `% Custom package
\\NeedsTeXFormat{LaTeX2e}
\\ProvidesPackage{mypackage}[2024/01/01 Custom package]

% Your package code here
`
  }
]

export function NewFileDialog({ isOpen, onClose }: NewFileDialogProps) {
  const { addProjectFile, files } = useLatexStore()
  const [fileName, setFileName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof FILE_TEMPLATES[0] | null>(null)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setError('')

    if (!fileName.trim()) {
      setError('File name is required')
      return
    }

    // Add extension if not present
    let finalName = fileName.trim()
    if (selectedTemplate && !finalName.includes('.')) {
      finalName += selectedTemplate.extension
    } else if (!finalName.includes('.')) {
      finalName += '.tex'
    }

    // Check for duplicates
    if (files.some(f => f.name === finalName)) {
      setError(`File "${finalName}" already exists`)
      return
    }

    // Validate extension
    const ext = finalName.split('.').pop()?.toLowerCase()
    const validExtensions = ['tex', 'bib', 'cls', 'sty', 'txt', 'md']
    if (!ext || !validExtensions.includes(ext)) {
      setError('Invalid file extension')
      return
    }

    const content = selectedTemplate?.content || ''
    await addProjectFile(finalName, content)

    // Reset and close
    setFileName('')
    setSelectedTemplate(null)
    onClose()
  }

  const handleTemplateSelect = (template: typeof FILE_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    if (!fileName.trim()) {
      // Suggest a name based on template
      const baseName = template.name.toLowerCase().replace(/\s+/g, '-')
      setFileName(baseName.replace(/-.+$/, '') + template.extension)
    } else if (!fileName.includes('.')) {
      setFileName(fileName + template.extension)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New File</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* File name input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="filename">File Name</Label>
          <Input
            id="filename"
            placeholder="chapter1.tex"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Templates */}
        <div className="space-y-2 mb-6">
          <Label>Template (optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            {FILE_TEMPLATES.map((template) => {
              const Icon = template.icon
              const isSelected = selectedTemplate?.name === template.name
              return (
                <button
                  key={template.name}
                  className={`flex items-center gap-2 p-2 rounded-md border text-left text-sm transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{template.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create File
          </Button>
        </div>
      </div>
    </div>
  )
}
