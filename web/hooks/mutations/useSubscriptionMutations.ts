import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/lib/subscriptionService';
import { queryKeys } from '@/lib/query-keys';
import { type SubscriptionData } from '@/models/subscription';
import { useToast } from '@/hooks/use-toast';

export const useAddSubscription = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subscriptionData: SubscriptionData) => 
      subscriptionService.addSubscription(subscriptionData, userId),
    onSuccess: (result) => {
      if (result.data) {
        // Invalidate and refetch subscription queries
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all(userId) });
        // Also invalidate dashboard data as it may depend on subscriptions
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) });
        
        toast({
          title: "Success",
          description: "Subscription added successfully",
        });
      } else if (result.error) {
        throw result.error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add subscription",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSubscription = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subscriptionData: SubscriptionData) => 
      subscriptionService.updateSubscription(subscriptionData, userId),
    onSuccess: (result) => {
      if (result.data) {
        // Invalidate and refetch subscription queries
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all(userId) });
        // Also invalidate dashboard data as it may depend on subscriptions
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) });
        
        toast({
          title: "Success",
          description: "Subscription updated successfully",
        });
      } else if (result.error) {
        throw result.error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSubscription = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => subscriptionService.deleteSubscription(id, userId),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate and refetch subscription queries
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all(userId) });
        // Also invalidate dashboard data as it may depend on subscriptions
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) });
        
        toast({
          title: "Success",
          description: "Subscription deleted successfully",
        });
      } else if (result.error) {
        throw result.error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription",
        variant: "destructive",
      });
    },
  });
};