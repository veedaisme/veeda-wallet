import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AuthState, AuthAction, AuthStatus, AuthUser, AuthError } from '@/types/auth'

// Initial state with computed properties
const initialState = {
  status: 'idle' as AuthStatus,
  user: null as AuthUser | null,
  error: null as AuthError | null,
  lastValidated: null as number | null,
  isInitialized: false,
  isAuthenticated: false,
  isLoading: false,
  canRetry: false,
}

// State transition rules - Finite State Machine
const stateTransitions: Record<AuthStatus, Partial<Record<AuthAction['type'], AuthStatus>>> = {
  idle: {
    INITIALIZE: 'initializing',
  },
  initializing: {
    SET_AUTHENTICATED: 'authenticated',
    SET_UNAUTHENTICATED: 'unauthenticated',
    SET_ERROR: 'error',
  },
  authenticated: {
    SET_UNAUTHENTICATED: 'unauthenticated',
    START_REFRESH: 'refreshing',
    SET_ERROR: 'error',
    RESET: 'idle',
  },
  unauthenticated: {
    SET_AUTHENTICATED: 'authenticated',
    SET_ERROR: 'error',
    RESET: 'idle',
  },
  refreshing: {
    REFRESH_SUCCESS: 'authenticated',
    SET_UNAUTHENTICATED: 'unauthenticated',
    SET_ERROR: 'error',
  },
  error: {
    SET_AUTHENTICATED: 'authenticated',
    SET_UNAUTHENTICATED: 'unauthenticated',
    CLEAR_ERROR: 'unauthenticated',
    RESET: 'idle',
  },
}

// State machine store interface
interface AuthStateMachine {
  // Core state
  status: AuthStatus
  user: AuthUser | null
  error: AuthError | null
  lastValidated: number | null
  isInitialized: boolean
  
  // Computed properties (stable, no getters)
  isAuthenticated: boolean
  isLoading: boolean
  canRetry: boolean
  
  // Actions
  dispatch: (action: AuthAction) => void
  initialize: () => void
  setAuthenticated: (user: AuthUser) => void
  setUnauthenticated: () => void
  setError: (error: AuthError) => void
  startRefresh: () => void
  refreshSuccess: (user: AuthUser) => void
  clearError: () => void
  reset: () => void
}

export const useAuthStateMachine = create<AuthStateMachine>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Core dispatch function following FSM rules
    dispatch: (action: AuthAction) => {
      const currentState = get()
      const currentStatus = currentState.status
      const allowedTransitions = stateTransitions[currentStatus]
      const nextStatus = allowedTransitions?.[action.type]

      // Only proceed if transition is valid
      if (!nextStatus) {
        console.warn(`Invalid auth transition: ${action.type} from ${currentStatus}`)
        return
      }

      // Apply state changes based on action type
      switch (action.type) {
        case 'INITIALIZE':
          set({
            status: nextStatus,
            error: null,
            isLoading: true,
            isAuthenticated: false,
            canRetry: false,
          })
          break

        case 'SET_AUTHENTICATED':
          set({
            status: nextStatus,
            user: action.user,
            error: null,
            lastValidated: Date.now(),
            isInitialized: true,
            isLoading: false,
            isAuthenticated: true,
            canRetry: false,
          })
          break

        case 'SET_UNAUTHENTICATED':
          set({
            status: nextStatus,
            user: null,
            error: null,
            lastValidated: null,
            isInitialized: true,
            isLoading: false,
            isAuthenticated: false,
            canRetry: false,
          })
          break

        case 'SET_ERROR':
          set({
            status: nextStatus,
            error: action.error,
            isInitialized: true,
            isLoading: false,
            isAuthenticated: false,
            canRetry: action.error.type !== 'validation',
          })
          break

        case 'START_REFRESH':
          set({
            status: nextStatus,
            error: null,
            isLoading: true,
            canRetry: false,
          })
          break

        case 'REFRESH_SUCCESS':
          set({
            status: nextStatus,
            user: action.user,
            error: null,
            lastValidated: Date.now(),
            isLoading: false,
            isAuthenticated: true,
            canRetry: false,
          })
          break

        case 'CLEAR_ERROR':
          set({
            status: nextStatus,
            error: null,
            canRetry: false,
          })
          break

        case 'RESET':
          set({
            ...initialState,
            status: nextStatus,
            isLoading: false,
            isAuthenticated: false,
            canRetry: false,
          })
          break

        default:
          console.warn(`Unhandled auth action type: ${(action as any).type}`)
      }
    },

    // Stable computed properties - no getters to avoid instability
    isAuthenticated: false, // Will be set by state transitions
    isLoading: false, // Will be set by state transitions  
    canRetry: false, // Will be set by state transitions

    // Action creators for better DX
    initialize: () => get().dispatch({ type: 'INITIALIZE' }),
    
    setAuthenticated: (user: AuthUser) => 
      get().dispatch({ type: 'SET_AUTHENTICATED', user }),
    
    setUnauthenticated: () => 
      get().dispatch({ type: 'SET_UNAUTHENTICATED' }),
    
    setError: (error: AuthError) => 
      get().dispatch({ type: 'SET_ERROR', error }),
    
    startRefresh: () => 
      get().dispatch({ type: 'START_REFRESH' }),
    
    refreshSuccess: (user: AuthUser) => 
      get().dispatch({ type: 'REFRESH_SUCCESS', user }),
    
    clearError: () => 
      get().dispatch({ type: 'CLEAR_ERROR' }),
    
    reset: () => 
      get().dispatch({ type: 'RESET' }),
  }))
)

// Only export the main store - individual selectors removed to prevent instability

// Subscribe to auth state changes for debugging
if (__DEV__) {
  useAuthStateMachine.subscribe(
    (state) => state.status,
    (status, previousStatus) => {
      console.log(`[AuthStateMachine] ${previousStatus} → ${status}`)
    }
  )
}