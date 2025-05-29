import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { Transaction } from '@/models/transaction';
import { transactionService } from '@/lib/transactionService';
import { queryKeys } from '@/lib/query-keys';

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
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: queryKeys.transactions.list(userId, {
      sortField,
      sortDirection,
      searchTerm,
      pageSize: PAGE_SIZE
    }),
    queryFn: ({ pageParam = 0 }) => 
      transactionService.getTransactions(userId!, {
        page: pageParam,
        pageSize: PAGE_SIZE,
        sortField,
        sortDirection,
        searchTerm
      }),
    enabled: !!userId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length; // Next page number
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into a single array
  const transactions = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field);
  }, []);

  const handleSortDirectionChange = useCallback((direction: SortDirection) => {
    setSortDirection(direction);
  }, []);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const loadMoreTransactions = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refreshTransactions = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    transactions,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    error: error?.message || null,
    hasMore: !!hasNextPage,
    sortField,
    sortDirection,
    searchTerm,
    setSortField: handleSortFieldChange,
    setSortDirection: handleSortDirectionChange,
    setSearchTerm: handleSearchTermChange,
    loadMoreTransactions,
    refreshTransactions,
  };
};