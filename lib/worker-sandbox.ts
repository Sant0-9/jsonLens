"use client"

interface PluginWorker {
  id: string
  worker: Worker
  isReady: boolean
  messageQueue: unknown[]
}

class WorkerSandbox {
  private workers: Map<string, PluginWorker> = new Map()
  private messageHandlers: Map<string, (data: unknown) => void> = new Map()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createWorker(pluginId: string, _pluginCode: string): Promise<string> {
    try {
      // Create a blob URL for the plugin code
      const workerCode = this.wrapPluginCode()
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)

      // Create the worker
      const worker = new Worker(workerUrl)
      
      const pluginWorker: PluginWorker = {
        id: pluginId,
        worker,
        isReady: false,
        messageQueue: []
      }

      // Set up message handling
      worker.onmessage = (event) => {
        this.handleWorkerMessage(pluginId, event.data)
      }

      worker.onerror = (error) => {
        console.error(`Worker ${pluginId} error:`, error)
        this.messageHandlers.get(pluginId)?.({
          type: 'error',
          error: error.message
        })
      }

      this.workers.set(pluginId, pluginWorker)

      // Initialize the worker
      worker.postMessage({
        type: 'init',
        pluginId
      })

      return pluginId
    } catch (error) {
      throw new Error(`Failed to create worker for plugin ${pluginId}: ${error}`)
    }
  }

  private wrapPluginCode(): string {
    return `
      // Worker sandbox wrapper
      let pluginId = null;
      let isReady = false;

      // Sandboxed environment
      const sandbox = {
        console: {
          log: (...args) => {
            self.postMessage({
              type: 'console',
              level: 'log',
              args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
            });
          },
          error: (...args) => {
            self.postMessage({
              type: 'console',
              level: 'error',
              args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
            });
          }
        },
        // Limited fetch for data fetching
        fetch: (url, options) => {
          return self.postMessage({
            type: 'fetch',
            url,
            options
          });
        },
        // Math and basic utilities
        Math,
        Date,
        JSON,
        // No access to DOM, window, or other global objects
      };

      // Create a safe execution context
      const executeInSandbox = (code) => {
        const func = new Function('sandbox', \`
          with (sandbox) {
            \${code}
          }
        \`);
        return func(sandbox);
      };

      // Handle messages from main thread
      self.onmessage = (event) => {
        const { type, data, pluginId: msgPluginId } = event.data;

        if (type === 'init') {
          pluginId = msgPluginId;
          isReady = true;
          self.postMessage({
            type: 'ready',
            pluginId
          });
          return;
        }

        if (type === 'execute') {
          try {
            const result = executeInSandbox(data.code);
            self.postMessage({
              type: 'result',
              pluginId,
              result: typeof result === 'object' ? JSON.stringify(result) : result
            });
          } catch (error) {
            self.postMessage({
              type: 'error',
              pluginId,
              error: error.message
            });
          }
        }
      };

      // Execute the plugin code
      try {
        executeInSandbox(\`\${pluginCode}\`);
      } catch (error) {
        self.postMessage({
          type: 'error',
          pluginId,
          error: error.message
        });
      }
    `
  }

  private handleWorkerMessage(pluginId: string, data: unknown) {
    const worker = this.workers.get(pluginId)
    if (!worker) return

    const messageData = data as { type: string; [key: string]: unknown }
    switch (messageData.type) {
      case 'ready':
        worker.isReady = true
        // Process queued messages
        worker.messageQueue.forEach(message => {
          worker.worker.postMessage(message)
        })
        worker.messageQueue = []
        break

      case 'result':
      case 'error':
      case 'console':
        this.messageHandlers.get(pluginId)?.(data)
        break

      case 'fetch':
        // Handle fetch requests from worker
        const fetchData = messageData as unknown as { url: string; options: unknown }
        this.handleFetchRequest(pluginId, fetchData.url, fetchData.options)
        break
    }
  }

  private async handleFetchRequest(pluginId: string, url: string, options: unknown) {
    try {
      const response = await fetch(url, options as RequestInit)
      const data = await response.text()
      
      this.workers.get(pluginId)?.worker.postMessage({
        type: 'fetchResponse',
        url,
        data,
        status: response.status
      })
    } catch (error) {
      this.workers.get(pluginId)?.worker.postMessage({
        type: 'fetchError',
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async executePlugin(pluginId: string, code: string, data: unknown): Promise<unknown> {
    const worker = this.workers.get(pluginId)
    if (!worker) {
      throw new Error(`Worker ${pluginId} not found`)
    }

    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36).substr(2, 9)
      
      const handler = (response: unknown) => {
        const responseData = response as { type: string; messageId?: string; result?: unknown; error?: string }
        if (responseData.type === 'result' && responseData.messageId === messageId) {
          this.messageHandlers.delete(messageId)
          resolve(responseData.result)
        } else if (responseData.type === 'error' && responseData.messageId === messageId) {
          this.messageHandlers.delete(messageId)
          reject(new Error(responseData.error || 'Unknown error'))
        }
      }

      this.messageHandlers.set(messageId, handler)

      if (worker.isReady) {
        worker.worker.postMessage({
          type: 'execute',
          messageId,
          code,
          data
        })
      } else {
        worker.messageQueue.push({
          type: 'execute',
          messageId,
          code,
          data
        })
      }
    })
  }

  terminateWorker(pluginId: string): void {
    const worker = this.workers.get(pluginId)
    if (worker) {
      worker.worker.terminate()
      this.workers.delete(pluginId)
      this.messageHandlers.delete(pluginId)
    }
  }

  terminateAll(): void {
    this.workers.forEach((worker, pluginId) => {
      this.terminateWorker(pluginId)
    })
  }

  getWorkerStatus(pluginId: string): { isReady: boolean; messageQueue: number } {
    const worker = this.workers.get(pluginId)
    return worker ? {
      isReady: worker.isReady,
      messageQueue: worker.messageQueue.length
    } : { isReady: false, messageQueue: 0 }
  }
}

export const workerSandbox = new WorkerSandbox()