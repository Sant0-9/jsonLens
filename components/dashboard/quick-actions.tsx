'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FilePlus, FileText, FlaskConical, Sparkles, StickyNote, HelpCircle } from 'lucide-react'

const ACTIONS = [
  {
    label: 'New LaTeX Project',
    href: '/latex',
    icon: <FilePlus className="h-4 w-4" />,
  },
  {
    label: 'Import Paper',
    href: '/papers',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: 'New Note',
    href: '/notes',
    icon: <StickyNote className="h-4 w-4" />,
  },
  {
    label: 'New Prompt',
    href: '/prompts',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'Log Experiment',
    href: '/experiments',
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    label: 'New Question',
    href: '/questions',
    icon: <HelpCircle className="h-4 w-4" />,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button variant="outline" size="sm" className="gap-2">
                {action.icon}
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
