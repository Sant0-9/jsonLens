"use client"

interface LLMConfig {
  apiKey: string
  provider: string
  model: string
}

// LLMRequest interface not used in current implementation

interface LLMResponse {
  success: boolean
  content?: string
  error?: string
}

class LLMService {
  private config: LLMConfig | null = null

  constructor() {
    this.loadConfig()
  }

  private loadConfig() {
    if (typeof window === 'undefined') return

    const apiKey = localStorage.getItem('jsonlens-llm-api-key')
    const provider = localStorage.getItem('jsonlens-llm-provider')
    const model = localStorage.getItem('jsonlens-llm-model')

    if (apiKey && provider && model) {
      this.config = { apiKey, provider, model }
    }
  }

  isConfigured(): boolean {
    return this.config !== null
  }

  async generateInsight(data: unknown, type: 'summary' | 'analysis' | 'suggestions'): Promise<LLMResponse> {
    if (!this.config) {
      return {
        success: false,
        error: 'LLM not configured. Please set up your API key in settings.'
      }
    }

    const prompt = this.buildPrompt(data, type)
    
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: this.config,
          request: {
            prompt,
            maxTokens: 500,
            temperature: 0.7
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        content: result.content
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private buildPrompt(data: unknown, type: string): string {
    const dataSummary = this.summarizeData(data)
    
    switch (type) {
      case 'summary':
        return `Please provide a brief summary of this JSON data:\n\n${dataSummary}\n\nFocus on the main structure and key insights.`
      
      case 'analysis':
        return `Analyze this JSON data and identify patterns, anomalies, or interesting characteristics:\n\n${dataSummary}\n\nProvide detailed analysis.`
      
      case 'suggestions':
        return `Based on this JSON data, suggest improvements for data structure, visualization, or analysis:\n\n${dataSummary}\n\nProvide actionable suggestions.`
      
      default:
        return `Please analyze this JSON data:\n\n${dataSummary}`
    }
  }

  private summarizeData(data: unknown): string {
    if (Array.isArray(data)) {
      return `Array with ${data.length} items. First few items: ${JSON.stringify(data.slice(0, 3), null, 2)}`
    }
    
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data)
      return `Object with ${keys.length} properties: ${keys.join(', ')}. Sample: ${JSON.stringify(data, null, 2).substring(0, 500)}`
    }
    
    return `Value: ${JSON.stringify(data)}`
  }
}

export const llmService = new LLMService()