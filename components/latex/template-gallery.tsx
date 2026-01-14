"use client"

import { useState, useMemo } from 'react'
import {
  X,
  FileText,
  GraduationCap,
  Presentation,
  User,
  Mail,
  Newspaper,
  FolderPlus,
  ChevronRight,
  Search,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLatexStore } from '@/store/latex-store'
import {
  TEMPLATES,
  getCategoryLabel,
  createFilesFromTemplate,
  type LatexTemplate,
  type TemplateCategory,
  type TemplateVariable
} from '@/lib/latex/template-engine'

interface TemplateGalleryProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_ICONS: Record<TemplateCategory, typeof FileText> = {
  article: FileText,
  thesis: GraduationCap,
  presentation: Presentation,
  cv: User,
  letter: Mail,
  poster: Newspaper,
  other: FolderPlus
}

const CATEGORY_ORDER: TemplateCategory[] = [
  'article',
  'thesis',
  'presentation',
  'cv',
  'letter',
  'poster',
  'other'
]

export function TemplateGallery({ isOpen, onClose }: TemplateGalleryProps) {
  const { createNewProject, addProjectFile, setProjectMainFile } = useLatexStore()

  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<LatexTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [projectName, setProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // Filter templates by category and search query
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(template => {
      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [selectedCategory, searchQuery])

  // Group templates by category for display
  const templatesByCategory = useMemo(() => {
    const groups = new Map<TemplateCategory, LatexTemplate[]>()

    for (const template of filteredTemplates) {
      const list = groups.get(template.category) || []
      list.push(template)
      groups.set(template.category, list)
    }

    return groups
  }, [filteredTemplates])

  // Initialize variable values when template is selected
  const handleTemplateSelect = (template: LatexTemplate) => {
    setSelectedTemplate(template)
    setError('')

    // Initialize with default values
    const defaults: Record<string, string> = {}
    for (const variable of template.variables) {
      defaults[variable.name] = variable.default
    }
    setVariableValues(defaults)

    // Generate project name from template
    setProjectName(template.name.toLowerCase().replace(/\s+/g, '-'))
  }

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleCreateProject = async () => {
    if (!selectedTemplate) return

    // Validate project name
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    // Validate required variables
    for (const variable of selectedTemplate.variables) {
      if (variable.required && !variableValues[variable.name]?.trim()) {
        setError(`${variable.label} is required`)
        return
      }
    }

    setIsCreating(true)
    setError('')

    try {
      // Create project files with variable substitution
      const files = createFilesFromTemplate(selectedTemplate, variableValues)

      // Create the project with the main file content
      const mainFileContent = files.find(f => f.name === selectedTemplate.mainFile)?.content || ''
      await createNewProject(projectName.trim(), mainFileContent)

      // Add additional files
      for (const file of files) {
        if (file.name !== selectedTemplate.mainFile) {
          await addProjectFile(file.name, file.content)
        }
      }

      // Set main file
      await setProjectMainFile(selectedTemplate.mainFile)

      // Close dialog
      resetAndClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const resetAndClose = () => {
    setSelectedTemplate(null)
    setSelectedCategory('all')
    setSearchQuery('')
    setVariableValues({})
    setProjectName('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {selectedTemplate ? 'Configure Template' : 'Template Gallery'}
          </h2>
          <Button variant="ghost" size="icon" onClick={resetAndClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {selectedTemplate ? (
          // Template Configuration View
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Template Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {(() => {
                    const Icon = CATEGORY_ICONS[selectedTemplate.category]
                    return <Icon className="h-6 w-6 text-primary" />
                  })()}
                </div>
                <div>
                  <h3 className="font-medium">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTemplate.files.length} file{selectedTemplate.files.length !== 1 ? 's' : ''}
                    {' '} | Main: {selectedTemplate.mainFile}
                  </p>
                </div>
              </div>

              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="my-project"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value)
                    setError('')
                  }}
                />
              </div>

              {/* Template Variables */}
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-4">
                  <Label>Template Variables</Label>
                  <div className="space-y-3">
                    {selectedTemplate.variables.map((variable: TemplateVariable) => (
                      <div key={variable.name} className="space-y-1">
                        <Label
                          htmlFor={variable.name}
                          className="text-sm font-normal"
                        >
                          {variable.label}
                          {variable.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          id={variable.name}
                          placeholder={variable.placeholder || variable.default}
                          value={variableValues[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Preview */}
              <div className="space-y-2">
                <Label>Files to be created</Label>
                <div className="border rounded-lg divide-y">
                  {selectedTemplate.files.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{file.name}</span>
                      {file.name === selectedTemplate.mainFile && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
        ) : (
          // Template Browser View
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Categories */}
            <div className="w-56 border-r bg-muted/20 flex flex-col">
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              <nav className="flex-1 p-2 space-y-0.5">
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span>All Templates</span>
                  <span className="text-xs text-muted-foreground">
                    {TEMPLATES.length}
                  </span>
                </button>

                {CATEGORY_ORDER.map((category) => {
                  const Icon = CATEGORY_ICONS[category]
                  const count = TEMPLATES.filter(t => t.category === category).length

                  if (count === 0) return null

                  return (
                    <button
                      key={category}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategory === category
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{getCategoryLabel(category)}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Main Content - Template Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No templates found</p>
                  <p className="text-sm mt-1">Try a different search or category</p>
                </div>
              ) : selectedCategory === 'all' ? (
                // Group by category when showing all
                <div className="space-y-8">
                  {CATEGORY_ORDER.map((category) => {
                    const templates = templatesByCategory.get(category)
                    if (!templates || templates.length === 0) return null

                    return (
                      <div key={category}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          {getCategoryLabel(category)}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {templates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onSelect={() => handleTemplateSelect(template)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                // Single category view
                <div className="grid grid-cols-2 gap-3">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleTemplateSelect(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          {selectedTemplate ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setSelectedTemplate(null)}
              >
                Back to Gallery
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreating}>
                {isCreating ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Create Project
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Template Card Component
interface TemplateCardProps {
  template: LatexTemplate
  onSelect: () => void
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.category]

  return (
    <button
      className="flex items-start gap-3 p-4 rounded-lg border text-left transition-colors hover:border-primary hover:bg-accent/50 group"
      onClick={onSelect}
    >
      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{template.name}</h4>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {template.files.length} file{template.files.length !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  )
}
