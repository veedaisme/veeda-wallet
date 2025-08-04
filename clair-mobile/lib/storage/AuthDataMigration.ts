import AsyncStorage from '@react-native-async-storage/async-storage'
import { SecureAuthStorageService } from './SecureAuthStorageService'
import { SecureAuthData } from '@/types/auth'

const LEGACY_AUTH_STORAGE_KEY = '@clair_auth_data'
const MIGRATION_FLAG_KEY = '@clair_migration_completed'

export class AuthDataMigration {
  /**
   * Migrate auth data from legacy AsyncStorage to secure storage
   * This is a one-time operation that runs on app startup
   */
  static async migrateAuthData(): Promise<void> {
    try {
      // Check if migration has already been completed
      const migrationCompleted = await AsyncStorage.getItem(MIGRATION_FLAG_KEY)
      if (migrationCompleted === 'true') {
        console.log('Auth data migration already completed, skipping')
        return
      }

      // Check for legacy auth data
      const legacyData = await AsyncStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
      
      if (legacyData) {
        console.log('Found legacy auth data, starting migration to secure storage')
        
        try {
          const authData: SecureAuthData = JSON.parse(legacyData)
          
          // Validate the data structure before migrating
          if (this.isValidAuthData(authData)) {
            // Store in secure storage
            await SecureAuthStorageService.storeAuthData(authData)
            
            // Remove from legacy storage
            await AsyncStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
            
            // Mark migration as completed
            await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true')
            
            console.log('Auth data migration completed successfully')
          } else {
            console.warn('Legacy auth data is invalid, skipping migration')
            // Mark migration as completed even if data was invalid to prevent retries
            await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true')
          }
        } catch (parseError) {
          console.error('Failed to parse legacy auth data:', parseError)
          // Mark migration as completed to prevent retries with corrupted data
          await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true')
        }
      } else {
        console.log('No legacy auth data found, marking migration as completed')
        // Mark migration as completed even if no data was found
        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true')
      }
    } catch (error) {
      console.error('Auth data migration failed:', error)
      // Don't throw - app should still work
      // Don't mark as completed either, so it can retry next time
    }
  }

  /**
   * Validate auth data structure before migration
   */
  private static isValidAuthData(data: any): data is SecureAuthData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.accessToken === 'string' &&
      typeof data.refreshToken === 'string' &&
      typeof data.expiresAt === 'number' &&
      typeof data.userId === 'string' &&
      data.accessToken.length > 0 &&
      data.refreshToken.length > 0 &&
      data.userId.length > 0 &&
      data.expiresAt > 0
    )
  }

  /**
   * Check if migration has been completed
   */
  static async isMigrationCompleted(): Promise<boolean> {
    try {
      const migrationCompleted = await AsyncStorage.getItem(MIGRATION_FLAG_KEY)
      return migrationCompleted === 'true'
    } catch (error) {
      console.error('Failed to check migration status:', error)
      return false
    }
  }

  /**
   * Reset migration flag (for testing/debugging purposes)
   */
  static async resetMigrationFlag(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MIGRATION_FLAG_KEY)
      console.log('Migration flag reset')
    } catch (error) {
      console.error('Failed to reset migration flag:', error)
    }
  }

  /**
   * Clean up any remaining legacy auth data after successful migration
   */
  static async cleanupLegacyData(): Promise<void> {
    try {
      // Only cleanup if migration has been completed
      const migrationCompleted = await this.isMigrationCompleted()
      if (!migrationCompleted) {
        console.log('Migration not completed, skipping cleanup')
        return
      }

      // Remove any remaining legacy auth data
      await AsyncStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
      
      // Also check for any other legacy auth-related keys that might exist
      const allKeys = await AsyncStorage.getAllKeys()
      const legacyAuthKeys = allKeys.filter(key => 
        key.includes('auth') && key.startsWith('@clair_')
      )
      
      if (legacyAuthKeys.length > 0) {
        console.log(`Cleaning up ${legacyAuthKeys.length} legacy auth keys:`, legacyAuthKeys)
        await AsyncStorage.multiRemove(legacyAuthKeys)
      }
      
      console.log('Legacy auth data cleanup completed')
    } catch (error) {
      console.error('Failed to cleanup legacy data:', error)
      // Don't throw - this is not critical
    }
  }
}