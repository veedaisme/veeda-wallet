import { supabase } from './supabaseClient';
import { Transaction } from '@/models/transaction';
import { type TransactionData, type SortField, type SortDirection } from '@/hooks/queries/useTransactionsQuery';

const PAGE_SIZE = 20;

interface FetchTransactionsParams {
  userId: string;
  page: number;
  sortField: SortField;
  sortDirection: SortDirection;
  searchTerm?: string;
}

export const fetchTransactions = async (
  { userId, page, sortField, sortDirection, searchTerm }: FetchTransactionsParams
): Promise<{ data: Transaction[], error: Error | null, hasMore: boolean }> => {
  console.log(`Service: Fetching transactions. User: ${userId}, Page: ${page}, Sort: ${sortField} ${sortDirection}, Search: ${searchTerm}`);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order(sortField, { ascending: sortDirection === 'asc' });

  if (searchTerm) {
    query = query.ilike('note', `%${searchTerm}%`); // Or search across multiple fields
  }

  const { data, error, count: _count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching transactions:', error);
    return { data: [], error, hasMore: false };
  }

  return { data: data || [], error: null, hasMore: (data || []).length === PAGE_SIZE };
};

export const addTransaction = async (userId: string, transactionData: TransactionData): Promise<{ data: Transaction | null, error: Error | null }> => {
  console.log('Service: Adding transaction for user:', userId);
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transactionData, user_id: userId }])
    .select()
    .single(); // Assuming you want the inserted row back

  if (error) {
    console.error('Error adding transaction:', error);
  }
  return { data, error };
};

export const updateTransaction = async (id: string, userId: string, transactionData: Partial<TransactionData>): Promise<{ data: Transaction | null, error: Error | null }> => {
  console.log('Service: Updating transaction:', id, 'for user:', userId);
  const { data, error } = await supabase
    .from('transactions')
    .update(transactionData)
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns the transaction
    .select()
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
  }
  return { data, error };
};

export const deleteTransaction = async (id: string, userId: string): Promise<{ error: Error | null }> => {
  console.log('Service: Deleting transaction:', id, 'for user:', userId);
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId); // Ensure user owns the transaction

  if (error) {
    console.error('Error deleting transaction:', error);
  }
  return { error };
};
