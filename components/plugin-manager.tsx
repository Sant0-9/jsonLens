"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Code, Play, Square } from 'lucide-react'
import { workerSandbox } from '@/lib/worker-sandbox'

interface Plugin {
  id: string
  name: string
  description: string
  code: string
  isActive: boolean
}

export function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [newPlugin, setNewPlugin] = useState({ name: '', description: '', code: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [executionResult, setExecutionResult] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = () => {
    const savedPlugins = localStorage.getItem('jsonlens-plugins')
    if (savedPlugins) {
      setPlugins(JSON.parse(savedPlugins))
    }
  }

  const savePlugins = (updatedPlugins: Plugin[]) => {
    localStorage.setItem('jsonlens-plugins', JSON.stringify(updatedPlugins))
    setPlugins(updatedPlugins)
  }

  const createPlugin = async () => {
    if (!newPlugin.name || !newPlugin.code) return

    setIsCreating(true)
    const pluginId = `plugin-${Date.now()}`
    
    try {
      await workerSandbox.createWorker(pluginId, newPlugin.code)
      
      const plugin: Plugin = {
        id: pluginId,
        name: newPlugin.name,
        description: newPlugin.description,
        code: newPlugin.code,
        isActive: true
      }

      const updatedPlugins = [...plugins, plugin]
      savePlugins(updatedPlugins)
      setNewPlugin({ name: '', description: '', code: '' })
    } catch (error) {
      console.error('Failed to create plugin:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const executePlugin = async (plugin: Plugin, data: unknown) => {
    setIsExecuting(true)
    setExecutionResult('')

    try {
      const result = await workerSandbox.executePlugin(plugin.id, plugin.code, data)
      setExecutionResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setExecutionResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const togglePlugin = (pluginId: string) => {
    const updatedPlugins = plugins.map(plugin =>
      plugin.id === pluginId ? { ...plugin, isActive: !plugin.isActive } : plugin
    )
    savePlugins(updatedPlugins)
  }

  const deletePlugin = (pluginId: string) => {
    workerSandbox.terminateWorker(pluginId)
    const updatedPlugins = plugins.filter(plugin => plugin.id !== pluginId)
    savePlugins(updatedPlugins)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Plugin Manager</h3>
        <p className="text-sm text-muted-foreground">Create and manage custom data processing plugins</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Create New Plugin
          </CardTitle>
          <CardDescription>
            Write JavaScript code that will run in a sandboxed environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plugin-name">Plugin Name</Label>
              <Input
                id="plugin-name"
                value={newPlugin.name}
                onChange={(e) => setNewPlugin(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Data Transformer"
              />
            </div>
            <div>
              <Label htmlFor="plugin-description">Description</Label>
              <Input
                id="plugin-description"
                value={newPlugin.description}
                onChange={(e) => setNewPlugin(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Transforms data in some way"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plugin-code">Plugin Code</Label>
            <textarea
              id="plugin-code"
              value={newPlugin.code}
              onChange={(e) => setNewPlugin(prev => ({ ...prev, code: e.target.value }))}
              placeholder="// Example plugin code
function transform(data) {
  // Your transformation logic here
  return data;
}

// Export the main function
transform;"
              className="w-full h-32 p-3 border rounded-md font-mono text-sm bg-background"
            />
          </div>

          <Button onClick={createPlugin} disabled={isCreating || !newPlugin.name || !newPlugin.code}>
            {isCreating ? 'Creating...' : 'Create Plugin'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h4 className="text-md font-semibold">Installed Plugins</h4>
        {plugins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plugins installed</p>
        ) : (
          plugins.map(plugin => (
            <Card key={plugin.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{plugin.name}</CardTitle>
                    <CardDescription>{plugin.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executePlugin(plugin, { test: 'data' })}
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <Square className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlugin(plugin.id)}
                    >
                      {plugin.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlugin(plugin.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {executionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto">
              {executionResult}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}