"use client"

import { type PaperRecord } from '@/store/papers-store'
import { PaperCard } from './paper-card'

interface PaperListProps {
  papers: PaperRecord[]
  viewMode: 'grid' | 'list'
}

export function PaperList({ papers, viewMode }: PaperListProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} viewMode={viewMode} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {papers.map((paper) => (
        <PaperCard key={paper.id} paper={paper} viewMode={viewMode} />
      ))}
    </div>
  )
}
