"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Clock, CreditCard, Plus, User, ChevronUp, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useTranslations } from 'next-intl';
import { LanguagePillToggle } from '@/components/ui/language-pill-toggle';

import { SpendingCard } from "@/components/spending-card";
import { Modal } from "@/components/ui/modal";
import { TransactionForm, type TransactionData } from "@/components/transaction-form";
import { Transaction } from "@/models/transaction";
// import {
//   TransactionSummary,
//   CategoryPercentage,
//   DailySpending,
//   WeeklySpending,
//   MonthlySpending,
//   DateRange,
//   SortField,
//   SortDirection,
// } from "@/models/transaction";
import { TransactionsList } from "@/components/transactions-list";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { EditTransactionModal } from "@/components/edit-transaction-modal";
import { 
  addSubscription, 
  updateSubscription, 
  deleteSubscription,
  fetchSubscriptionSummary,
  fetchProjectedSubscriptions,
} from "@/lib/subscriptionService";
import { type SubscriptionData, type SubscriptionSummary, ProjectedSubscription } from "@/models/subscription";
import { SubscriptionsList } from "@/components/subscriptions-list";
import { SubscriptionForm } from '@/components/subscription-form';

type TabType = "dashboard" | "transactions" | "subscriptions";
type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";

import ProtectedLayout from "@/components/ProtectedLayout";

import { formatIDR } from "@/utils/currency";

