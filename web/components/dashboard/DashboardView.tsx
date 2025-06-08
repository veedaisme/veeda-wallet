"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SpendingCard } from "@/components/spending-card";
import ChartModal from '@/components/dashboard/ChartModal';
import { useDashboardSummary } from "@/hooks/queries/useDashboardQuery";

interface DashboardViewProps {
  userId: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ userId }) => {
  const tDash = useTranslations('dashboard');

  // Use React Query for dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    isError
  } = useDashboardSummary(userId);

  // Chart modal state
  const [chartModal, setChartModal] = useState<{ open: boolean; type: "week" | "month" | null }>({ open: false, type: null });

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load dashboard data</p>
          <p className="text-sm text-gray-500">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Ensure we have data with fallback values
  const data = dashboardData || {
    spent_today: 0,
    spent_yesterday: 0,
    spent_this_week: 0,
    spent_last_week: 0,
    spent_this_month: 0,
    spent_last_month: 0,
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpendingCard
          title={tDash('today')}
          amount={Number(data.spent_today)}
          previousLabel={tDash('yesterday')}
          previousAmount={Number(data.spent_yesterday)}
        />
        <SpendingCard
          title={tDash('thisWeek')}
          amount={Number(data.spent_this_week)}
          previousLabel={tDash('lastWeek')}
          previousAmount={Number(data.spent_last_week)}
          onClick={() => setChartModal({ open: true, type: "week" })}
        />
        <SpendingCard
          title={tDash('thisMonth')}
          amount={Number(data.spent_this_month)}
          previousLabel={tDash('lastMonth')}
          previousAmount={Number(data.spent_last_month)}
          onClick={() => setChartModal({ open: true, type: "month" })}
        />
      </div>

      {/* Chart Modal */}
      <ChartModal
        open={chartModal.open}
        onClose={() => setChartModal({ open: false, type: null })}
        type={chartModal.type}
        userId={userId}
      />
    </>
  );
};

export default DashboardView;
