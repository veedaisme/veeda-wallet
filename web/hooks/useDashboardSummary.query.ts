import { useQuery } from '@tanstack/react-query';
import { getChange } from '@/utils/calculationUtils';
import { dashboardService } from '@/lib/dashboardService';
import { queryKeys } from '@/lib/query-keys';

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
  const {
    data: rawData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.dashboard.summary(userId),
    queryFn: () => dashboardService.getDashboardSummary(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Transform data to include calculated changes (preserving original logic)
  const dashboardData: DashboardData | null = rawData ? {
    ...rawData,
    todayChange: getChange(rawData.spent_today, rawData.spent_yesterday),
    weekChange: getChange(rawData.spent_this_week, rawData.spent_last_week),
    monthChange: getChange(rawData.spent_this_month, rawData.spent_last_month),
  } : null;

  return {
    dashboardData,
    loading: isLoading,
    error: error?.message || null,
    refetchDashboardSummary: () => {
      refetch();
    },
  };
};