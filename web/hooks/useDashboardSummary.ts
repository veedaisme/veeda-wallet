import { useState, useEffect, useCallback } from 'react';
import { getChange } from '@/utils/calculationUtils';

// Define types for dashboard data and return type of the hook
interface DashboardData {
  spent_today: number;
  spent_yesterday: number;
  spent_this_week: number;
  spent_last_week: number;
  spent_this_month: number;
  spent_last_month: number;
  todayChange?: number;
  weekChange?: number;
  monthChange?: number;
}

interface UseDashboardSummaryReturn {
  dashboardData: DashboardData | null;
  // chartData: any; // Define chart data type later
  loading: boolean;
  error: string | null;
  refetchDashboardSummary: () => void;
}

export const useDashboardSummary = (userId?: string | null): UseDashboardSummaryReturn => {
  console.log('Hook: Initializing dashboard summary fetch.');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // TODO: Implement actual data fetching logic (e.g., from dashboardService.ts)
    console.log('Hook: Fetching dashboard summary for user:', userId);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const rawData = {
        spent_today: 50000, // Example data
        spent_yesterday: 75000,
        spent_this_week: 350000,
        spent_last_week: 300000,
        spent_this_month: 1200000,
        spent_last_month: 1500000,
      };
      setDashboardData({
        ...rawData,
        todayChange: getChange(rawData.spent_today, rawData.spent_yesterday),
        weekChange: getChange(rawData.spent_this_week, rawData.spent_last_week),
        monthChange: getChange(rawData.spent_this_month, rawData.spent_last_month),
      });
    } catch (e: any) {
      setError(e.message || 'Failed to fetch dashboard summary');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refetchDashboardSummary: fetchDashboardData,
  };
};
