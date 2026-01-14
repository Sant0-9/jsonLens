"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface SymbolPaletteProps {
  onInsert: (symbol: string) => void
  onClose: () => void
}

interface SymbolCategory {
  name: string
  symbols: { label: string; latex: string; display?: string }[]
}

const symbolCategories: SymbolCategory[] = [
  {
    name: 'Greek (lowercase)',
    symbols: [
      { label: 'alpha', latex: '\\alpha', display: 'a' },
      { label: 'beta', latex: '\\beta', display: 'b' },
      { label: 'gamma', latex: '\\gamma', display: 'g' },
      { label: 'delta', latex: '\\delta', display: 'd' },
      { label: 'epsilon', latex: '\\epsilon', display: 'e' },
      { label: 'zeta', latex: '\\zeta', display: 'z' },
      { label: 'eta', latex: '\\eta', display: 'h' },
      { label: 'theta', latex: '\\theta', display: 'q' },
      { label: 'iota', latex: '\\iota', display: 'i' },
      { label: 'kappa', latex: '\\kappa', display: 'k' },
      { label: 'lambda', latex: '\\lambda', display: 'l' },
      { label: 'mu', latex: '\\mu', display: 'm' },
      { label: 'nu', latex: '\\nu', display: 'n' },
      { label: 'xi', latex: '\\xi', display: 'x' },
      { label: 'pi', latex: '\\pi', display: 'p' },
      { label: 'rho', latex: '\\rho', display: 'r' },
      { label: 'sigma', latex: '\\sigma', display: 's' },
      { label: 'tau', latex: '\\tau', display: 't' },
      { label: 'upsilon', latex: '\\upsilon', display: 'u' },
      { label: 'phi', latex: '\\phi', display: 'f' },
      { label: 'chi', latex: '\\chi', display: 'c' },
      { label: 'psi', latex: '\\psi', display: 'y' },
      { label: 'omega', latex: '\\omega', display: 'w' },
    ],
  },
  {
    name: 'Greek (uppercase)',
    symbols: [
      { label: 'Gamma', latex: '\\Gamma', display: 'G' },
      { label: 'Delta', latex: '\\Delta', display: 'D' },
      { label: 'Theta', latex: '\\Theta', display: 'Q' },
      { label: 'Lambda', latex: '\\Lambda', display: 'L' },
      { label: 'Xi', latex: '\\Xi', display: 'X' },
      { label: 'Pi', latex: '\\Pi', display: 'P' },
      { label: 'Sigma', latex: '\\Sigma', display: 'S' },
      { label: 'Phi', latex: '\\Phi', display: 'F' },
      { label: 'Psi', latex: '\\Psi', display: 'Y' },
      { label: 'Omega', latex: '\\Omega', display: 'W' },
    ],
  },
  {
    name: 'Operators',
    symbols: [
      { label: 'plus minus', latex: '\\pm' },
      { label: 'minus plus', latex: '\\mp' },
      { label: 'times', latex: '\\times' },
      { label: 'divide', latex: '\\div' },
      { label: 'cdot', latex: '\\cdot' },
      { label: 'ast', latex: '\\ast' },
      { label: 'star', latex: '\\star' },
      { label: 'circ', latex: '\\circ' },
      { label: 'bullet', latex: '\\bullet' },
      { label: 'oplus', latex: '\\oplus' },
      { label: 'otimes', latex: '\\otimes' },
      { label: 'odot', latex: '\\odot' },
    ],
  },
  {
    name: 'Relations',
    symbols: [
      { label: 'leq', latex: '\\leq' },
      { label: 'geq', latex: '\\geq' },
      { label: 'neq', latex: '\\neq' },
      { label: 'approx', latex: '\\approx' },
      { label: 'equiv', latex: '\\equiv' },
      { label: 'sim', latex: '\\sim' },
      { label: 'simeq', latex: '\\simeq' },
      { label: 'cong', latex: '\\cong' },
      { label: 'propto', latex: '\\propto' },
      { label: 'subset', latex: '\\subset' },
      { label: 'supset', latex: '\\supset' },
      { label: 'subseteq', latex: '\\subseteq' },
      { label: 'supseteq', latex: '\\supseteq' },
      { label: 'in', latex: '\\in' },
      { label: 'ni', latex: '\\ni' },
      { label: 'notin', latex: '\\notin' },
    ],
  },
  {
    name: 'Arrows',
    symbols: [
      { label: 'leftarrow', latex: '\\leftarrow' },
      { label: 'rightarrow', latex: '\\rightarrow' },
      { label: 'leftrightarrow', latex: '\\leftrightarrow' },
      { label: 'Leftarrow', latex: '\\Leftarrow' },
      { label: 'Rightarrow', latex: '\\Rightarrow' },
      { label: 'Leftrightarrow', latex: '\\Leftrightarrow' },
      { label: 'uparrow', latex: '\\uparrow' },
      { label: 'downarrow', latex: '\\downarrow' },
      { label: 'updownarrow', latex: '\\updownarrow' },
      { label: 'mapsto', latex: '\\mapsto' },
      { label: 'to', latex: '\\to' },
      { label: 'gets', latex: '\\gets' },
    ],
  },
  {
    name: 'Structures',
    symbols: [
      { label: 'frac', latex: '\\frac{a}{b}' },
      { label: 'sqrt', latex: '\\sqrt{x}' },
      { label: 'sqrt[n]', latex: '\\sqrt[n]{x}' },
      { label: 'sum', latex: '\\sum_{i=1}^{n}' },
      { label: 'prod', latex: '\\prod_{i=1}^{n}' },
      { label: 'int', latex: '\\int_{a}^{b}' },
      { label: 'oint', latex: '\\oint' },
      { label: 'iint', latex: '\\iint' },
      { label: 'iiint', latex: '\\iiint' },
      { label: 'lim', latex: '\\lim_{x \\to \\infty}' },
      { label: 'partial', latex: '\\partial' },
      { label: 'nabla', latex: '\\nabla' },
    ],
  },
  {
    name: 'Delimiters',
    symbols: [
      { label: 'left (', latex: '\\left(' },
      { label: 'right )', latex: '\\right)' },
      { label: 'left [', latex: '\\left[' },
      { label: 'right ]', latex: '\\right]' },
      { label: 'left {', latex: '\\left\\{' },
      { label: 'right }', latex: '\\right\\}' },
      { label: 'left |', latex: '\\left|' },
      { label: 'right |', latex: '\\right|' },
      { label: 'langle', latex: '\\langle' },
      { label: 'rangle', latex: '\\rangle' },
      { label: 'lceil', latex: '\\lceil' },
      { label: 'rceil', latex: '\\rceil' },
      { label: 'lfloor', latex: '\\lfloor' },
      { label: 'rfloor', latex: '\\rfloor' },
    ],
  },
  {
    name: 'Accents',
    symbols: [
      { label: 'hat', latex: '\\hat{a}' },
      { label: 'bar', latex: '\\bar{a}' },
      { label: 'vec', latex: '\\vec{a}' },
      { label: 'dot', latex: '\\dot{a}' },
      { label: 'ddot', latex: '\\ddot{a}' },
      { label: 'tilde', latex: '\\tilde{a}' },
      { label: 'overline', latex: '\\overline{ab}' },
      { label: 'underline', latex: '\\underline{ab}' },
      { label: 'overbrace', latex: '\\overbrace{ab}' },
      { label: 'underbrace', latex: '\\underbrace{ab}' },
    ],
  },
  {
    name: 'Misc',
    symbols: [
      { label: 'infty', latex: '\\infty' },
      { label: 'forall', latex: '\\forall' },
      { label: 'exists', latex: '\\exists' },
      { label: 'nexists', latex: '\\nexists' },
      { label: 'neg', latex: '\\neg' },
      { label: 'land', latex: '\\land' },
      { label: 'lor', latex: '\\lor' },
      { label: 'emptyset', latex: '\\emptyset' },
      { label: 'aleph', latex: '\\aleph' },
      { label: 'hbar', latex: '\\hbar' },
      { label: 'ell', latex: '\\ell' },
      { label: 'Re', latex: '\\Re' },
      { label: 'Im', latex: '\\Im' },
      { label: 'angle', latex: '\\angle' },
      { label: 'degree', latex: '^\\circ' },
    ],
  },
]

export function SymbolPalette({ onInsert, onClose }: SymbolPaletteProps) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div className="absolute right-4 top-4 w-80 bg-card border rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Symbol Palette</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex border-b overflow-x-auto">
        {symbolCategories.map((category, index) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(index)}
            className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeCategory === index
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1">
          {symbolCategories[activeCategory].symbols.map((symbol) => (
            <button
              key={symbol.latex}
              onClick={() => onInsert(symbol.latex)}
              className="p-2 text-sm font-mono hover:bg-muted rounded transition-colors text-center"
              title={symbol.latex}
            >
              {symbol.display || symbol.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Click a symbol to insert it at the cursor
        </p>
      </div>
    </div>
  )
}
