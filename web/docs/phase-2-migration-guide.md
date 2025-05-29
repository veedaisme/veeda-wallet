# Phase 2 Migration Guide: React Query Hooks

This guide helps you migrate from legacy hooks to the new React Query-based hooks while maintaining the same interface contracts.

## Overview

Phase 2 introduces React Query versions of existing hooks that maintain identical interfaces but provide better caching, background updates, and error handling.

## Hook Migrations

### Dashboard Hook

**Before (Legacy):**
```typescript
import { useDashboardSummary } from '@/hooks/useDashboardSummary';

const { dashboardData, loading, error, refetchDashboardSummary } = useDashboardSummary(userId);
```

**After (React Query):**
```typescript
import { useDashboardSummary } from '@/hooks/useDashboardSummary.query';
// OR
import { useDashboardSummary } from '@/hooks'; // Uses new version by default

const { dashboardData, loading, error, refetchDashboardSummary } = useDashboardSummary(userId);
```

**Interface Contract:** ✅ **PRESERVED** - Exact same return type and function signatures.

### Transactions Hook

**Before (Legacy):**
```typescript
import { useTransactions } from '@/hooks/useTransactions';

const {
  transactions,
  loading,
  loadingMore,
  error,
  hasMore,
  sortField,
  sortDirection,
  searchTerm,
  setSortField,
  setSortDirection,
  setSearchTerm,
  loadMoreTransactions,
  refreshTransactions,
} = useTransactions(userId);
```

**After (React Query):**
```typescript
import { useTransactions } from '@/hooks/useTransactions.query';
// OR
import { useTransactions } from '@/hooks'; // Uses new version by default

// Exact same interface
const {
  transactions,
  loading,
  loadingMore,
  error,
  hasMore,
  sortField,
  sortDirection,
  searchTerm,
  setSortField,
  setSortDirection,
  setSearchTerm,
  loadMoreTransactions,
  refreshTransactions,
} = useTransactions(userId);
```

**Interface Contract:** ✅ **PRESERVED** - Exact same return type and function signatures.

### Subscriptions Hook

**Before (Legacy):**
```typescript
import { useSubscriptions } from '@/hooks/useSubscriptions';

const {
  subscriptions,
  summary,
  loading,
  error,
  refetchSubscriptions,
} = useSubscriptions(userId);
```

**After (React Query):**
```typescript
import { useSubscriptions } from '@/hooks/useSubscriptions.query';
// OR
import { useSubscriptions } from '@/hooks'; // Uses new version by default

// Exact same interface
const {
  subscriptions,
  summary,
  loading,
  error,
  refetchSubscriptions,
} = useSubscriptions(userId);
```

**Interface Contract:** ✅ **PRESERVED** - Exact same return type and function signatures.

## New Mutation Hooks

Phase 2 introduces dedicated mutation hooks for better state management:

### Transaction Mutations

```typescript
import {
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks';

const addTransaction = useAddTransaction(userId);
const updateTransaction = useUpdateTransaction(userId);
const deleteTransaction = useDeleteTransaction(userId);

// Usage
addTransaction.mutate(transactionData);
updateTransaction.mutate({ id: '123', transactionData: updatedData });
deleteTransaction.mutate('transaction-id');
```

### Subscription Mutations

```typescript
import {
  useAddSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
} from '@/hooks';

const addSubscription = useAddSubscription(userId);
const updateSubscription = useUpdateSubscription(userId);
const deleteSubscription = useDeleteSubscription(userId);

// Usage
addSubscription.mutate(subscriptionData);
updateSubscription.mutate(subscriptionData); // Must include id in data
deleteSubscription.mutate('subscription-id');
```

## Migration Strategy

### Step 1: Import from New Location

Update your imports to use the new hooks:

```typescript
// Before
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useTransactions } from '@/hooks/useTransactions';
import { useSubscriptions } from '@/hooks/useSubscriptions';

// After
import {
  useDashboardSummary,
  useTransactions,
  useSubscriptions,
} from '@/hooks';
```

### Step 2: No Code Changes Required

Since the interface contracts are preserved, your existing component code should work without any changes.

### Step 3: Leverage New Features (Optional)

You can now take advantage of React Query features:

```typescript
const {
  dashboardData,
  loading,
  error,
  refetchDashboardSummary,
  // New React Query specific properties (optional to use)
  isStale,
  isFetching,
  dataUpdatedAt,
} = useDashboardSummary(userId);
```

## Benefits of Migration

1. **Automatic Background Refetching**: Data stays fresh automatically
2. **Intelligent Caching**: Reduces unnecessary API calls
3. **Optimistic Updates**: Better UX with mutation hooks
4. **Error Retry Logic**: Built-in retry mechanisms
5. **Loading States**: More granular loading indicators
6. **DevTools**: React Query DevTools for debugging

## Backward Compatibility

Legacy hooks are still available during the transition:

```typescript
import {
  useDashboardSummaryLegacy,
  useTransactionsLegacy,
  useSubscriptionsLegacy,
} from '@/hooks';
```

## Testing the Migration

1. Update imports in a single component
2. Verify the component works identically
3. Check React Query DevTools for proper caching
4. Test error scenarios and loading states
5. Gradually migrate other components

## Troubleshooting

### Issue: TypeScript errors after migration
**Solution**: Ensure you're importing from the correct location and that all service functions are properly typed.

### Issue: Data not updating after mutations
**Solution**: Use the new mutation hooks which automatically invalidate related queries.

### Issue: Performance concerns
**Solution**: React Query's intelligent caching should improve performance. Check the DevTools to verify query behavior.

## Next Steps

After successful migration:
1. Remove legacy hook files (Phase 3)
2. Implement real-time updates with Supabase Realtime (Phase 4)
3. Add optimistic updates for better UX (Phase 5)