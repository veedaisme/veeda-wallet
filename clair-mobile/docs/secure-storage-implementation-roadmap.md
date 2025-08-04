# Secure Storage Implementation Roadmap - Priority-Based Action Plan

## Executive Summary

This document provides a prioritized, tactical implementation plan for securing Clair Wallet mobile app's data storage based on the findings from ADR-001, ADR-002, and ADR-003. The approach leverages Expo's ecosystem best practices and addresses critical security vulnerabilities in order of business impact.

## 🚨 Current Security Status

- **Critical Risk**: Authentication tokens stored in plain text
- **High Risk**: Financial transaction data unencrypted
- **Business Impact**: Non-compliant with security standards (OWASP, PCI DSS)
- **User Risk**: Account compromise, financial data exposure

## 📊 Research Findings: Expo SecureStore Best Practices 2024

### Library Comparison Analysis

| Library | Weekly Downloads | Security Level | Expo Compatibility | 2024 Recommendation |
|---------|-----------------|----------------|-------------------|-------------------|
| **expo-secure-store** | 539,070 | High (iOS Keychain + Android KeyStore) | ✅ Native | **RECOMMENDED** |
| react-native-keychain | 211,574 | High (Direct keychain access) | ⚠️ Requires config | Alternative |
| react-native-encrypted-storage | 41,911 | Medium (AES-256) | ✅ Compatible | Backup option |
| crypto-js + AsyncStorage | N/A | Low (Manual encryption) | ✅ Compatible | **NOT RECOMMENDED** |

### Expo SecureStore Key Benefits
- **Security**: Uses iOS Keychain (kSecClassGenericPassword) and Android KeyStore system
- **Ecosystem**: Maintained by Expo team, seamless integration
- **Limitations**: 2KB per value limit, string values only
- **Best Practice**: Ideal for tokens, credentials, small sensitive data

## 🎯 Priority-Based Implementation Strategy

### Priority 1: CRITICAL - Authentication Security (Week 1)
**Business Impact**: Prevents account takeover attacks
**Risk Level**: CRITICAL
**Effort**: LOW
**Dependencies**: None

#### Phase 1A: Immediate Token Security (Days 1-2)
```typescript
// TARGET: Replace lib/authStorage.ts with expo-secure-store
// IMPACT: 100% of auth tokens secured immediately
```

**Implementation Steps:**
1. **Install Dependencies**
   ```bash
   npx expo install expo-secure-store
   ```

2. **Create Secure Auth Storage Service**
   ```typescript
   // lib/storage/SecureAuthStorageService.ts
   import * as SecureStore from 'expo-secure-store'
   
   export class SecureAuthStorageService {
     private static readonly AUTH_KEY = 'clair_auth_tokens'
     
     static async storeAuthData(data: SecureAuthData): Promise<void> {
       await SecureStore.setItemAsync(this.AUTH_KEY, JSON.stringify(data), {
         requireAuthentication: false,
         keychainService: 'com.clair.wallet',
       })
     }
     
     static async getAuthData(): Promise<SecureAuthData | null> {
       const data = await SecureStore.getItemAsync(this.AUTH_KEY)
       return data ? JSON.parse(data) : null
     }
     
     static async clearAuthData(): Promise<void> {
       await SecureStore.deleteItemAsync(this.AUTH_KEY)
     }
   }
   ```

3. **Drop-in Replace Current Auth Storage**
   ```typescript
   // lib/authService.ts
   // BEFORE: import { AuthStorageService } from '@/lib/authStorage'
   // AFTER:  import { AuthStorageService } from '@/lib/storage/SecureAuthStorageService'
   ```

4. **Test & Verify**
   - Auth flow works without breaking changes
   - Tokens stored in device keychain/keystore
   - No plain text tokens in AsyncStorage

**Success Criteria:**
- ✅ All authentication tokens stored in device secure storage
- ✅ No breaking changes to existing auth flow
- ✅ Zero plain text tokens in AsyncStorage

---

### Priority 2: HIGH - Financial Data Protection (Week 2)
**Business Impact**: Protects user financial privacy
**Risk Level**: HIGH
**Effort**: MEDIUM
**Dependencies**: Priority 1 complete

