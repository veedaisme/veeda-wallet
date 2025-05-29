import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UiState {
  // Global loading state
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Modal states
  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (open: boolean) => void;
  
  isSubscriptionModalOpen: boolean;
  setSubscriptionModalOpen: (open: boolean) => void;
  
  isEditTransactionModalOpen: boolean;
  setEditTransactionModalOpen: (open: boolean) => void;
  
  // Active tab state
  activeTab: 'dashboard' | 'transactions' | 'subscriptions';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'subscriptions') => void;
  
  // Profile menu state
  isProfileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  
  // Sidebar state (for mobile)
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Toast notifications
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | 'warning' | null;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>()((
  devtools(
    (set) => ({
      // Global loading state
      isGlobalLoading: false,
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }, false, 'setGlobalLoading'),
      
      // Modal states
      isTransactionModalOpen: false,
      setTransactionModalOpen: (open) => set({ isTransactionModalOpen: open }, false, 'setTransactionModalOpen'),
      
      isSubscriptionModalOpen: false,
      setSubscriptionModalOpen: (open) => set({ isSubscriptionModalOpen: open }, false, 'setSubscriptionModalOpen'),
      
      isEditTransactionModalOpen: false,
      setEditTransactionModalOpen: (open) => set({ isEditTransactionModalOpen: open }, false, 'setEditTransactionModalOpen'),
      
      // Active tab state
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }, false, 'setActiveTab'),
      
      // Profile menu state
      isProfileMenuOpen: false,
      setProfileMenuOpen: (open) => set({ isProfileMenuOpen: open }, false, 'setProfileMenuOpen'),
      
      // Sidebar state
      isSidebarOpen: false,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }, false, 'setSidebarOpen'),
      
      // Toast notifications
      toastMessage: null,
      toastType: null,
      showToast: (message, type) => set({ toastMessage: message, toastType: type }, false, 'showToast'),
      hideToast: () => set({ toastMessage: null, toastType: null }, false, 'hideToast'),
    }),
    {
      name: 'ui-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
));