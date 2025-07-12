import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';
import { invalidationKeys } from './queryKeys';

export interface MutationConfig {
  successMessage: string;
  errorMessage: string;
  invalidateTransactions?: boolean;
  invalidateSubscriptions?: boolean;
  invalidateDashboard?: boolean;
}

export function createMutationHandlers(
  queryClient: QueryClient,
  config: MutationConfig
) {
  const onSuccess = (data: any, variables: any) => {
    console.log(`Operation successful: ${config.successMessage}`);
    toast.success(config.successMessage);

    // Invalidate queries based on configuration
    if (config.invalidateTransactions) {
      queryClient.invalidateQueries({
        queryKey: invalidationKeys.allTransactions(),
      });
    }

    if (config.invalidateSubscriptions) {
      queryClient.invalidateQueries({
        queryKey: invalidationKeys.allSubscriptions(),
      });
    }

    if (config.invalidateDashboard) {
      queryClient.invalidateQueries({
        queryKey: invalidationKeys.allDashboard(),
      });
    }

    console.log('Cache invalidation completed');
  };

  const onError = (error: any) => {
    console.error(`Operation failed:`, error);
    toast.error(config.errorMessage);
  };

  return { onSuccess, onError };
}

// Predefined configurations for common operations
export const mutationConfigs = {
  addTransaction: {
    successMessage: 'Transaction added successfully',
    errorMessage: 'Failed to add transaction. Please try again.',
    invalidateTransactions: true,
    invalidateDashboard: true,
  },
  updateTransaction: {
    successMessage: 'Transaction updated successfully',
    errorMessage: 'Failed to update transaction. Please try again.',
    invalidateTransactions: true,
    invalidateDashboard: true,
  },
  deleteTransaction: {
    successMessage: 'Transaction deleted successfully',
    errorMessage: 'Failed to delete transaction. Please try again.',
    invalidateTransactions: true,
    invalidateDashboard: true,
  },
  addSubscription: {
    successMessage: 'Subscription added successfully',
    errorMessage: 'Failed to add subscription. Please try again.',
    invalidateSubscriptions: true,
    invalidateDashboard: true,
  },
  updateSubscription: {
    successMessage: 'Subscription updated successfully',
    errorMessage: 'Failed to update subscription. Please try again.',
    invalidateSubscriptions: true,
    invalidateDashboard: true,
  },
  deleteSubscription: {
    successMessage: 'Subscription deleted successfully',
    errorMessage: 'Failed to delete subscription. Please try again.',
    invalidateSubscriptions: true,
    invalidateDashboard: true,
  },
} as const;