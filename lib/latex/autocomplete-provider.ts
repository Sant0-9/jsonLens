/**
 * LaTeX Autocomplete Provider for Monaco Editor
 *
 * Provides comprehensive LaTeX command completion.
 */

// Import type for Monaco but don't use at runtime (handled by Monaco loader)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonacoType = any

/**
 * LaTeX Command Categories
 */
export const LATEX_COMMANDS = {
  // Document Classes
  documentClasses: [
    'article', 'report', 'book', 'letter', 'slides', 'beamer',
    'memoir', 'IEEEtran', 'acmart', 'revtex4', 'amsart', 'elsarticle'
  ],

  // Common Packages
  packages: [
    'amsmath', 'amssymb', 'amsthm', 'graphicx', 'hyperref', 'geometry',
    'fancyhdr', 'enumitem', 'booktabs', 'multirow', 'subcaption',
    'xcolor', 'tikz', 'pgfplots', 'listings', 'algorithm2e', 'algorithmic',
    'natbib', 'biblatex', 'cleveref', 'siunitx', 'chemformula',
    'fontspec', 'unicode-math', 'microtype', 'setspace', 'lipsum',
    'longtable', 'array', 'tabularx', 'colortbl', 'caption',
    'float', 'wrapfig', 'textcomp', 'url', 'inputenc', 'babel'
  ],

  // Greek Letters
  greekLetters: [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon',
    'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa',
    'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi',
    'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon',
    'phi', 'varphi', 'chi', 'psi', 'omega',
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi',
    'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega'
  ],

  // Math Operators
  mathOperators: [
    'frac', 'sqrt', 'sum', 'prod', 'int', 'oint', 'iint', 'iiint',
    'lim', 'limsup', 'liminf', 'sup', 'inf', 'max', 'min',
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
    'log', 'ln', 'exp', 'det', 'dim', 'ker', 'hom',
    'arg', 'deg', 'gcd', 'mod', 'bmod', 'pmod'
  ],

  // Math Symbols
  mathSymbols: [
    'times', 'div', 'pm', 'mp', 'cdot', 'ast', 'star', 'circ',
    'bullet', 'oplus', 'ominus', 'otimes', 'odot', 'oslash',
    'cap', 'cup', 'uplus', 'sqcap', 'sqcup', 'vee', 'wedge',
    'setminus', 'wr', 'diamond', 'bigtriangleup', 'bigtriangledown',
    'triangleleft', 'triangleright', 'lhd', 'rhd', 'unlhd', 'unrhd',
    'leq', 'geq', 'prec', 'succ', 'preceq', 'succeq',
    'll', 'gg', 'subset', 'supset', 'subseteq', 'supseteq',
    'sqsubset', 'sqsupset', 'sqsubseteq', 'sqsupseteq',
    'in', 'ni', 'notin', 'vdash', 'dashv', 'models',
    'perp', 'mid', 'parallel', 'equiv', 'sim', 'simeq',
    'asymp', 'approx', 'cong', 'neq', 'ne', 'propto',
    'forall', 'exists', 'nexists', 'neg', 'not',
    'Rightarrow', 'Leftarrow', 'Leftrightarrow',
    'rightarrow', 'leftarrow', 'leftrightarrow',
    'mapsto', 'longmapsto', 'longrightarrow', 'longleftarrow',
    'uparrow', 'downarrow', 'updownarrow',
    'Uparrow', 'Downarrow', 'Updownarrow',
    'nearrow', 'searrow', 'swarrow', 'nwarrow',
    'leadsto', 'rightsquigarrow', 'leftrightsquigarrow',
    'infty', 'nabla', 'partial', 'emptyset', 'varnothing',
    'aleph', 'beth', 'gimel', 'daleth',
    'hbar', 'imath', 'jmath', 'ell', 'wp', 'Re', 'Im',
    'prime', 'angle', 'triangle', 'square', 'surd',
    'top', 'bot', 'flat', 'natural', 'sharp',
    'clubsuit', 'diamondsuit', 'heartsuit', 'spadesuit',
    'S', 'P', 'dag', 'ddag', 'copyright', 'pounds'
  ],

  // Delimiters
  delimiters: [
    'left', 'right', 'big', 'Big', 'bigg', 'Bigg',
    'langle', 'rangle', 'lceil', 'rceil', 'lfloor', 'rfloor',
    'lvert', 'rvert', 'lVert', 'rVert', 'ulcorner', 'urcorner'
  ],

  // Text Formatting
  textFormatting: [
    'textbf', 'textit', 'texttt', 'textsf', 'textrm', 'textsc',
    'textup', 'textsl', 'emph', 'underline', 'overline',
    'sout', 'uline', 'uuline', 'uwave', 'xout',
    'tiny', 'scriptsize', 'footnotesize', 'small', 'normalsize',
    'large', 'Large', 'LARGE', 'huge', 'Huge'
  ],

  // Math Environments
  mathEnvironments: [
    'equation', 'equation*', 'align', 'align*', 'gather', 'gather*',
    'multline', 'multline*', 'split', 'aligned', 'gathered',
    'cases', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix', 'Bmatrix'
  ],

  // Document Environments
  documentEnvironments: [
    'document', 'abstract', 'figure', 'table', 'tabular', 'tabular*',
    'array', 'itemize', 'enumerate', 'description', 'quote', 'quotation',
    'verse', 'verbatim', 'center', 'flushleft', 'flushright',
    'minipage', 'titlepage', 'thebibliography', 'appendix',
    'theorem', 'lemma', 'proof', 'definition', 'corollary', 'remark', 'example'
  ],

  // References
  references: [
    'label', 'ref', 'eqref', 'pageref', 'cite', 'citep', 'citet',
    'citeauthor', 'citeyear', 'nocite', 'bibliography', 'bibliographystyle'
  ],

  // Structure
  structure: [
    'documentclass', 'usepackage', 'input', 'include', 'includeonly',
    'newcommand', 'renewcommand', 'newenvironment', 'renewenvironment',
    'title', 'author', 'date', 'maketitle', 'tableofcontents',
    'listoffigures', 'listoftables',
    'part', 'chapter', 'section', 'subsection', 'subsubsection',
    'paragraph', 'subparagraph', 'appendix',
    'footnote', 'marginpar', 'thanks'
  ],

  // Spacing
  spacing: [
    'hspace', 'vspace', 'hfill', 'vfill', 'quad', 'qquad',
    'thinspace', 'medspace', 'thickspace', 'enspace',
    'smallskip', 'medskip', 'bigskip', 'newline', 'linebreak',
    'newpage', 'clearpage', 'cleardoublepage', 'pagebreak', 'nopagebreak'
  ],

  // Accents
  accents: [
    'hat', 'check', 'breve', 'acute', 'grave', 'tilde', 'bar',
    'vec', 'dot', 'ddot', 'dddot', 'ddddot', 'mathring',
    'widehat', 'widetilde', 'overbrace', 'underbrace',
    'overline', 'underline', 'overleftarrow', 'overrightarrow',
    'overleftrightarrow', 'underrightarrow', 'underleftarrow'
  ]
}

