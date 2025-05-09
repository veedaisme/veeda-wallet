import { useState, useEffect, useCallback, useRef } from 'react';
import { Transaction } from '@/models/transaction'; // Assuming Transaction model exists

export type SortField = 'date' | 'amount';
export type SortDirection = 'asc' | 'desc';

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  searchTerm: string;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setSearchTerm: (term: string) => void;
  loadMoreTransactions: () => void;
  refreshTransactions: () => void;
}

const PAGE_SIZE = 20;

export const useTransactions = (userId?: string | null): UseTransactionsReturn => {
  console.log('Hook: Initializing transactions fetch.');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true); // Initial load
  const [loadingMore, setLoadingMore] = useState(false); // Subsequent loads
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortFieldState] = useState<SortField>('date');
  const [sortDirection, setSortDirectionState] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTermState] = useState('');

  // To prevent fetching on initial mount for sort/search/tab changes if not needed
  const initialFetchPerformedRef = useRef(false);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (isRefresh) {
      setLoading(true);
      setPage(0); // Reset page for refresh
    } else {
      setLoadingMore(true);
    }
    setError(null);

    const currentPage = isRefresh ? 0 : page;
    console.log(`Hook: Fetching transactions for user: ${userId}, page: ${currentPage}, sort: ${sortField} ${sortDirection}, search: ${searchTerm}`);

    // TODO: Implement actual data fetching logic (e.g., from transactionService.ts)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newTransactions: Transaction[] = []; // Replace with actual API response
      // Example: generate some dummy data based on page for testing
      // for (let i = 0; i < PAGE_SIZE; i++) {
      //   newTransactions.push({
      //     id: `id_${currentPage}_${i}`,
      //     user_id: userId,
      //     amount: Math.random() * 1000,
      //     date: new Date().toISOString(),
      //     note: `Transaction note ${currentPage}-${i}`,
      //     category: 'Food',
      //     created_at: new Date().toISOString(),
      //   });
      // }

      if (isRefresh) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
      setHasMore(newTransactions.length === PAGE_SIZE);
      if (newTransactions.length > 0 && !isRefresh) {
        setPage(prev => prev + 1);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch transactions');
    }
    setLoading(false);
    setLoadingMore(false);
    initialFetchPerformedRef.current = true;
  }, [userId, page, sortField, sortDirection, searchTerm]);

  // Initial fetch or when user changes
  useEffect(() => {
    if (userId) {
        fetchTransactions(true); // Initial fetch is a refresh
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); 

  // Refetch when sort or search term changes
  useEffect(() => {
    if (userId && initialFetchPerformedRef.current) {
        fetchTransactions(true); // Treat as refresh
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDirection, searchTerm]);

  const loadMoreTransactions = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchTransactions(false);
    }
  }, [loading, loadingMore, hasMore, fetchTransactions]);

  const refreshTransactions = useCallback(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  const setSortField = (field: SortField) => setSortFieldState(field);
  const setSortDirection = (direction: SortDirection) => setSortDirectionState(direction);
  const setSearchTerm = (term: string) => {
    setSearchTermState(term);
    // Optionally debounce or handle search triggering logic here
  };

  return {
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
  };
};
