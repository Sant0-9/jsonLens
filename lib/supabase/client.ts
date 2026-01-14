import { createBrowserClient } from '@supabase/ssr'

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton instance for client-side use
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    return null
  }
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
