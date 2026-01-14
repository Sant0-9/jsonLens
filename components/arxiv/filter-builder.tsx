"use client"

import { useState } from 'react'
import { useArxivStore, ARXIV_CATEGORIES } from '@/store/arxiv-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'
import type { ArxivFilter } from '@/lib/db/schema'

interface FilterBuilderProps {
  open: boolean
  onClose: () => void
  editingFilter?: ArxivFilter
}

export function FilterBuilder({ open, onClose, editingFilter }: FilterBuilderProps) {
  const { addFilter, updateFilter } = useArxivStore()

  const [name, setName] = useState(editingFilter?.name || '')
  const [categories, setCategories] = useState<string[]>(editingFilter?.categories || [])
  const [keywords, setKeywords] = useState<string[]>(editingFilter?.keywords || [])
  const [authors, setAuthors] = useState<string[]>(editingFilter?.authors || [])
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>(
    editingFilter?.excludeKeywords || []
  )
  const [minRelevance, setMinRelevance] = useState(editingFilter?.minRelevance || 50)
  const [keywordInput, setKeywordInput] = useState('')
  const [authorInput, setAuthorInput] = useState('')
  const [excludeInput, setExcludeInput] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return

    const filterData = {
      name,
      enabled: editingFilter?.enabled ?? true,
      categories,
      keywords,
      authors,
      excludeKeywords,
      minRelevance,
    }

    if (editingFilter) {
      await updateFilter(editingFilter.id, filterData)
    } else {
      await addFilter(filterData)
    }

    onClose()
    resetForm()
  }

  const resetForm = () => {
    setName('')
    setCategories([])
    setKeywords([])
    setAuthors([])
    setExcludeKeywords([])
    setMinRelevance(50)
  }

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords(prev => [...prev, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const addAuthor = () => {
    if (authorInput.trim() && !authors.includes(authorInput.trim())) {
      setAuthors(prev => [...prev, authorInput.trim()])
      setAuthorInput('')
    }
  }

  const addExclude = () => {
    if (excludeInput.trim() && !excludeKeywords.includes(excludeInput.trim())) {
      setExcludeKeywords(prev => [...prev, excludeInput.trim()])
      setExcludeInput('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFilter ? 'Edit Filter' : 'Create Filter'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Filter Name</Label>
            <Input
              placeholder="e.g., Machine Learning Papers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ARXIV_CATEGORIES).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={categories.includes(key)}
                    onCheckedChange={() => toggleCategory(key)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords (match in title or abstract)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., transformer, attention"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button variant="outline" onClick={addKeyword}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {keywords.map(kw => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setKeywords(prev => prev.filter(k => k !== kw))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label>Authors (follow specific researchers)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Yann LeCun"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
              />
              <Button variant="outline" onClick={addAuthor}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {authors.map(a => (
                <Badge key={a} variant="secondary" className="gap-1">
                  {a}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setAuthors(prev => prev.filter(x => x !== a))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Exclude Keywords */}
          <div className="space-y-2">
            <Label>Exclude Keywords</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., survey, review"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExclude())}
              />
              <Button variant="outline" onClick={addExclude}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {excludeKeywords.map(kw => (
                <Badge key={kw} variant="destructive" className="gap-1">
                  {kw}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setExcludeKeywords(prev => prev.filter(k => k !== kw))}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Min Relevance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Minimum Relevance Score</Label>
              <span className="text-sm text-muted-foreground">{minRelevance}%</span>
            </div>
            <Slider
              value={[minRelevance]}
              onValueChange={([v]) => setMinRelevance(v)}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Only show papers with relevance score above this threshold
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editingFilter ? 'Update' : 'Create'} Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
