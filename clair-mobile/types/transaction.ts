export interface Transaction {
  id: string
  amount: number
  category: string
  note: string | null
  date: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface TransactionCreateData {
  amount: number
  category: string
  note?: string
  date: string
}

export interface TransactionUpdateData {
  amount?: number
  category?: string
  note?: string
  date?: string
}

export interface TransactionFilters {
  category?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  search?: string
}

export interface TransactionListParams {
  page?: number
  limit?: number
  sortField?: 'date' | 'amount' | 'category'
  sortDirection?: 'asc' | 'desc'
  filters?: TransactionFilters
}

export interface TransactionListResponse {
  data: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export const TRANSACTION_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Health',
  'Education',
  'Travel',
  'Personal Care',
  'Gifts',
  'Other',
] as const

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number]