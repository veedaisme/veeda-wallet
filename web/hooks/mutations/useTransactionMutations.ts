import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/lib/transactionService';
import { queryKeys } from '@/lib/query-keys';
import { type TransactionData } from '@/components/transaction-form';
import { Transaction } from '@/models/transaction';
import { useToast } from '@/hooks/use-toast';

export const useAddTransaction = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transactionData: TransactionData) => 
      transactionService.addTransaction(userId, transactionData),
    onSuccess: (result) => {
      if (result.data) {
        // Invalidate and refetch transaction queries
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all(userId) });
        // Also invalidate dashboard data as it depends on transactions
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) });
        
        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
      } else if (result.error) {
        throw result.error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTransaction = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, transactionData }: { id: string; transactionData: Partial<TransactionData> }) => 
      transactionService.updateTransaction(id, userId, transactionData),
    onSuccess: (result) => {
      if (result.data) {
        // Invalidate and refetch transaction queries
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all(userId) });
        // Also invalidate dashboard data as it depends on transactions
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) });
        
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else if (result.error) {
        throw result.error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTransaction = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id, userId),
    onSuccess: (result) => {
      if (!result.error) {
        // Invalidate and refetch transaction queries
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all(userId) });
        // Also invalidate dashboard data as it depends on transactions
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) });
        
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
      } else {
        throw result.error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });
};