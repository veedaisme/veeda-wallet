# Auth System Redesign - Implementation Documentation

## Overview

This document details the complete redesign of the Clair Wallet mobile authentication system, transforming it from a reactive, error-prone setup to a proactive, secure, and elegant solution using modern patterns.

## Previous Issues

### 1. Architecture Problems
- **Infinite Loops**: `useAuth` hook caused endless re-renders due to improper dependency management
- **Dual State Redundancy**: Storing both `user` and `session` created confusion and inconsistency
- **Global Loading States**: Single loading state affected entire app UX
- **No Error Recovery**: Errors handled ad-hoc without proper retry mechanisms

### 2. Security Vulnerabilities
- **No Token Validation**: Stored sessions weren't verified on app start
- **Missing Token Refresh**: No automatic refresh before expiration
- **Unsafe Storage**: Full session object stored in AsyncStorage
- **Stale Session Persistence**: Invalid sessions remained cached indefinitely

### 3. Poor User Experience
- **Stuck Loading Screens**: App would hang on "INITIAL_SESSION" without progression
- **Manual Navigation**: Components manually handled auth redirects
- **No Offline Support**: App broke without network connection
- **Unclear Error States**: Generic error messages without actionable feedback

## New Architecture

### 1. Finite State Machine (`authStateMachine.ts`)

```typescript
type AuthStatus = 
  | 'idle'           // Initial state
  | 'initializing'   // Checking stored tokens
  | 'authenticated'  // Valid session active
  | 'unauthenticated'// No valid session
  | 'refreshing'     // Refreshing expired token
  | 'error'          // Auth error state

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  error: AuthError | null
  lastValidated: number | null
  isInitialized: boolean
}
```

**Benefits:**
- Predictable state transitions prevent infinite loops
- Clear loading states for better UX
- Atomic state updates ensure consistency
- Built-in error recovery mechanisms

### 2. Secure Token Storage (`authStorage.ts`)

```typescript
interface SecureAuthData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
}
```

**Features:**
- Only stores essential auth data (no sensitive user info)
- Token expiration validation with 5-minute buffer
- Automatic cleanup of invalid/expired tokens
- Secure storage in AsyncStorage with proper error handling

### 3. Token Validation & Refresh Service (`authService.ts`)

**Key Methods:**
- `initialize()`: Smart app startup with token validation
- `refreshToken()`: Automatic refresh with deduplication
- `validateStoredSession()`: Server-side session verification
- `checkAndRefreshIfNeeded()`: Background token maintenance

**Benefits:**
- Prevents multiple simultaneous refresh attempts
- Handles network errors gracefully
- Automatic session recovery on app foreground
- Server-side validation ensures security

### 4. Simplified Auth Hook (`useAuthV2.ts`)

```typescript
const { 
  isAuthenticated,
  isLoading,
  user,
  signIn,
  signOut,
  error,
  retry
} = useAuth()
```

**Features:**
- Single source of truth for auth state
- Composable hooks for specific use cases
- Automatic token refresh management
- Clear error handling with retry options

## Implementation Details

### State Transitions

```
idle → initializing → authenticated/unauthenticated
authenticated → refreshing → authenticated/error
error → retry → initializing
```

### Token Refresh Logic

1. **Proactive Refresh**: Checks token 5 minutes before expiration
2. **Background Refresh**: Automatic refresh when app becomes active
3. **Deduplication**: Prevents multiple simultaneous refresh requests
4. **Fallback**: Graceful degradation to login if refresh fails

### Error Handling

```typescript
type AuthErrorType = 'validation' | 'network' | 'auth' | 'token' | 'unknown'

interface AuthError {
  message: string
  code?: string
  type: AuthErrorType
}
```

- **Categorized Errors**: Different handling based on error type
- **Retry Logic**: Network errors can be retried, validation errors cannot
- **User-Friendly Messages**: Clear, actionable error descriptions

## File Structure