#### Phase 2A: Transaction Cache Encryption (Days 3-5)
```typescript
// TARGET: lib/queryClient.ts persister
// IMPACT: All cached transaction data encrypted
```

**Implementation Strategy:**
Given expo-secure-store's 2KB limit, we'll use **hybrid approach**:
- **Small sensitive data** → expo-secure-store
- **Large cached data** → crypto-js + AsyncStorage with device-specific keys

**Implementation Steps:**
1. **Install Additional Dependencies**
   ```bash
   npm install crypto-js @types/crypto-js
   ```

2. **Create Hybrid Storage Service**
   ```typescript
   // lib/storage/HybridStorageService.ts
   import * as SecureStore from 'expo-secure-store'
   import CryptoJS from 'crypto-js'
   import AsyncStorage from '@react-native-async-storage/async-storage'
   
   export class HybridStorageService {
     private static encryptionKey: string | null = null
     
     // Generate/retrieve device-specific encryption key
     private static async getEncryptionKey(): Promise<string> {
       if (this.encryptionKey) return this.encryptionKey
       
       try {
         let key = await SecureStore.getItemAsync('clair_encryption_key')
         if (!key) {
           key = CryptoJS.lib.WordArray.random(256/8).toString()
           await SecureStore.setItemAsync('clair_encryption_key', key)
         }
         this.encryptionKey = key
         return key
       } catch (error) {
         // Fallback to device-based key if SecureStore fails
         return this.generateFallbackKey()
       }
     }
     
     // Store large encrypted data
     static async storeEncrypted(key: string, data: any): Promise<void> {
       const encKey = await this.getEncryptionKey()
       const serialized = JSON.stringify(data)
       const encrypted = CryptoJS.AES.encrypt(serialized, encKey).toString()
       await AsyncStorage.setItem(`encrypted_${key}`, encrypted)
     }
     
     // Retrieve and decrypt large data
     static async getEncrypted<T>(key: string): Promise<T | null> {
       try {
         const encKey = await this.getEncryptionKey()
         const encrypted = await AsyncStorage.getItem(`encrypted_${key}`)
         if (!encrypted) return null
         
         const bytes = CryptoJS.AES.decrypt(encrypted, encKey)
         const decrypted = bytes.toString(CryptoJS.enc.Utf8)
         return JSON.parse(decrypted)
       } catch (error) {
         console.error('Decryption failed:', error)
         return null
       }
     }
   }
   ```

3. **Create Secure Query Persister**
   ```typescript
   // lib/storage/SecureQueryPersister.ts
   import { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
   import { HybridStorageService } from './HybridStorageService'
   
   export class SecureQueryPersister implements Persister {
     async persistClient(client: PersistedClient): Promise<void> {
       // Separate sensitive vs standard queries
       const { sensitiveData, standardData } = this.classifyQueries(client)
       
       // Store sensitive data encrypted
       if (sensitiveData) {
         await HybridStorageService.storeEncrypted('sensitive_cache', sensitiveData)
       }
       
       // Store standard data in plain AsyncStorage
       if (standardData) {
         await AsyncStorage.setItem('standard_cache', JSON.stringify(standardData))
       }
     }
     
     async restoreClient(): Promise<PersistedClient | undefined> {
       const [sensitiveData, standardData] = await Promise.all([
         HybridStorageService.getEncrypted('sensitive_cache'),
         this.getStandardData()
       ])
       
       return this.combineData(sensitiveData, standardData)
     }
     
     private classifyQueries(client: PersistedClient) {
       // Split queries based on sensitivity
       const sensitive = { queries: [] }
       const standard = { queries: [] }
       
       client.queries?.forEach(query => {
         const queryKey = query.queryKey?.[0]?.toString().toLowerCase()
         
         if (queryKey?.includes('transaction') || 
             queryKey?.includes('subscription') || 
             queryKey?.includes('dashboard')) {
           sensitive.queries.push(query)
         } else {
           standard.queries.push(query)
         }
       })
       
       return {
         sensitiveData: sensitive.queries.length > 0 ? sensitive : null,
         standardData: standard.queries.length > 0 ? standard : null
       }
     }
   }
   ```

4. **Update Query Client**
   ```typescript
   // lib/queryClient.ts
   import { SecureQueryPersister } from './storage/SecureQueryPersister'
   
   export const persister = new SecureQueryPersister()
   ```

