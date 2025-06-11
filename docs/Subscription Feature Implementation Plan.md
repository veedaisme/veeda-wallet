# Subscription Feature Implementation Plan

## Overview

This document outlines the technical steps required to implement the Subscription tracking feature for the Clair Wallet web application. The feature will add a new tab to the existing application, alongside the current Dashboard and Transactions tabs.

## Technical Requirements

1. Add a subscription model and database table
2. Create UI components for the subscription tab
3. Implement multi-currency support
4. Create subscription form for adding/editing subscriptions
5. Update navigation to include the new tab
6. Add required translations
7. Implement currency conversion functionality

## Implementation Steps

### 1. Database Schema Updates

#### 1.1 Create Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  frequency TEXT NOT NULL,
  next_payment_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster querying
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_payment_date ON subscriptions(next_payment_date);

-- Enable Row Level Security on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY select_subscriptions ON subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_subscriptions ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY update_subscriptions ON subscriptions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY delete_subscriptions ON subscriptions
  FOR DELETE USING (user_id = auth.uid());
```

#### 1.2 Create Currency Exchange Rates Table

```sql
CREATE TABLE currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC(16, 6) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);
```

#### 1.3 Create RPC Function for Subscription Summary

```sql
CREATE OR REPLACE FUNCTION subscription_summary(user_id UUID)
RETURNS TABLE (
  upcoming_this_month NUMERIC,
  total_monthly_amount NUMERIC,
  subscription_count INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH this_month_subs AS (
    SELECT 
      s.amount,
      s.currency,
      COALESCE(er.rate, 1) as exchange_rate
    FROM subscriptions s
    LEFT JOIN currency_exchange_rates er ON s.currency = er.base_currency AND er.target_currency = 'IDR'
    WHERE 
      s.user_id = subscription_summary.user_id
      AND EXTRACT(MONTH FROM s.next_payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM s.next_payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  ),
  all_subs AS (
    SELECT 
      s.amount,
      s.currency,
      s.frequency,
      COALESCE(er.rate, 1) as exchange_rate
    FROM subscriptions s
    LEFT JOIN currency_exchange_rates er ON s.currency = er.base_currency AND er.target_currency = 'IDR'
    WHERE s.user_id = subscription_summary.user_id
  )
  SELECT
    COALESCE(SUM(amount * exchange_rate), 0) as upcoming_this_month,
    COALESCE(SUM(
      CASE
        WHEN frequency = 'monthly' THEN amount * exchange_rate
        WHEN frequency = 'quarterly' THEN amount * exchange_rate / 3
        WHEN frequency = 'annually' THEN amount * exchange_rate / 12
        ELSE 0
      END
    ), 0) as total_monthly_amount,
    COUNT(*)::INTEGER as subscription_count
  FROM all_subs;
END;
$$;
```

### 2. Frontend Models and Types

#### 2.1 Create Subscription Model (`models/subscription.ts`)

```typescript
export interface Subscription {
  id: string;
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  next_payment_date: string;
  created_at: string;
  updated_at: string;
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
];

export const COMMON_CURRENCIES = [
  'IDR',
  'USD',
  'EUR',
  'SGD',
  'JPY',
  'AUD'
];
```

### 3. Components

#### 3.1 Create SubscriptionForm Component

Create a form similar to TransactionForm but with the following fields:
- Provider name
- Amount
- Currency (dropdown)
- Frequency (dropdown)
- Next payment date (date picker)

#### 3.2 Create SubscriptionCard Component

Create a card to display subscription details.

#### 3.3 Create SubscriptionList Component

Create a list component to display all subscription cards.

#### 3.4 Create CurrencyToggle Component

Create a toggle component to switch between IDR and original currency display.

### 4. Add Subscription Tab in Main Page

Modify the main page component to include the subscription tab along with the existing dashboard and transactions tabs.

### 5. Create Subscription CRUD Functions

Implement functions to:
- Fetch subscriptions from the database
- Add new subscriptions
- Edit existing subscriptions
- Delete subscriptions
- Convert currencies

### 6. Add Translations

Add subscription-related translations to both English and Indonesian language files.

### 7. Currency Conversion Service

Implement a service to fetch and update currency exchange rates from an external API.

### 8. Testing

Test all subscription functionality including:
- Adding/editing/deleting subscriptions
- Currency conversion
- Sorting by upcoming payment date
- Display of subscription summary data

## Detailed Implementation Guide

### Phase 1: Database Setup

1. Create the subscription and exchange rates tables in Supabase
2. Seed some initial exchange rate data
3. Test the RPC function with sample data

### Phase 2: Core Components

1. Create the subscription model
2. Implement basic CRUD operations for subscriptions
3. Create the subscription form component
4. Create subscription list component

### Phase 3: UI Integration

1. Add the subscription tab to the main navigation
2. Implement the subscription view page
3. Add the currency toggle functionality
4. Style all components according to design guidelines

### Phase 4: Currency Features

1. Implement currency conversion logic
2. Create a service to update exchange rates
3. Test with various currencies

### Phase 5: Testing and Refinement

1. Test all subscription functionality
2. Add error handling
3. Optimize performance
4. Final UI polish

## Technical Considerations

### Data Storage

All subscription data will be stored in Supabase, with relationships to user accounts using the user_id field. 

### Currency Conversion

We'll implement currency conversion using an external API and store the rates in our database. Options include:
- Open Exchange Rates API
- ExchangeRate-API
- Frankfurter API (free, no API key required)

Exchange rates should be updated daily using a scheduled function.

### Performance

To ensure optimal performance:
1. Use pagination for subscription lists if the number of subscriptions becomes large
2. Implement optimistic UI updates
3. Cache exchange rates to minimize API calls

## Conclusion

This implementation plan provides a structured approach to adding subscription tracking functionality to the Clair Wallet web application. Following these steps will ensure the feature is implemented according to the design decisions document and meets all the requirements.
