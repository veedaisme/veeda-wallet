import { User, Session } from '@supabase/supabase-js'

export type AuthUser = User & {
  id: string
  email?: string
}

export type AuthSession = Session & {
  user: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
}

export interface AuthError {
  message: string
  code?: string
  status?: number
  type: 'validation' | 'network' | 'auth' | 'token' | 'unknown'
}

// Finite State Machine States
export type AuthStatus = 
  | 'idle'           // Initial state, not yet initialized
  | 'initializing'   // Checking stored tokens/session
  | 'authenticated'  // User is logged in with valid session
  | 'unauthenticated'// User is not logged in
  | 'refreshing'     // Refreshing expired token
  | 'error'          // Auth error state

// Auth State following FSM pattern
export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  error: AuthError | null
  lastValidated: number | null
  isInitialized: boolean
}

// Auth Actions/Events for state transitions
export type AuthAction = 
  | { type: 'INITIALIZE' }
  | { type: 'SET_AUTHENTICATED'; user: AuthUser }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'SET_ERROR'; error: AuthError }
  | { type: 'START_REFRESH' }
  | { type: 'REFRESH_SUCCESS'; user: AuthUser }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }

// Secure storage interface
export interface SecureAuthData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
}

// Auth operation results
export interface AuthResult<T = void> {
  success: boolean
  data?: T
  error?: AuthError
}

