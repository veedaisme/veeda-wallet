import { QueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client'

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Create persister for AsyncStorage
export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'CLAIR_WALLET_CACHE',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})