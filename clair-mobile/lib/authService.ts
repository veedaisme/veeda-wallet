import { supabase } from '@/lib/supabase'
import { AuthStorageService } from '@/lib/authStorage'
import { useAuthStateMachine } from '@/stores/authStateMachine'
import { AuthError, AuthUser, SecureAuthData, AuthResult, LoginCredentials, RegisterCredentials } from '@/types/auth'

export class AuthService {
  private static refreshPromise: Promise<AuthResult<AuthUser>> | null = null

  /**
   * Initialize auth state by checking stored tokens
   */
  static async initialize(): Promise<void> {
    const { initialize, setAuthenticated, setUnauthenticated, setError } = useAuthStateMachine.getState()
    
    try {
      initialize()

      // Check if we have valid stored tokens
      const isValid = await AuthStorageService.isTokenValid()
      
      if (isValid) {
        // Validate with server and get user
        const result = await this.validateStoredSession()
        if (result.success && result.data) {
          setAuthenticated(result.data)
        } else {
          await this.cleanup()
          setUnauthenticated()
        }
      } else {
        // Check if token needs refresh
        const needsRefresh = await AuthStorageService.needsRefresh()
        if (needsRefresh) {
          const refreshResult = await this.refreshToken()
          if (refreshResult.success && refreshResult.data) {
            setAuthenticated(refreshResult.data)
          } else {
            await this.cleanup()
            setUnauthenticated()
          }
        } else {
          await this.cleanup()
          setUnauthenticated()
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      setError(this.createAuthError(error, 'unknown'))
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResult<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return {
          success: false,
          error: this.createAuthError(error, 'auth')
        }
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: this.createAuthError('No session returned from login', 'auth')
        }
      }

      // Store auth data securely
      await this.storeSession(data.session)
      
      const user = data.user as AuthUser
      useAuthStateMachine.getState().setAuthenticated(user)

      return {
        success: true,
        data: user
      }
    } catch (error) {
      return {
        success: false,
        error: this.createAuthError(error, 'network')
      }
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(credentials: RegisterCredentials): Promise<AuthResult<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return {
          success: false,
          error: this.createAuthError(error, 'auth')
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: this.createAuthError('No user returned from registration', 'auth')
        }
      }

      // If session is available, store it
      if (data.session) {
        await this.storeSession(data.session)
        const user = data.user as AuthUser
        useAuthStateMachine.getState().setAuthenticated(user)
        
        return {
          success: true,
          data: user
        }
      }

      // If no session (email confirmation required), set unauthenticated
      useAuthStateMachine.getState().setUnauthenticated()
      
      return {
        success: true,
        data: data.user as AuthUser
      }
    } catch (error) {
      return {
        success: false,
        error: this.createAuthError(error, 'network')
      }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut()
      
      // Always cleanup local storage regardless of server response
      await this.cleanup()
      useAuthStateMachine.getState().setUnauthenticated()

      if (error) {
        console.warn('Sign out warning:', error.message)
        // Don't treat this as a failure since we cleaned up locally
      }

      return { success: true }
    } catch (error) {
      // Still cleanup and set unauthenticated even if network fails
      await this.cleanup()
      useAuthStateMachine.getState().setUnauthenticated()
      
      return {
        success: false,
        error: this.createAuthError(error, 'network')
      }
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<AuthResult<AuthUser>> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performTokenRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    
    return result
  }

  /**
   * Validate stored session with server
   */
  private static async validateStoredSession(): Promise<AuthResult<AuthUser>> {
    try {
      const authData = await AuthStorageService.getAuthData()
      if (!authData) {
        return {
          success: false,
          error: this.createAuthError('No stored session found', 'auth')
        }
      }

      // Set the session in Supabase client
      const { data, error } = await supabase.auth.setSession({
        access_token: authData.accessToken,
        refresh_token: authData.refreshToken
      })

      if (error || !data.session?.user) {
        return {
          success: false,
          error: this.createAuthError(error?.message || 'Session validation failed', 'auth')
        }
      }

      // Update stored session if tokens were refreshed
      if (data.session.access_token !== authData.accessToken) {
        await this.storeSession(data.session)
      }

      return {
        success: true,
        data: data.session.user as AuthUser
      }
    } catch (error) {
      return {
        success: false,
        error: this.createAuthError(error, 'network')
      }
    }
  }

  /**
   * Perform actual token refresh
   */
  private static async performTokenRefresh(): Promise<AuthResult<AuthUser>> {
    const { startRefresh, refreshSuccess, setError, setUnauthenticated } = useAuthStateMachine.getState()
    
    try {
      startRefresh()

      const { data, error } = await supabase.auth.refreshSession()

      if (error || !data.session?.user) {
        await this.cleanup()
        setUnauthenticated()
        return {
          success: false,
          error: this.createAuthError(error?.message || 'Token refresh failed', 'token')
        }
      }

      // Store the new session
      await this.storeSession(data.session)
      
      const user = data.session.user as AuthUser
      refreshSuccess(user)

      return {
        success: true,
        data: user
      }
    } catch (error) {
      const authError = this.createAuthError(error, 'network')
      setError(authError)
      return {
        success: false,
        error: authError
      }
    }
  }

  /**
   * Store session data securely
   */
  private static async storeSession(session: any): Promise<void> {
    const authData: SecureAuthData = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at * 1000, // Convert to milliseconds
      userId: session.user.id,
    }

    await AuthStorageService.storeAuthData(authData)
  }

  /**
   * Clean up all stored auth data
   */
  private static async cleanup(): Promise<void> {
    await AuthStorageService.clearAuthData()
  }

  /**
   * Create standardized auth error
   */
  private static createAuthError(error: any, type: AuthError['type']): AuthError {
    if (typeof error === 'string') {
      return {
        message: error,
        type,
        code: 'UNKNOWN'
      }
    }

    if (error?.message) {
      return {
        message: error.message,
        type,
        code: error.code || error.error_code || 'UNKNOWN',
        status: error.status
      }
    }

    return {
      message: 'An unexpected error occurred',
      type,
      code: 'UNKNOWN'
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        return {
          success: false,
          error: this.createAuthError(error, 'auth')
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: this.createAuthError(error, 'network')
      }
    }
  }

  /**
   * Check if automatic token refresh is needed
   */
  static async checkAndRefreshIfNeeded(): Promise<void> {
    const needsRefresh = await AuthStorageService.needsRefresh()
    if (needsRefresh) {
      await this.refreshToken()
    }
  }
}