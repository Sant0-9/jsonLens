"use client"

import { useState, useEffect } from "react"
import { Command } from "cmdk"
import { useJsonStore } from "@/store/json-store"
import { 
  Search, 
  FileText, 
  Table, 
  Code, 
  GitCompare, 
  Search as QueryIcon, 
  FileCheck, 
  Network, 
  BarChart3, 
  Eye, 
  Gauge,
  Settings, 
  Trash2,
  Copy,
  Save,
  Moon,
  Sun,
  HelpCircle,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

interface CommandItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
  category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { theme, setTheme } = useTheme()
  
  const {
    setView,
    jsonData,
    clearData,
    fileName,
    fileSize,
    error,
    setSearchQuery,
    
  } = useJsonStore()

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const getItemCount = () => {
    if (!jsonData) return 0
    if (Array.isArray(jsonData)) return jsonData.length
    if (typeof jsonData === "object") return Object.keys(jsonData).length
    return 1
  }

  const getFileSizeFormatted = () => {
    if (fileSize === 0) return "No file"
    const kb = fileSize / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    return `${kb.toFixed(1)} KB`
  }

  const commands: CommandItem[] = [
    // View Commands
    {
      id: "view-tree",
      title: "Switch to Tree View",
      description: "View JSON as an expandable tree structure",
      icon: <FileText className="h-4 w-4" />,
      action: () => setView("tree"),
      keywords: ["tree", "view", "structure", "hierarchy"],
      category: "Views"
    },
    {
      id: "open-diagnostics",
      title: "Open Diagnostics",
      description: "View local observability and profile info",
      icon: <Info className="h-4 w-4" />,
      action: () => {
        window.location.href = "/diagnostics"
      },
      keywords: ["diagnostics", "observability", "profile", "debug"],
      category: "Help"
    },
    {
      id: "view-table",
      title: "Switch to Table View",
      description: "View JSON arrays as a sortable table",
      icon: <Table className="h-4 w-4" />,
      action: () => setView("table"),
      keywords: ["table", "view", "array", "data", "rows", "columns"],
      category: "Views"
    },
    {
      id: "view-raw",
      title: "Switch to Raw View",
      description: "View raw JSON text with syntax highlighting",
      icon: <Code className="h-4 w-4" />,
      action: () => setView("raw"),
      keywords: ["raw", "view", "text", "code", "json"],
      category: "Views"
    },
    {
      id: "view-diff",
      title: "Switch to Diff View",
      description: "Compare two JSON files side by side",
      icon: <GitCompare className="h-4 w-4" />,
      action: () => setView("diff"),
      keywords: ["diff", "view", "compare", "difference"],
      category: "Views"
    },
    {
      id: "view-query",
      title: "Switch to Query View",
      description: "Query JSON with JSONPath or JMESPath",
      icon: <QueryIcon className="h-4 w-4" />,
      action: () => setView("query"),
      keywords: ["query", "view", "search", "jsonpath", "jmespath"],
      category: "Views"
    },
    {
      id: "view-schema",
      title: "Switch to Schema View",
      description: "View inferred JSON schema and validation",
      icon: <FileCheck className="h-4 w-4" />,
      action: () => setView("schema"),
      keywords: ["schema", "view", "validation", "types"],
      category: "Views"
    },
    {
      id: "view-graph",
      title: "Switch to Graph View",
      description: "Visualize entity relationships as a graph",
      icon: <Network className="h-4 w-4" />,
      action: () => setView("graph"),
      keywords: ["graph", "view", "relationships", "entities", "network"],
      category: "Views"
    },
    {
      id: "view-diagram",
      title: "Switch to Diagram View",
      description: "Generate Mermaid diagrams from JSON structure",
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => setView("diagram"),
      keywords: ["diagram", "view", "mermaid", "visualization"],
      category: "Views"
    },
    {
      id: "view-visualize",
      title: "Switch to Visualization View",
      description: "Data profiling with treemaps, heatmaps, and timelines",
      icon: <Eye className="h-4 w-4" />,
      action: () => setView("visualize"),
      keywords: ["visualize", "view", "treemap", "heatmap", "timeline"],
      category: "Views"
    },
    {
      id: "view-profiler",
      title: "Switch to Profiler View",
      description: "Deep dataset profiling and distributions",
      icon: <Gauge className="h-4 w-4" />,
      action: () => setView("profiler"),
      keywords: ["profiler", "quality", "distribution", "nulls"],
      category: "Views"
    },
    {
      id: "view-transform",
      title: "Switch to Transform View",
      description: "Transform and convert JSON data",
      icon: <Settings className="h-4 w-4" />,
      action: () => setView("transform"),
      keywords: ["transform", "view", "convert", "flatten", "pivot"],
      category: "Views"
    },
    {
      id: "view-api",
      title: "Switch to API Playground",
      description: "Test APIs and explore OpenAPI specifications",
      icon: <Network className="h-4 w-4" />,
      action: () => setView("api"),
      keywords: ["api", "view", "playground", "openapi", "request"],
      category: "Views"
    },

    // Data Commands
    {
      id: "clear-data",
      title: "Clear All Data",
      description: "Remove current JSON data and reset workspace",
      icon: <Trash2 className="h-4 w-4" />,
      action: () => clearData(),
      keywords: ["clear", "data", "reset", "remove", "delete"],
      category: "Data"
    },
    {
      id: "copy-json",
      title: "Copy JSON to Clipboard",
      description: "Copy the current JSON data to clipboard",
      icon: <Copy className="h-4 w-4" />,
      action: () => {
        if (jsonData) {
          navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
        }
      },
      keywords: ["copy", "json", "clipboard", "export"],
      category: "Data"
    },
    {
      id: "save-workspace",
      title: "Save Workspace",
      description: "Save current workspace state",
      icon: <Save className="h-4 w-4" />,
      action: () => {
        // Workspace is auto-saved, but we can show a confirmation
        console.log("Workspace auto-saved")
      },
      keywords: ["save", "workspace", "state"],
      category: "Data"
    },

    // Search Commands
    {
      id: "focus-search",
      title: "Focus Search",
      description: "Focus the search input in current view",
      icon: <Search className="h-4 w-4" />,
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      keywords: ["focus", "search", "input", "filter"],
      category: "Search"
    },
    {
      id: "clear-search",
      title: "Clear Search",
      description: "Clear current search query",
      icon: <Search className="h-4 w-4" />,
      action: () => setSearchQuery(""),
      keywords: ["clear", "search", "query", "filter"],
      category: "Search"
    },

    // Theme Commands
    {
      id: "toggle-theme",
      title: "Toggle Theme",
      description: "Switch between light and dark mode",
      icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
      keywords: ["toggle", "theme", "dark", "light", "mode"],
      category: "Appearance"
    },

    // Help Commands
    {
      id: "show-help",
      title: "Show Help",
      description: "Open help documentation and shortcuts",
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => {
        // This could open a help modal or navigate to help page
        console.log("Show help")
      },
      keywords: ["help", "documentation", "guide", "shortcuts"],
      category: "Help"
    },
    {
      id: "show-info",
      title: "Show Dataset Info",
      description: "Show information about current dataset",
      icon: <Info className="h-4 w-4" />,
      action: () => {
        const info = {
          fileName: fileName || "No file",
          fileSize: getFileSizeFormatted(),
          itemCount: getItemCount(),
          hasError: !!error
        }
        alert(`Dataset Info:\nFile: ${info.fileName}\nSize: ${info.fileSize}\nItems: ${info.itemCount}\nError: ${info.hasError ? "Yes" : "No"}`)
      },
      keywords: ["info", "dataset", "file", "size", "count"],
      category: "Help"
    }
  ]

  const filteredCommands = commands.filter((command) => {
    if (!query) return true
    const searchTerms = query.toLowerCase().split(" ")
    return searchTerms.every(term =>
      command.title.toLowerCase().includes(term) ||
      command.description.toLowerCase().includes(term) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(term))
    )
  })

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, CommandItem[]>)

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0"
        onClick={() => setOpen(true)}
        data-command-palette
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">Open command palette</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
              <Command.Input
                placeholder="Type a command or search..."
                value={query}
                onValueChange={setQuery}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Command.Empty>No results found.</Command.Empty>
              <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <Command.Group key={category} heading={category}>
                    {categoryCommands.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={command.id}
                        onSelect={() => {
                          command.action()
                          setOpen(false)
                        }}
                        className="flex items-center space-x-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        {command.icon}
                        <div className="flex flex-col">
                          <span className="font-medium">{command.title}</span>
                          <span className="text-xs text-muted-foreground">{command.description}</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Press Esc to close</span>
              <span>Cmd+K to open</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
