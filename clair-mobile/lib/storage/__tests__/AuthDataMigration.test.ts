import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthDataMigration } from '../AuthDataMigration'
import { SecureAuthStorageService } from '../SecureAuthStorageService'
import { SecureAuthData } from '@/types/auth'

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage')
jest.mock('../SecureAuthStorageService')

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockSecureAuthStorageService = SecureAuthStorageService as jest.Mocked<typeof SecureAuthStorageService>

describe('AuthDataMigration', () => {
  const testAuthData: SecureAuthData = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600000,
    userId: 'test-user-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console methods to avoid test output pollution
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('migrateAuthData', () => {
    it('should skip migration if already completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('true') // migration flag

      await AuthDataMigration.migrateAuthData()

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@clair_migration_completed')
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledWith('Auth data migration already completed, skipping')
    })

    it('should migrate valid legacy auth data', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // migration flag (not completed)
        .mockResolvedValueOnce(JSON.stringify(testAuthData)) // legacy auth data

      mockSecureAuthStorageService.storeAuthData.mockResolvedValue()
      mockAsyncStorage.removeItem.mockResolvedValue()
      mockAsyncStorage.setItem.mockResolvedValue()

      await AuthDataMigration.migrateAuthData()

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@clair_migration_completed')
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@clair_auth_data')
      expect(mockSecureAuthStorageService.storeAuthData).toHaveBeenCalledWith(testAuthData)
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@clair_auth_data')
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@clair_migration_completed', 'true')
      expect(console.log).toHaveBeenCalledWith('Auth data migration completed successfully')
    })

    it('should mark migration complete when no legacy data exists', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // migration flag (not completed)
        .mockResolvedValueOnce(null) // no legacy auth data

      mockAsyncStorage.setItem.mockResolvedValue()

      await AuthDataMigration.migrateAuthData()

      expect(mockSecureAuthStorageService.storeAuthData).not.toHaveBeenCalled()
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@clair_migration_completed', 'true')
      expect(console.log).toHaveBeenCalledWith('No legacy auth data found, marking migration as completed')
    })

    it('should handle invalid legacy data gracefully', async () => {
      const invalidData = { invalid: 'data' }
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // migration flag (not completed)
        .mockResolvedValueOnce(JSON.stringify(invalidData)) // invalid legacy auth data

      mockAsyncStorage.setItem.mockResolvedValue()

      await AuthDataMigration.migrateAuthData()

      expect(mockSecureAuthStorageService.storeAuthData).not.toHaveBeenCalled()
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@clair_migration_completed', 'true')
      expect(console.warn).toHaveBeenCalledWith('Legacy auth data is invalid, skipping migration')
    })

    it('should handle corrupted legacy data gracefully', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // migration flag (not completed)
        .mockResolvedValueOnce('invalid-json') // corrupted legacy auth data

      mockAsyncStorage.setItem.mockResolvedValue()

      await AuthDataMigration.migrateAuthData()

      expect(mockSecureAuthStorageService.storeAuthData).not.toHaveBeenCalled()
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@clair_migration_completed', 'true')
      expect(console.error).toHaveBeenCalledWith('Failed to parse legacy auth data:', expect.any(Error))
    })

    it('should not throw when migration fails', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'))

      await expect(AuthDataMigration.migrateAuthData()).resolves.toBeUndefined()
      expect(console.error).toHaveBeenCalledWith('Auth data migration failed:', expect.any(Error))
    })
  })

  describe('isMigrationCompleted', () => {
    it('should return true when migration is completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true')

      const result = await AuthDataMigration.isMigrationCompleted()

      expect(result).toBe(true)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@clair_migration_completed')
    })

    it('should return false when migration is not completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await AuthDataMigration.isMigrationCompleted()

      expect(result).toBe(false)
    })

    it('should return false when check fails', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Check failed'))

      const result = await AuthDataMigration.isMigrationCompleted()

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Failed to check migration status:', expect.any(Error))
    })
  })

  describe('resetMigrationFlag', () => {
    it('should remove migration flag', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue()

      await AuthDataMigration.resetMigrationFlag()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@clair_migration_completed')
      expect(console.log).toHaveBeenCalledWith('Migration flag reset')
    })

    it('should handle reset failure gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Reset failed'))

      await AuthDataMigration.resetMigrationFlag()

      expect(console.error).toHaveBeenCalledWith('Failed to reset migration flag:', expect.any(Error))
    })
  })

  describe('cleanupLegacyData', () => {
    it('should cleanup legacy data when migration is completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true') // migration completed
      mockAsyncStorage.removeItem.mockResolvedValue()
      mockAsyncStorage.getAllKeys.mockResolvedValue(['@clair_auth_old', '@other_key', '@clair_session'])
      mockAsyncStorage.multiRemove.mockResolvedValue()

      await AuthDataMigration.cleanupLegacyData()

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@clair_auth_data')
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(['@clair_auth_old', '@clair_session'])
      expect(console.log).toHaveBeenCalledWith('Legacy auth data cleanup completed')
    })

    it('should skip cleanup when migration is not completed', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null) // migration not completed

      await AuthDataMigration.cleanupLegacyData()

      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled()
      expect(mockAsyncStorage.getAllKeys).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('Migration not completed, skipping cleanup')
    })

    it('should handle cleanup failure gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Cleanup failed'))

      await AuthDataMigration.cleanupLegacyData()

      expect(console.error).toHaveBeenCalledWith('Failed to cleanup legacy data:', expect.any(Error))
    })
  })

  describe('isValidAuthData', () => {
    // Access private method through bracket notation for testing
    const isValidAuthData = (AuthDataMigration as any).isValidAuthData

    it('should return true for valid auth data', () => {
      expect(isValidAuthData(testAuthData)).toBe(true)
    })

    it('should return false for null/undefined', () => {
      expect(isValidAuthData(null)).toBe(false)
      expect(isValidAuthData(undefined)).toBe(false)
    })

    it('should return false for missing required fields', () => {
      expect(isValidAuthData({ ...testAuthData, accessToken: undefined })).toBe(false)
      expect(isValidAuthData({ ...testAuthData, refreshToken: '' })).toBe(false)
      expect(isValidAuthData({ ...testAuthData, userId: '' })).toBe(false)
      expect(isValidAuthData({ ...testAuthData, expiresAt: 0 })).toBe(false)
    })

    it('should return false for incorrect types', () => {
      expect(isValidAuthData({ ...testAuthData, accessToken: 123 })).toBe(false)
      expect(isValidAuthData({ ...testAuthData, expiresAt: '123' })).toBe(false)
    })
  })
})