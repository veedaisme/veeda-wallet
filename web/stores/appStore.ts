import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TabType = "dashboard" | "transactions" | "subscriptions";

interface AppState {
  activeTab: TabType;
  profileMenuOpen: boolean;
  isTransactionModalOpen: boolean;
  isSubscriptionModalOpen: boolean;
  loading: boolean;
  error: string | null;
  
  setActiveTab: (tab: TabType) => void;
  setProfileMenuOpen: (open: boolean) => void;
  toggleProfileMenu: () => void;
  setTransactionModalOpen: (open: boolean) => void;
  setSubscriptionModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  activeTab: "dashboard" as TabType,
  profileMenuOpen: false,
  isTransactionModalOpen: false,
  isSubscriptionModalOpen: false,
  loading: false,
  error: null,
};

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setActiveTab: (tab: TabType) => 
        set({ activeTab: tab }, false, 'setActiveTab'),
      
      setProfileMenuOpen: (open: boolean) => 
        set({ profileMenuOpen: open }, false, 'setProfileMenuOpen'),
      
      toggleProfileMenu: () => 
        set((state) => ({ profileMenuOpen: !state.profileMenuOpen }), false, 'toggleProfileMenu'),
      
      setTransactionModalOpen: (open: boolean) => 
        set({ isTransactionModalOpen: open }, false, 'setTransactionModalOpen'),
      
      setSubscriptionModalOpen: (open: boolean) => 
        set({ isSubscriptionModalOpen: open }, false, 'setSubscriptionModalOpen'),
      
      setLoading: (loading: boolean) => 
        set({ loading }, false, 'setLoading'),
      
      setError: (error: string | null) => 
        set({ error }, false, 'setError'),
      
      clearError: () => 
        set({ error: null }, false, 'clearError'),
      
      reset: () => 
        set(initialState, false, 'reset'),
    }),
    { name: 'app-store' }
  )
);
