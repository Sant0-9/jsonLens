/**
 * Prompt Template Engine
 *
 * Parse and render templates with {{variable}} placeholders.
 */

export interface TemplateVariable {
  name: string
  description?: string
  defaultValue?: string
  required: boolean
}

/**
 * Extract variables from a template string
 */
export function extractVariables(template: string): TemplateVariable[] {
  const regex = /\{\{(\w+)(?:\|([^}]*))?\}\}/g
  const variables = new Map<string, TemplateVariable>()
  let match

  while ((match = regex.exec(template)) !== null) {
    const name = match[1]
    const defaultValue = match[2]?.trim()

    if (!variables.has(name)) {
      variables.set(name, {
        name,
        defaultValue,
        required: !defaultValue,
      })
    }
  }

  return Array.from(variables.values())
}

/**
 * Render a template with variable values
 */
export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_, name, defaultValue) => {
    const value = values[name]
    if (value !== undefined && value !== '') {
      return value
    }
    return defaultValue?.trim() || ''
  })
}

/**
 * Validate that all required variables have values
 */
export function validateTemplate(
  template: string,
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const variables = extractVariables(template)
  const missing: string[] = []

  for (const variable of variables) {
    if (variable.required && !values[variable.name]) {
      missing.push(variable.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Check if a string contains template variables
 */
export function hasVariables(template: string): boolean {
  return /\{\{\w+(?:\|[^}]*)?\}\}/.test(template)
}

/**
 * Common prompt templates
 */
export const PROMPT_TEMPLATES = {
  summarize: {
    name: 'Summarize',
    description: 'Summarize text concisely',
    systemPrompt: 'You are a helpful assistant that summarizes text concisely while preserving key information.',
    userPrompt: 'Please summarize the following text:\n\n{{text}}',
  },
  explain: {
    name: 'Explain',
    description: 'Explain a concept simply',
    systemPrompt: 'You are a helpful assistant that explains complex concepts in simple, easy-to-understand terms.',
    userPrompt: 'Please explain {{topic}} in simple terms. Target audience: {{audience|general public}}',
  },
  codeReview: {
    name: 'Code Review',
    description: 'Review code for issues',
    systemPrompt: 'You are an experienced software engineer conducting a code review. Focus on bugs, security issues, performance, and best practices.',
    userPrompt: 'Please review this {{language|code}}:\n\n```\n{{code}}\n```',
  },
  translate: {
    name: 'Translate',
    description: 'Translate text',
    systemPrompt: 'You are a professional translator. Translate accurately while preserving tone and meaning.',
    userPrompt: 'Translate the following text from {{source_language|English}} to {{target_language}}:\n\n{{text}}',
  },
  brainstorm: {
    name: 'Brainstorm',
    description: 'Generate ideas',
    systemPrompt: 'You are a creative assistant that generates diverse, innovative ideas.',
    userPrompt: 'Generate {{count|5}} ideas for: {{topic}}',
  },
  writeEmail: {
    name: 'Write Email',
    description: 'Draft an email',
    systemPrompt: 'You are a professional email writer. Write clear, concise, and appropriately toned emails.',
    userPrompt: 'Write a {{tone|professional}} email about: {{subject}}\n\nKey points to include:\n{{points}}',
  },
  analyzeData: {
    name: 'Analyze Data',
    description: 'Analyze and interpret data',
    systemPrompt: 'You are a data analyst. Analyze data and provide clear, actionable insights.',
    userPrompt: 'Analyze the following data and provide insights:\n\n{{data}}',
  },
  researchSummary: {
    name: 'Research Summary',
    description: 'Summarize research paper',
    systemPrompt: 'You are a research assistant. Summarize academic papers highlighting key contributions, methodology, results, and limitations.',
    userPrompt: 'Summarize this research paper:\n\nTitle: {{title}}\nAbstract: {{abstract}}\n\n{{content|}}',
  },
} as const

export type TemplateId = keyof typeof PROMPT_TEMPLATES
