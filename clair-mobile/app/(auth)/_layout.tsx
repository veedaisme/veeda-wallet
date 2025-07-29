import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/hooks/useAuthV2'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AuthLayout() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth()

  if (!isInitialized || isLoading) {
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