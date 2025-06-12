-- Migration: 003_seed_subscription_payments_optimized.sql
-- Description: Efficiently populate subscription_payments for 6-month horizon
-- Author: Veeda Wallet Team
-- Date: 2025-01-27
-- Strategy: Pre-populate 6 months of payment records for optimal performance

BEGIN;

-- Simple and efficient seeding for current scale
-- Creates payment records for all future projected payments (6 months)
INSERT INTO subscription_payments (subscription_id, projected_payment_date, payment_status)
SELECT DISTINCT
    p.id as subscription_id,
    p.projected_payment_date,
    'unpaid' as payment_status
FROM (
    -- Get all users with subscriptions
    SELECT DISTINCT user_id FROM subscriptions
) users
CROSS JOIN LATERAL (
    -- Get projected payments for each user (6 months forward)
    SELECT * FROM get_projected_subscription_payments(
        users.user_id, 
        CURRENT_DATE + INTERVAL '6 months'
    )
    WHERE projected_payment_date >= CURRENT_DATE
) p
ON CONFLICT (subscription_id, projected_payment_date) DO NOTHING;

-- Verify the seeding results
DO $$
DECLARE
    v_total_records INTEGER;
    v_unique_subscriptions INTEGER;
    v_date_range_start DATE;
    v_date_range_end DATE;
BEGIN
    -- Get statistics
    SELECT 
        COUNT(*),
        COUNT(DISTINCT subscription_id),
        MIN(projected_payment_date),
        MAX(projected_payment_date)
    INTO v_total_records, v_unique_subscriptions, v_date_range_start, v_date_range_end
    FROM subscription_payments;
    
    -- Log results
    RAISE NOTICE 'Subscription payment seeding completed:';
    RAISE NOTICE '  - Total payment records: %', v_total_records;
    RAISE NOTICE '  - Unique subscriptions: %', v_unique_subscriptions;
    RAISE NOTICE '  - Date range: % to %', v_date_range_start, v_date_range_end;
END;
$$;

COMMIT;

-- Post-migration verification queries:
-- 
-- 1. Check total records created:
-- SELECT COUNT(*) as total_payment_records FROM subscription_payments;
--
-- 2. Check distribution by status:
-- SELECT payment_status, COUNT(*) FROM subscription_payments GROUP BY payment_status;
--
-- 3. Check date range:
-- SELECT MIN(projected_payment_date) as earliest, MAX(projected_payment_date) as latest 
-- FROM subscription_payments;
--
-- 4. Test the new function:
-- SELECT COUNT(*) FROM get_unpaid_subscription_payments('user_id_here'::uuid);
