"use client"

import { useState, useEffect } from "react";
import { ChevronDown, Clock, CreditCard, Plus, User } from "lucide-react";

import { SpendingCard } from "@/components/spending-card";
import { Modal } from "@/components/ui/modal";
import { TransactionForm, type TransactionData } from "@/components/transaction-form";
import { Transaction } from "@/models/transaction";
import { TransactionsList } from "@/components/transactions-list";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

type TabType = "dashboard" | "transactions";

import ProtectedLayout from "@/components/ProtectedLayout";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({
    spent_today: 0,
    spent_yesterday: 0,
    spent_this_week: 0,
    spent_last_week: 0,
    spent_this_month: 0,
    spent_last_month: 0,
  });

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
    };

    fetchDashboardData();
  }, [user]);

  const handleAddTransaction = async (data: TransactionData) => {
    setLoading(true);
    setError(null);

    if (!user) {
      setError("You must be logged in to add a transaction.");
      setLoading(false);
      return;
    }

    const newTransaction = {
      id: "", // Placeholder, will be replaced with the actual ID from Supabase
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: new Date().toISOString(),
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

  return (
    <ProtectedLayout>
      <div className="w-full min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">My Accounts</h1>
            <ChevronDown className="h-6 w-6" />
          </div>
          <button className="rounded-full bg-gray-200 p-2">
            <User className="h-5 w-5 text-gray-500" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden">
          {activeTab === "dashboard" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SpendingCard
                title="Spent Today"
                amount={Number(dashboardData.spent_today)}
                change={-11}
                previousLabel="Yesterday"
                previousAmount={Number(dashboardData.spent_yesterday)}
              />
              <SpendingCard
                title="Spent This Week"
                amount={Number(dashboardData.spent_this_week)}
                change={-18}
                previousLabel="Last Week"
                previousAmount={Number(dashboardData.spent_last_week)}
              />
              <SpendingCard
                title="Spent This Month"
                amount={Number(dashboardData.spent_this_month)}
                change={-41}
                previousLabel="Last Month"
                previousAmount={Number(dashboardData.spent_last_month)}
              />
            </div>
          ) : (
            <TransactionsList transactions={transactions} />
          )}
        </main>

        {/* Floating Action Button */}
        <div className="fixed bottom-24 right-6 z-30">
          <button className="bg-black text-white rounded-full p-4 shadow-lg" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 w-full border-t border-gray-200 p-4 flex justify-around items-center bg-white z-20">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center ${activeTab === "dashboard" ? "text-black" : "text-gray-400"}`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex flex-col items-center ${activeTab === "transactions" ? "text-black" : "text-gray-400"}`}
          >
            <Clock className="h-6 w-6" />
            <span className="text-xs mt-1">Transactions</span>
          </button>
        </nav>

        {/* Transaction Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
          <TransactionForm onSubmit={handleAddTransaction} onCancel={() => setIsModalOpen(false)} loading={loading} />
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
