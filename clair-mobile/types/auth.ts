import { User, Session } from '@supabase/supabase-js'

export interface AuthUser extends User {
  id: string
  email?: string
  created_at?: string
  updated_at?: string
}

export interface AuthSession extends Session {
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

export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  initialized: boolean
}

export interface AuthError {
  message: string
  status?: number
}