import { useState, useEffect, useCallback } from 'react';
import { type ProjectedSubscription, type SubscriptionSummary } from '@/models/subscription'; // Assuming model exists

interface UseSubscriptionsReturn {
  subscriptions: ProjectedSubscription[];
  summary: SubscriptionSummary | null;
  loading: boolean;
  error: string | null;
  refetchSubscriptions: () => void;
}

export const useSubscriptions = (userId?: string | null): UseSubscriptionsReturn => {
  console.log('Hook: Initializing subscriptions fetch.');
  const [subscriptions, setSubscriptions] = useState<ProjectedSubscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionsData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    console.log('Hook: Fetching subscriptions for user:', userId);
    // TODO: Implement actual data fetching logic (e.g., from subscriptionService.ts)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscriptions([]); // Placeholder
      setSummary(null); // Placeholder
    } catch (e: any) {
      setError(e.message || 'Failed to fetch subscriptions');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSubscriptionsData();
  }, [fetchSubscriptionsData]);

  return {
    subscriptions,
    summary,
    loading,
    error,
    refetchSubscriptions: fetchSubscriptionsData,
  };
};
