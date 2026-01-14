'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ModuleCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge?: string
  stats?: { label: string; value: string }[]
  disabled?: boolean
}

export function ModuleCard({
  title,
  description,
  href,
  icon,
  badge,
  stats,
  disabled,
}: ModuleCardProps) {
  const content = (
    <Card
      className={`transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:border-primary/50 cursor-pointer'
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">{icon}</div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {stats && stats.length > 0 && (
        <CardContent>
          <div className="flex gap-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )

  if (disabled) {
    return content
  }

  return <Link href={href}>{content}</Link>
}
