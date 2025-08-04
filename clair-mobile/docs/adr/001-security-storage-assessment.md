# ADR-001: Security Storage Assessment

## Status
**Accepted** - 2024-08-04

## Context

The Clair Wallet mobile application (`@clair-mobile`) currently stores sensitive data locally using AsyncStorage, which presents significant security vulnerabilities. A comprehensive security assessment has revealed critical issues that must be addressed before production deployment.

## Problem Statement

### Current Storage Architecture

The application currently uses multiple unencrypted storage layers:

1. **Authentication Storage** (`lib/authStorage.ts:14`)
   - JWT access tokens, refresh tokens, and user IDs stored as JSON strings in AsyncStorage
   - No encryption or secure storage implementation

2. **Query Cache** (`lib/queryClient.ts:21-26`)
   - Transaction data, subscription data, and user information cached in AsyncStorage
   - Potentially sensitive financial data persisted unencrypted

3. **State Management** (`stores/authStore.ts:48-56`)
   - User sessions and authentication state persisted via Zustand middleware
   - Session data includes sensitive user information

4. **Supabase Auth** (`lib/supabase.ts:11`)
   - Configured to use AsyncStorage for session persistence
   - Full session objects with tokens stored unencrypted

5. **Internationalization** (i18n configuration)
   - Language preferences stored in AsyncStorage

## Security Vulnerabilities Identified

### 🔴 Critical Security Issues

1. **Unencrypted Token Storage**
   - **Location**: `lib/authStorage.ts:14` - `await AsyncStorage.setItem(AUTH_STORAGE_KEY, serializedData)`
   - **Risk**: High - Authentication tokens accessible to malicious apps on rooted/jailbroken devices
   - **Impact**: Complete account compromise, unauthorized access to financial data

2. **Sensitive Financial Data Exposure**
   - **Location**: `lib/queryClient.ts:23` - Query cache persister using AsyncStorage
   - **Risk**: High - Transaction amounts, categories, and spending patterns exposed
   - **Impact**: Privacy violation, potential financial surveillance

3. **Session Data Vulnerability**
   - **Location**: `stores/authStore.ts:50` - Zustand persist middleware with AsyncStorage
   - **Risk**: Medium-High - User profile data and session information exposed
   - **Impact**: Identity exposure, session hijacking potential

### ⚠️ Security Concerns

4. **No Data Classification**
   - All data treated equally regardless of sensitivity level
   - No distinction between public preferences and private financial data

5. **Missing Secure Storage Implementation**
   - No use of expo-secure-store or device keychain/keystore
   - Missing industry-standard encryption for sensitive data

6. **Token Lifecycle Management**
   - Tokens persist indefinitely without automatic cleanup
   - No secure deletion of expired or invalid tokens

## Performance Assessment

### ✅ Good Performance Practices

1. **Efficient Query Caching**
   - TanStack Query with optimized stale time (5 minutes) and garbage collection (24 hours)
   - Proper cache invalidation strategies prevent stale data

2. **State Management Optimization**
   - Zustand stores are lightweight with selective persistence using `partialize`
   - Minimal re-renders with proper state slicing

### ⚠️ Performance Concerns

3. **Storage I/O Bottlenecks**
   - Multiple storage operations across different services may cause I/O congestion
   - Large transaction datasets could impact AsyncStorage performance

4. **No Data Pagination Limits**
   - Query cache may grow indefinitely without proper size management
   - Could lead to storage exhaustion on devices with limited space

## Extensibility Assessment

### ✅ Well-Designed Architecture

1. **Modular Storage Services**
   - Clean separation between auth storage, query cache, and state management
   - Type-safe interfaces with comprehensive error handling
   - Query key factories enable efficient cache management

2. **Future-Ready Patterns**
   - State machine pattern for auth flows provides predictable state transitions
   - Internationalization storage infrastructure ready for multiple languages

### ⚠️ Extensibility Limitations

