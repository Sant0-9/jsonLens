import { NextRequest, NextResponse } from 'next/server'

async function validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
    
    if (response.ok) {
      return { valid: true }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return { 
        valid: false, 
        error: errorData.error?.message || `HTTP ${response.status}` 
      }
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

async function validateAnthropicKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    })
    
    // Anthropic returns 400 for invalid keys, 200 for valid ones
    if (response.status === 200 || response.status === 400) {
      const data = await response.json().catch(() => ({}))
      if (data.error?.type === 'invalid_api_key') {
        return { valid: false, error: 'Invalid API key' }
      }
      return { valid: true }
    } else {
      return { 
        valid: false, 
        error: `HTTP ${response.status}` 
      }
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider, model } = await request.json()

    if (!apiKey || !provider || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Basic format validation first
    let formatValid = false
    let formatError = ''

    switch (provider) {
      case 'openai':
        formatValid = apiKey.startsWith('sk-') && apiKey.length > 20
        formatError = 'Invalid OpenAI API key format (should start with sk- and be at least 20 characters)'
        break
      case 'anthropic':
        formatValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20
        formatError = 'Invalid Anthropic API key format (should start with sk-ant- and be at least 20 characters)'
        break
      case 'local':
        formatValid = apiKey.length > 10
        formatError = 'Local model key too short (should be at least 10 characters)'
        break
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        )
    }

    if (!formatValid) {
      return NextResponse.json(
        { error: formatError },
        { status: 400 }
      )
    }

    // For local models, just validate format
    if (provider === 'local') {
      return NextResponse.json({
        success: true,
        message: 'Local model configuration saved'
      })
    }

    // For real providers, validate the API key
    let validationResult

    try {
      switch (provider) {
        case 'openai':
          validationResult = await validateOpenAIKey(apiKey)
          break
        case 'anthropic':
          validationResult = await validateAnthropicKey(apiKey)
          break
        default:
          return NextResponse.json(
            { error: 'Unsupported provider for validation' },
            { status: 400 }
          )
      }

      if (validationResult.valid) {
        return NextResponse.json({
          success: true,
          message: 'API key validated successfully'
        })
      } else {
        return NextResponse.json(
          { error: validationResult.error || 'API key validation failed' },
          { status: 400 }
        )
      }

    } catch (validationError) {
      return NextResponse.json(
        { 
          error: validationError instanceof Error ? validationError.message : 'Validation failed' 
        },
        { status: 400 }
      )
    }

  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}