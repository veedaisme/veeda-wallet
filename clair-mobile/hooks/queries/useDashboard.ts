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
  // Enhanced analytics
  todayComparison: number // today vs yesterday percentage
  averageDailySpending: number // current month average
  highestSpendingDay: number
  lowestSpendingDay: number
  spendingTrend: 'increasing' | 'decreasing' | 'stable'
  projectedMonthlySpending: number
}

export interface TimeSeriesData {
  date: string
  amount: number
}

export interface EnhancedDashboardData extends DashboardData {
  weeklyData: TimeSeriesData[]
  monthlyData: TimeSeriesData[]
  topCategories: CategorySpending[]
  spendingInsights: {
    message: string
    type: 'warning' | 'success' | 'info'
  }[]
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

  // Calculate percentage changes with proper zero handling
  const weeklyComparison = 
    lastWeekTotal === 0 && thisWeekTotal > 0 ? 100 :
    lastWeekTotal === 0 ? 0 : 
    ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
  
  const monthlyComparison = 
    lastMonthTotal === 0 && thisMonthTotal > 0 ? 100 :
    lastMonthTotal === 0 ? 0 : 
    ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

  const todayComparison = 
    yesterdayTotal === 0 && todayTotal > 0 ? 100 :
    yesterdayTotal === 0 ? 0 :
    ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100

  // Enhanced analytics calculations
  const daysInMonth = new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() + 1, 0).getDate()
  const daysPassed = new Date().getDate()
  const averageDailySpending = daysPassed > 0 ? thisMonthTotal / daysPassed : 0
  const projectedMonthlySpending = averageDailySpending * daysInMonth

  // Fetch daily spending for this month to calculate highs/lows and trends
  const { data: dailySpending } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .gte('date', thisMonthStart.toISOString())
    .lte('date', endOfMonth(today).toISOString())
    .order('date')

  // Group by day and calculate daily totals
  const dailyTotals = (dailySpending || []).reduce((acc, transaction) => {
    const day = new Date(transaction.date).toDateString()
    acc[day] = (acc[day] || 0) + transaction.amount
    return acc
  }, {} as Record<string, number>)

  const dailyAmounts = Object.values(dailyTotals)
  const highestSpendingDay = dailyAmounts.length > 0 ? Math.max(...dailyAmounts) : 0
  const lowestSpendingDay = dailyAmounts.length > 0 ? Math.min(...dailyAmounts) : 0

  // Simple trend calculation based on recent vs older data
  const midPoint = Math.floor(dailyAmounts.length / 2)
  const recentAvg = dailyAmounts.slice(midPoint).reduce((sum, val) => sum + val, 0) / Math.max(1, dailyAmounts.length - midPoint)
  const olderAvg = dailyAmounts.slice(0, midPoint).reduce((sum, val) => sum + val, 0) / Math.max(1, midPoint)
  
  let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (recentAvg > olderAvg * 1.1) spendingTrend = 'increasing'
  else if (recentAvg < olderAvg * 0.9) spendingTrend = 'decreasing'

  return {
    today: todayTotal,
    yesterday: yesterdayTotal,
    thisWeek: thisWeekTotal,
    lastWeek: lastWeekTotal,
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    weeklyComparison,
    monthlyComparison,
    todayComparison,
    averageDailySpending,
    highestSpendingDay,
    lowestSpendingDay,
    spendingTrend,
    projectedMonthlySpending,
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

// Fetch time series data
const fetchWeeklyData = async (userId: string): Promise<TimeSeriesData[]> => {
  const thisWeekStart = startOfWeek(new Date())
  const { data } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .gte('date', thisWeekStart.toISOString())
    .order('date')

  // Group by day
  const dailyTotals = (data || []).reduce((acc, transaction) => {
    const day = new Date(transaction.date).toISOString().split('T')[0]
    acc[day] = (acc[day] || 0) + transaction.amount
    return acc
  }, {} as Record<string, number>)

  return Object.entries(dailyTotals).map(([date, amount]) => ({ date, amount }))
}

const fetchMonthlyData = async (userId: string): Promise<TimeSeriesData[]> => {
  const thisMonthStart = startOfMonth(new Date())
  const { data } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .gte('date', thisMonthStart.toISOString())
    .order('date')

  // Group by week
  const weeklyTotals = (data || []).reduce((acc, transaction) => {
    const week = `Week ${Math.ceil(new Date(transaction.date).getDate() / 7)}`
    acc[week] = (acc[week] || 0) + transaction.amount
    return acc
  }, {} as Record<string, number>)

  return Object.entries(weeklyTotals).map(([date, amount]) => ({ date, amount }))
}

// Generate spending insights
const generateSpendingInsights = (analytics: SpendingAnalytics, categoryBreakdown: CategorySpending[]) => {
  const insights: { message: string; type: 'warning' | 'success' | 'info' }[] = []

  // Trend insights
  if (analytics.spendingTrend === 'increasing') {
    insights.push({
      message: `Your spending trend is increasing. You're on track to spend ${(analytics.projectedMonthlySpending / 1000000).toFixed(1)}M this month.`,
      type: 'warning'
    })
  } else if (analytics.spendingTrend === 'decreasing') {
    insights.push({
      message: 'Great job! Your spending trend is decreasing compared to earlier this month.',
      type: 'success'
    })
  }

  // Daily comparison
  if (analytics.todayComparison > 50) {
    insights.push({
      message: `Today's spending is ${analytics.todayComparison.toFixed(0)}% higher than yesterday.`,
      type: 'warning'
    })
  } else if (analytics.todayComparison < -20) {
    insights.push({
      message: `You've reduced spending by ${Math.abs(analytics.todayComparison).toFixed(0)}% compared to yesterday!`,
      type: 'success'
    })
  }

  // Category insights
  const topCategory = categoryBreakdown[0]
  if (topCategory && topCategory.percentage > 40) {
    insights.push({
      message: `${topCategory.category} represents ${topCategory.percentage.toFixed(0)}% of your spending this month.`,
      type: 'info'
    })
  }

  return insights
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

// Fetch enhanced dashboard data
const fetchEnhancedDashboardData = async (userId: string): Promise<EnhancedDashboardData> => {
  const [analytics, categoryBreakdown, weeklyData, monthlyData] = await Promise.all([
    fetchSpendingAnalytics(userId),
    fetchCategoryBreakdown(userId),
    fetchWeeklyData(userId),
    fetchMonthlyData(userId),
  ])

  // Fetch recent transactions (last 5)
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5)

  const spendingInsights = generateSpendingInsights(analytics, categoryBreakdown)
  const topCategories = categoryBreakdown.slice(0, 3)

  return {
    analytics,
    categoryBreakdown,
    recentTransactions: recentTransactions || [],
    weeklyData,
    monthlyData,
    topCategories,
    spendingInsights,
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

export const useEnhancedDashboardData = (userId: string | null) => {
  return useQuery({
    queryKey: [...dashboardKeys.spending(userId!), 'enhanced'],
    queryFn: () => fetchEnhancedDashboardData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}