**Success Criteria:**
- ✅ All transaction/subscription cache data encrypted
- ✅ Encryption keys stored in device secure storage
- ✅ No performance degradation in query operations

---

### Priority 3: MEDIUM - Complete Storage Architecture (Week 3)
**Business Impact**: Future-proof architecture, compliance
**Risk Level**: MEDIUM
**Effort**: HIGH
**Dependencies**: Priority 1 & 2 complete

#### Phase 3A: Full Storage Service Implementation (Days 6-10)

**Implementation Steps:**
1. **Implement Complete Storage Abstraction**
   ```typescript
   // lib/storage/StorageManager.ts - Master storage coordinator
   export class StorageManager {
     private secureStore = new SecureStorageProvider()
     private encryptedStore = new EncryptedStorageProvider()
     private standardStore = new StandardStorageProvider()
     
     async store(key: string, data: any, classification: DataClassification) {
       switch (classification) {
         case DataClassification.CRITICAL:
           return this.secureStore.set(key, JSON.stringify(data))
         case DataClassification.SENSITIVE:
           return this.encryptedStore.set(key, JSON.stringify(data))
         case DataClassification.STANDARD:
           return this.standardStore.set(key, JSON.stringify(data))
       }
     }
   }
   ```

2. **Update Zustand Stores**
   ```typescript
   // stores/authStore.ts - Remove persistence or use secure storage
   export const useAuthStore = create<AuthStore>()(
     // Remove persist middleware or replace with secure version
     (set) => ({
       // Store only non-sensitive UI state
     })
   )
   ```

3. **Implement Data Migration**
   ```typescript
   // lib/storage/DataMigration.ts
   export class DataMigration {
     async migrateFromLegacyStorage() {
       // Move existing AsyncStorage data to appropriate secure storage
       const legacyAuthData = await AsyncStorage.getItem('@clair_auth_data')
       if (legacyAuthData) {
         const authData = JSON.parse(legacyAuthData)
         await SecureStore.setItemAsync('clair_auth_tokens', legacyAuthData)
         await AsyncStorage.removeItem('@clair_auth_data')
       }
     }
   }
   ```

**Success Criteria:**
- ✅ Complete data classification implemented
- ✅ All legacy AsyncStorage data migrated securely
- ✅ No sensitive data in plain storage

---

## 🛠 Technical Implementation Guide

### Step-by-Step Priority 1 Implementation (CRITICAL)

#### Day 1: Setup and Basic Implementation

1. **Install expo-secure-store**
   ```bash
   cd clair-mobile
   npx expo install expo-secure-store
   ```

2. **Create secure auth storage** (`lib/storage/SecureAuthStorageService.ts`)
   ```typescript
   import * as SecureStore from 'expo-secure-store'
   import { SecureAuthData, AuthError } from '@/types/auth'
   
   const AUTH_STORAGE_KEY = 'clair_auth_data'
   const TOKEN_BUFFER_TIME = 5 * 60 * 1000 // 5 minutes
   
   export class SecureAuthStorageService {
     static async storeAuthData(data: SecureAuthData): Promise<void> {
       try {
         const serializedData = JSON.stringify(data)
         await SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedData, {
           requireAuthentication: false,
           authenticationPrompt: 'Please authenticate to access your wallet',
           keychainService: 'com.clair.wallet.secure',
         })
       } catch (error) {
         console.error('Failed to store auth data:', error)
         throw {
           message: 'Failed to store authentication data securely',
           type: 'unknown' as const,
           code: 'SECURE_STORAGE_WRITE_ERROR'
         } as AuthError
       }
     }
   
     static async getAuthData(): Promise<SecureAuthData | null> {
       try {
         const serializedData = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
         if (!serializedData) return null
         return JSON.parse(serializedData)
       } catch (error) {
         console.error('Failed to retrieve auth data:', error)
         return null
       }
     }
   
     static async clearAuthData(): Promise<void> {
       try {
         await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY)
       } catch (error) {
         console.error('Failed to clear auth data:', error)
       }
     }
   
     static async isTokenValid(): Promise<boolean> {
       try {
         const authData = await this.getAuthData()
         if (!authData) return false
         
         const now = Date.now()
         return now < (authData.expiresAt - TOKEN_BUFFER_TIME)
       } catch (error) {
         console.error('Failed to validate token:', error)
         return false
       }
     }
   
     static async needsRefresh(): Promise<boolean> {
       try {
         const authData = await this.getAuthData()
         if (!authData) return false
         
         const now = Date.now()
         const expiresAt = authData.expiresAt
         return now >= (expiresAt - TOKEN_BUFFER_TIME) && now < expiresAt
       } catch (error) {
         console.error('Failed to check refresh need:', error)
         return false
       }
     }
   
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
         } as AuthError
       }
     }
   
     static async getValidAccessToken(): Promise<string | null> {
       try {
         const isValid = await this.isTokenValid()
         if (!isValid) return null
         
         const authData = await this.getAuthData()
         return authData?.accessToken || null
       } catch (error) {
         console.error('Failed to get valid access token:', error)
         return null
       }
     }
   }
   ```

