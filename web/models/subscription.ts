export interface Subscription {
  id: string;
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  next_payment_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionData {
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  next_payment_date: Date;
  id?: string;
}

export interface SubscriptionSummary {
  upcoming_this_month: number;
  total_monthly_amount: number;
  subscription_count: number;
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
    next_payment_date: "2025-05-15",
  },
  {
    id: "s2",
    provider_name: "Spotify",
    amount: 54990,
    currency: "IDR",
    frequency: "monthly",
    next_payment_date: "2025-05-20",
  },
  {
    id: "s3",
    provider_name: "Adobe Creative Cloud",
    amount: 52.99,
    currency: "USD",
    frequency: "monthly",
    next_payment_date: "2025-05-28",
  },
  {
    id: "s4",
    provider_name: "iCloud+",
    amount: 0.99,
    currency: "USD",
    frequency: "monthly",
    next_payment_date: "2025-06-05",
  },
  {
    id: "s5",
    provider_name: "Amazon Prime",
    amount: 139,
    currency: "USD",
    frequency: "annually",
    next_payment_date: "2025-11-12",
  }
];
