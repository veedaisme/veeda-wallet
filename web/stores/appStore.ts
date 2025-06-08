import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Transaction } from '@/models/transaction';

export type TabType = "dashboard" | "transactions" | "subscriptions";

interface AppState {
  activeTab: TabType;
  profileMenuOpen: boolean;
  isTransactionModalOpen: boolean;
  isSubscriptionModalOpen: boolean;
  loading: boolean;
  error: string | null;

  // Transaction-specific UI state
  selectedTransaction: Transaction | null;
  isEditTransactionModalOpen: boolean;

  setActiveTab: (tab: TabType) => void;
  setProfileMenuOpen: (open: boolean) => void;
  toggleProfileMenu: () => void;
  setTransactionModalOpen: (open: boolean) => void;
  setSubscriptionModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Transaction-specific actions
  setSelectedTransaction: (transaction: Transaction | null) => void;
  setEditTransactionModalOpen: (open: boolean) => void;
  openEditTransactionModal: (transaction: Transaction) => void;
  closeEditTransactionModal: () => void;

  reset: () => void;
}

const initialState = {
  activeTab: "dashboard" as TabType,
  profileMenuOpen: false,
  isTransactionModalOpen: false,
  isSubscriptionModalOpen: false,
  loading: false,
  error: null,

  // Transaction-specific UI state
  selectedTransaction: null,
  isEditTransactionModalOpen: false,
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

      // Transaction-specific actions
      setSelectedTransaction: (transaction: Transaction | null) =>
        set({ selectedTransaction: transaction }, false, 'setSelectedTransaction'),

      setEditTransactionModalOpen: (open: boolean) =>
        set({ isEditTransactionModalOpen: open }, false, 'setEditTransactionModalOpen'),

      openEditTransactionModal: (transaction: Transaction) =>
        set({
          selectedTransaction: transaction,
          isEditTransactionModalOpen: true
        }, false, 'openEditTransactionModal'),

      closeEditTransactionModal: () =>
        set({
          selectedTransaction: null,
          isEditTransactionModalOpen: false
        }, false, 'closeEditTransactionModal'),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    { name: 'app-store' }
  )
);
