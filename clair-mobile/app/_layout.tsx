import 'react-native-url-polyfill/auto'
import React from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/useColorScheme'
import { useAuth } from '@/hooks/useAuthV2'
import { queryClient, persister } from '@/lib/queryClient'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function RootLayoutNav() {
  // ALWAYS call all hooks at the top level - never conditionally
  const colorScheme = useColorScheme()
  const { 
    isInitialized, 
    isLoading, 
    isAuthenticated, 
    status,
    hasError,
    error,
    retry,
    canRetry 
  } = useAuth()

  // Calculate what to render - but don't return early
  const shouldShowLoading = !isInitialized || isLoading
  const shouldShowError = hasError && canRetry
  
  const loadingMessage = status === 'initializing' ? 'Starting up...' : 
                        status === 'refreshing' ? 'Refreshing session...' : 
                        'Loading...'

  // Build content based on state - no early returns
  let content: React.ReactNode

  if (shouldShowLoading) {
    content = <LoadingSpinner message={loadingMessage} overlay />
  } else if (shouldShowError) {
    content = <LoadingSpinner message="Retrying connection..." overlay />
  } else {
    // Main app content
    content = (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modals/add-transaction" options={{ 
                presentation: 'modal',
                title: 'Add Transaction',
                headerShown: true,
              }} />
              <Stack.Screen name="modals/edit-transaction" options={{ 
                presentation: 'modal',
                title: 'Edit Transaction',
                headerShown: true,
              }} />
              <Stack.Screen name="modals/add-subscription" options={{ 
                presentation: 'modal',
                title: 'Add Subscription',
                headerShown: true,
              }} />
            </>
          ) : (
            <Stack.Screen name="(auth)" />
          )}
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    )
  }

  // Single return point - hooks always called in same order
  return content
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <RootLayoutNav />
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  )
}