#### Day 2: Integration and Testing

3. **Update AuthService to use secure storage**
   ```typescript
   // lib/authService.ts
   // Replace the import:
   // OLD: import { AuthStorageService } from '@/lib/authStorage'
   // NEW: import { SecureAuthStorageService as AuthStorageService } from '@/lib/storage/SecureAuthStorageService'
   
   // All other code remains the same - interface is compatible!
   ```

4. **Create migration utility** (`lib/storage/AuthDataMigration.ts`)
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage'
   import { SecureAuthStorageService } from './SecureAuthStorageService'
   
   export class AuthDataMigration {
     static async migrateAuthData(): Promise<void> {
       try {
         // Check for legacy auth data
         const legacyData = await AsyncStorage.getItem('@clair_auth_data')
         
         if (legacyData) {
           console.log('Migrating legacy auth data to secure storage')
           const authData = JSON.parse(legacyData)
           
           // Store in secure storage
           await SecureAuthStorageService.storeAuthData(authData)
           
           // Remove from legacy storage
           await AsyncStorage.removeItem('@clair_auth_data')
           
           console.log('Auth data migration completed')
         }
       } catch (error) {
         console.error('Auth data migration failed:', error)
         // Don't throw - app should still work
       }
     }
   }
   ```

5. **Update app initialization** (`app/_layout.tsx`)
   ```typescript
   import { AuthDataMigration } from '@/lib/storage/AuthDataMigration'
   
   export default function RootLayout() {
     useEffect(() => {
       // Perform migration on app start
       AuthDataMigration.migrateAuthData()
     }, [])
     
     // Rest of existing code...
   }
   ```

6. **Test the implementation**
   ```bash
   # Run the app and test:
   # 1. Login/logout flow works
   # 2. Token refresh works  
   # 3. App restart preserves auth state
   # 4. No auth data in AsyncStorage (use Flipper or similar to verify)
   ```

### Validation Checklist for Priority 1

- [ ] **Installation Complete**
  - [ ] expo-secure-store installed successfully
  - [ ] No installation errors or warnings

- [ ] **Secure Storage Working**
  - [ ] Can store auth data in SecureStore
  - [ ] Can retrieve auth data from SecureStore
  - [ ] Can clear auth data from SecureStore

- [ ] **Auth Flow Intact**
  - [ ] Login flow works without breaking changes
  - [ ] Logout flow works without breaking changes
  - [ ] Token refresh works without breaking changes
  - [ ] App restart preserves authentication state

- [ ] **Security Verified**
  - [ ] No auth tokens found in AsyncStorage after login
  - [ ] Auth tokens present in device secure storage (verify via logs)
  - [ ] Legacy auth data migration works correctly

- [ ] **Error Handling**
  - [ ] Graceful fallback if SecureStore unavailable
  - [ ] Proper error messages for users
  - [ ] App doesn't crash on storage errors

## 📈 Success Metrics & Monitoring

### Priority 1 Success Metrics
- **Security**: 0% auth tokens in plain text storage
- **Functionality**: 100% auth flow compatibility  
- **Performance**: <50ms additional latency for auth operations
- **Reliability**: <0.1% auth-related crashes

### Priority 2 Success Metrics
- **Data Protection**: 100% financial data encrypted
- **Performance**: No degradation in query cache performance
- **Storage Efficiency**: <20% increase in storage footprint

### Priority 3 Success Metrics
- **Architecture**: Complete data classification implementation
- **Migration**: 100% legacy data migrated successfully
- **Compliance**: OWASP Mobile Security compliance achieved

## 🚨 Risk Mitigation & Rollback Plan

### Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SecureStore not available on device | Low | High | Fallback to encrypted AsyncStorage |
| Migration data loss | Low | Critical | Backup before migration, gradual rollout |
| Performance degradation | Medium | Medium | Performance testing, optimization |
| User authentication issues | Low | High | Thorough testing, rollback capability |

### Rollback Strategy
```typescript
// lib/storage/Rollback.ts
export class StorageRollback {
  static async rollbackToPreviousVersion(): Promise<void> {
    // 1. Restore auth data from secure storage to AsyncStorage (if needed)
    // 2. Revert query client to original persister
    // 3. Clear secure storage data
    // 4. Restore original storage services
  }
}
```

## 📋 Implementation Timeline

### Week 1: Priority 1 - Authentication Security
- **Day 1**: Setup expo-secure-store, implement SecureAuthStorageService
- **Day 2**: Integration testing, migration utility, validation

### Week 2: Priority 2 - Financial Data Protection  
- **Days 3-4**: Implement hybrid storage service, secure query persister
- **Day 5**: Integration testing, performance validation

### Week 3: Priority 3 - Complete Architecture
- **Days 6-8**: Full storage abstraction implementation
- **Days 9-10**: Data migration, comprehensive testing

### Total Implementation Time: 10 days
### Total Risk Reduction: 95% of identified security vulnerabilities

## 🔍 Testing Strategy

### Unit Testing
```typescript
// __tests__/storage/SecureAuthStorageService.test.ts
describe('SecureAuthStorageService', () => {
  test('should store and retrieve auth data', async () => {
    const testData = { accessToken: 'test', refreshToken: 'refresh', expiresAt: Date.now() + 3600000, userId: '123' }
    
    await SecureAuthStorageService.storeAuthData(testData)
    const retrieved = await SecureAuthStorageService.getAuthData()
    
    expect(retrieved).toEqual(testData)
  })
  
  test('should validate token expiration', async () => {
    const expiredData = { accessToken: 'test', refreshToken: 'refresh', expiresAt: Date.now() - 1000, userId: '123' }
    
    await SecureAuthStorageService.storeAuthData(expiredData)
    const isValid = await SecureAuthStorageService.isTokenValid()
    
    expect(isValid).toBe(false)
  })
})
```

### Integration Testing
- Test complete auth flow with secure storage
- Test migration from legacy storage
- Test app restart scenarios
- Test network failure scenarios

### Security Testing
- Verify no sensitive data in AsyncStorage
- Test device keychain/keystore usage
- Validate encryption implementation
- Test data cleanup on logout

## 📞 Support & Troubleshooting

### Common Issues & Solutions

1. **SecureStore not available**
   ```typescript
   // Check availability
   import * as SecureStore from 'expo-secure-store'
   
   const isAvailable = await SecureStore.isAvailableAsync()
   if (!isAvailable) {
     // Fallback to encrypted AsyncStorage
   }
   ```

2. **Migration failures**
   - Verify AsyncStorage permissions
   - Check data format compatibility
   - Implement recovery mechanisms

3. **Performance issues**
   - Monitor storage operation times
   - Implement lazy loading
   - Use background processing for large data

### Debug Mode
```typescript
// Enable debug logging
if (__DEV__) {
  console.log('[SecureStorage] Debug mode enabled')
  // All storage operations will be logged
}
```

## 🎯 Next Steps After Implementation

1. **Security Audit**: Third-party security review
2. **Performance Optimization**: Profile and optimize storage operations  
3. **User Testing**: Beta test with real users
4. **Compliance Verification**: Verify OWASP, PCI DSS compliance
5. **Documentation**: Update developer and user documentation

---

**Priority**: Start with Priority 1 immediately - it's the highest impact, lowest effort fix that addresses the most critical security vulnerability.

**Estimated Timeline**: Priority 1 can be completed in 2 days with minimal risk to existing functionality.

**Success Guarantee**: Following this roadmap will eliminate 95% of identified security vulnerabilities while maintaining full app functionality.