export default function Home() {
  const tApp = useTranslations('app');
  const tDash = useTranslations('dashboard');
  const tTrans = useTranslations('transactions');
  const tSub = useTranslations('subscriptions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [hasMore, setHasMore] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Edit transaction state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [dashboardData, setDashboardData] = useState({
    spent_today: 0,
    spent_yesterday: 0,
    spent_this_week: 0,
    spent_last_week: 0,
    spent_this_month: 0,
    spent_last_month: 0,
  });

  // Chart modal state
  const [chartModal, setChartModal] = useState<{ open: boolean; type: "week" | "month" | null }>({ open: false, type: null });

  // Ref to prevent redundant dashboard_summary queries
  const dashboardFetchedRef = useRef(false);

  // Sorting and searching state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Infinite scroll ref
  const observer = useRef<IntersectionObserver | null>(null);

  const [subscriptions, setSubscriptions] = useState<ProjectedSubscription[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data, error } = await supabase.rpc('dashboard_summary');
      if (error) {
        console.error("Error fetching dashboard data:", error);
      } else {
        setDashboardData((data && data[0]) ? data[0] : {
          spent_today: 0,
          spent_yesterday: 0,
          spent_this_week: 0,
          spent_last_week: 0,
          spent_this_month: 0,
          spent_last_month: 0,
        });
      }
      dashboardFetchedRef.current = true;
    };

    if (activeTab === "dashboard" && user && !dashboardFetchedRef.current) {
      fetchDashboardData();
    }
  }, [activeTab, user]);

  // Reset the dashboardFetchedRef when leaving the dashboard tab
  useEffect(() => {
    if (activeTab !== "dashboard") {
      dashboardFetchedRef.current = false;
    }
  }, [activeTab]);

  // Fetch paginated transactions with sorting and searching
  const fetchTransactions = async (reset = false) => {
    if (!user) return;
    setLoadingTransactions(true);
    const from = (reset ? 0 : page * pageSize);
    const to = from + pageSize - 1;
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order(sortField, { ascending: sortDirection === "asc" });

    if (searchTerm) {
      query = query.ilike("note", `%${searchTerm}%`);
    }

    const { data, error } = await query.range(from, to);

    if (error) {
      setError(error.message);
    } else {
      if (reset) {
        setTransactions(data);
        setPage(0);
      } else {
        setTransactions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === pageSize);
      if (!reset) setPage(prev => prev + 1);
    }
    setLoadingTransactions(false);
  };

  // Reset and fetch when sort/search changes or tab/user changes
  useEffect(() => {
    if (activeTab === "transactions" && user) {
      fetchTransactions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, sortField, sortDirection, searchTerm]);

  const loadProjectedSubscriptions = async () => {
    if (!user) return;
    setLoadingSubscriptions(true);
    setError(null);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // Project 12 months into the future
    const projectionEndDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const { data: projectedSubs, error: projectedSubsError } = await fetchProjectedSubscriptions(user.id, projectionEndDateStr);
      if (projectedSubsError) throw projectedSubsError;
      setSubscriptions(projectedSubs ?? []);

      const { data, error } = await fetchSubscriptionSummary(user.id);
      if (error) {
        console.error("Error fetching subscription summary:", error);
        setSubscriptionSummary(null);
      } else {
        setSubscriptionSummary(data);
      }

    } catch (e: unknown) {
      console.error("Failed to load subscription data:", e);
      if (e instanceof Error) {
        setError(e.message || "Failed to load subscription data");
      } else {
        setError("An unknown error occurred while loading subscription data");
      }
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "subscriptions" && user) {
      loadProjectedSubscriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // Infinite scroll observer
  const lastTransactionRef = useCallback((node: HTMLLIElement | null) => {
    if (loadingTransactions) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingTransactions, hasMore]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleAddTransaction = async (data: TransactionData) => {
    setLoading(true);
    setError(null);

    if (!user) {
      setError("You must be logged in to add a transaction.");
      setLoading(false);
      return;
    }

    // Set the time to noon to avoid timezone issues
    const dateWithoutTime = new Date(data.date);
    dateWithoutTime.setHours(12, 0, 0, 0);

    const newTransaction = {
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: dateWithoutTime.toISOString(),
      user_id: user.id,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert([newTransaction])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setTransactions([inserted, ...transactions]);
    setIsModalOpen(false);
    setLoading(false);
  };
  
  const handleEditTransaction = async (data: TransactionData) => {
    if (!user || !data.id) return;
    
    // Set the time to noon to avoid timezone issues
    const dateWithoutTime = new Date(data.date);
    dateWithoutTime.setHours(12, 0, 0, 0);
    
    const updatedTransaction = {
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: dateWithoutTime.toISOString(),
    };
    
    const { error: updateError } = await supabase
      .from("transactions")
      .update(updatedTransaction)
      .eq('id', data.id)
      .select()
      .single();
      
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    // Reset the dashboard data flag to force a refresh when switching to dashboard
    dashboardFetchedRef.current = false;
    
    // If we're on the dashboard tab, refresh the dashboard data immediately
    if (activeTab === "dashboard") {
      const { data, error } = await supabase.rpc('dashboard_summary');
      if (error) {
        console.error("Error fetching dashboard data:", error);
      } else {
        setDashboardData((data && data[0]) ? data[0] : {
          spent_today: 0,
          spent_yesterday: 0,
          spent_this_week: 0,
          spent_last_week: 0,
          spent_this_month: 0,
          spent_last_month: 0,
        });
      }
    }
    
    // Refresh the transaction list to ensure correct sorting after date changes
    setPage(0); // Reset to first page
    fetchTransactions(true); // Refresh the transaction list
    
    return;
  };
  
  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleSaveSubscription = async (data: SubscriptionData) => {
    if (!user) return;
    try {
      setLoadingSubscriptions(true);
      if (data.id) {
        await updateSubscription(data, user.id); 
        // toast({ title: t('subscription_updated_successfully') });
      } else {
        // This case should ideally be handled by onSubscriptionAdded if it's a new subscription
        // For now, assuming onUpdate is primarily for existing ones from SubscriptionsList
        await addSubscription(data, user.id);
        // toast({ title: t('subscription_added_successfully') });
      }
      loadProjectedSubscriptions();
    } catch (error) {
      console.error('Error saving subscription:', error);
      // toast({ title: t('error_saving_subscription'), variant: 'destructive' });
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleConfirmDeleteSubscription = async (subscription: ProjectedSubscription) => {
    if (!user || !subscription) return;
    try {
      setLoadingSubscriptions(true);
      await deleteSubscription(subscription.id, user.id);
      setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
      // Re-fetch summary after deleting
      const { data: summaryData, error: summaryError } = await fetchSubscriptionSummary(user.id);
      if (summaryError) throw summaryError;
      setSubscriptionSummary(summaryData);
    } catch (error) {
      console.error("Error deleting subscription:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileMenuOpen(false);
    router.replace("/auth");
  };

  const openAddSubscriptionModal = () => setIsAddSubscriptionModalOpen(true);

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
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SpendingCard
                  title={tDash('today')}
                  amount={Number(dashboardData.spent_today)}
                  previousLabel={tDash('yesterday')}
                  previousAmount={Number(dashboardData.spent_yesterday)}
                />
                <SpendingCard
                  title={tDash('thisWeek')}
                  amount={Number(dashboardData.spent_this_week)}
                  previousLabel={tDash('lastWeek')}
                  previousAmount={Number(dashboardData.spent_last_week)}
                />
                <SpendingCard
                  title={tDash('thisMonth')}
                  amount={Number(dashboardData.spent_this_month)}
                  previousLabel={tDash('lastMonth')}
                  previousAmount={Number(dashboardData.spent_last_month)}
                />
              </div>
            </>
          ) : activeTab === "transactions" ? (
            <>
              {/* Search and sort controls */}
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <input
                  type="text"
                  placeholder={tTrans('search')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 pl-3 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSort("date")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      sortField === "date" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tTrans('date')}
                    {sortField === "date" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                  <button
                    onClick={() => handleSort("amount")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      sortField === "amount" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tTrans('amount')}
                    {sortField === "amount" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                </div>
              </div>
              <TransactionsList 
                transactions={transactions} 
                lastTransactionRef={lastTransactionRef} 
                onEditTransaction={openEditModal}
              />
              {loadingTransactions && (
                <div className="flex justify-center mt-4">
                  <span className="text-gray-500">Loading...</span>
                </div>
              )}
            </>
          ) : (
            user && (
              <SubscriptionsList
                subscriptions={subscriptions}
                summary={subscriptionSummary}
                onUpdate={handleSaveSubscription}
                onDelete={handleConfirmDeleteSubscription}
                loading={loadingSubscriptions}
                openAddSubscriptionModal={openAddSubscriptionModal}
              />
            )
          )}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => {
            if (activeTab === 'subscriptions') {
              openAddSubscriptionModal();
            } else { // dashboard or transactions
              setIsModalOpen(true);
            }
          }}
          className="fixed bottom-24 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-50"
          aria-label={activeTab === 'subscriptions' ? tSub('addSubscription') : tTrans('add')}
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
            <span className="text-xs mt-1">{tDash('title')}</span>
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
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={tTrans('add')}>
          <TransactionForm onSubmit={handleAddTransaction} onCancel={() => setIsModalOpen(false)} loading={loading} />
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </Modal>
        
        {/* Edit Transaction Modal */}
        <EditTransactionModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          transaction={selectedTransaction}
          onUpdateTransaction={handleEditTransaction}
        />

        {/* Add Subscription Modal */}
        <Modal isOpen={isAddSubscriptionModalOpen} onClose={() => setIsAddSubscriptionModalOpen(false)} title={tSub('addSubscription')}>
          <SubscriptionForm 
            onSubmit={async (formData) => { 
              await handleSaveSubscription(formData); 
              setIsAddSubscriptionModalOpen(false); 
            }}
            onCancel={() => setIsAddSubscriptionModalOpen(false)} 
            loading={loadingSubscriptions} 
          />
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
