"use client"

import { useEffect, useState } from 'react'
import { usePromptsStore } from '@/store/prompts-store'
import { PromptEditor } from '@/components/prompts/prompt-editor'
import { ModelSelector } from '@/components/prompts/model-selector'
import { ResponsePanel } from '@/components/prompts/response-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Save,
  Trash2,
  FileText,
} from 'lucide-react'

export default function PromptsPage() {
  const {
    prompts,
    currentPromptId,
    loadPrompts,
    loadPrompt,
    savePrompt,
    deletePrompt,
    newPrompt,
    hasUnsavedChanges,
    error,
  } = usePromptsStore()

  const [mounted, setMounted] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    setMounted(true)
    loadPrompts()
  }, [loadPrompts])

  const currentPrompt = prompts.find(p => p.id === currentPromptId)

  const handleSave = async () => {
    if (!saveName.trim()) return
    await savePrompt(saveName)
    setShowSaveDialog(false)
    setSaveName('')
  }

  const handleOpenSaveDialog = () => {
    setSaveName(currentPrompt?.prompt.name || '')
    setShowSaveDialog(true)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Saved Prompts */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button className="w-full" onClick={newPrompt}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {prompts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved prompts
              </p>
            ) : (
              prompts.map((record) => (
                <button
                  key={record.id}
                  onClick={() => loadPrompt(record.id)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    currentPromptId === record.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{record.prompt.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {new Date(record.prompt.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {currentPrompt?.prompt.name || 'New Prompt'}
            </h1>
            {hasUnsavedChanges() && (
              <span className="text-xs text-muted-foreground">(unsaved)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenSaveDialog}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            {currentPromptId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deletePrompt(currentPromptId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Editor and Results */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 h-full p-4">
            {/* Left - Editor */}
            <div className="col-span-4 overflow-auto">
              <PromptEditor />
            </div>

            {/* Center - Models */}
            <div className="col-span-2 overflow-auto">
              <ModelSelector />
            </div>

            {/* Right - Results */}
            <div className="col-span-6 overflow-auto">
              <ResponsePanel />
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Prompt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter prompt name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
