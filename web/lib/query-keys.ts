/**
 * Centralized query key definitions for React Query
 * This ensures consistent caching and invalidation across the application
 */

// Type definitions for query parameters
interface TransactionQueryParams {
  page?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

interface SubscriptionQueryParams {
  sortDirection?: 'asc' | 'desc';
}

export const QUERY_KEYS = {
  // Dashboard queries
  dashboard: ['dashboard'] as const,
  dashboardSummary: (userId: string) => 
    [...QUERY_KEYS.dashboard, 'summary', userId] as const,
  
  // Transaction queries
  transactions: ['transactions'] as const,
  transactionsList: (userId: string, params?: TransactionQueryParams) => 
    [...QUERY_KEYS.transactions, 'list', userId, params] as const,
  transactionDetail: (transactionId: string) => 
    [...QUERY_KEYS.transactions, 'detail', transactionId] as const,
  transactionCategories: () => 
    [...QUERY_KEYS.transactions, 'categories'] as const,
  
  // Subscription queries
  subscriptions: ['subscriptions'] as const,
  subscriptionsList: (userId: string, params?: SubscriptionQueryParams) => 
    [...QUERY_KEYS.subscriptions, 'list', userId, params] as const,
  subscriptionDetail: (subscriptionId: string) => 
    [...QUERY_KEYS.subscriptions, 'detail', subscriptionId] as const,
  subscriptionSummary: (userId: string) => 
    [...QUERY_KEYS.subscriptions, 'summary', userId] as const,
  subscriptionSchedules: (subscriptionId: string) => 
    [...QUERY_KEYS.subscriptions, 'schedules', subscriptionId] as const,
  
  // User queries
  user: ['user'] as const,
  userProfile: (userId: string) => 
    [...QUERY_KEYS.user, 'profile', userId] as const,
  userPreferences: (userId: string) => 
    [...QUERY_KEYS.user, 'preferences', userId] as const,
} as const;

/**
 * Type-safe query key factory functions
 * These provide intellisense and type checking for query keys
 */
export type QueryKeys = typeof QUERY_KEYS;

/**
 * Export queryKeys as an alias for QUERY_KEYS for consistency
 */
export const queryKeys = QUERY_KEYS;

/**
 * Helper function to invalidate all queries for a specific entity
 */
export const getInvalidationKeys = {
  dashboard: (userId?: string) => {
    if (userId) {
      return [QUERY_KEYS.dashboardSummary(userId)];
    }
    return [QUERY_KEYS.dashboard];
  },
  
  transactions: (userId?: string) => {
    if (userId) {
      return [
        QUERY_KEYS.transactionsList(userId),
        QUERY_KEYS.dashboardSummary(userId), // Dashboard depends on transactions
      ];
    }
    return [QUERY_KEYS.transactions, QUERY_KEYS.dashboard];
  },
  
  subscriptions: (userId?: string) => {
    if (userId) {
      return [
        QUERY_KEYS.subscriptionsList(userId),
        QUERY_KEYS.subscriptionSummary(userId),
        QUERY_KEYS.dashboardSummary(userId), // Dashboard depends on subscriptions
      ];
    }
    return [QUERY_KEYS.subscriptions, QUERY_KEYS.dashboard];
  },
  
  user: (userId?: string) => {
    if (userId) {
      return [
        QUERY_KEYS.userProfile(userId),
        QUERY_KEYS.userPreferences(userId),
      ];
    }
    return [QUERY_KEYS.user];
  },
};