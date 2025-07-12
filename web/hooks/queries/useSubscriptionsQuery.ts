import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchConsolidatedSubscriptionData,
  addSubscription,
  updateSubscription,
  deleteSubscription
} from '@/lib/subscriptionService';
import {
  Subscription,
  SubscriptionData,
  ProjectedSubscription,
  SubscriptionSummary
} from '@/models/subscription';
import { createMutationHandlers, mutationConfigs } from '@/lib/mutationHelpers';

// Re-export types for convenience
export type { Subscription, SubscriptionData, ProjectedSubscription, SubscriptionSummary };

// Basic subscriptions query using consolidated data
export function useSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.subscriptionsList(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await fetchConsolidatedSubscriptionData(userId);
      if (error) throw error;
      if (!data) throw new Error("No data returned from server");

      return data.subscriptions || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Consolidated subscription data query (subscriptions + projected + summary)
export function useConsolidatedSubscriptionData(
  userId: string | null,
  projectionEndDate?: string
) {
  return useQuery({
    queryKey: queryKeys.subscriptionsConsolidated(userId || '', projectionEndDate),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await fetchConsolidatedSubscriptionData(userId, projectionEndDate);
      if (error) throw error;
      if (!data) throw new Error("No data returned from server");

      return {
        subscriptions: data.subscriptions || [],
        projectedSubscriptions: data.projected_subscriptions || [],
        summary: data.subscription_summary || null,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Add subscription mutation
export function useAddSubscription() {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = createMutationHandlers(queryClient, mutationConfigs.addSubscription);

  return useMutation({
    mutationFn: async ({
      subscriptionData,
      userId
    }: {
      subscriptionData: SubscriptionData;
      userId: string;
    }) => {
      const { data, error } = await addSubscription(subscriptionData, userId);
      if (error) throw error;
      return data;
    },
    onSuccess,
    onError,
  });
}

// Update subscription mutation
export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = createMutationHandlers(queryClient, mutationConfigs.updateSubscription);

  return useMutation({
    mutationFn: async ({
      subscriptionData,
      userId
    }: {
      subscriptionData: SubscriptionData;
      userId: string;
    }) => {
      const { data, error } = await updateSubscription(subscriptionData, userId);
      if (error) throw error;
      return data;
    },
    onSuccess,
    onError,
  });
}

// Delete subscription mutation
export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = createMutationHandlers(queryClient, mutationConfigs.deleteSubscription);

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      userId
    }: {
      subscriptionId: string;
      userId: string;
    }) => {
      const { data, error } = await deleteSubscription(subscriptionId, userId);
      if (error) throw error;
      return data;
    },
    onSuccess,
    onError,
  });
}
