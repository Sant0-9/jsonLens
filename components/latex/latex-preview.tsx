"use client"

import { useEffect, useState, useRef, useMemo } from 'react'
import { useLatexStore } from '@/store/latex-store'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface ParsedContent {
  type: 'text' | 'math-inline' | 'math-display' | 'heading' | 'environment'
  content: string
  level?: number
  envName?: string
}

function parseLatex(content: string): ParsedContent[] {
  const result: ParsedContent[] = []
  let remaining = content

  // Remove preamble (everything before \begin{document})
  const docStart = remaining.indexOf('\\begin{document}')
  if (docStart !== -1) {
    remaining = remaining.substring(docStart + '\\begin{document}'.length)
  }

  // Remove \end{document}
  const docEnd = remaining.indexOf('\\end{document}')
  if (docEnd !== -1) {
    remaining = remaining.substring(0, docEnd)
  }

  // Parse content
  while (remaining.length > 0) {
    // Display math: $$...$$ or \[...\]
    const displayMathMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/) ||
                              remaining.match(/^\\\[([\s\S]*?)\\\]/)
    if (displayMathMatch) {
      result.push({ type: 'math-display', content: displayMathMatch[1].trim() })
      remaining = remaining.substring(displayMathMatch[0].length)
      continue
    }

    // Equation environment
    const equationMatch = remaining.match(/^\\begin\{(equation|align|gather|multline)\*?\}([\s\S]*?)\\end\{\1\*?\}/)
    if (equationMatch) {
      result.push({ type: 'math-display', content: equationMatch[2].trim(), envName: equationMatch[1] })
      remaining = remaining.substring(equationMatch[0].length)
      continue
    }

    // Inline math: $...$
    const inlineMathMatch = remaining.match(/^\$([^$]+)\$/)
    if (inlineMathMatch) {
      result.push({ type: 'math-inline', content: inlineMathMatch[1].trim() })
      remaining = remaining.substring(inlineMathMatch[0].length)
      continue
    }

    // Section headings
    const sectionMatch = remaining.match(/^\\(section|subsection|subsubsection|chapter|title)\{([^}]*)\}/)
    if (sectionMatch) {
      const levels: Record<string, number> = {
        title: 0,
        chapter: 1,
        section: 2,
        subsection: 3,
        subsubsection: 4,
      }
      result.push({
        type: 'heading',
        content: sectionMatch[2],
        level: levels[sectionMatch[1]] || 2,
      })
      remaining = remaining.substring(sectionMatch[0].length)
      continue
    }

    // Skip \maketitle, \author, \date, etc.
    const metaMatch = remaining.match(/^\\(maketitle|author|date)\{?[^}]*\}?/)
    if (metaMatch) {
      remaining = remaining.substring(metaMatch[0].length)
      continue
    }

    // Text formatting commands
    const formatMatch = remaining.match(/^\\(textbf|textit|emph|underline)\{([^}]*)\}/)
    if (formatMatch) {
      const formatted = formatMatch[1] === 'textbf' ? `**${formatMatch[2]}**` :
                        formatMatch[1] === 'textit' || formatMatch[1] === 'emph' ? `*${formatMatch[2]}*` :
                        formatMatch[2]
      result.push({ type: 'text', content: formatted })
      remaining = remaining.substring(formatMatch[0].length)
      continue
    }

    // Skip unknown commands
    const cmdMatch = remaining.match(/^\\[a-zA-Z]+(\{[^}]*\})?/)
    if (cmdMatch) {
      remaining = remaining.substring(cmdMatch[0].length)
      continue
    }

    // Regular text - take until next special character
    const textMatch = remaining.match(/^[^$\\]+/)
    if (textMatch) {
      const text = textMatch[0].trim()
      if (text) {
        result.push({ type: 'text', content: text })
      }
      remaining = remaining.substring(textMatch[0].length)
      continue
    }

    // Skip single character
    remaining = remaining.substring(1)
  }

  return result
}

function RenderMath({ content, display }: { content: string; display: boolean }) {
  const [html, setHtml] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const rendered = katex.renderToString(content, {
        displayMode: display,
        throwOnError: false,
        errorColor: '#ef4444',
        trust: true,
        strict: false,
      })
      setHtml(rendered)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to render math')
      setHtml('')
    }
  }, [content, display])

  if (error) {
    return (
      <span className="text-red-500 text-sm font-mono">
        {error}: {content}
      </span>
    )
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className={display ? 'block my-4 text-center overflow-x-auto' : 'inline'}
    />
  )
}

export function LatexPreview() {
  const { content } = useLatexStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [debouncedContent, setDebouncedContent] = useState(content)

  // Debounce content updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content)
    }, 300)
    return () => clearTimeout(timer)
  }, [content])

  const parsed = useMemo(() => parseLatex(debouncedContent), [debouncedContent])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto p-6 bg-background"
    >
      <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
        {parsed.map((item, index) => {
          switch (item.type) {
            case 'heading':
              const HeadingTag = `h${Math.min(item.level || 2, 6)}` as keyof React.JSX.IntrinsicElements
              return (
                <HeadingTag key={index} className="mt-6 mb-3">
                  {item.content}
                </HeadingTag>
              )

            case 'math-display':
              return (
                <div key={index} className="my-4">
                  <RenderMath content={item.content} display={true} />
                </div>
              )

            case 'math-inline':
              return <RenderMath key={index} content={item.content} display={false} />

            case 'text':
              return (
                <p key={index} className="my-2 leading-relaxed">
                  {item.content}
                </p>
              )

            default:
              return null
          }
        })}

        {parsed.length === 0 && (
          <div className="text-muted-foreground text-center py-8">
            <p>Start typing LaTeX to see the preview.</p>
            <p className="text-sm mt-2">
              Math will be rendered using KaTeX.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
