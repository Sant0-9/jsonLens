import { NextRequest, NextResponse } from 'next/server'

interface LLMConfig {
  apiKey: string
  provider: string
  model: string
}

interface LLMRequest {
  prompt: string
  maxTokens: number
  temperature: number
}

async function callOpenAI(apiKey: string, model: string, prompt: string, maxTokens: number, temperature: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature,
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage
  }
}

async function callAnthropic(apiKey: string, model: string, prompt: string, maxTokens: number, temperature: number) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.content[0]?.text || '',
    usage: data.usage
  }
}

async function callLocalModel(apiKey: string, model: string, prompt: string) {
  // For local models, we'll use a simple mock response
  // In a real implementation, you would call your local model endpoint
  return {
    content: `Local model analysis (${model}): This JSON data contains structured information that would benefit from visualization. The data structure suggests using tree views for hierarchical data or table views for tabular data.`,
    usage: {
      prompt_tokens: Math.ceil(prompt.length / 4),
      completion_tokens: 50,
      total_tokens: Math.ceil(prompt.length / 4) + 50
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config, request: llmRequest }: { config: LLMConfig; request: LLMRequest } = await request.json()

    if (!config || !llmRequest) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const { prompt, maxTokens, temperature } = llmRequest
    const { apiKey, provider, model } = config

    let result

    try {
      switch (provider) {
        case 'openai':
          result = await callOpenAI(apiKey, model, prompt, maxTokens, temperature)
          break
        case 'anthropic':
          result = await callAnthropic(apiKey, model, prompt, maxTokens, temperature)
          break
        case 'local':
          result = await callLocalModel(apiKey, model, prompt)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      return NextResponse.json({
        success: true,
        content: result.content,
        usage: result.usage
      })

    } catch (apiError) {
      return NextResponse.json(
        { 
          error: apiError instanceof Error ? apiError.message : 'API call failed',
          success: false 
        },
        { status: 400 }
      )
    }

  } catch {
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        success: false 
      },
      { status: 500 }
    )
  }
}