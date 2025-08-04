import { SecureAuthStorageService } from '../SecureAuthStorageService'
import { SecureAuthData } from '@/types/auth'

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
}))

import * as SecureStore from 'expo-secure-store'

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>

describe('SecureAuthStorageService', () => {
  const testAuthData: SecureAuthData = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    userId: 'test-user-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeAuthData', () => {
    it('should store auth data in secure storage', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue()

      await SecureAuthStorageService.storeAuthData(testAuthData)

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'clair_auth_tokens',
        JSON.stringify(testAuthData),
        {
          requireAuthentication: false,
          authenticationPrompt: 'Please authenticate to access your wallet',
          keychainService: 'com.clair.wallet.secure',
        }
      )
    })

    it('should throw error when storage fails', async () => {
      const error = new Error('Storage failed')
      mockSecureStore.setItemAsync.mockRejectedValue(error)

      await expect(SecureAuthStorageService.storeAuthData(testAuthData)).rejects.toEqual({
        message: 'Failed to store authentication data securely',
        type: 'unknown',
        code: 'SECURE_STORAGE_WRITE_ERROR'
      })
    })
  })

  describe('getAuthData', () => {
    it('should retrieve and parse auth data', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(testAuthData))

      const result = await SecureAuthStorageService.getAuthData()

      expect(result).toEqual(testAuthData)
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('clair_auth_tokens')
    })

    it('should return null when no data exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null)

      const result = await SecureAuthStorageService.getAuthData()

      expect(result).toBeNull()
    })

    it('should return null when retrieval fails', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Retrieval failed'))

      const result = await SecureAuthStorageService.getAuthData()

      expect(result).toBeNull()
    })
  })

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      const validAuthData = {
        ...testAuthData,
        expiresAt: Date.now() + 600000 // 10 minutes from now
      }
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(validAuthData))

      const result = await SecureAuthStorageService.isTokenValid()

      expect(result).toBe(true)
    })

    it('should return false for expired token', async () => {
      const expiredAuthData = {
        ...testAuthData,
        expiresAt: Date.now() - 1000 // 1 second ago
      }
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(expiredAuthData))

      const result = await SecureAuthStorageService.isTokenValid()

      expect(result).toBe(false)
    })

    it('should return false when no auth data exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null)

      const result = await SecureAuthStorageService.isTokenValid()

      expect(result).toBe(false)
    })
  })

  describe('needsRefresh', () => {
    it('should return true when token is within refresh buffer', async () => {
      const refreshNeededAuthData = {
        ...testAuthData,
        expiresAt: Date.now() + 240000 // 4 minutes from now (within 5-minute buffer)
      }
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(refreshNeededAuthData))

      const result = await SecureAuthStorageService.needsRefresh()

      expect(result).toBe(true)
    })

    it('should return false when token has plenty of time left', async () => {
      const validAuthData = {
        ...testAuthData,
        expiresAt: Date.now() + 600000 // 10 minutes from now
      }
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(validAuthData))

      const result = await SecureAuthStorageService.needsRefresh()

      expect(result).toBe(false)
    })
  })

  describe('clearAuthData', () => {
    it('should delete auth data from secure storage', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue()

      await SecureAuthStorageService.clearAuthData()

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('clair_auth_tokens')
    })

    it('should not throw when deletion fails', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('Deletion failed'))

      await expect(SecureAuthStorageService.clearAuthData()).resolves.toBeUndefined()
    })
  })

  describe('updateTokens', () => {
    it('should update existing auth data with new tokens', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(testAuthData))
      mockSecureStore.setItemAsync.mockResolvedValue()

      const newAccessToken = 'new-access-token'
      const newRefreshToken = 'new-refresh-token'
      const newExpiresAt = Date.now() + 7200000

      await SecureAuthStorageService.updateTokens(newAccessToken, newRefreshToken, newExpiresAt)

      const expectedUpdatedData = {
        ...testAuthData,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt
      }

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'clair_auth_tokens',
        JSON.stringify(expectedUpdatedData),
        expect.any(Object)
      )
    })

    it('should throw error when no existing data found', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null)

      await expect(
        SecureAuthStorageService.updateTokens('token', 'refresh', Date.now())
      ).rejects.toEqual({
        message: 'Failed to update authentication tokens',
        type: 'unknown',
        code: 'TOKEN_UPDATE_ERROR'
      })
    })
  })

  describe('getValidAccessToken', () => {
    it('should return access token when valid', async () => {
      const validAuthData = {
        ...testAuthData,
        expiresAt: Date.now() + 600000 // 10 minutes from now
      }
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(validAuthData))

      const result = await SecureAuthStorageService.getValidAccessToken()

      expect(result).toBe(testAuthData.accessToken)
    })

    it('should return null when token is expired', async () => {
      const expiredAuthData = {
        ...testAuthData,
        expiresAt: Date.now() - 1000 // 1 second ago
      }
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(expiredAuthData))

      const result = await SecureAuthStorageService.getValidAccessToken()

      expect(result).toBeNull()
    })
  })

  describe('isAvailable', () => {
    it('should return true when SecureStore is available', async () => {
      mockSecureStore.isAvailableAsync.mockResolvedValue(true)

      const result = await SecureAuthStorageService.isAvailable()

      expect(result).toBe(true)
    })

    it('should return false when SecureStore is not available', async () => {
      mockSecureStore.isAvailableAsync.mockResolvedValue(false)

      const result = await SecureAuthStorageService.isAvailable()

      expect(result).toBe(false)
    })

    it('should return false when availability check fails', async () => {
      mockSecureStore.isAvailableAsync.mockRejectedValue(new Error('Check failed'))

      const result = await SecureAuthStorageService.isAvailable()

      expect(result).toBe(false)
    })
  })
})