/**
 * Create completion items for Monaco
 */
export function createCompletionItems(monaco: MonacoType, range: unknown): unknown[] {
  const CompletionItemKind = monaco.languages.CompletionItemKind
  const InsertTextRule = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet

  const items: unknown[] = []

  // Document classes
  for (const cls of LATEX_COMMANDS.documentClasses) {
    items.push({
      label: `\\documentclass{${cls}}`,
      insertText: `\\documentclass{${cls}}`,
      kind: CompletionItemKind.Class,
      detail: 'Document class',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Packages
  for (const pkg of LATEX_COMMANDS.packages) {
    items.push({
      label: `\\usepackage{${pkg}}`,
      insertText: `\\usepackage{${pkg}}`,
      kind: CompletionItemKind.Module,
      detail: 'Package',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Greek letters
  for (const letter of LATEX_COMMANDS.greekLetters) {
    items.push({
      label: `\\${letter}`,
      insertText: `\\${letter}`,
      kind: CompletionItemKind.Constant,
      detail: 'Greek letter',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Math operators (with arguments)
  const operatorsWithArgs: Record<string, string> = {
    frac: '\\frac{${1:num}}{${2:den}}',
    sqrt: '\\sqrt{${1:x}}',
    sum: '\\sum_{${1:i=1}}^{${2:n}}',
    prod: '\\prod_{${1:i=1}}^{${2:n}}',
    int: '\\int_{${1:a}}^{${2:b}}',
    oint: '\\oint_{${1:C}}',
    lim: '\\lim_{${1:x \\to \\infty}}',
    limsup: '\\limsup_{${1:n \\to \\infty}}',
    liminf: '\\liminf_{${1:n \\to \\infty}}'
  }

  for (const op of LATEX_COMMANDS.mathOperators) {
    items.push({
      label: `\\${op}`,
      insertText: operatorsWithArgs[op] || `\\${op}`,
      kind: CompletionItemKind.Function,
      detail: 'Math operator',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Math symbols
  for (const sym of LATEX_COMMANDS.mathSymbols) {
    items.push({
      label: `\\${sym}`,
      insertText: `\\${sym}`,
      kind: CompletionItemKind.Operator,
      detail: 'Math symbol',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Delimiters
  for (const del of LATEX_COMMANDS.delimiters) {
    items.push({
      label: `\\${del}`,
      insertText: `\\${del}`,
      kind: CompletionItemKind.Keyword,
      detail: 'Delimiter',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Text formatting (with arguments)
  const textFormattingWithArgs = [
    'textbf', 'textit', 'texttt', 'textsf', 'textrm', 'textsc',
    'textup', 'textsl', 'emph', 'underline', 'overline'
  ]
  for (const fmt of LATEX_COMMANDS.textFormatting) {
    const hasArg = textFormattingWithArgs.includes(fmt)
    items.push({
      label: `\\${fmt}`,
      insertText: hasArg ? `\\${fmt}{\${1:text}}` : `\\${fmt}`,
      kind: CompletionItemKind.Function,
      detail: 'Text formatting',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Math environments
  for (const env of LATEX_COMMANDS.mathEnvironments) {
    const envName = env.replace('*', '')
    items.push({
      label: `\\begin{${env}}`,
      insertText: `\\begin{${env}}\n\t\${1:}\n\\end{${envName}${env.endsWith('*') ? '*' : ''}}`,
      kind: CompletionItemKind.Snippet,
      detail: 'Math environment',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Document environments
  for (const env of LATEX_COMMANDS.documentEnvironments) {
    items.push({
      label: `\\begin{${env}}`,
      insertText: `\\begin{${env}}\n\t\${1:}\n\\end{${env}}`,
      kind: CompletionItemKind.Snippet,
      detail: 'Environment',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // References (with arguments)
  const refWithArgs: Record<string, string> = {
    label: '\\label{${1:label}}',
    ref: '\\ref{${1:label}}',
    eqref: '\\eqref{${1:label}}',
    pageref: '\\pageref{${1:label}}',
    cite: '\\cite{${1:key}}',
    citep: '\\citep{${1:key}}',
    citet: '\\citet{${1:key}}',
    nocite: '\\nocite{${1:*}}',
    bibliography: '\\bibliography{${1:references}}',
    bibliographystyle: '\\bibliographystyle{${1:plain}}'
  }

  for (const ref of LATEX_COMMANDS.references) {
    items.push({
      label: `\\${ref}`,
      insertText: refWithArgs[ref] || `\\${ref}`,
      kind: CompletionItemKind.Reference,
      detail: 'Reference command',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Structure commands (with arguments)
  const structureWithArgs: Record<string, string> = {
    documentclass: '\\documentclass{${1:article}}',
    usepackage: '\\usepackage{${1:package}}',
    input: '\\input{${1:file}}',
    include: '\\include{${1:file}}',
    newcommand: '\\newcommand{\\${1:cmd}}{${2:definition}}',
    renewcommand: '\\renewcommand{\\${1:cmd}}{${2:definition}}',
    title: '\\title{${1:title}}',
    author: '\\author{${1:author}}',
    date: '\\date{${1:\\today}}',
    section: '\\section{${1:title}}',
    subsection: '\\subsection{${1:title}}',
    subsubsection: '\\subsubsection{${1:title}}',
    paragraph: '\\paragraph{${1:title}}',
    chapter: '\\chapter{${1:title}}',
    part: '\\part{${1:title}}',
    footnote: '\\footnote{${1:text}}'
  }

  for (const cmd of LATEX_COMMANDS.structure) {
    items.push({
      label: `\\${cmd}`,
      insertText: structureWithArgs[cmd] || `\\${cmd}`,
      kind: CompletionItemKind.Struct,
      detail: 'Document structure',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Spacing commands (with arguments where needed)
  const spacingWithArgs: Record<string, string> = {
    hspace: '\\hspace{${1:1cm}}',
    vspace: '\\vspace{${1:1cm}}'
  }

  for (const sp of LATEX_COMMANDS.spacing) {
    items.push({
      label: `\\${sp}`,
      insertText: spacingWithArgs[sp] || `\\${sp}`,
      kind: CompletionItemKind.Property,
      detail: 'Spacing',
      range,
      insertTextRules: InsertTextRule
    })
  }

  // Accents (with argument)
  for (const acc of LATEX_COMMANDS.accents) {
    items.push({
      label: `\\${acc}`,
      insertText: `\\${acc}{\${1:x}}`,
      kind: CompletionItemKind.Function,
      detail: 'Math accent',
      range,
      insertTextRules: InsertTextRule
    })
  }

  return items
}

/**
 * Register the completion provider with Monaco
 */
export function registerLatexCompletionProvider(monaco: MonacoType): void {
  monaco.languages.registerCompletionItemProvider('latex', {
    triggerCharacters: ['\\', '{'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const lineContent = model.getLineContent(position.lineNumber)
      const charBefore = lineContent[position.column - 2]

      // Check if we're completing after a backslash
      if (charBefore === '\\') {
        const suggestions = createCompletionItems(monaco, range)
        return { suggestions }
      }

      // Check if we're completing inside braces
      if (charBefore === '{') {
        // Find what command we're in
        const textBefore = lineContent.substring(0, position.column - 1)
        const match = textBefore.match(/\\(\w+)\{$/)

        if (match) {
          const command = match[1]

          // Provide context-aware completions
          if (command === 'documentclass') {
            return {
              suggestions: LATEX_COMMANDS.documentClasses.map(cls => ({
                label: cls,
                insertText: cls,
                kind: monaco.languages.CompletionItemKind.Class,
                range
              }))
            }
          }

          if (command === 'usepackage') {
            return {
              suggestions: LATEX_COMMANDS.packages.map(pkg => ({
                label: pkg,
                insertText: pkg,
                kind: monaco.languages.CompletionItemKind.Module,
                range
              }))
            }
          }

          if (command === 'begin' || command === 'end') {
            const allEnvs = [
              ...LATEX_COMMANDS.mathEnvironments,
              ...LATEX_COMMANDS.documentEnvironments
            ]
            return {
              suggestions: allEnvs.map(env => ({
                label: env,
                insertText: env,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range
              }))
            }
          }

          if (command === 'bibliographystyle') {
            const styles = ['plain', 'abbrv', 'alpha', 'unsrt', 'IEEEtran', 'apalike', 'acm']
            return {
              suggestions: styles.map(style => ({
                label: style,
                insertText: style,
                kind: monaco.languages.CompletionItemKind.EnumMember,
                range
              }))
            }
          }
        }
      }

      // Default: return all completions
      return { suggestions: createCompletionItems(monaco, range) }
    }
  })
}
