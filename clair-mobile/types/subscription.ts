export interface Subscription {
  id: string
  provider_name: string
  amount: number
  currency: string
  frequency: 'monthly' | 'quarterly' | 'annually'
  payment_date: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface SubscriptionCreateData {
  provider_name: string
  amount: number
  currency: string
  frequency: 'monthly' | 'quarterly' | 'annually'
  payment_date: string
}

export interface SubscriptionUpdateData {
  provider_name?: string
  amount?: number
  currency?: string
  frequency?: 'monthly' | 'quarterly' | 'annually'
  payment_date?: string
}

export interface SubscriptionSummary {
  upcoming_this_month: number
  total_monthly_recurring: number
  subscription_count: number
}

export interface ProjectedSubscription {
  id: string
  provider_name: string
  original_amount: number
  original_currency: string
  amount_in_idr: number
  frequency: 'monthly' | 'quarterly' | 'annually'
  original_payment_date: string
  projected_payment_date: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: string
  last_updated: string
}

export interface ConsolidatedSubscriptionData {
  subscriptions: Subscription[]
  projected_subscriptions: ProjectedSubscription[]
  subscription_summary: SubscriptionSummary
}

export const FREQUENCIES = [
  'monthly',
  'quarterly', 
  'annually'
] as const

export const COMMON_CURRENCIES = [
  'IDR',
  'USD',
  'EUR',
  'SGD',
  'JPY',
  'AUD',
  'GBP',
  'CAD',
  'CHF',
  'NZD',
  'CNH'
] as const

export type SubscriptionFrequency = typeof FREQUENCIES[number]
export type Currency = typeof COMMON_CURRENCIES[number]