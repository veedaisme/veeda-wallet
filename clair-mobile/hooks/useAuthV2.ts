import { useEffect, useCallback, useMemo } from 'react'
import { AuthService } from '@/lib/authService'
import { useAuthStateMachine } from '@/stores/authStateMachine'
import { LoginCredentials, RegisterCredentials, AuthResult, AuthUser } from '@/types/auth'

/**
 * Main auth hook - provides all auth functionality with clean interface
 */
export const useAuth = () => {
  // Access individual properties to prevent object creation - no selectors that return new objects
  const status = useAuthStateMachine(state => state.status)
  const user = useAuthStateMachine(state => state.user)
  const error = useAuthStateMachine(state => state.error)
  const isAuthenticated = useAuthStateMachine(state => state.isAuthenticated)
  const isLoading = useAuthStateMachine(state => state.isLoading)
  const canRetry = useAuthStateMachine(state => state.canRetry)
  const isInitialized = useAuthStateMachine(state => state.isInitialized)
  const lastValidated = useAuthStateMachine(state => state.lastValidated)
  const clearErrorAction = useAuthStateMachine(state => state.clearError)
  const resetAction = useAuthStateMachine(state => state.reset)

  // Initialize auth on first load
  useEffect(() => {
    if (status === 'idle') {
      AuthService.initialize()  
    }
  }, [status])

  // Set up automatic token refresh check
  useEffect(() => {
    if (!isAuthenticated) return

    const checkTokenRefresh = () => {
      AuthService.checkAndRefreshIfNeeded()
    }

    // Check every 5 minutes
    const interval = setInterval(checkTokenRefresh, 5 * 60 * 1000)
    
    // Check when app comes to foreground
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkTokenRefresh()
      }
    }

    // Note: In a real app, you'd want to use AppState from react-native
    // For now, just use the interval
    
    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated])

  // Stable action functions - using individual selectors
  const clearError = useCallback(() => {
    clearErrorAction()
  }, [clearErrorAction])

  const retry = useCallback(async () => {
    if (!canRetry) return
    
    clearErrorAction()
    await AuthService.initialize()
  }, [canRetry, clearErrorAction])

  const reset = useCallback(() => {
    resetAction()
  }, [resetAction])

  // Static auth service actions - these never change
  const signIn = useCallback(async (credentials: LoginCredentials): Promise<AuthResult<AuthUser>> => {
    return AuthService.signIn(credentials)
  }, [])

  const signUp = useCallback(async (credentials: RegisterCredentials): Promise<AuthResult<AuthUser>> => {
    return AuthService.signUp(credentials)
  }, [])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    return AuthService.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    return AuthService.resetPassword(email)
  }, [])

  const refreshToken = useCallback(async (): Promise<AuthResult<AuthUser>> => {
    return AuthService.refreshToken()
  }, [])

  // Derived state computed from individual values - all stable
  const isInitializing = status === 'initializing'
  const isRefreshing = status === 'refreshing'
  const hasError = status === 'error'
  const isNetworkError = error?.type === 'network'
  const isValidationError = error?.type === 'validation'
  const isTokenError = error?.type === 'token'
  const isGuest = status === 'unauthenticated'

  return {
    // Core state - all primitive values, no object creation
    status,
    user,
    error,
    isAuthenticated,
    isLoading,
    canRetry,

    // Derived state - computed from primitives
    isInitializing,
    isRefreshing,
    isSigningIn: false,
    isSigningOut: false,
    hasError,
    isNetworkError,
    isValidationError,
    isTokenError,
    isInitialized,
    isGuest,
    needsEmailVerification: false,
    lastValidated,

    // Actions - all stable callbacks
    signIn,
    signUp, 
    signOut,
    resetPassword,
    refreshToken,
    clearError,
    retry,
    reset,

    // Legacy compatibility
    initialized: isInitialized,
    loading: isLoading,
  }
}

// Removed individual hook functions to prevent instability
// Use the main useAuth() hook instead for all auth needs

