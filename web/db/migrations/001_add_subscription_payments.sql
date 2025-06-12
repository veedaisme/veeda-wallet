-- Migration: 001_add_subscription_payments.sql
-- Description: Add subscription payment tracking functionality
-- Author: Veeda Wallet Team
-- Date: 2025-01-27

BEGIN;

-- Create subscription_payments table for tracking payment status
CREATE TABLE IF NOT EXISTS subscription_payments (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_date ON subscription_payments(projected_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_lookup ON subscription_payments(subscription_id, payment_status, projected_payment_date);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on subscription_payments
DROP TRIGGER IF EXISTS subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies for subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access payment records for their own subscriptions
CREATE POLICY subscription_payments_user_policy ON subscription_payments
  FOR ALL
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON subscription_payments TO authenticated;
GRANT USAGE ON SEQUENCE subscription_payments_id_seq TO authenticated;

COMMIT;

-- Rollback script (for reference, run manually if needed):
-- BEGIN;
-- DROP TABLE IF EXISTS subscription_payments CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- COMMIT;
