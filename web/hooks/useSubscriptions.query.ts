import { useQuery } from '@tanstack/react-query';
import { type ProjectedSubscription, type SubscriptionSummary } from '@/models/subscription';
import { subscriptionService } from '@/lib/subscriptionService';
import { queryKeys } from '@/lib/query-keys';

interface UseSubscriptionsReturn {
  subscriptions: ProjectedSubscription[];
  summary: SubscriptionSummary | null;
  loading: boolean;
  error: string | null;
  refetchSubscriptions: () => void;
}

export const useSubscriptions = (userId?: string | null): UseSubscriptionsReturn => {
  // Query for projected subscriptions
  const {
    data: subscriptions = [],
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptionsData
  } = useQuery({
    queryKey: queryKeys.subscriptions.projected(userId),
    queryFn: () => subscriptionService.getProjectedSubscriptions(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for subscription summary
  const {
    data: summary = null,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummaryData
  } = useQuery({
    queryKey: queryKeys.subscriptions.summary(userId),
    queryFn: () => subscriptionService.getSubscriptionSummary(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Combined loading state
  const loading = subscriptionsLoading || summaryLoading;

  // Combined error state
  const error = subscriptionsError?.message || summaryError?.message || null;

  // Combined refetch function
  const refetchSubscriptions = () => {
    refetchSubscriptionsData();
    refetchSummaryData();
  };

  return {
    subscriptions,
    summary,
    loading,
    error,
    refetchSubscriptions,
  };
};