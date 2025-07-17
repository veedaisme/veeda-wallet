import { supabase } from './supabaseClient';

// Define types for service function responses if not already defined elsewhere
// e.g., for dashboard_summary RPC response
export interface DashboardSummaryData {
  spent_today: number;
  spent_yesterday: number;
  spent_this_week: number;
  spent_last_week: number;
  spent_this_month: number;
  spent_last_month: number;
}

export const fetchDashboardSummary = async (userId: string): Promise<{ data: DashboardSummaryData | null, error: Error | null }> => {
  const { data, error } = await supabase.rpc('dashboard_summary_by_user_id', { user_id: userId });
  if (error) {
    console.error('Error fetching dashboard summary:', error);
    return { data: null, error };
  }
  // The RPC returns an array, we expect a single object or null/empty array
  return { data: data && data.length > 0 ? data[0] : null, error: null };
};

// Type for chart data points
export interface ChartDataPoint {
  date: string;
  amount: number;
}

// Type for chart data response
export interface ChartDataResponse {
  data: ChartDataPoint[];
  error: Error | null;
}

// Fetching weekly spending for chart
export const fetchWeeklySpendingForChart = async (userId: string, dateRange: { start: string, end: string }): Promise<ChartDataResponse> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching weekly spending chart data:', error);
    return { data: [], error };
  }

  // Group transactions by date and sum amounts
  const chartData: ChartDataPoint[] = [];
  const dailyTotals: { [date: string]: number } = {};
  
  data?.forEach(transaction => {
    const date = transaction.date.split('T')[0]; // Extract date part
    dailyTotals[date] = (dailyTotals[date] || 0) + transaction.amount;
  });
  
  // Convert to chart data format
  Object.entries(dailyTotals).forEach(([date, amount]) => {
    chartData.push({ date, amount });
  });
  
  return { data: chartData, error: null };
};

// Fetching monthly spending for chart
export const fetchMonthlySpendingForChart = async (userId: string, dateRange: { start: string, end: string }): Promise<ChartDataResponse> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching monthly spending chart data:', error);
    return { data: [], error };
  }

  // Group transactions by month and sum amounts
  const chartData: ChartDataPoint[] = [];
  const monthlyTotals: { [month: string]: number } = {};
  
  data?.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + transaction.amount;
  });
  
  // Convert to chart data format
  Object.entries(monthlyTotals).forEach(([month, amount]) => {
    chartData.push({ date: month, amount });
  });
  
  return { data: chartData, error: null };
};
