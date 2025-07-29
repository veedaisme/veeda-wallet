import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AuthLayout() {
  const { isAuthenticated, loading, initialized } = useAuth()

  if (!initialized || loading) {
    return <LoadingSpinner message="Loading..." overlay />
  }

  // If user is authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />
  }

  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Welcome Back',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
    </Stack>
  )
}