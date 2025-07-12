import { useMemo } from 'react';
import { useDashboardSummary } from '@/hooks/queries/useDashboardQuery';
import { 
  normalizeDashboardData,
  calculateDashboardChanges,
  type DashboardData,
  type DashboardCalculations
} from '@/utils/dashboardCalculations';

export interface DashboardAnalytics {
  /** Normalized dashboard data with safe number conversion */
  data: DashboardData;
  /** Calculated percentage changes for all periods */
  calculations: DashboardCalculations;
  /** Loading state from TanStack Query */
  isLoading: boolean;
  /** Error state from TanStack Query */
  isError: boolean;
  /** Error object from TanStack Query */
  error: Error | null;
}

/**
 * Custom hook that provides dashboard data with memoized calculations
 * Follows modern TanStack Query patterns with derived state management
 * 
 * @returns DashboardAnalytics object with data, calculations, and query states
 * 
 * @example
 * ```tsx
 * const { data, calculations, isLoading, isError } = useDashboardAnalytics();
 * 
 * if (isLoading) return <Loading />;
 * if (isError) return <Error />;
 * 
 * return (
 *   <SpendingCard
 *     amount={data.spent_today}
 *     change={calculations.todayChange}
 *     previousAmount={data.spent_yesterday}
 *   />
 * );
 * ```
 */
export function useDashboardAnalytics(): DashboardAnalytics {
  // Get raw data from TanStack Query
  const {
    data: rawData,
    isLoading,
    isError,
    error
  } = useDashboardSummary();

  // Memoized data normalization - only recalculates when rawData changes
  const data = useMemo(() => {
    return normalizeDashboardData(rawData);
  }, [rawData]);

  // Memoized calculations - only recalculates when normalized data changes
  const calculations = useMemo(() => {
    return calculateDashboardChanges(data);
  }, [data]);

  return {
    data,
    calculations,
    isLoading,
    isError,
    error,
  };
}