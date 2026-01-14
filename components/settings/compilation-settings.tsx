'use client'

import { useSettingsStore } from '@/store/settings-store'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Server, Container, Globe } from 'lucide-react'

const COMPILATION_METHODS = [
  {
    id: 'docker' as const,
    name: 'Docker (Local)',
    description: 'Full TeX Live, no limits, works offline',
    icon: <Container className="h-5 w-5" />,
    badge: 'Recommended',
  },
  {
    id: 'remote' as const,
    name: 'Remote Server',
    description: 'Your own VPS with TeX Live installed',
    icon: <Server className="h-5 w-5" />,
    badge: null,
  },
  {
    id: 'online' as const,
    name: 'latex.online',
    description: 'Free tier (1000/month), no setup required',
    icon: <Globe className="h-5 w-5" />,
    badge: 'Easiest',
  },
]

const ENGINES = [
  { id: 'pdflatex' as const, name: 'pdfLaTeX', description: 'Standard LaTeX compiler' },
  { id: 'xelatex' as const, name: 'XeLaTeX', description: 'Unicode support, custom fonts' },
  { id: 'lualatex' as const, name: 'LuaLaTeX', description: 'Lua scripting support' },
]

export function CompilationSettings() {
  const { settings, updateCompilation } = useSettingsStore()
  const compilation = settings.compilation

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Compilation Method */}
        <div className="space-y-3">
          <Label>Compilation Method</Label>
          <div className="grid gap-3">
            {COMPILATION_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => updateCompilation({ method: method.id })}
                className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-colors ${
                  compilation.method === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-muted/50'
                }`}
              >
                <div className="p-2 bg-muted rounded-lg shrink-0">{method.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.name}</span>
                    {method.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Docker Path (if docker selected) */}
        {compilation.method === 'docker' && (
          <div className="space-y-2">
            <Label htmlFor="dockerPath">Docker Path (optional)</Label>
            <Input
              id="dockerPath"
              placeholder="/usr/bin/docker"
              value={compilation.dockerPath || ''}
              onChange={(e) => updateCompilation({ dockerPath: e.target.value })}
            />
            <CardDescription>
              Leave empty to use system default. Make sure Docker is installed and running.
            </CardDescription>
          </div>
        )}

        {/* Remote URL (if remote selected) */}
        {compilation.method === 'remote' && (
          <div className="space-y-2">
            <Label htmlFor="remoteUrl">Remote Server URL</Label>
            <Input
              id="remoteUrl"
              placeholder="https://your-server.com/latex/compile"
              value={compilation.remoteUrl || ''}
              onChange={(e) => updateCompilation({ remoteUrl: e.target.value })}
            />
            <CardDescription>
              Your server should accept POST requests with LaTeX content and return compiled PDF.
            </CardDescription>
          </div>
        )}

        {/* Default Engine */}
        <div className="space-y-3">
          <Label>Default LaTeX Engine</Label>
          <div className="flex flex-wrap gap-2">
            {ENGINES.map((engine) => (
              <button
                key={engine.id}
                onClick={() => updateCompilation({ defaultEngine: engine.id })}
                className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                  compilation.defaultEngine === engine.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-muted'
                }`}
              >
                {engine.name}
              </button>
            ))}
          </div>
          <CardDescription>
            {ENGINES.find((e) => e.id === compilation.defaultEngine)?.description}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
