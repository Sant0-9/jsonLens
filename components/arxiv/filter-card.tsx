"use client"

import { ArxivFilter } from '@/lib/db/schema'
import { useArxivStore, ARXIV_CATEGORIES } from '@/store/arxiv-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Edit2, Trash2 } from 'lucide-react'

interface FilterCardProps {
  filter: ArxivFilter
  onEdit?: () => void
}

export function FilterCard({ filter, onEdit }: FilterCardProps) {
  const { toggleFilter, deleteFilter } = useArxivStore()

  return (
    <Card className={!filter.enabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{filter.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={filter.enabled}
              onCheckedChange={() => toggleFilter(filter.id)}
            />
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => deleteFilter(filter.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filter.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filter.categories.map(cat => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {ARXIV_CATEGORIES[cat as keyof typeof ARXIV_CATEGORIES] || cat}
              </Badge>
            ))}
          </div>
        )}

        {filter.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filter.keywords.map(kw => (
              <Badge key={kw} variant="outline" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        {filter.authors.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Authors: {filter.authors.join(', ')}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Min relevance: {filter.minRelevance}%
        </p>
      </CardContent>
    </Card>
  )
}
