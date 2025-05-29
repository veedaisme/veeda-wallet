// React Query Hooks - New State Management
export { useDashboardSummary } from './useDashboardSummary.query';
export { useTransactions } from './useTransactions.query';
export { useSubscriptions } from './useSubscriptions.query';

// Mutation Hooks
export {
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from './mutations/useTransactionMutations';

export {
  useAddSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
} from './mutations/useSubscriptionMutations';

// Legacy Hooks (for backward compatibility during migration)
export { useDashboardSummary as useDashboardSummaryLegacy } from './useDashboardSummary';
export { useTransactions as useTransactionsLegacy } from './useTransactions';
export { useSubscriptions as useSubscriptionsLegacy } from './useSubscriptions';

// Other hooks
export { useUser } from './useUser';
export { useMobile } from './use-mobile';
export { useToast } from './use-toast';