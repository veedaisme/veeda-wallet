/**
 * Utility functions for dashboard calculations and data normalization
 */

export interface DashboardData {
  spent_today: number;
  spent_yesterday: number;
  spent_this_week: number;
  spent_last_week: number;
  spent_this_month: number;
  spent_last_month: number;
}

export interface DashboardCalculations {
  todayChange: number;
  weekChange: number;
  monthChange: number;
}

/**
 * Calculate percentage change between current and previous values
 * Handles edge cases like division by zero
 */
export const calculateChangePercentage = (current: number, previous: number): number => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  
  return ((currentValue - previousValue) / previousValue) * 100;
};

/**
 * Normalize raw dashboard data from API to ensure type safety
 * Converts strings to numbers and handles null/undefined values
 */
export const normalizeDashboardData = (rawData: any): DashboardData => {
  if (!rawData) {
    return {
      spent_today: 0,
      spent_yesterday: 0,
      spent_this_week: 0,
      spent_last_week: 0,
      spent_this_month: 0,
      spent_last_month: 0,
    };
  }

  return {
    spent_today: Number(rawData.spent_today) || 0,
    spent_yesterday: Number(rawData.spent_yesterday) || 0,
    spent_this_week: Number(rawData.spent_this_week) || 0,
    spent_last_week: Number(rawData.spent_last_week) || 0,
    spent_this_month: Number(rawData.spent_this_month) || 0,
    spent_last_month: Number(rawData.spent_last_month) || 0,
  };
};

/**
 * Calculate all percentage changes for dashboard periods
 */
export const calculateDashboardChanges = (data: DashboardData): DashboardCalculations => {
  return {
    todayChange: calculateChangePercentage(data.spent_today, data.spent_yesterday),
    weekChange: calculateChangePercentage(data.spent_this_week, data.spent_last_week),
    monthChange: calculateChangePercentage(data.spent_this_month, data.spent_last_month),
  };
};

/**
 * Default dashboard data for fallback scenarios
 */
export const getDefaultDashboardData = (): DashboardData => ({
  spent_today: 0,
  spent_yesterday: 0,
  spent_this_week: 0,
  spent_last_week: 0,
  spent_this_month: 0,
  spent_last_month: 0,
});