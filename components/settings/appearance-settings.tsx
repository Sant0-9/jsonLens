'use client'

import { useSettingsStore } from '@/store/settings-store'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'

const FONT_FAMILIES = [
  { value: 'JetBrains Mono, Fira Code, monospace', label: 'JetBrains Mono' },
  { value: 'Fira Code, monospace', label: 'Fira Code' },
  { value: 'Monaco, Menlo, monospace', label: 'Monaco' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'monospace', label: 'System Mono' },
]

export function AppearanceSettings() {
  const { settings, updateAppearance } = useSettingsStore()
  const { theme, setTheme } = useTheme()

  const appearance = settings.appearance

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Theme Selection */}
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex gap-2">
            <ThemeButton
              icon={<Sun className="h-4 w-4" />}
              label="Light"
              isActive={theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <ThemeButton
              icon={<Moon className="h-4 w-4" />}
              label="Dark"
              isActive={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeButton
              icon={<Monitor className="h-4 w-4" />}
              label="System"
              isActive={theme === 'system'}
              onClick={() => setTheme('system')}
            />
          </div>
        </div>

        {/* Editor Font Size */}
        <div className="space-y-2">
          <Label htmlFor="fontSize">Editor Font Size</Label>
          <div className="flex items-center gap-3">
            <Input
              id="fontSize"
              type="number"
              min={10}
              max={24}
              value={appearance.editorFontSize}
              onChange={(e) =>
                updateAppearance({ editorFontSize: parseInt(e.target.value) || 14 })
              }
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">px</span>
          </div>
        </div>

        {/* Editor Font Family */}
        <div className="space-y-2">
          <Label htmlFor="fontFamily">Editor Font</Label>
          <select
            id="fontFamily"
            value={appearance.editorFontFamily}
            onChange={(e) => updateAppearance({ editorFontFamily: e.target.value })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Line Height */}
        <div className="space-y-2">
          <Label htmlFor="lineHeight">Line Height</Label>
          <div className="flex items-center gap-3">
            <Input
              id="lineHeight"
              type="number"
              min={1}
              max={3}
              step={0.1}
              value={appearance.lineHeight}
              onChange={(e) =>
                updateAppearance({ lineHeight: parseFloat(e.target.value) || 1.5 })
              }
              className="w-20"
            />
          </div>
        </div>

        {/* Tab Size */}
        <div className="space-y-2">
          <Label htmlFor="tabSize">Tab Size</Label>
          <div className="flex items-center gap-3">
            <Input
              id="tabSize"
              type="number"
              min={1}
              max={8}
              value={appearance.tabSize}
              onChange={(e) => updateAppearance({ tabSize: parseInt(e.target.value) || 2 })}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">spaces</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ThemeButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function ThemeButton({ icon, label, isActive, onClick }: ThemeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
        isActive
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-input hover:bg-muted'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  )
}
