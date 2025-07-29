import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthUser, AuthSession } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setSession: (session: AuthSession | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  initialized: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      
      setSession: (session) => set({ 
        session, 
        user: session?.user || null 
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setInitialized: (initialized) => set({ initialized }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        initialized: state.initialized,
      }),
    }
  )
)