import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidationKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabaseClient';

export interface TransactionData {
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface TransactionWithId extends TransactionData {
  id: string;
  user_id: string;
  created_at: string;
}

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
      const dateWithoutTime = new Date(transactionData.date);
      dateWithoutTime.setHours(12, 0, 0, 0);

      const newTransaction = {
        amount: transactionData.amount,
        category: transactionData.category,
        note: transactionData.note,
        date: dateWithoutTime.toISOString(),
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
