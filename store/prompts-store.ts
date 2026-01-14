"use client"

import { create } from 'zustand'
import { put, get as dbGet, getAll, remove, generateId, STORES } from '@/lib/db'
import type { PromptRecord, PromptResult } from '@/lib/db/schema'
import { providerRegistry, type ChatResponse } from '@/lib/prompts/provider-registry'
import { recordCost } from '@/lib/costs/cost-tracker'
import { extractVariables, renderTemplate, hasVariables } from '@/lib/prompts/template-engine'

export interface LocalPromptVersion {
  id: string
  promptId: string
  systemPrompt: string
  userPrompt: string
  timestamp: number
}

export interface RunResult {
  modelId: string
  providerId: string
  response?: ChatResponse
  error?: string
  streaming: boolean
  content: string
}

interface PromptsState {
  // Prompts library
  prompts: PromptRecord[]
  isLoading: boolean
  error: string | null

  // Current prompt editing
  currentPromptId: string | null
  systemPrompt: string
  userPrompt: string
  variableValues: Record<string, string>

  // Model selection
  selectedModels: string[]

  // Parameters
  temperature: number
  maxTokens: number

  // Results
  results: Map<string, RunResult>
  isRunning: boolean

  // UI state
  showTemplates: boolean
  showHistory: boolean

  // Actions
  loadPrompts: () => Promise<void>
  loadPrompt: (id: string) => Promise<void>
  savePrompt: (name: string) => Promise<string>
  deletePrompt: (id: string) => Promise<void>

  // Editing
  setSystemPrompt: (prompt: string) => void
  setUserPrompt: (prompt: string) => void
  setVariableValue: (name: string, value: string) => void
  clearVariables: () => void

  // Models
  toggleModel: (modelId: string) => void
  clearModels: () => void

  // Parameters
  setTemperature: (temp: number) => void
  setMaxTokens: (tokens: number) => void

  // Running
  runPrompt: () => Promise<void>
  runPromptStreaming: () => Promise<void>
  stopRun: () => void
  clearResults: () => void

  // UI
  setShowTemplates: (show: boolean) => void
  setShowHistory: (show: boolean) => void
  newPrompt: () => void

  // Computed
  getVariables: () => Array<{ name: string; required: boolean; defaultValue?: string }>
  getRenderedPrompt: () => { systemPrompt: string; userPrompt: string }
  hasUnsavedChanges: () => boolean
}

