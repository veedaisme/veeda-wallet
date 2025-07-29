import { create } from 'zustand'

type TabType = 'dashboard' | 'transactions' | 'subscriptions'

interface AppState {
  // Navigation
  activeTab: TabType
  
  // Modals
  isTransactionModalOpen: boolean
  isSubscriptionModalOpen: boolean
  editingTransactionId: string | null
  editingSubscriptionId: string | null
  
  // Loading states
  isRefreshing: boolean
  
  // Error handling
  error: string | null
  
  // Theme
  isDarkMode: boolean
}

interface AppActions {
  // Navigation
  setActiveTab: (tab: TabType) => void
  
  // Modals
  setTransactionModalOpen: (open: boolean) => void
  setSubscriptionModalOpen: (open: boolean) => void
  setEditingTransactionId: (id: string | null) => void
  setEditingSubscriptionId: (id: string | null) => void
  
  // Loading
  setRefreshing: (refreshing: boolean) => void
  
  // Error handling
  setError: (error: string | null) => void
  clearError: () => void
  
  // Theme
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  
  // Reset
  reset: () => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  activeTab: 'dashboard',
  isTransactionModalOpen: false,
  isSubscriptionModalOpen: false,
  editingTransactionId: null,
  editingSubscriptionId: null,
  isRefreshing: false,
  error: null,
  isDarkMode: false,
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  
  // Navigation
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Modals
  setTransactionModalOpen: (open) => set({ 
    isTransactionModalOpen: open,
    editingTransactionId: open ? get().editingTransactionId : null,
  }),
  
  setSubscriptionModalOpen: (open) => set({ 
    isSubscriptionModalOpen: open,
    editingSubscriptionId: open ? get().editingSubscriptionId : null,
  }),
  
  setEditingTransactionId: (id) => set({ editingTransactionId: id }),
  
  setEditingSubscriptionId: (id) => set({ editingSubscriptionId: id }),
  
  // Loading
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  
  // Error handling
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Theme
  toggleDarkMode: () => set({ isDarkMode: !get().isDarkMode }),
  
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),
  
  // Reset
  reset: () => set(initialState),
}))