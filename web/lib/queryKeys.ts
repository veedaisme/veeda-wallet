/**
 * Centralized query key management for React Query
 * 
 * This file provides a hierarchical structure for query keys that enables:
 * - Type-safe query key definitions
 * - Efficient cache invalidation
 * - Consistent naming conventions
 * - Easy maintenance and refactoring
 */

// Base query key types
export const queryKeys = {
  // Dashboard related queries
  dashboard: ['dashboard'] as const,
  dashboardSummary: () => [...queryKeys.dashboard, 'summary'] as const,
  dashboardChart: (type: 'week' | 'month', userId: string, dateRange?: { start: string; end: string }) => 
    [...queryKeys.dashboard, 'chart', type, userId, dateRange] as const,
  
  // Transaction related queries
  transactions: ['transactions'] as const,
  transactionsList: (userId: string, filters?: Record<string, any>) => 
    [...queryKeys.transactions, 'list', userId, filters] as const,
  transactionsDetail: (transactionId: string) => 
    [...queryKeys.transactions, 'detail', transactionId] as const,
  transactionsSearch: (userId: string, query: string) => 
    [...queryKeys.transactions, 'search', userId, query] as const,
  
  // Subscription related queries
  subscriptions: ['subscriptions'] as const,
  subscriptionsList: (userId: string) => 
    [...queryKeys.subscriptions, 'list', userId] as const,
  subscriptionsDetail: (subscriptionId: string) => 
    [...queryKeys.subscriptions, 'detail', subscriptionId] as const,
  subscriptionsSummary: (userId: string) => 
    [...queryKeys.subscriptions, 'summary', userId] as const,
  
  // User related queries
  user: ['user'] as const,
  userProfile: (userId: string) => 
    [...queryKeys.user, 'profile', userId] as const,
} as const;

// Type helpers for query keys
export type QueryKeys = typeof queryKeys;
export type DashboardQueryKey = ReturnType<typeof queryKeys.dashboardSummary>;
export type TransactionsQueryKey = ReturnType<typeof queryKeys.transactionsList>;
export type SubscriptionsQueryKey = ReturnType<typeof queryKeys.subscriptionsList>;

// Utility functions for cache invalidation
export const invalidationKeys = {
  // Invalidate all dashboard queries
  allDashboard: () => queryKeys.dashboard,
  
  // Invalidate all transaction queries
  allTransactions: () => queryKeys.transactions,
  
  // Invalidate all subscription queries
  allSubscriptions: () => queryKeys.subscriptions,
  
  // Invalidate specific user's data
  userSpecific: (userId: string) => [
    queryKeys.dashboardSummary(),
    queryKeys.transactionsList(userId),
    queryKeys.subscriptionsList(userId),
  ],
} as const;
