import 'react-native-url-polyfill/auto'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/useColorScheme'
import { useAuth } from '@/hooks/useAuth'
import { queryClient, persister } from '@/lib/queryClient'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  const { initialized, loading } = useAuth()

  if (!initialized || loading) {
    return <LoadingSpinner message="Loading..." overlay />
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
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
