import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { 
  Transaction, 
  TransactionCreateData, 
  TransactionUpdateData,
  TransactionListParams 
} from '@/types/transaction'

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params: TransactionListParams) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

// Fetch transactions with filters and pagination
const fetchTransactions = async (
  userId: string,
  params: TransactionListParams = {}
): Promise<Transaction[]> => {
  const {
    page = 1,
    limit = 20,
    sortField = 'date',
    sortDirection = 'desc',
    filters = {}
  } = params

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  if (filters.minAmount) {
    query = query.gte('amount', filters.minAmount)
  }

  if (filters.maxAmount) {
    query = query.lte('amount', filters.maxAmount)
  }

  if (filters.search) {
    query = query.or(`note.ilike.%${filters.search}%,category.ilike.%${filters.search}%`)
  }

  // Apply sorting
  query = query.order(sortField, { ascending: sortDirection === 'asc' })

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Fetch single transaction
const fetchTransaction = async (id: string): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create transaction
const createTransaction = async (
  userId: string,
  transactionData: TransactionCreateData
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transactionData,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update transaction
const updateTransaction = async (
  id: string,
  transactionData: TransactionUpdateData
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(transactionData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete transaction
const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Hooks
export const useTransactions = (userId: string | null, params?: TransactionListParams) => {
  return useQuery({
    queryKey: transactionKeys.list(params || {}),
    queryFn: () => fetchTransactions(userId!, params),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, transactionData }: {
      userId: string
      transactionData: TransactionCreateData
    }) => createTransaction(userId, transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, transactionData }: {
      id: string
      transactionData: TransactionUpdateData
    }) => updateTransaction(id, transactionData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.setQueryData(transactionKeys.detail(data.id), data)
    },
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}