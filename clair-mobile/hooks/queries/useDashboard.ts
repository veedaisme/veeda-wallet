import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfToday, startOfYesterday, startOfWeek, startOfMonth, endOfToday, endOfYesterday, endOfWeek, endOfMonth, subWeeks, subMonths } from 'date-fns'

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: (userId: string) => [...dashboardKeys.all, 'analytics', userId] as const,
  spending: (userId: string) => [...dashboardKeys.all, 'spending', userId] as const,
  categories: (userId: string) => [...dashboardKeys.all, 'categories', userId] as const,
}

// Types
export interface SpendingAnalytics {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  weeklyComparison: number // percentage change
  monthlyComparison: number // percentage change
}

export interface CategorySpending {
  category: string
  amount: number
  percentage: number
}

export interface DashboardData {
  analytics: SpendingAnalytics
  categoryBreakdown: CategorySpending[]
  recentTransactions: any[] // Using Transaction type would be better
}

// Fetch spending analytics
const fetchSpendingAnalytics = async (userId: string): Promise<SpendingAnalytics> => {
  const today = startOfToday()
  const yesterday = startOfYesterday()
  const thisWeekStart = startOfWeek(today)
  const lastWeekStart = startOfWeek(subWeeks(today, 1))
  const thisMonthStart = startOfMonth(today)
  const lastMonthStart = startOfMonth(subMonths(today, 1))

  // Fetch spending data in parallel
  const [
    todayData,
    yesterdayData,
    thisWeekData,
    lastWeekData,
    thisMonthData,
    lastMonthData,
  ] = await Promise.all([
    // Today
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', today.toISOString())
      .lte('date', endOfToday().toISOString()),
    
    // Yesterday
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', yesterday.toISOString())
      .lte('date', endOfYesterday().toISOString()),
    
    // This week
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', thisWeekStart.toISOString())
      .lte('date', endOfWeek(today).toISOString()),
    
    // Last week
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', lastWeekStart.toISOString())
      .lte('date', endOfWeek(subWeeks(today, 1)).toISOString()),
    
    // This month
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', thisMonthStart.toISOString())
      .lte('date', endOfMonth(today).toISOString()),
    
    // Last month
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', lastMonthStart.toISOString())
      .lte('date', endOfMonth(subMonths(today, 1)).toISOString()),
  ])

  // Calculate totals
  const todayTotal = todayData.data?.reduce((sum, t) => sum + t.amount, 0) || 0
  const yesterdayTotal = yesterdayData.data?.reduce((sum, t) => sum + t.amount, 0) || 0
  const thisWeekTotal = thisWeekData.data?.reduce((sum, t) => sum + t.amount, 0) || 0
  const lastWeekTotal = lastWeekData.data?.reduce((sum, t) => sum + t.amount, 0) || 0
  const thisMonthTotal = thisMonthData.data?.reduce((sum, t) => sum + t.amount, 0) || 0
  const lastMonthTotal = lastMonthData.data?.reduce((sum, t) => sum + t.amount, 0) || 0

  // Calculate percentage changes
  const weeklyComparison = lastWeekTotal === 0 ? 0 : 
    ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
  
  const monthlyComparison = lastMonthTotal === 0 ? 0 : 
    ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

  return {
    today: todayTotal,
    yesterday: yesterdayTotal,
    thisWeek: thisWeekTotal,
    lastWeek: lastWeekTotal,
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    weeklyComparison,
    monthlyComparison,
  }
}

// Fetch category breakdown
const fetchCategoryBreakdown = async (userId: string): Promise<CategorySpending[]> => {
  const thisMonth = startOfMonth(new Date())
  
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('date', thisMonth.toISOString())
    .lte('date', endOfMonth(new Date()).toISOString())

  if (error) throw error

  // Group by category and calculate totals
  const categoryTotals = (data || []).reduce((acc, transaction) => {
    const category = transaction.category
    acc[category] = (acc[category] || 0) + transaction.amount
    return acc
  }, {} as Record<string, number>)

  // Calculate total for percentages
  const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

  // Convert to array with percentages
  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total === 0 ? 0 : (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// Fetch complete dashboard data
const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  const [analytics, categoryBreakdown] = await Promise.all([
    fetchSpendingAnalytics(userId),
    fetchCategoryBreakdown(userId),
  ])

  // Fetch recent transactions (last 5)
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5)

  return {
    analytics,
    categoryBreakdown,
    recentTransactions: recentTransactions || [],
  }
}

// Hooks
export const useSpendingAnalytics = (userId: string | null) => {
  return useQuery({
    queryKey: dashboardKeys.analytics(userId!),
    queryFn: () => fetchSpendingAnalytics(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

export const useCategoryBreakdown = (userId: string | null) => {
  return useQuery({
    queryKey: dashboardKeys.categories(userId!),
    queryFn: () => fetchCategoryBreakdown(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useDashboardData = (userId: string | null) => {
  return useQuery({
    queryKey: dashboardKeys.spending(userId!),
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}