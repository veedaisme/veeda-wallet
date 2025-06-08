"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { Clock, CreditCard, Plus, User, LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { LanguagePillToggle } from '@/components/ui/language-pill-toggle';
import { Modal } from "@/components/ui/modal";
import { TransactionForm, type TransactionData } from "@/components/transaction-form";
import { SubscriptionForm } from "@/components/subscription-form";
import { type SubscriptionData } from "@/models/subscription";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAppStore } from "@/stores/appStore";
import { useAddTransaction } from "@/hooks/queries/useTransactionsQuery";
import { useAddSubscription } from "@/hooks/queries/useSubscriptionsQuery";

import DashboardView from "@/components/dashboard/DashboardView";
import TransactionsView from "@/components/transactions/TransactionsView";
import SubscriptionsView from "@/components/subscriptions/SubscriptionsView";

type TabType = "dashboard" | "transactions" | "subscriptions";

export default function Home() {
  const tApp = useTranslations('app');
  const tTrans = useTranslations('transactions');
  const tSub = useTranslations('subscriptions');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;

  // Use Zustand store for state management
  const {
    activeTab,
    profileMenuOpen,
    isTransactionModalOpen,
    isSubscriptionModalOpen,
    loading,
    error,
    setActiveTab,
    setProfileMenuOpen,
    setTransactionModalOpen,
    setSubscriptionModalOpen,
    setLoading,
    setError,
    clearError,
  } = useAppStore();

  const { user } = useUser();
  const router = useRouter();

  // React Query mutations
  const addTransactionMutation = useAddTransaction();
  const addSubscriptionMutation = useAddSubscription();

  // Set initial tab from URL params
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab, setActiveTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileMenuOpen(false);
    router.replace("/auth");
  };

  const handleAddTransaction = async (data: TransactionData) => {
    if (!user) {
      setError("You must be logged in to add a transaction.");
      return;
    }

    clearError();

    try {
      await addTransactionMutation.mutateAsync({
        transactionData: data,
        userId: user.id,
      });

      setTransactionModalOpen(false);
    } catch (error: any) {
      setError(error.message || 'Failed to add transaction');
    }
  };

  const handleAddSubscription = async (data: SubscriptionData) => {
    if (!user) {
      setError("You must be logged in to add a subscription.");
      return;
    }

    clearError();

    try {
      await addSubscriptionMutation.mutateAsync({
        subscriptionData: data,
        userId: user.id,
      });

      setSubscriptionModalOpen(false);
    } catch (error: any) {
      setError(error.message || 'Failed to add subscription');
    }
  };

  return (
    <ProtectedLayout>
      <div className="w-full min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="p-6 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{tApp('title')}</h1>
          </div>
          <div className="flex flex-row items-center gap-4">
            <LanguagePillToggle />
            <div className="relative">
              <button
                className="rounded-full bg-gray-200 p-2"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-label="Open profile menu"
              >
                <User className="h-5 w-5 text-gray-500" />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {tApp('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden">
          {activeTab === "dashboard" ? (
            <DashboardView userId={user?.id ?? null} />
          ) : activeTab === "transactions" ? (
            <TransactionsView userId={user?.id ?? null} />
          ) : (
            <SubscriptionsView userId={user?.id ?? null} />
          )}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => activeTab === "subscriptions" ? setSubscriptionModalOpen(true) : setTransactionModalOpen(true)}
          className="fixed bottom-24 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-50"
          aria-label={activeTab === "subscriptions" ? tSub('add') : tTrans('add')}
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 w-full border-t border-gray-200 p-4 flex justify-around items-center bg-white z-20">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center ${activeTab === "dashboard" ? "text-black" : "text-gray-400"}`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-xs mt-1">{tApp('dashboard')}</span>
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex flex-col items-center ${activeTab === "subscriptions" ? "text-black" : "text-gray-400"}`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">{tSub('title')}</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex flex-col items-center ${activeTab === "transactions" ? "text-black" : "text-gray-400"}`}
          >
            <Clock className="h-6 w-6" />
            <span className="text-xs mt-1">{tTrans('tabTitle')}</span>
          </button>
        </nav>

        {/* Add Transaction Modal */}
        <Modal isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)} title={tTrans('add')}>
          <TransactionForm
            onSubmit={handleAddTransaction}
            onCancel={() => setTransactionModalOpen(false)}
            loading={addTransactionMutation.isPending}
          />
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </Modal>

        {/* Add Subscription Modal */}
        <Modal isOpen={isSubscriptionModalOpen} onClose={() => setSubscriptionModalOpen(false)} title={tSub('addSubscription')}>
          <SubscriptionForm
            onSubmit={handleAddSubscription}
            onCancel={() => setSubscriptionModalOpen(false)}
            loading={addSubscriptionMutation.isPending}
          />
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
