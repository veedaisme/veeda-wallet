"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { SpendingCard } from "@/components/spending-card";
import ChartModal from '@/components/dashboard/ChartModal';
import { supabase } from "@/lib/supabaseClient";

interface DashboardViewProps {
  userId: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ userId }) => {
  const tDash = useTranslations('dashboard');
  
  const [dashboardData, setDashboardData] = useState({
    spent_today: 0,
    spent_yesterday: 0,
    spent_this_week: 0,
    spent_last_week: 0,
    spent_this_month: 0,
    spent_last_month: 0,
  });

  // Chart modal state
  const [chartModal, setChartModal] = useState<{ open: boolean; type: "week" | "month" | null }>({ open: false, type: null });

  // Ref to prevent redundant dashboard_summary queries
  const dashboardFetchedRef = useRef(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase.rpc('dashboard_summary');
      if (error) {
        console.error("Error fetching dashboard data:", error);
      } else {
        setDashboardData((data && data[0]) ? data[0] : {
          spent_today: 0,
          spent_yesterday: 0,
          spent_this_week: 0,
          spent_last_week: 0,
          spent_this_month: 0,
          spent_last_month: 0,
        });
      }
      dashboardFetchedRef.current = true;
    };

    if (userId && !dashboardFetchedRef.current) {
      fetchDashboardData();
    }
    
    // Reset ref when component unmounts
    return () => {
      dashboardFetchedRef.current = false;
    };
  }, [userId]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SpendingCard
          title={tDash('today')}
          amount={Number(dashboardData.spent_today)}
          previousLabel={tDash('yesterday')}
          previousAmount={Number(dashboardData.spent_yesterday)}
        />
        <SpendingCard
          title={tDash('thisWeek')}
          amount={Number(dashboardData.spent_this_week)}
          previousLabel={tDash('lastWeek')}
          previousAmount={Number(dashboardData.spent_last_week)}
          onClick={() => setChartModal({ open: true, type: "week" })}
        />
        <SpendingCard
          title={tDash('thisMonth')}
          amount={Number(dashboardData.spent_this_month)}
          previousLabel={tDash('lastMonth')}
          previousAmount={Number(dashboardData.spent_last_month)}
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
