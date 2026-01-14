/**
 * Auth utilities for optional cloud sync
 * Users can use the app anonymously, then optionally sign in to sync
 */

import { getSupabase, isSupabaseConfigured } from './client'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
}

/**
 * Get current auth state
 */
export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { user: null, session: null, isLoading: false, isConfigured: false }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { user: null, session: null, isLoading: false, isConfigured: false }
  }

  const { data: { session } } = await supabase.auth.getSession()
  return {
    user: session?.user ?? null,
    session,
    isLoading: false,
    isConfigured: true,
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with magic link (email)
 */
export async function signInWithMagicLink(email: string) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = getSupabase()
  if (!supabase) return

  await supabase.auth.signOut()
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (state: AuthState) => void) {
  const supabase = getSupabase()
  if (!supabase) {
    callback({ user: null, session: null, isLoading: false, isConfigured: false })
    return { unsubscribe: () => {} }
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event: string, session: Session | null) => {
      callback({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isConfigured: true,
      })
    }
  )

  return { unsubscribe: () => subscription.unsubscribe() }
}
