import AsyncStorage from '@react-native-async-storage/async-storage'
import { SecureAuthData, AuthError } from '@/types/auth'

const AUTH_STORAGE_KEY = '@clair_auth_data'
const TOKEN_BUFFER_TIME = 5 * 60 * 1000 // 5 minutes buffer before expiration

export class AuthStorageService {
  /**
   * Store auth data securely
   */
  static async storeAuthData(data: SecureAuthData): Promise<void> {
    try {
      const serializedData = JSON.stringify(data)
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, serializedData)
    } catch (error) {
      console.error('Failed to store auth data:', error)
      throw {
        message: 'Failed to store authentication data',
        type: 'unknown' as const,
        code: 'STORAGE_WRITE_ERROR'
      }
    }
  }

  /**
   * Retrieve stored auth data
   */
  static async getAuthData(): Promise<SecureAuthData | null> {
    try {
      const serializedData = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      if (!serializedData) {
        return null
      }

      const data: SecureAuthData = JSON.parse(serializedData)
      return data
    } catch (error) {
      console.error('Failed to retrieve auth data:', error)
      // Don't throw here, just return null to allow app to continue
      return null
    }
  }

  /**
   * Check if stored token is valid and not expired
   */
  static async isTokenValid(): Promise<boolean> {
    try {
      const authData = await this.getAuthData()
      if (!authData) {
        return false
      }

      const now = Date.now()
      const expiresAt = authData.expiresAt
      
      // Check if token expires within the buffer time
      return now < (expiresAt - TOKEN_BUFFER_TIME)
    } catch (error) {
      console.error('Failed to validate token:', error)
      return false
    }
  }

  /**
   * Check if token needs refresh (within buffer time of expiration)
   */
  static async needsRefresh(): Promise<boolean> {
    try {
      const authData = await this.getAuthData()
      if (!authData) {
        return false
      }

      const now = Date.now()
      const expiresAt = authData.expiresAt
      const bufferTime = TOKEN_BUFFER_TIME

      // Needs refresh if we're within the buffer time of expiration
      return now >= (expiresAt - bufferTime) && now < expiresAt
    } catch (error) {
      console.error('Failed to check refresh need:', error)
      return false
    }
  }

  /**
   * Clear all stored auth data
   */
  static async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear auth data:', error)
      // Don't throw here, just log the error
    }
  }

  /**
   * Update only the tokens in stored auth data
   */
  static async updateTokens(accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
    try {
      const existingData = await this.getAuthData()
      if (!existingData) {
        throw new Error('No existing auth data to update')
      }

      const updatedData: SecureAuthData = {
        ...existingData,
        accessToken,
        refreshToken,
        expiresAt
      }

      await this.storeAuthData(updatedData)
    } catch (error) {
      console.error('Failed to update tokens:', error)
      throw {
        message: 'Failed to update authentication tokens',
        type: 'unknown' as const,
        code: 'TOKEN_UPDATE_ERROR'
      }
    }
  }

  /**
   * Get access token if valid
   */
  static async getValidAccessToken(): Promise<string | null> {
    try {
      const isValid = await this.isTokenValid()
      if (!isValid) {
        return null
      }

      const authData = await this.getAuthData()
      return authData?.accessToken || null
    } catch (error) {
      console.error('Failed to get valid access token:', error)
      return null
    }
  }
}