```
lib/
├── authStorage.ts      # Secure token storage service
├── authService.ts      # Auth operations & token management
└── supabase.ts         # Supabase client configuration

stores/
└── authStateMachine.ts # Finite state machine for auth state

hooks/
├── useAuth.ts          # Legacy auth hook (deprecated)
└── useAuthV2.ts        # New simplified auth hook

types/
└── auth.ts             # TypeScript definitions

app/
├── _layout.tsx         # Root routing with auth guards
└── (auth)/
    ├── _layout.tsx     # Auth layout with redirects
    ├── login.tsx       # Updated login screen
    └── register.tsx    # Updated register screen
```

## Migration Guide

### 1. Import Changes

```typescript
// Old
import { useAuth } from '@/hooks/useAuth'

// New
import { useAuth } from '@/hooks/useAuthV2'
```

### 2. API Changes

```typescript
// Old
const { loading, initialized, isAuthenticated } = useAuth()

// New
const { isLoading, isInitialized, isAuthenticated } = useAuth()
```

### 3. Error Handling

```typescript
// Old
const { error } = await signIn(credentials)
if (error) {
  Alert.alert('Login Failed', error)
}

// New
const result = await signIn(credentials)
if (!result.success) {
  Alert.alert('Login Failed', result.error?.message || 'Please try again')
}
```

### 4. Loading States

```typescript
// Old - Single global loading
if (loading) return <LoadingSpinner />

// New - Specific loading states
if (isInitializing) return <LoadingSpinner message="Starting up..." />
if (isRefreshing) return <LoadingSpinner message="Refreshing session..." />
```

## Security Improvements

### 1. Token Storage
- **Before**: Full session object with user data in AsyncStorage
- **After**: Only essential tokens with expiration validation

### 2. Session Validation
- **Before**: Trust stored session without verification
- **After**: Server-side validation on app start with automatic refresh

### 3. Token Refresh
- **Before**: Manual refresh only when requests fail
- **After**: Proactive refresh with 5-minute buffer and background checks

### 4. Error Recovery
- **Before**: Manual recovery required after auth errors
- **After**: Automatic retry with intelligent error categorization

## Performance Optimizations

### 1. Reduced Re-renders
- Zustand state machine with selective subscriptions
- Memoized auth actions and derived state
- Optimized component updates with specific selectors

### 2. Background Operations
- Token refresh during app inactive periods
- Automatic cleanup of expired sessions
- Dedupled network requests

### 3. Startup Performance
- Parallel token validation and app initialization
- Smart caching with timestamp validation
- Minimal blocking operations during startup

## Testing Strategy

### 1. Unit Tests
- State machine transitions
- Token storage operations
- Error handling scenarios
- Token refresh logic

### 2. Integration Tests
- Auth flow end-to-end
- Network failure scenarios
- Session expiration handling
- App state transitions

### 3. Manual Testing Scenarios
- Fresh app install
- Token expiration during use
- Network connectivity issues
- App backgrounding/foregrounding

## Future Enhancements

### Phase 2: Enhanced Security
- Biometric authentication
- Device fingerprinting
- Session management dashboard
- Multi-device session handling

### Phase 3: Advanced Features
- Social login integration
- Two-factor authentication
- Passwordless authentication
- Advanced security monitoring

## Troubleshooting

### Common Issues

1. **Infinite Loading**: Check token expiration and network connectivity
2. **Login Failures**: Verify Supabase configuration and user credentials
3. **Token Refresh Errors**: Check refresh token validity and network status
4. **Navigation Issues**: Ensure auth state is properly initialized

### Debug Tools

```typescript
// Enable auth debugging
if (__DEV__) {
  // State machine transitions are automatically logged
  // Check console for: [AuthStateMachine] idle → initializing
}
```

### Error Recovery

```typescript
const { retry, canRetry, error } = useAuth()

if (error && canRetry) {
  // Show retry button
  <Button onPress={retry} title="Retry" />
}
```

## Conclusion

The new auth system provides:
- **Reliability**: No more infinite loops or stuck states
- **Security**: Proper token management and validation
- **Performance**: Optimized rendering and background operations
- **Developer Experience**: Clean APIs and comprehensive error handling
- **User Experience**: Clear loading states and smooth transitions

This foundation supports future enhancements while maintaining simplicity and reliability for everyday use.