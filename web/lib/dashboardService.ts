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

export const fetchDashboardSummary = async (): Promise<{ data: DashboardSummaryData | null, error: Error | null }> => {
  console.log('Service: Fetching dashboard summary');
  const { data, error } = await supabase.rpc('dashboard_summary');
  if (error) {
    console.error('Error fetching dashboard summary:', error);
    return { data: null, error };
  }
  // The RPC returns an array, we expect a single object or null/empty array
  return { data: data && data.length > 0 ? data[0] : null, error: null };
};

// New function signature for React Query compatibility
export const getDashboardSummary = async (userId: string): Promise<DashboardSummaryData> => {
  console.log('Service: Fetching dashboard summary for user:', userId);
  const { data, error } = await supabase.rpc('dashboard_summary', { p_user_id: userId });
  if (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
  // The RPC returns an array, we expect a single object or null/empty array
  return data && data.length > 0 ? data[0] : null;
};

// Export as default object for easier importing
export const dashboardService = {
  getDashboardSummary,
  fetchDashboardSummary,
  fetchWeeklySpendingForChart,
  fetchMonthlySpendingForChart,
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

// Placeholder for fetching weekly spending for chart
export const fetchWeeklySpendingForChart = async (userId: string, dateRange: { start: string, end: string }): Promise<ChartDataResponse> => {
  console.log('Service: Fetching weekly spending for chart. User:', userId, 'Range:', dateRange);
  // TODO: Implement actual Supabase call for weekly chart data
  return { data: [], error: null }; 
};

// Placeholder for fetching monthly spending for chart
export const fetchMonthlySpendingForChart = async (userId: string, dateRange: { start: string, end: string }): Promise<ChartDataResponse> => {
  console.log('Service: Fetching monthly spending for chart. User:', userId, 'Range:', dateRange);
  // TODO: Implement actual Supabase call for monthly chart data
  return { data: [], error: null };
};
