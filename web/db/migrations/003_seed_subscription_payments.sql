-- Migration: 003_seed_subscription_payments.sql
-- Description: Populate subscription_payments for existing subscriptions
-- Author: Veeda Wallet Team
-- Date: 2025-01-27

-- This script creates unpaid payment records for all future projected payments
-- for existing subscriptions. This ensures backward compatibility.

BEGIN;

-- Function to seed payment records for a specific user
CREATE OR REPLACE FUNCTION seed_subscription_payments_for_user(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    projection_record RECORD;
BEGIN
    -- Get all projected payments for the user (12 months forward)
    FOR projection_record IN
        SELECT 
            id as subscription_id,
            projected_payment_date
        FROM get_projected_subscription_payments(p_user_id, CURRENT_DATE + INTERVAL '12 months')
        WHERE projected_payment_date >= CURRENT_DATE
    LOOP
        -- Create payment record if it doesn't exist
        INSERT INTO subscription_payments (subscription_id, projected_payment_date, payment_status)
        VALUES (projection_record.subscription_id, projection_record.projected_payment_date, 'unpaid')
        ON CONFLICT (subscription_id, projected_payment_date) DO NOTHING;
        
        -- Count successful insertions
        IF FOUND THEN
            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Seed payment records for all users with subscriptions
-- Note: In production, this should be run carefully and possibly in batches
DO $$
DECLARE
    user_record RECORD;
    total_inserted INTEGER := 0;
    user_inserted INTEGER;
BEGIN
    -- Get all users who have subscriptions
    FOR user_record IN
        SELECT DISTINCT user_id 
        FROM subscriptions
    LOOP
        -- Seed payment records for this user
        SELECT seed_subscription_payments_for_user(user_record.user_id) INTO user_inserted;
        total_inserted := total_inserted + user_inserted;
        
        RAISE NOTICE 'Seeded % payment records for user %', user_inserted, user_record.user_id;
    END LOOP;
    
    RAISE NOTICE 'Total payment records created: %', total_inserted;
END;
$$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS seed_subscription_payments_for_user(UUID);

COMMIT;

-- Verification query (run after migration):
-- SELECT 
--     COUNT(*) as total_payment_records,
--     COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_records,
--     COUNT(DISTINCT subscription_id) as unique_subscriptions
-- FROM subscription_payments;
