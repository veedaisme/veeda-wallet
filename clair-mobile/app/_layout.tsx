import 'react-native-url-polyfill/auto'
import React from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { I18nextProvider } from 'react-i18next'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/useColorScheme'
import { useAuth } from '@/hooks/useAuthV2'
import { queryClient, persister } from '@/lib/queryClient'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { initI18n } from '@/src/i18n'
import i18n from '@/src/i18n'
import { AuthDataMigration } from '@/lib/storage/AuthDataMigration'

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
  const [i18nInitialized, setI18nInitialized] = useState(false)

  useEffect(() => {
    // Perform auth data migration on app startup
    const initializeApp = async () => {
      try {
        // Migrate auth data from AsyncStorage to SecureStore if needed
        await AuthDataMigration.migrateAuthData()
        
        // Initialize i18n
        await initI18n()
        setI18nInitialized(true)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setI18nInitialized(true) // Still proceed to avoid infinite loading
      }
    }

    initializeApp()
  }, [])

  if (!loaded || !i18nInitialized) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <RootLayoutNav />
        </PersistQueryClientProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  )
}
