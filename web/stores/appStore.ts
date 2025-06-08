import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Transaction } from '@/models/transaction';
import { Subscription, SubscriptionData } from '@/models/subscription';

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

  // Subscription-specific UI state
  selectedSubscription: Subscription | null;
  editingSubscriptionData: SubscriptionData | null;
  isDeleteSubscriptionModalOpen: boolean;
  subscriptionToDelete: Subscription | null;

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

  // Subscription-specific actions
  setSelectedSubscription: (subscription: Subscription | null) => void;
  setEditingSubscriptionData: (data: SubscriptionData | null) => void;
  setDeleteSubscriptionModalOpen: (open: boolean) => void;
  setSubscriptionToDelete: (subscription: Subscription | null) => void;
  openEditSubscriptionModal: (subscription: Subscription) => void;
  openDeleteSubscriptionModal: (subscription: Subscription) => void;
  closeSubscriptionModal: () => void;
  closeDeleteSubscriptionModal: () => void;

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

  // Subscription-specific UI state
  selectedSubscription: null,
  editingSubscriptionData: null,
  isDeleteSubscriptionModalOpen: false,
  subscriptionToDelete: null,
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

      // Subscription-specific actions
      setSelectedSubscription: (subscription: Subscription | null) =>
        set({ selectedSubscription: subscription }, false, 'setSelectedSubscription'),

      setEditingSubscriptionData: (data: SubscriptionData | null) =>
        set({ editingSubscriptionData: data }, false, 'setEditingSubscriptionData'),

      setDeleteSubscriptionModalOpen: (open: boolean) =>
        set({ isDeleteSubscriptionModalOpen: open }, false, 'setDeleteSubscriptionModalOpen'),

      setSubscriptionToDelete: (subscription: Subscription | null) =>
        set({ subscriptionToDelete: subscription }, false, 'setSubscriptionToDelete'),

      openEditSubscriptionModal: (subscription: Subscription) => {
        const subscriptionData: SubscriptionData = {
          id: subscription.id,
          provider_name: subscription.provider_name,
          amount: subscription.amount,
          currency: subscription.currency,
          frequency: subscription.frequency,
          payment_date: new Date(subscription.payment_date)
        };
        set({
          selectedSubscription: subscription,
          editingSubscriptionData: subscriptionData,
          isSubscriptionModalOpen: true
        }, false, 'openEditSubscriptionModal');
      },

      openDeleteSubscriptionModal: (subscription: Subscription) =>
        set({
          subscriptionToDelete: subscription,
          isDeleteSubscriptionModalOpen: true
        }, false, 'openDeleteSubscriptionModal'),

      closeSubscriptionModal: () =>
        set({
          selectedSubscription: null,
          editingSubscriptionData: null,
          isSubscriptionModalOpen: false
        }, false, 'closeSubscriptionModal'),

      closeDeleteSubscriptionModal: () =>
        set({
          subscriptionToDelete: null,
          isDeleteSubscriptionModalOpen: false
        }, false, 'closeDeleteSubscriptionModal'),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    { name: 'app-store' }
  )
);
