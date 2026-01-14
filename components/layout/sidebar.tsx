'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileEdit,
  FileText,
  Sparkles,
  Newspaper,
  FlaskConical,
  DollarSign,
  Settings,
  StickyNote,
  HelpCircle,
  Network,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/latex', label: 'LaTeX Editor', icon: FileEdit },
  { href: '/papers', label: 'Paper Lens', icon: FileText },
  { href: '/prompts', label: 'Prompt Lab', icon: Sparkles },
  { href: '/arxiv', label: 'ArXiv Radar', icon: Newspaper },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/experiments', label: 'Experiments', icon: FlaskConical },
  { href: '/questions', label: 'Questions', icon: HelpCircle },
  { href: '/graph', label: 'Knowledge Graph', icon: Network },
  { href: '/costs', label: 'Costs', icon: DollarSign },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileEdit className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Research Workbench</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
