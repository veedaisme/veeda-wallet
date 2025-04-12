"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Clock, CreditCard, Plus, User, ChevronUp, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { SpendingCard } from "@/components/spending-card";
import { Modal } from "@/components/ui/modal";
import { TransactionForm, type TransactionData } from "@/components/transaction-form";
import { Transaction } from "@/models/transaction";
import { TransactionsList } from "@/components/transactions-list";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

type TabType = "dashboard" | "transactions";
type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";

import ProtectedLayout from "@/components/ProtectedLayout";

import { ChartContainer } from "@/components/ui/chart";
import * as Recharts from "recharts";
import { formatIDR } from "@/utils/currency";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    // eslint-disable-next-line
  }, [activeTab, user, sortField, sortDirection, searchTerm]);

  // Infinite scroll: observe last transaction
  const lastTransactionRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (loadingTransactions) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          fetchTransactions();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingTransactions, hasMore, sortField, sortDirection, searchTerm, user, page]
  );

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

    const newTransaction = {
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

  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileMenuOpen(false);
    router.replace("/auth");
  };

  return (
    <ProtectedLayout>
      <div className="w-full min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="p-6 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">My Accounts</h1>
            <ChevronDown className="h-6 w-6" />
          </div>
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
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden">
          {activeTab === "dashboard" ? (
            <>
              <ChartModalDashboard
                open={chartModal.open}
                type={chartModal.type}
                onClose={() => setChartModal({ open: false, type: null })}
                userId={user?.id}
              />
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
                  onClick={() => setChartModal({ open: true, type: "week" })}
                />
                <SpendingCard
                  title="Spent This Month"
                  amount={Number(dashboardData.spent_this_month)}
                  change={-41}
                  previousLabel="Last Month"
                  previousAmount={Number(dashboardData.spent_last_month)}
                  onClick={() => setChartModal({ open: true, type: "month" })}
                />
              </div>
            </>
          ) : (
            <>
              {/* Search and sort controls */}
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <input
                  type="text"
                  placeholder="Search transactions..."
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
                    Date
                    {sortField === "date" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                  <button
                    onClick={() => handleSort("amount")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      sortField === "amount" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Amount
                    {sortField === "amount" && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                </div>
              </div>
              <TransactionsList transactions={transactions} lastTransactionRef={lastTransactionRef} />
              {loadingTransactions && (
                <div className="flex justify-center mt-4">
                  <span className="text-gray-500">Loading...</span>
                </div>
              )}
            </>
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

// ChartModalDashboard component
import { format, startOfWeek, addDays, startOfMonth, addWeeks, endOfWeek, endOfMonth, subWeeks, subMonths, isSameMonth, isSameWeek } from "date-fns";

type ChartModalDashboardProps = {
  open: boolean;
  type: "week" | "month" | null;
  onClose: () => void;
  userId?: string | null;
};

function getWeekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEE"));
}

function getMonthWeeks(start: Date, end: Date) {
  const weeks = [];
  let current = startOfWeek(start, { weekStartsOn: 1 });
  let idx = 1;
  while (current < end) {
    weeks.push({ label: `Week ${idx}`, start: current, end: endOfWeek(current, { weekStartsOn: 1 }) });
    current = addWeeks(current, 1);
    idx++;
  }
  return weeks;
}

function ChartModalDashboard({ open, type, onClose, userId }: ChartModalDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !type || !userId) return;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      const now = new Date();
      if (type === "week") {
        // Current week: Mon–Sun this week
        const startCurrent = startOfWeek(now, { weekStartsOn: 1 });
        const endCurrent = addDays(startCurrent, 6);
        // Previous week: Mon–Sun last week
        const startPrev = addDays(startCurrent, -7);
        const endPrev = addDays(startPrev, 6);

        // Fetch both weeks
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startPrev.toISOString())
          .lte("date", endCurrent.toISOString());

        if (error) {
          setError("Failed to fetch transactions");
          setLoading(false);
          return;
        }

        // Aggregate by day for both weeks
        const days = getWeekDays(startCurrent);
        const prevDays = getWeekDays(startPrev);
        const currentWeek: { [key: string]: number } = {};
        const previousWeek: { [key: string]: number } = {};
        days.forEach(day => (currentWeek[day] = 0));
        prevDays.forEach(day => (previousWeek[day] = 0));

        (data as Transaction[]).forEach(tx => {
          const d = new Date(tx.date);
          if (d >= startCurrent && d <= endCurrent) {
            const label = format(d, "EEE");
            if (label in currentWeek) currentWeek[label] += tx.amount;
          } else if (d >= startPrev && d <= endPrev) {
            const label = format(d, "EEE");
            if (label in previousWeek) previousWeek[label] += tx.amount;
          }
        });

        // Compose chart data
        setChartData(
          days.map((day, i) => ({
            day,
            "Current Week": currentWeek[day],
            "Previous Week": previousWeek[day],
          }))
        );
      } else if (type === "month") {
        // Current month: weeks in this month
        const startCurrent = startOfMonth(now);
        const endCurrent = endOfMonth(now);
        // Previous month: weeks in previous month
        const prevMonth = subMonths(now, 1);
        const startPrev = startOfMonth(prevMonth);
        const endPrev = endOfMonth(prevMonth);

        // Fetch both months
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startPrev.toISOString())
          .lte("date", endCurrent.toISOString());

        if (error) {
          setError("Failed to fetch transactions");
          setLoading(false);
          return;
        }

        // Get week ranges for both months
        const currentWeeks = getMonthWeeks(startCurrent, endCurrent);
        const prevWeeks = getMonthWeeks(startPrev, endPrev);

        // Aggregate by week for both months
        const currentMonth: { [key: string]: number } = {};
        const previousMonth: { [key: string]: number } = {};
        currentWeeks.forEach(w => (currentMonth[w.label] = 0));
        prevWeeks.forEach(w => (previousMonth[w.label] = 0));

        (data as Transaction[]).forEach(tx => {
          const d = new Date(tx.date);
          // Current month
          currentWeeks.forEach((w, idx) => {
            if (d >= w.start && d <= w.end && isSameMonth(d, startCurrent)) {
              currentMonth[w.label] += tx.amount;
            }
          });
          // Previous month
          prevWeeks.forEach((w, idx) => {
            if (d >= w.start && d <= w.end && isSameMonth(d, startPrev)) {
              previousMonth[w.label] += tx.amount;
            }
          });
        });

        // Compose chart data (align week labels)
        const allLabels = Array.from(new Set([...currentWeeks.map(w => w.label), ...prevWeeks.map(w => w.label)]));
        setChartData(
          allLabels.map(label => ({
            week: label,
            "Current Month": currentMonth[label] || 0,
            "Previous Month": previousMonth[label] || 0,
          }))
        );
      }
      setLoading(false);
    };

    fetchData();
  }, [open, type, userId]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        type === "week"
          ? "Spending Comparison: This Week vs Last Week"
          : type === "month"
          ? "Spending Comparison: This Month vs Last Month"
          : ""
      }
    >
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-gray-400">Loading chart...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : type === "week" && chartData.length ? (
        <ChartContainer
          config={{
            "Current Week": { label: "Current Week", color: "#6366f1" },
            "Previous Week": { label: "Previous Week", color: "#a3a3a3" },
          }}
          className="w-full h-64"
        >
          <Recharts.LineChart data={chartData}>
            <Recharts.XAxis dataKey="day" />
            <Recharts.YAxis tickFormatter={(value) => formatIDR(value)} />
            <Recharts.Tooltip
              formatter={(value: number) => formatIDR(value)}
            />
            <Recharts.Legend />
            <Recharts.Line type="monotone" dataKey="Current Week" stroke="#6366f1" strokeWidth={2} dot />
            <Recharts.Line type="monotone" dataKey="Previous Week" stroke="#a3a3a3" strokeWidth={2} dot />
          </Recharts.LineChart>
        </ChartContainer>
      ) : type === "month" && chartData.length ? (
        <ChartContainer
          config={{
            "Current Month": { label: "Current Month", color: "#6366f1" },
            "Previous Month": { label: "Previous Month", color: "#a3a3a3" },
          }}
          className="w-full h-64"
        >
          <Recharts.LineChart data={chartData}>
            <Recharts.XAxis dataKey="week" />
            <Recharts.YAxis tickFormatter={(value) => formatIDR(value)} />
            <Recharts.Tooltip
              formatter={(value: number) => formatIDR(value)}
            />
            <Recharts.Legend />
            <Recharts.Line type="monotone" dataKey="Current Month" stroke="#6366f1" strokeWidth={2} dot />
            <Recharts.Line type="monotone" dataKey="Previous Month" stroke="#a3a3a3" strokeWidth={2} dot />
          </Recharts.LineChart>
        </ChartContainer>
      ) : (
        <div className="text-gray-400">No data available</div>
      )}
    </Modal>
  );
}