3. **Hard AsyncStorage Dependency**
   - No abstraction layer for storage providers
   - Difficult to migrate to secure storage without significant refactoring

4. **Limited Offline-First Capabilities**
   - Basic caching without sophisticated offline synchronization
   - No conflict resolution for offline data modifications

## Data Classification Analysis

Based on the codebase analysis, data can be classified into three sensitivity levels:

### High Sensitivity (Requires Secure Storage)
- JWT access tokens and refresh tokens (`SecureAuthData`)
- User authentication credentials and session data
- Financial transaction details (amounts, categories, notes)
- Personal spending patterns and analytics

### Medium Sensitivity (Encrypted AsyncStorage)
- User preferences and settings
- Cached query data (with personal identifiers removed)
- Application state that could reveal usage patterns

### Low Sensitivity (Standard AsyncStorage)
- Language preferences and UI settings
- Non-personal configuration data
- Public category definitions and constants

## Risk Assessment Matrix

| Vulnerability | Probability | Impact | Risk Level | Priority |
|---------------|-------------|--------|------------|----------|
| Token theft via device compromise | Medium | Critical | HIGH | P0 |
| Financial data exposure | Medium | High | HIGH | P0 |
| Session hijacking | Low | High | MEDIUM | P1 |
| Privacy violation via data mining | High | Medium | MEDIUM | P1 |
| Storage performance degradation | Medium | Low | LOW | P2 |

## Compliance Considerations

### Security Standards
- **OWASP Mobile Top 10**: Currently violates M2 (Insecure Data Storage)
- **PCI DSS**: Non-compliant for financial data handling
- **GDPR**: Potential privacy violations due to unencrypted personal data

### Mobile Security Best Practices
- **iOS Security Guide**: Not utilizing iOS Keychain for sensitive data
- **Android Security**: Not using Android Keystore for cryptographic operations

## Current Storage Usage Analysis

### File System Inspection
```
/Users/nb-dk-iqbal-fakhri/Documents/playground/code/veeda-wallet/clair-mobile/
├── lib/
│   ├── authStorage.ts      # 🔴 Critical: Unencrypted token storage
│   ├── authService.ts      # ⚠️  Uses authStorage for sensitive operations  
│   ├── queryClient.ts      # ⚠️  Caches sensitive transaction data
│   └── supabase.ts         # ⚠️  Configured with AsyncStorage
├── stores/
│   ├── authStore.ts        # ⚠️  Persists session data
│   └── appStore.ts         # ✅  Only UI state, no sensitive data
└── types/
    └── auth.ts             # ✅  Type definitions, no storage
```

### Storage Pattern Analysis
- **Total Storage Layers**: 6 different storage mechanisms
- **Encrypted Storage Usage**: 0% (0 out of 6)
- **Sensitive Data in AsyncStorage**: ~80% of stored data
- **Security Implementation**: Missing entirely

## Decision Requirements

Based on this assessment, the following decisions are required:

1. **Immediate Security Fixes**
   - Implement secure storage for authentication tokens
   - Encrypt sensitive query cache data
   - Migrate session storage to secure mechanisms

2. **Architecture Redesign**
   - Create abstracted storage service with multiple providers
   - Implement data classification and appropriate storage selection
   - Add secure deletion and cleanup policies  

3. **Performance Optimization**
   - Implement storage size limits and cleanup strategies
   - Add cache compression for large datasets
   - Optimize I/O operations with batching

4. **Compliance Alignment**
   - Ensure OWASP Mobile Security compliance
   - Implement privacy-by-design principles
   - Add audit logging for sensitive data access

## Next Steps

This assessment provides the foundation for:
- **ADR-002**: Storage Architecture Redesign
- **ADR-003**: Secure Storage Implementation Guide

## References

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [React Native Security Guidelines](https://reactnative.dev/docs/security)
- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)

---

**Date Created**: 2024-08-04  
**Authors**: System Security Assessment  
**Reviewers**: [Pending]  
**Next Review**: 2024-09-04