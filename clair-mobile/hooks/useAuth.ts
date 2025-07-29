import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials, RegisterCredentials } from '@/types/auth'

export const useAuth = () => {
  const {
    user,
    session,
    loading,
    initialized,
    setUser,
    setSession,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      if (!mounted) return
      
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          console.log('Initial session:', session ? 'Found' : 'None')
          setSession(session)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
          setSession(session)
          setLoading(false)
        }
      }
    )

    getInitialSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (credentials: RegisterCredentials) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      reset()
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    initialized,
    isAuthenticated: !!session?.user,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}