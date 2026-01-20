// IndexedDB Utility Functions
import { DB_NAME, DB_VERSION, STORES } from './schema'

let dbInstance: IDBDatabase | null = null

// Reset database connection (useful when schema changes)
export function resetDBConnection(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export async function openDB(): Promise<IDBDatabase> {
  // Check if existing connection has all required stores
  if (dbInstance) {
    const allStoresExist = Object.values(STORES).every(
      store => dbInstance!.objectStoreNames.contains(store)
    )
    if (!allStoresExist) {
      // Close stale connection and re-open
      dbInstance.close()
      dbInstance = null
    } else {
      return dbInstance
    }
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create all stores
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' })
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.PAPERS)) {
        const paperStore = db.createObjectStore(STORES.PAPERS, { keyPath: 'id' })
        paperStore.createIndex('addedAt', 'addedAt', { unique: false })
        paperStore.createIndex('title', 'paper.title', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
        const promptStore = db.createObjectStore(STORES.PROMPTS, { keyPath: 'id' })
        promptStore.createIndex('updatedAt', 'prompt.updatedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.EXPERIMENTS)) {
        const experimentStore = db.createObjectStore(STORES.EXPERIMENTS, { keyPath: 'id' })
        experimentStore.createIndex('createdAt', 'experiment.createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.ARXIV_DIGESTS)) {
        db.createObjectStore(STORES.ARXIV_DIGESTS, { keyPath: 'date' })
      }

      if (!db.objectStoreNames.contains(STORES.API_COSTS)) {
        const costStore = db.createObjectStore(STORES.API_COSTS, { keyPath: 'id' })
        costStore.createIndex('timestamp', 'timestamp', { unique: false })
        costStore.createIndex('provider', 'provider', { unique: false })
        costStore.createIndex('module', 'module', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      }

      if (!db.objectStoreNames.contains(STORES.VERSIONS)) {
        const versionStore = db.createObjectStore(STORES.VERSIONS, { keyPath: 'versionId' })
        versionStore.createIndex('projectId', 'projectId', { unique: false })
        versionStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' })
        notesStore.createIndex('updatedAt', 'note.updatedAt', { unique: false })
        notesStore.createIndex('title', 'note.title', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
        const questionsStore = db.createObjectStore(STORES.QUESTIONS, { keyPath: 'id' })
        questionsStore.createIndex('updatedAt', 'question.updatedAt', { unique: false })
        questionsStore.createIndex('status', 'question.status', { unique: false })
      }
    }
  })
}

// Helper to check if store exists
function storeExists(db: IDBDatabase, storeName: string): boolean {
  return db.objectStoreNames.contains(storeName)
}

export async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return undefined
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T | undefined)
  })
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return []
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T[])
  })
}

export async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(value)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function remove(storeName: string, key: string): Promise<void> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function clear(storeName: string): Promise<void> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllByIndex<T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return []
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(query)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T[])
  })
}

export async function count(storeName: string): Promise<number> {
  const db = await openDB()
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" not found. Try refreshing the page.`)
    return 0
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.count()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// Re-export schema constants
export { STORES, DB_NAME, DB_VERSION } from './schema'
