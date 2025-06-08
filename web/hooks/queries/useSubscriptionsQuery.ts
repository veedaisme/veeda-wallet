import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidationKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabaseClient';

export interface SubscriptionData {
  name: string;
  amount: number;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: string;
  category?: string;
  description?: string;
}

export interface SubscriptionWithId extends SubscriptionData {
  id: string;
  user_id: string;
  created_at: string;
  is_active: boolean;
}

export function useSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.subscriptionsList(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      subscriptionData, 
      userId 
    }: { 
      subscriptionData: SubscriptionData; 
      userId: string; 
    }) => {
      const newSubscription = {
        ...subscriptionData,
        user_id: userId,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([newSubscription])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionsList(variables.userId),
      });
      
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionsSummary(variables.userId),
      });
    },
    onError: (error) => {
      console.error('Failed to add subscription:', error);
    },
  });
}
