export interface Subscription {
  id: string;
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  payment_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionData {
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  payment_date: Date;
  id?: string;
}

export interface SubscriptionSummary {
  upcoming_this_month: number;
  total_monthly_recurring: number;
  subscription_count: number;
}

export interface ProjectedSubscription {
  id: string; // Original subscription ID
  provider_name: string;
  original_amount: number;     // Renamed from amount
  original_currency: string; // Renamed from currency
  amount_in_idr: number;     // New field
  frequency: 'monthly' | 'quarterly' | 'annually';
  original_payment_date: string; // The anchor payment_date from the subscriptions table
  projected_payment_date: string; // The calculated future payment date for this instance
  user_id: string;
  created_at?: string;
  updated_at?: string;

  // New payment tracking fields
  payment_id?: string; // subscription_payments.id
  payment_status: 'unpaid' | 'paid' | 'failed';
  transaction_id?: string;
  paid_at?: string;
}

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: string; // Using string for rate to maintain precision as seen in DB
  last_updated: string; // ISO date string
}

export interface ConsolidatedSubscriptionData {
  subscriptions: Subscription[];
  projected_subscriptions: ProjectedSubscription[];
  subscription_summary: SubscriptionSummary;
}

export interface UnpaidSubscriptionData {
  unpaid_subscriptions: ProjectedSubscription[];
  payment_summary: SubscriptionPaymentSummary;
}

export interface SubscriptionPaymentSummary {
  total_unpaid_amount: number;
  unpaid_count: number;
  overdue_count: number;
  next_payment_date?: string;
  next_payment_amount?: number;
}

export interface PaySubscriptionRequest {
  amount?: number;
  note?: string;
  category?: string;
}

export interface PaySubscriptionResponse {
  transaction: {
    id: string;
    amount: number;
    category: string;
    note: string;
    date: string;
    user_id: string;
  };
  payment: {
    id: string;
    status: 'paid';
    paid_at: string;
    transaction_id: string;
  };
}

export const FREQUENCIES = [
  'monthly',
  'quarterly',
  'annually'
] as const;

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
] as const;

// Sample subscription data for development (if needed)
export const sampleSubscriptions: Subscription[] = [
  {
    id: "s1",
    provider_name: "Netflix",
    amount: 169000,
    currency: "IDR",
    frequency: "monthly",
    payment_date: "2025-05-15",
  },
  {
    id: "s2",
    provider_name: "Spotify",
    amount: 54990,
    currency: "IDR",
    frequency: "monthly",
    payment_date: "2025-05-20",
  },
  {
    id: "s3",
    provider_name: "Adobe Creative Cloud",
    amount: 52.99,
    currency: "USD",
    frequency: "monthly",
    payment_date: "2025-05-28",
  },
  {
    id: "s4",
    provider_name: "iCloud+",
    amount: 0.99,
    currency: "USD",
    frequency: "monthly",
    payment_date: "2025-06-05",
  },
  {
    id: "s5",
    provider_name: "Amazon Prime",
    amount: 139,
    currency: "USD",
    frequency: "annually",
    payment_date: "2025-11-12",
    updated_at: "2024-04-01T10:00:00Z"
  }
];
