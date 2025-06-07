export interface DashboardSummary {
  spent_today: number;
  spent_yesterday: number;
  spent_this_week: number;
  spent_last_week: number;
  spent_this_month: number;
  spent_last_month: number;
}

export interface ChartDataPoint {
  date: string;
  amount: number;
}

export interface ChartDataResponse {
  data: ChartDataPoint[];
  period: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
}
