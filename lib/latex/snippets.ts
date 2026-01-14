/**
 * LaTeX Code Snippets
 *
 * Provides shorthand triggers for common LaTeX structures.
 */

export interface LatexSnippet {
  name: string
  prefix: string | string[]
  body: string
  description: string
  category: 'structure' | 'math' | 'figure' | 'table' | 'list' | 'text' | 'reference' | 'theorem' | 'code'
}

export const LATEX_SNIPPETS: LatexSnippet[] = [
  // Document Structure
  {
    name: 'Document Template',
    prefix: ['doc', 'document'],
    body: `\\\\documentclass{$\{1:article\}}
\\\\usepackage[utf8]{inputenc}
\\\\usepackage{amsmath, amssymb}
\\\\usepackage{graphicx}
\\\\usepackage{hyperref}

\\\\title{$\{2:Title\}}
\\\\author{$\{3:Author\}}
\\\\date{$\{4:\\\\today\}}

\\\\begin{document}

\\\\maketitle

$0

\\\\end{document}`,
    description: 'Basic document template',
    category: 'structure'
  },
  {
    name: 'Section',
    prefix: 'sec',
    body: `\\\\section{$\{1:Section Title\}}
$0`,
    description: 'Section heading',
    category: 'structure'
  },
  {
    name: 'Subsection',
    prefix: 'sub',
    body: `\\\\subsection{$\{1:Subsection Title\}}
$0`,
    description: 'Subsection heading',
    category: 'structure'
  },
  {
    name: 'Subsubsection',
    prefix: 'ssub',
    body: `\\\\subsubsection{$\{1:Subsubsection Title\}}
$0`,
    description: 'Subsubsection heading',
    category: 'structure'
  },
  {
    name: 'Chapter',
    prefix: 'chap',
    body: `\\\\chapter{$\{1:Chapter Title\}}
$0`,
    description: 'Chapter heading (for book/report)',
    category: 'structure'
  },
  {
    name: 'Abstract',
    prefix: 'abs',
    body: `\\\\begin{abstract}
$\{1:Your abstract here.\}
\\\\end{abstract}`,
    description: 'Abstract environment',
    category: 'structure'
  },

  // Figure
  {
    name: 'Figure',
    prefix: ['fig', 'figure'],
    body: `\\\\begin{figure}[htbp]
  \\\\centering
  \\\\includegraphics[width=$\{1:0.8\}\\\\textwidth]{$\{2:image\}}
  \\\\caption{$\{3:Caption\}}
  \\\\label{fig:$\{4:label\}}
\\\\end{figure}`,
    description: 'Figure with image',
    category: 'figure'
  },
  {
    name: 'Figure with Subfigures',
    prefix: ['subfig', 'subfigure'],
    body: `\\\\begin{figure}[htbp]
  \\\\centering
  \\\\begin{subfigure}[b]{0.45\\\\textwidth}
    \\\\centering
    \\\\includegraphics[width=\\\\textwidth]{$\{1:image1\}}
    \\\\caption{$\{2:Caption 1\}}
    \\\\label{fig:$\{3:label1\}}
  \\\\end{subfigure}
  \\\\hfill
  \\\\begin{subfigure}[b]{0.45\\\\textwidth}
    \\\\centering
    \\\\includegraphics[width=\\\\textwidth]{$\{4:image2\}}
    \\\\caption{$\{5:Caption 2\}}
    \\\\label{fig:$\{6:label2\}}
  \\\\end{subfigure}
  \\\\caption{$\{7:Main caption\}}
  \\\\label{fig:$\{8:mainlabel\}}
\\\\end{figure}`,
    description: 'Figure with two subfigures',
    category: 'figure'
  },

  // Table
  {
    name: 'Table',
    prefix: ['tab', 'table'],
    body: `\\\\begin{table}[htbp]
  \\\\centering
  \\\\caption{$\{1:Caption\}}
  \\\\label{tab:$\{2:label\}}
  \\\\begin{tabular}{$\{3:lcc\}}
    \\\\hline
    $\{4:Header 1\} & $\{5:Header 2\} & $\{6:Header 3\} \\\\\\\\
    \\\\hline
    $\{7:Data\} & $\{8:Data\} & $\{9:Data\} \\\\\\\\
    \\\\hline
  \\\\end{tabular}
\\\\end{table}`,
    description: 'Table environment',
    category: 'table'
  },
  {
    name: 'Tabular',
    prefix: 'tabular',
    body: `\\\\begin{tabular}{$\{1:lcc\}}
  \\\\hline
  $\{2:A\} & $\{3:B\} & $\{4:C\} \\\\\\\\
  \\\\hline
  $0
  \\\\hline
\\\\end{tabular}`,
    description: 'Tabular environment only',
    category: 'table'
  },
  {
    name: 'Long Table',
    prefix: 'longtab',
    body: `\\\\begin{longtable}{$\{1:lcc\}}
  \\\\caption{$\{2:Caption\}} \\\\label{tab:$\{3:label\}} \\\\\\\\
  \\\\hline
  $\{4:Header 1\} & $\{5:Header 2\} & $\{6:Header 3\} \\\\\\\\
  \\\\hline
  \\\\endfirsthead

  \\\\multicolumn{3}{c}{\\\\tablename\\\\ \\\\thetable\\\\ -- continued} \\\\\\\\
  \\\\hline
  $\{4:Header 1\} & $\{5:Header 2\} & $\{6:Header 3\} \\\\\\\\
  \\\\hline
  \\\\endhead

  \\\\hline
  \\\\endfoot

  $0
\\\\end{longtable}`,
    description: 'Multi-page table',
    category: 'table'
  },

  // Math
  {
    name: 'Equation',
    prefix: ['eq', 'equation'],
    body: `\\\\begin{equation}
  $\{1:formula\}
  \\\\label{eq:$\{2:label\}}
\\\\end{equation}`,
    description: 'Numbered equation',
    category: 'math'
  },
  {
    name: 'Equation (unnumbered)',
    prefix: 'eq*',
    body: `\\\\begin{equation*}
  $\{1:formula\}
\\\\end{equation*}`,
    description: 'Unnumbered equation',
    category: 'math'
  },
  {
    name: 'Align',
    prefix: 'align',
    body: `\\\\begin{align}
  $\{1:left\} &= $\{2:right\} \\\\label{eq:$\{3:label\}}
\\\\end{align}`,
    description: 'Aligned equations',
    category: 'math'
  },
  {
    name: 'Align (unnumbered)',
    prefix: 'align*',
    body: `\\\\begin{align*}
  $\{1:left\} &= $\{2:right\}
\\\\end{align*}`,
    description: 'Aligned equations (unnumbered)',
    category: 'math'
  },
  {
    name: 'Inline Math',
    prefix: ['$', 'im', 'inlinemath'],
    body: '\\$$\{1:formula\}\\$',
    description: 'Inline math mode',
    category: 'math'
  },
  {
    name: 'Display Math',
    prefix: ['$$', 'dm', 'displaymath'],
    body: `\\$\\$
$\{1:formula\}
\\$\\$`,
    description: 'Display math mode',
    category: 'math'
  },
  {
    name: 'Fraction',
    prefix: 'frac',
    body: '\\\\frac{$\{1:numerator\}}{$\{2:denominator\}}',
    description: 'Fraction',
    category: 'math'
  },
  {
    name: 'Sum',
    prefix: 'sum',
    body: '\\\\sum_{$\{1:i=1\}}^{$\{2:n\}} $\{3:term\}',
    description: 'Summation',
    category: 'math'
  },
  {
    name: 'Product',
    prefix: 'prod',
    body: '\\\\prod_{$\{1:i=1\}}^{$\{2:n\}} $\{3:term\}',
    description: 'Product',
    category: 'math'
  },
  {
    name: 'Integral',
    prefix: 'int',
    body: '\\\\int_{$\{1:a\}}^{$\{2:b\}} $\{3:f(x)\} \\\\, dx',
    description: 'Definite integral',
    category: 'math'
  },
  {
    name: 'Limit',
    prefix: 'lim',
    body: '\\\\lim_{$\{1:x \\\\to \\\\infty\}} $\{2:f(x)\}',
    description: 'Limit',
    category: 'math'
  },
  {
    name: 'Matrix',
    prefix: 'matrix',
    body: `\\\\begin{$\{1|pmatrix,bmatrix,vmatrix,Bmatrix\}}
  $\{2:a\} & $\{3:b\} \\\\\\\\
  $\{4:c\} & $\{5:d\}
\\\\end{$\{1\}}`,
    description: 'Matrix',
    category: 'math'
  },
  {
    name: 'Cases',
    prefix: 'cases',
    body: `\\\\begin{cases}
  $\{1:f(x)\} & \\\\text{if } $\{2:condition\} \\\\\\\\
  $\{3:g(x)\} & \\\\text{otherwise}
\\\\end{cases}`,
    description: 'Piecewise function',
    category: 'math'
  },

  // Lists
  {
    name: 'Itemize',
    prefix: ['item', 'itemize', 'ul'],
    body: `\\\\begin{itemize}
  \\\\item $\{1:First item\}
  \\\\item $\{2:Second item\}
\\\\end{itemize}`,
    description: 'Bullet list',
    category: 'list'
  },
  {
    name: 'Enumerate',
    prefix: ['enum', 'enumerate', 'ol'],
    body: `\\\\begin{enumerate}
  \\\\item $\{1:First item\}
  \\\\item $\{2:Second item\}
\\\\end{enumerate}`,
    description: 'Numbered list',
    category: 'list'
  },
  {
    name: 'Description',
    prefix: 'desc',
    body: `\\\\begin{description}
  \\\\item[$\{1:Term 1\}] $\{2:Description 1\}
  \\\\item[$\{3:Term 2\}] $\{4:Description 2\}
\\\\end{description}`,
    description: 'Description list',
    category: 'list'
  },
  {
    name: 'Item',
    prefix: 'it',
    body: '\\\\item $0',
    description: 'List item',
    category: 'list'
  },

  // Text Formatting
  {
    name: 'Bold',
    prefix: ['bf', 'bold'],
    body: '\\\\textbf{$\{1:text\}}',
    description: 'Bold text',
    category: 'text'
  },
  {
    name: 'Italic',
    prefix: ['it', 'italic'],
    body: '\\\\textit{$\{1:text\}}',
    description: 'Italic text',
    category: 'text'
  },
  {
    name: 'Underline',
    prefix: ['ul', 'underline'],
    body: '\\\\underline{$\{1:text\}}',
    description: 'Underlined text',
    category: 'text'
  },
  {
    name: 'Emphasis',
    prefix: 'emph',
    body: '\\\\emph{$\{1:text\}}',
    description: 'Emphasized text',
    category: 'text'
  },
  {
    name: 'Typewriter',
    prefix: ['tt', 'mono'],
    body: '\\\\texttt{$\{1:text\}}',
    description: 'Monospace/typewriter text',
    category: 'text'
  },
  {
    name: 'Small Caps',
    prefix: 'sc',
    body: '\\\\textsc{$\{1:text\}}',
    description: 'Small caps text',
    category: 'text'
  },
  {
    name: 'Footnote',
    prefix: 'fn',
    body: '\\\\footnote{$\{1:footnote text\}}',
    description: 'Footnote',
    category: 'text'
  },
  {
    name: 'Quote',
    prefix: 'quote',
    body: `\\\\begin{quote}
$\{1:Quoted text.\}
\\\\end{quote}`,
    description: 'Block quote',
    category: 'text'
  },

  // References
  {
    name: 'Label',
    prefix: 'lab',
    body: '\\\\label{$\{1:label\}}',
    description: 'Create a label',
    category: 'reference'
  },
  {
    name: 'Reference',
    prefix: 'ref',
    body: '\\\\ref{$\{1:label\}}',
    description: 'Reference a label',
    category: 'reference'
  },
  {
    name: 'Equation Reference',
    prefix: 'eqref',
    body: '\\\\eqref{$\{1:label\}}',
    description: 'Reference an equation',
    category: 'reference'
  },
  {
    name: 'Page Reference',
    prefix: 'pageref',
    body: '\\\\pageref{$\{1:label\}}',
    description: 'Reference a page',
    category: 'reference'
  },
  {
    name: 'Citation',
    prefix: 'cite',
    body: '\\\\cite{$\{1:key\}}',
    description: 'Cite a reference',
    category: 'reference'
  },
  {
    name: 'Citation with Page',
    prefix: 'citep',
    body: '\\\\cite[$\{1:p.~42\}]{$\{2:key\}}',
    description: 'Cite with page number',
    category: 'reference'
  },
  {
    name: 'Hyperlink',
    prefix: 'href',
    body: '\\\\href{$\{1:url\}}{$\{2:text\}}',
    description: 'Hyperlink',
    category: 'reference'
  },
  {
    name: 'URL',
    prefix: 'url',
    body: '\\\\url{$\{1:url\}}',
    description: 'URL',
    category: 'reference'
  },

  // Theorems
  {
    name: 'Theorem',
    prefix: 'thm',
    body: `\\\\begin{theorem}[$\{1:Name\}]
$\{2:Statement\}
\\\\end{theorem}`,
    description: 'Theorem environment',
    category: 'theorem'
  },
  {
    name: 'Lemma',
    prefix: 'lem',
    body: `\\\\begin{lemma}[$\{1:Name\}]
$\{2:Statement\}
\\\\end{lemma}`,
    description: 'Lemma environment',
    category: 'theorem'
  },
  {
    name: 'Proof',
    prefix: 'prf',
    body: `\\\\begin{proof}
$\{1:Proof text.\}
\\\\end{proof}`,
    description: 'Proof environment',
    category: 'theorem'
  },
  {
    name: 'Definition',
    prefix: 'def',
    body: `\\\\begin{definition}[$\{1:Name\}]
$\{2:Definition text.\}
\\\\end{definition}`,
    description: 'Definition environment',
    category: 'theorem'
  },
  {
    name: 'Corollary',
    prefix: 'cor',
    body: `\\\\begin{corollary}
$\{1:Statement\}
\\\\end{corollary}`,
    description: 'Corollary environment',
    category: 'theorem'
  },
  {
    name: 'Remark',
    prefix: 'rem',
    body: `\\\\begin{remark}
$\{1:Remark text.\}
\\\\end{remark}`,
    description: 'Remark environment',
    category: 'theorem'
  },
  {
    name: 'Example',
    prefix: 'ex',
    body: `\\\\begin{example}
$\{1:Example text.\}
\\\\end{example}`,
    description: 'Example environment',
    category: 'theorem'
  },

  // Code
  {
    name: 'Verbatim',
    prefix: 'verb',
    body: `\\\\begin{verbatim}
$\{1:code\}
\\\\end{verbatim}`,
    description: 'Verbatim code block',
    category: 'code'
  },
  {
    name: 'Inline Verbatim',
    prefix: 'iv',
    body: '\\\\verb|$\{1:code\}|',
    description: 'Inline verbatim',
    category: 'code'
  },
  {
    name: 'Listing',
    prefix: 'lst',
    body: `\\\\begin{lstlisting}[language=$\{1:Python\}]
$\{2:code\}
\\\\end{lstlisting}`,
    description: 'Code listing with syntax highlighting',
    category: 'code'
  },
  {
    name: 'Algorithm',
    prefix: 'algo',
    body: `\\\\begin{algorithm}
\\\\caption{$\{1:Algorithm Name\}}
\\\\label{alg:$\{2:label\}}
\\\\begin{algorithmic}[1]
  \\\\Require $\{3:Input\}
  \\\\Ensure $\{4:Output\}
  \\\\State $\{5:Initialize\}
  \\\\For{$\{6:condition\}}
    \\\\State $\{7:body\}
  \\\\EndFor
  \\\\Return $\{8:result\}
\\\\end{algorithmic}
\\\\end{algorithm}`,
    description: 'Algorithm environment',
    category: 'code'
  },

  // Special
  {
    name: 'Frame (Beamer)',
    prefix: 'frame',
    body: `\\\\begin{frame}{$\{1:Title\}}
$0
\\\\end{frame}`,
    description: 'Beamer slide frame',
    category: 'structure'
  },
  {
    name: 'Columns (Beamer)',
    prefix: 'cols',
    body: `\\\\begin{columns}
  \\\\begin{column}{0.5\\\\textwidth}
    $\{1:Left content\}
  \\\\end{column}
  \\\\begin{column}{0.5\\\\textwidth}
    $\{2:Right content\}
  \\\\end{column}
\\\\end{columns}`,
    description: 'Two-column layout (Beamer)',
    category: 'structure'
  },
  {
    name: 'Block (Beamer)',
    prefix: 'block',
    body: `\\\\begin{block}{$\{1:Title\}}
$\{2:Content\}
\\\\end{block}`,
    description: 'Beamer block',
    category: 'structure'
  },
  {
    name: 'Minipage',
    prefix: 'mini',
    body: `\\\\begin{minipage}{$\{1:0.45\}\\\\textwidth}
$0
\\\\end{minipage}`,
    description: 'Minipage environment',
    category: 'structure'
  },
]

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(category: LatexSnippet['category']): LatexSnippet[] {
  return LATEX_SNIPPETS.filter(s => s.category === category)
}

/**
 * Find snippet by prefix
 */
export function findSnippetByPrefix(prefix: string): LatexSnippet | undefined {
  return LATEX_SNIPPETS.find(s =>
    Array.isArray(s.prefix) ? s.prefix.includes(prefix) : s.prefix === prefix
  )
}

/**
 * Get all prefixes (for autocomplete)
 */
export function getAllPrefixes(): string[] {
  const prefixes: string[] = []
  for (const snippet of LATEX_SNIPPETS) {
    if (Array.isArray(snippet.prefix)) {
      prefixes.push(...snippet.prefix)
    } else {
      prefixes.push(snippet.prefix)
    }
  }
  return prefixes
}
