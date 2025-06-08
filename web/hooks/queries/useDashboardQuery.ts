import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidationKeys } from '@/lib/queryKeys';
import { 
  fetchDashboardSummary, 
  fetchWeeklySpendingForChart, 
  fetchMonthlySpendingForChart,
  type DashboardSummaryData,
  type ChartDataPoint 
} from '@/lib/dashboardService';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: async () => {
      const { data, error } = await fetchDashboardSummary();
      if (error) {
        throw error;
      }
      return data || {
        spent_today: 0,
        spent_yesterday: 0,
        spent_this_week: 0,
        spent_last_week: 0,
        spent_this_month: 0,
        spent_last_month: 0,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useWeeklyChartData(
  userId: string | null, 
  dateRange: { start: string; end: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.dashboardChart('week', userId || '', dateRange),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await fetchWeeklySpendingForChart(userId, dateRange);
      if (error) throw error;
      return data;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useMonthlyChartData(
  userId: string | null, 
  dateRange: { start: string; end: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.dashboardChart('month', userId || '', dateRange),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await fetchMonthlySpendingForChart(userId, dateRange);
      if (error) throw error;
      return data;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({
        queryKey: invalidationKeys.allDashboard(),
      });
      
      await queryClient.refetchQueries({
        queryKey: queryKeys.dashboardSummary(),
      });
    },
    onSuccess: () => {
      console.log('Dashboard data refreshed successfully');
    },
    onError: (error) => {
      console.error('Failed to refresh dashboard data:', error);
    },
  });
}
