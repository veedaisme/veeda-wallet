# Subscription Payment Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for adding payment functionality to the subscription schedule feature in the veeda-wallet project. The goal is to enable users to pay subscription bills directly from the schedule view, automatically creating transactions and tracking payment status.

## Current State Analysis

### Existing Components
- **SubscriptionScheduleList**: Displays projected subscriptions grouped by month
- **SubscriptionCard**: Shows individual subscription details with edit/delete actions
- **ProjectedSubscription Model**: Contains calculated future payment dates and IDR amounts

### Current Data Flow
1. `get_projected_subscription_payments()` DB function calculates future payment dates
2. `get_consolidated_subscription_data()` fetches subscriptions + projections + summary
3. `SubscriptionsView` uses `useConsolidatedSubscriptionData` hook
4. Data flows to `SubscriptionScheduleList` component
5. Individual items rendered via `SubscriptionCard`

### Current Filtering Logic
- Shows ALL projected payments up to 12 months in the future
- Groups by month-year based on `projected_payment_date`
- No filtering by payment status (doesn't exist yet)

### Database Schema Analysis
```sql
-- Existing tables
subscriptions: id, user_id, provider_name, amount, currency, frequency, payment_date, created_at, updated_at
transactions: id, amount, category, note, date, user_id
currency_exchange_rates: id, base_currency, target_currency, rate, last_updated
```

### Limitations Identified
1. **No Payment Status Tracking**: No way to mark subscriptions as paid
2. **No Subscription-Transaction Link**: No relationship between payments and subscriptions
3. **Shows All Future Payments**: Cannot filter to show only unpaid items
4. **No Payment Action**: No "Pay" button or payment workflow

## Requirements Analysis

### Functional Requirements
1. **Payment Status Tracking**: Track which subscription instances have been paid
2. **Unpaid Filter**: Show only unpaid subscription items regardless of date
3. **Pay Button**: Add payment action to each unpaid subscription item
4. **Automatic Transaction Creation**: Create transaction with predefined values when paid
5. **Payment Status Update**: Mark subscription instance as paid after transaction creation
6. **Remove from List**: Hide paid items from unpaid schedule view

### Technical Requirements
1. **Database Schema Changes**: New table for tracking payment status
2. **API Endpoints**: New endpoints for payment actions
3. **Component Updates**: Add payment UI and logic
4. **Data Flow Changes**: Filter by payment status instead of date
5. **Transaction Integration**: Seamless transaction creation workflow

### User Experience Requirements
1. **Clear Payment Status**: Visual indication of payment status
2. **One-Click Payment**: Simple payment action
3. **Immediate Feedback**: Real-time UI updates after payment
4. **Error Handling**: Graceful error handling for failed payments

## Database Schema Design

### New Table: subscription_payments
```sql
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  projected_payment_date DATE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one payment record per subscription per projected date
  UNIQUE(subscription_id, projected_payment_date)
);

-- Indexes for performance
CREATE INDEX idx_subscription_payments_status ON subscription_payments(payment_status);
CREATE INDEX idx_subscription_payments_date ON subscription_payments(projected_payment_date);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
```

### Updated ProjectedSubscription Model
```typescript
export interface ProjectedSubscription {
  id: string; // Original subscription ID
  provider_name: string;
  original_amount: number;
  original_currency: string;
  amount_in_idr: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  original_payment_date: string;
  projected_payment_date: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  
  // New payment tracking fields
  payment_id?: string; // subscription_payments.id
  payment_status: 'unpaid' | 'paid' | 'failed';
  transaction_id?: string;
  paid_at?: string;
}
```

## Implementation Plan

### Phase 1: Database Schema Updates
1. **Create subscription_payments table** with schema above
2. **Update get_projected_subscription_payments function** to include payment status
3. **Create payment management functions**:
   - `create_subscription_payment_record()`
   - `mark_subscription_payment_paid()`
   - `get_unpaid_subscription_payments()`

### Phase 2: Backend API Updates
1. **New endpoint**: `POST /api/subscriptions/payments/:paymentId/pay`
2. **Update transaction creation** to link with subscription payments
3. **Add payment status filtering** to existing subscription endpoints

### Phase 3: Frontend Component Updates
1. **Update SubscriptionCard** to show payment status and Pay button
2. **Add payment action handlers** to SubscriptionScheduleList
3. **Update data fetching** to filter by payment status
4. **Add payment confirmation UI**

### Phase 4: Integration & Testing
1. **End-to-end payment workflow testing**
2. **Error handling implementation**
3. **Performance optimization**
4. **User acceptance testing**

## Detailed Component Architecture

### Updated Data Flow
```
1. get_unpaid_subscription_payments() → Only unpaid items
2. SubscriptionsView → useUnpaidSubscriptionData hook
3. SubscriptionScheduleList → Filtered unpaid subscriptions
4. SubscriptionCard → Pay button for unpaid items
5. Payment action → Create transaction + Update payment status
6. Real-time UI update → Remove from unpaid list
```

### Payment Workflow
```
1. User clicks "Pay" button on subscription item
2. Frontend calls payment API with subscription payment ID
3. Backend creates transaction with predefined values:
   - amount: subscription.amount_in_idr
   - category: "Subscriptions" 
   - note: "Payment for {provider_name} - {frequency}"
   - date: current timestamp
4. Backend updates subscription_payments.payment_status = 'paid'
5. Backend links transaction_id in subscription_payments
6. Frontend refetches data and updates UI
7. Paid item disappears from unpaid list
```

## AI Agent Integration Considerations

### Future AI Workflows
1. **Spending Analysis**: Link subscription payments to spending patterns
2. **Payment Predictions**: Predict upcoming subscription costs
3. **Budget Optimization**: Suggest subscription management based on usage
4. **Anomaly Detection**: Detect unusual subscription payment patterns

### Data Structure for AI
- Clear subscription-transaction relationships
- Payment timing and frequency data
- Category-based spending analysis
- Historical payment patterns

## Next Steps

1. **Review and approve** this implementation plan
2. **Create database migration scripts** for schema changes
3. **Implement backend API changes** following Hono.js patterns
4. **Update frontend components** with payment functionality
5. **Comprehensive testing** of payment workflow
6. **Documentation updates** for new features

## Risk Mitigation

### Technical Risks
- **Data consistency**: Use database transactions for payment operations
- **Race conditions**: Implement proper locking for payment status updates
- **API failures**: Implement retry logic and error recovery

### User Experience Risks
- **Accidental payments**: Add confirmation dialogs
- **Payment failures**: Clear error messages and recovery options
- **Performance**: Optimize queries for large subscription datasets

## Success Metrics

1. **Functional**: All unpaid subscriptions show Pay button
2. **Integration**: Successful transaction creation from subscription payment
3. **UX**: Smooth payment workflow with immediate UI feedback
4. **Performance**: Sub-second response times for payment actions
5. **Reliability**: 99%+ success rate for payment operations

## Detailed Technical Specifications

### Database Functions

#### 1. Updated get_projected_subscription_payments Function
```sql
CREATE OR REPLACE FUNCTION get_projected_subscription_payments_with_status(
    p_user_id UUID,
    p_projection_end_date DATE DEFAULT NULL,
    p_payment_status TEXT DEFAULT NULL -- 'unpaid', 'paid', 'failed', or NULL for all
)
RETURNS TABLE (
    id UUID,
    provider_name TEXT,
    original_amount NUMERIC,
    original_currency TEXT,
    amount_in_idr NUMERIC,
    frequency TEXT,
    original_payment_date DATE,
    projected_payment_date DATE,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    payment_id UUID,
    payment_status TEXT,
    transaction_id UUID,
    paid_at TIMESTAMPTZ
) AS $$
-- Implementation will join subscriptions with subscription_payments
-- and filter by payment_status if provided
$$;
```

#### 2. Payment Management Functions
```sql
-- Create payment record for a projected subscription payment
CREATE OR REPLACE FUNCTION create_subscription_payment_record(
    p_subscription_id UUID,
    p_projected_payment_date DATE
) RETURNS UUID AS $$
-- Implementation creates subscription_payments record
$$;

-- Mark payment as paid and link transaction
CREATE OR REPLACE FUNCTION mark_subscription_payment_paid(
    p_payment_id UUID,
    p_transaction_id UUID
) RETURNS BOOLEAN AS $$
-- Implementation updates payment_status and transaction_id
$$;
```

### API Endpoints

#### 1. Get Unpaid Subscriptions
```typescript
// GET /api/subscriptions/unpaid
// Returns only unpaid subscription payments
interface UnpaidSubscriptionsResponse {
  data: ProjectedSubscription[];
  summary: {
    total_unpaid_amount: number;
    unpaid_count: number;
    overdue_count: number;
  };
}
```

#### 2. Pay Subscription
```typescript
// POST /api/subscriptions/payments/:paymentId/pay
interface PaySubscriptionRequest {
  // Optional override values
  amount?: number;
  note?: string;
  category?: string;
}

interface PaySubscriptionResponse {
  transaction: Transaction;
  payment: {
    id: string;
    status: 'paid';
    paid_at: string;
    transaction_id: string;
  };
}
```

### Frontend Components

#### 1. Updated SubscriptionCard Component
```typescript
interface SubscriptionCardProps {
  subscription: ProjectedSubscription;
  showInIDR: boolean;
  onEdit?: (subscription: ProjectedSubscription) => void;
  onDelete?: (subscription: ProjectedSubscription) => void;
  onPay?: (subscription: ProjectedSubscription) => Promise<void>; // New
  isPaymentLoading?: boolean; // New
}

// New payment button in SubscriptionCard
{subscription.payment_status === 'unpaid' && (
  <button
    onClick={() => onPay?.(subscription)}
    disabled={isPaymentLoading}
    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
  >
    {isPaymentLoading ? 'Paying...' : 'Pay'}
  </button>
)}
```

#### 2. Payment Hook
```typescript
// hooks/useSubscriptionPayment.ts
export function useSubscriptionPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      // Call payment API
      const response = await apiClient.paySubscription(paymentId);
      return response;
    },
    onSuccess: () => {
      // Invalidate unpaid subscriptions query
      queryClient.invalidateQueries(['subscriptions', 'unpaid']);
      // Show success notification
    },
    onError: (error) => {
      // Show error notification
    }
  });
}
```

### Migration Strategy

#### 1. Database Migration
```sql
-- Migration: 001_add_subscription_payments.sql
BEGIN;

-- Create subscription_payments table
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  projected_payment_date DATE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(subscription_id, projected_payment_date)
);

-- Create indexes
CREATE INDEX idx_subscription_payments_status ON subscription_payments(payment_status);
CREATE INDEX idx_subscription_payments_date ON subscription_payments(projected_payment_date);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);

-- Create trigger for updated_at
CREATE TRIGGER subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

#### 2. Data Seeding Strategy
```sql
-- Populate subscription_payments for existing subscriptions
-- This creates unpaid records for all future projected payments
INSERT INTO subscription_payments (subscription_id, projected_payment_date, payment_status)
SELECT
  p.id as subscription_id,
  p.projected_payment_date,
  'unpaid' as payment_status
FROM get_projected_subscription_payments(
  (SELECT id FROM auth.users LIMIT 1), -- Replace with actual user iteration
  CURRENT_DATE + INTERVAL '12 months'
) p
ON CONFLICT (subscription_id, projected_payment_date) DO NOTHING;
```

## Implementation Timeline

### Week 1: Database Foundation
- [ ] Create subscription_payments table
- [ ] Update database functions
- [ ] Create migration scripts
- [ ] Test database changes

### Week 2: Backend API
- [ ] Implement payment endpoints
- [ ] Update subscription endpoints
- [ ] Add payment status filtering
- [ ] Integration testing

### Week 3: Frontend Updates
- [ ] Update SubscriptionCard component
- [ ] Add payment hooks and services
- [ ] Update data fetching logic
- [ ] UI/UX implementation

### Week 4: Integration & Polish
- [ ] End-to-end testing
- [ ] Error handling
- [ ] Performance optimization
- [ ] Documentation updates

## Testing Strategy

### Unit Tests
- Database function tests
- API endpoint tests
- Component rendering tests
- Payment workflow tests

### Integration Tests
- Full payment workflow
- Error scenarios
- Data consistency
- Performance tests

### User Acceptance Tests
- Payment button visibility
- Transaction creation
- UI feedback
- Error handling