export const usePromptsStore = create<PromptsState>((set, get) => ({
  // Initial state
  prompts: [],
  isLoading: false,
  error: null,
  currentPromptId: null,
  systemPrompt: '',
  userPrompt: '',
  variableValues: {},
  selectedModels: [],
  temperature: 0.7,
  maxTokens: 4096,
  results: new Map(),
  isRunning: false,
  showTemplates: false,
  showHistory: false,

  // Load all prompts
  loadPrompts: async () => {
    set({ isLoading: true, error: null })
    try {
      const records = await getAll<PromptRecord>(STORES.PROMPTS)
      set({ prompts: records, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load prompts',
        isLoading: false,
      })
    }
  },

  // Load a specific prompt
  loadPrompt: async (id: string) => {
    const record = await dbGet<PromptRecord>(STORES.PROMPTS, id)
    if (record) {
      set({
        currentPromptId: id,
        systemPrompt: record.prompt.systemPrompt || '',
        userPrompt: record.prompt.userPrompt,
        variableValues: {},
        results: new Map(),
      })
    }
  },

  // Save current prompt
  savePrompt: async (name: string) => {
    const { currentPromptId, systemPrompt, userPrompt, prompts } = get()

    const id = currentPromptId || generateId()
    const now = Date.now()

    const existing = currentPromptId
      ? await dbGet<PromptRecord>(STORES.PROMPTS, currentPromptId)
      : null

    const versions: LocalPromptVersion[] = existing?.versions || []

    // Add current state as a version if changed
    if (existing && (existing.prompt.systemPrompt !== systemPrompt || existing.prompt.userPrompt !== userPrompt)) {
      versions.push({
        id: generateId(),
        promptId: id,
        systemPrompt,
        userPrompt,
        timestamp: now,
      })
    }

    const record: PromptRecord = {
      id,
      prompt: {
        id,
        name,
        systemPrompt,
        userPrompt,
        variables: existing?.prompt.variables || {},
        tags: existing?.prompt.tags || [],
        createdAt: existing?.prompt.createdAt || now,
        updatedAt: now,
      },
      versions: versions.slice(-50) as PromptRecord['versions'], // Keep last 50 versions
      results: existing?.results || [],
    }

    await put(STORES.PROMPTS, record)

    // Update local state
    if (currentPromptId) {
      set({
        prompts: prompts.map(p => p.id === id ? record : p),
      })
    } else {
      set({
        currentPromptId: id,
        prompts: [...prompts, record],
      })
    }

    return id
  },

  // Delete prompt
  deletePrompt: async (id: string) => {
    await remove(STORES.PROMPTS, id)
    const { currentPromptId } = get()

    set(state => ({
      prompts: state.prompts.filter(p => p.id !== id),
      currentPromptId: currentPromptId === id ? null : currentPromptId,
      systemPrompt: currentPromptId === id ? '' : state.systemPrompt,
      userPrompt: currentPromptId === id ? '' : state.userPrompt,
    }))
  },

  // Editing
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setUserPrompt: (prompt) => set({ userPrompt: prompt }),
  setVariableValue: (name, value) => set(state => ({
    variableValues: { ...state.variableValues, [name]: value },
  })),
  clearVariables: () => set({ variableValues: {} }),

  // Models
  toggleModel: (modelId) => set(state => ({
    selectedModels: state.selectedModels.includes(modelId)
      ? state.selectedModels.filter(m => m !== modelId)
      : [...state.selectedModels, modelId],
  })),
  clearModels: () => set({ selectedModels: [] }),

  // Parameters
  setTemperature: (temp) => set({ temperature: Math.max(0, Math.min(2, temp)) }),
  setMaxTokens: (tokens) => set({ maxTokens: Math.max(1, Math.min(128000, tokens)) }),

  // Run prompt (non-streaming)
  runPrompt: async () => {
    const { selectedModels, temperature, maxTokens } = get()
    const { systemPrompt, userPrompt } = get().getRenderedPrompt()

    if (selectedModels.length === 0) {
      set({ error: 'Please select at least one model' })
      return
    }

    set({ isRunning: true, error: null, results: new Map() })

    const results = new Map<string, RunResult>()

    await Promise.all(selectedModels.map(async (modelId) => {
      const provider = providerRegistry.findProviderForModel(modelId)
      if (!provider) {
        results.set(modelId, {
          modelId,
          providerId: 'unknown',
          error: 'Provider not found',
          streaming: false,
          content: '',
        })
        return
      }

      try {
        const response = await provider.chat({
          model: modelId,
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt: systemPrompt || undefined,
          temperature,
          maxTokens,
        })

        // Record cost
        await recordCost(
          provider.id as 'openai' | 'anthropic' | 'google' | 'groq',
          modelId,
          'prompt-lab',
          response.inputTokens,
          response.outputTokens
        )

        results.set(modelId, {
          modelId,
          providerId: provider.id,
          response,
          streaming: false,
          content: response.content,
        })
      } catch (error) {
        results.set(modelId, {
          modelId,
          providerId: provider.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          streaming: false,
          content: '',
        })
      }

      set({ results: new Map(results) })
    }))

    set({ isRunning: false })
  },

  // Run prompt with streaming
  runPromptStreaming: async () => {
    const { selectedModels, temperature, maxTokens } = get()
    const { systemPrompt, userPrompt } = get().getRenderedPrompt()

    if (selectedModels.length === 0) {
      set({ error: 'Please select at least one model' })
      return
    }

    set({ isRunning: true, error: null, results: new Map() })

    const results = new Map<string, RunResult>()

    // Initialize all results
    for (const modelId of selectedModels) {
      const provider = providerRegistry.findProviderForModel(modelId)
      results.set(modelId, {
        modelId,
        providerId: provider?.id || 'unknown',
        streaming: true,
        content: '',
      })
    }
    set({ results: new Map(results) })

    await Promise.all(selectedModels.map(async (modelId) => {
      const provider = providerRegistry.findProviderForModel(modelId)
      if (!provider) {
        results.set(modelId, {
          modelId,
          providerId: 'unknown',
          error: 'Provider not found',
          streaming: false,
          content: '',
        })
        set({ results: new Map(results) })
        return
      }

      try {
        let content = ''
        let inputTokens = 0
        let outputTokens = 0

        for await (const chunk of provider.streamChat({
          model: modelId,
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt: systemPrompt || undefined,
          temperature,
          maxTokens,
        })) {
          content += chunk.content
          if (chunk.inputTokens) inputTokens = chunk.inputTokens
          if (chunk.outputTokens) outputTokens = chunk.outputTokens

          results.set(modelId, {
            modelId,
            providerId: provider.id,
            streaming: !chunk.done,
            content,
            response: chunk.done ? {
              content,
              inputTokens,
              outputTokens,
              model: modelId,
              latencyMs: 0,
            } : undefined,
          })
          set({ results: new Map(results) })
        }

        // Record cost
        if (inputTokens > 0 || outputTokens > 0) {
          await recordCost(
            provider.id as 'openai' | 'anthropic' | 'google' | 'groq',
            modelId,
            'prompt-lab',
            inputTokens,
            outputTokens
          )
        }
      } catch (error) {
        results.set(modelId, {
          modelId,
          providerId: provider.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          streaming: false,
          content: '',
        })
        set({ results: new Map(results) })
      }
    }))

    set({ isRunning: false })
  },

  stopRun: () => set({ isRunning: false }),
  clearResults: () => set({ results: new Map() }),

  // UI
  setShowTemplates: (show) => set({ showTemplates: show }),
  setShowHistory: (show) => set({ showHistory: show }),
  newPrompt: () => set({
    currentPromptId: null,
    systemPrompt: '',
    userPrompt: '',
    variableValues: {},
    results: new Map(),
  }),

  // Computed
  getVariables: () => {
    const { systemPrompt, userPrompt } = get()
    const combined = `${systemPrompt}\n${userPrompt}`
    return extractVariables(combined)
  },

  getRenderedPrompt: () => {
    const { systemPrompt, userPrompt, variableValues } = get()
    return {
      systemPrompt: hasVariables(systemPrompt) ? renderTemplate(systemPrompt, variableValues) : systemPrompt,
      userPrompt: hasVariables(userPrompt) ? renderTemplate(userPrompt, variableValues) : userPrompt,
    }
  },

  hasUnsavedChanges: () => {
    const { currentPromptId, systemPrompt, userPrompt, prompts } = get()
    if (!currentPromptId) return systemPrompt !== '' || userPrompt !== ''

    const saved = prompts.find(p => p.id === currentPromptId)
    if (!saved) return true

    return saved.prompt.systemPrompt !== systemPrompt || saved.prompt.userPrompt !== userPrompt
  },
}))
