import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, invalidationKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabaseClient';
import { fetchTransactions, updateTransaction, deleteTransaction } from '@/lib/transactionService';
import { Transaction } from '@/models/transaction';

export interface TransactionData {
  amount: number;
  category: string;
  note: string;
  date: string | Date;
  id?: string;
}

export interface TransactionWithId extends TransactionData {
  id: string;
  user_id: string;
  created_at: string;
}

export type SortField = "date" | "amount";
export type SortDirection = "asc" | "desc";

export interface TransactionFilters {
  sortField?: SortField;
  sortDirection?: SortDirection;
  searchTerm?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Basic transactions query (for backward compatibility)
export function useTransactions(
  userId: string | null,
  filters?: Record<string, any>
) {
  return useQuery({
    queryKey: queryKeys.transactionsList(userId || '', filters),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (filters) {
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.dateFrom) {
          query = query.gte('date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('date', filters.dateTo);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Infinite query for paginated transactions with sorting and search
export function useTransactionsPaginated(
  userId: string | null,
  filters: TransactionFilters = {}
) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactionsPaginated(userId || '', filters),
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error, hasMore } = await fetchTransactions({
        userId,
        page: pageParam,
        sortField: filters.sortField || 'date',
        sortDirection: filters.sortDirection || 'desc',
        searchTerm: filters.searchTerm,
      });

      if (error) throw error;

      return {
        transactions: data,
        nextPage: hasMore ? pageParam + 1 : undefined,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionData,
      userId
    }: {
      transactionData: TransactionData;
      userId: string;
    }) => {
      // Handle both Date and string types
      const dateValue = transactionData.date instanceof Date
        ? transactionData.date
        : new Date(transactionData.date);
      dateValue.setHours(12, 0, 0, 0);

      const newTransaction = {
        amount: transactionData.amount,
        category: transactionData.category,
        note: transactionData.note,
        date: dateValue.toISOString(),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactionsList(variables.userId),
      });

      queryClient.invalidateQueries({
        queryKey: invalidationKeys.allDashboard(),
      });
    },
    onError: (error) => {
      console.error('Failed to add transaction:', error);
    },
  });
}

// Update transaction mutation
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      transactionData,
      userId
    }: {
      transactionId: string;
      transactionData: Partial<TransactionData>;
      userId: string;
    }) => {
      // Set the time to noon to avoid timezone issues
      const updatedData = { ...transactionData };
      if (updatedData.date) {
        const dateValue = updatedData.date instanceof Date
          ? updatedData.date
          : new Date(updatedData.date);
        dateValue.setHours(12, 0, 0, 0);
        updatedData.date = dateValue.toISOString();
      }

      const { data, error } = await updateTransaction(transactionId, userId, updatedData);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all transaction queries for this user
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactionsList(variables.userId),
      });

      // Invalidate dashboard data as transaction changes affect summaries
      queryClient.invalidateQueries({
        queryKey: invalidationKeys.allDashboard(),
      });
    },
    onError: (error) => {
      console.error('Failed to update transaction:', error);
    },
  });
}

// Delete transaction mutation
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      userId
    }: {
      transactionId: string;
      userId: string;
    }) => {
      const { error } = await deleteTransaction(transactionId, userId);
      if (error) throw error;
      return { id: transactionId };
    },
    onSuccess: (data, variables) => {
      // Invalidate all transaction queries for this user
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactionsList(variables.userId),
      });

      // Invalidate dashboard data as transaction deletion affects summaries
      queryClient.invalidateQueries({
        queryKey: invalidationKeys.allDashboard(),
      });
    },
    onError: (error) => {
      console.error('Failed to delete transaction:', error);
    },
  });
}
