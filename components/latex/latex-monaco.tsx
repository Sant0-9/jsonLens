"use client"

import { useCallback, useRef, useEffect } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { useLatexStore } from '@/store/latex-store'
import { useTheme } from 'next-themes'
import { registerLatexCompletionProvider } from '@/lib/latex/autocomplete-provider'
import { LATEX_SNIPPETS } from '@/lib/latex/snippets'
import {
  createHeuristicMapping,
  sourceToPDF
} from '@/lib/latex/synctex-parser'

export function LatexMonaco() {
  const {
    content,
    setContent,
    editorFontSize,
    syncTeXNavigation,
    highlightPDFLocation,
    clearSyncTeXNavigation
  } = useLatexStore()
  const { resolvedTheme } = useTheme()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  // Handle PDF-to-source navigation (scroll to line when PDF is clicked)
  useEffect(() => {
    if (!syncTeXNavigation.navigateToSource || !editorRef.current) return

    const { line, column } = syncTeXNavigation.navigateToSource

    // Scroll to the line
    editorRef.current.revealLineInCenter(line)

    // Set cursor position
    editorRef.current.setPosition({ lineNumber: line, column: column || 1 })

    // Highlight the line briefly
    const decorations = editorRef.current.deltaDecorations([], [
      {
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 1
        },
        options: {
          isWholeLine: true,
          className: 'synctex-highlight-line',
          glyphMarginClassName: 'synctex-highlight-glyph'
        }
      }
    ])

    // Remove decoration after animation
    const timer = setTimeout(() => {
      editorRef.current?.deltaDecorations(decorations, [])
      clearSyncTeXNavigation()
    }, 2000)

    return () => clearTimeout(timer)
  }, [syncTeXNavigation.navigateToSource, clearSyncTeXNavigation])

  // Handle source-to-PDF navigation (Ctrl+Click) via window event
  useEffect(() => {
    const handleSyncTeXEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        highlightPDFLocation(customEvent.detail)
      }
    }

    window.addEventListener('synctex-to-pdf', handleSyncTeXEvent)
    return () => window.removeEventListener('synctex-to-pdf', handleSyncTeXEvent)
  }, [highlightPDFLocation])

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    // Add Ctrl+Click handler for SyncTeX source-to-PDF navigation
    editor.onMouseDown((e) => {
      // Check for Ctrl+Click (or Cmd+Click on Mac)
      if (e.event.ctrlKey || e.event.metaKey) {
        const position = e.target.position
        if (position) {
          // Trigger source-to-PDF navigation
          // We need to use setTimeout to allow the click to complete
          setTimeout(() => {
            const line = position.lineNumber
            // Create heuristic mapping if needed
            const currentContent = editor.getValue()
            if (currentContent) {
              const lines = currentContent.split('\n').length
              const estimatedPages = Math.max(1, Math.ceil(lines / 45))
              const heuristic = createHeuristicMapping(currentContent, 'main.tex', estimatedPages)
              const pdfLocation = sourceToPDF(heuristic, 'main.tex', line)
              if (pdfLocation) {
                // Dispatch to store via window event (workaround for closure)
                window.dispatchEvent(new CustomEvent('synctex-to-pdf', {
                  detail: pdfLocation
                }))
              }
            }
          }, 0)
        }
      }
    })

    // Register LaTeX language if not already registered
    if (!monaco.languages.getLanguages().find((l: { id: string }) => l.id === 'latex')) {
      monaco.languages.register({ id: 'latex' })

      // LaTeX syntax highlighting
      monaco.languages.setMonarchTokensProvider('latex', {
        tokenizer: {
          root: [
            // Comments
            [/%.*$/, 'comment'],

            // Commands
            [/\\[a-zA-Z@]+/, 'keyword'],

            // Math mode
            [/\$\$/, 'string', '@mathDisplay'],
            [/\$/, 'string', '@mathInline'],

            // Environments
            [/\\begin\{[^}]+\}/, 'type'],
            [/\\end\{[^}]+\}/, 'type'],

            // Braces
            [/[{}]/, 'delimiter.bracket'],
            [/[\[\]]/, 'delimiter.square'],

            // Numbers
            [/\d+/, 'number'],
          ],
          mathInline: [
            [/\$/, 'string', '@pop'],
            [/[^$]+/, 'string'],
          ],
          mathDisplay: [
            [/\$\$/, 'string', '@pop'],
            [/[^$]+/, 'string'],
          ],
        },
      })

      // Register enhanced completion provider (LaTeX commands)
      registerLatexCompletionProvider(monaco)

      // Register snippet completions (shorthand triggers like fig, tab, eq)
      monaco.languages.registerCompletionItemProvider('latex', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          }

          // Convert snippets to Monaco completion items
          const suggestions = LATEX_SNIPPETS.map(snippet => {
            const prefixes = Array.isArray(snippet.prefix) ? snippet.prefix : [snippet.prefix]
            const mainPrefix = prefixes[0]

            return {
              label: mainPrefix,
              insertText: snippet.body,
              kind: monaco.languages.CompletionItemKind.Snippet,
              detail: `[${snippet.category}] ${snippet.name}`,
              documentation: snippet.description,
              range,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            }
          })

          return { suggestions }
        },
      })
    }

    // Set editor options
    editor.updateOptions({
      wordWrap: 'on',
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      suggest: {
        showSnippets: true,
        snippetsPreventQuickSuggestions: false,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
    })
  }, [])

  const handleChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      setContent(value)
    }
  }, [setContent])

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="latex"
        language="latex"
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          fontSize: editorFontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 1.6,
          padding: { top: 16, bottom: 16 },
        }}
        loading={
          <div className="h-full flex items-center justify-center">
            <div className="text-muted-foreground">Loading editor...</div>
          </div>
        }
      />
    </div>
  )
}
