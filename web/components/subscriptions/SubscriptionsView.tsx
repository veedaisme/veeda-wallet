import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SubscriptionScheduleList } from "@/components/subscriptionScheduleList";
import { useConsolidatedSubscriptionData } from '@/hooks/queries/useSubscriptionsQuery';
import { DashboardCardSkeleton } from '@/components/ui/skeletons';

interface SubscriptionsViewProps {
  userId: string | null;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ userId }) => {
  const tSub = useTranslations('subscriptions');
  const router = useRouter();

  // Note: SubscriptionsView is now read-only.
  // Users should navigate to /subscriptions page to manage subscriptions.

  // Calculate projection end date (12 months from now)
  const projectionEndDate = React.useMemo(() => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);
    return endDate.toISOString().split('T')[0]; // YYYY-MM-DD
  }, []);

  // React Query hooks
  const {
    data: consolidatedData,
    isLoading,
    isError,
    error,
  } = useConsolidatedSubscriptionData(userId, projectionEndDate);

  // Extract data from consolidated response
  const subscriptions = consolidatedData?.subscriptions || [];
  const projectedSubscriptions = consolidatedData?.projectedSubscriptions || [];
  const subscriptionSummary = consolidatedData?.summary || null;

  return (
    <div className="flex flex-col space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">{tSub('title')}</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
            {error?.message || 'An error occurred while loading subscription data'}
          </div>
        ) : subscriptionSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">{tSub('monthlySpending')}</div>
              <div className="text-2xl font-bold">Rp {subscriptionSummary.total_monthly_recurring.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">{tSub('yearlySpending')}</div>
              <div className="text-2xl font-bold">Rp {(subscriptionSummary.total_monthly_recurring * 12).toLocaleString()}</div>
            </div>
            <div
              className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                // Navigate to subscriptions page with clean parameter handling
                const currentUrl = new URL(window.location.href);
                const locale = currentUrl.pathname.split('/')[1];
                const subscriptionsUrl = locale && (locale === 'en' || locale === 'id')
                  ? `/${locale}/subscriptions?from=subscriptions`
                  : '/subscriptions?from=subscriptions';
                router.push(subscriptionsUrl);
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">{tSub('activeSubscriptions')}</div>
                  <div className="text-2xl font-bold">{subscriptionSummary.subscription_count}</div>
                </div>
                <div className="text-gray-400 flex items-center">
                  <span className="text-xs mr-1">{tSub('viewAll')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p>{tSub('noSubscriptionsYet')}</p>
          </div>
        )}
      </div>
      
      {/* Subscriptions List */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{tSub('upcomingPayments')}</h3>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
        ) : subscriptions.length > 0 ? (
          <SubscriptionScheduleList
            subscriptions={projectedSubscriptions}
            summary={subscriptionSummary}
          />
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p>{tSub('noUpcomingPayments')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsView;