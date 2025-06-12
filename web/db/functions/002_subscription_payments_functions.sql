-- Functions: 002_subscription_payments_functions.sql
-- Description: Database functions for subscription payment management
-- Author: Veeda Wallet Team
-- Date: 2025-01-27

-- Function: Get projected subscription payments with payment status
-- This extends the existing function to include payment tracking
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
DECLARE
    sub RECORD;
    loop_date DATE;
    interval_val INTERVAL;
    v_rate_to_idr NUMERIC;
    v_amount_in_idr NUMERIC;
    v_end_date DATE;
    payment_record RECORD;
BEGIN
    -- Set default projection end date to 12 months from now if not provided
    IF p_projection_end_date IS NULL THEN
        v_end_date := CURRENT_DATE + INTERVAL '12 months';
    ELSE
        v_end_date := p_projection_end_date;
    END IF;

    FOR sub IN
        SELECT s.* FROM public.subscriptions s
        WHERE s.user_id = p_user_id
    LOOP
        -- Assign original values directly
        id := sub.id;
        provider_name := sub.provider_name;
        original_amount := sub.amount;
        original_currency := sub.currency;
        frequency := sub.frequency;
        original_payment_date := sub.payment_date;
        user_id := sub.user_id;
        created_at := sub.created_at;
        updated_at := sub.updated_at;

        -- Calculate amount_in_idr
        IF original_currency = 'IDR' THEN
            v_rate_to_idr := 1;
        ELSE
            SELECT cer.rate INTO v_rate_to_idr
            FROM public.currency_exchange_rates cer
            WHERE cer.base_currency = original_currency AND cer.target_currency = 'IDR';

            IF NOT FOUND THEN
                v_rate_to_idr := 1; -- Default to 1 if no rate found
            END IF;
        END IF;
        
        v_amount_in_idr := original_amount * v_rate_to_idr;
        amount_in_idr := v_amount_in_idr;

        CASE sub.frequency
            WHEN 'monthly' THEN interval_val := '1 month';
            WHEN 'quarterly' THEN interval_val := '3 months';
            WHEN 'annually' THEN interval_val := '1 year';
            ELSE CONTINUE;
        END CASE;

        loop_date := sub.payment_date;

        -- Advance to first future date if payment_date is in the past
        IF loop_date < CURRENT_DATE THEN
            WHILE loop_date < CURRENT_DATE LOOP
                loop_date := loop_date + interval_val;
            END LOOP;
        END IF;
        
        -- Generate projected payments up to end date
        WHILE loop_date <= v_end_date LOOP
            projected_payment_date := loop_date;
            
            -- Check if payment record exists for this projected date
            SELECT sp.id, sp.payment_status, sp.transaction_id, sp.paid_at
            INTO payment_record
            FROM subscription_payments sp
            WHERE sp.subscription_id = sub.id 
            AND sp.projected_payment_date = loop_date;
            
            IF FOUND THEN
                -- Use existing payment record
                payment_id := payment_record.id;
                payment_status := payment_record.payment_status;
                transaction_id := payment_record.transaction_id;
                paid_at := payment_record.paid_at;
            ELSE
                -- Create default unpaid status for new projections
                payment_id := NULL;
                payment_status := 'unpaid';
                transaction_id := NULL;
                paid_at := NULL;
            END IF;
            
            -- Filter by payment status if specified
            IF p_payment_status IS NULL OR payment_status = p_payment_status THEN
                RETURN NEXT;
            END IF;
            
            loop_date := loop_date + interval_val;

            IF interval_val <= '0 days'::interval THEN
                EXIT; 
            END IF;
        END LOOP;
    END LOOP;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function: Get only unpaid subscription payments
-- Convenience function for the main use case
CREATE OR REPLACE FUNCTION get_unpaid_subscription_payments(
    p_user_id UUID,
    p_projection_end_date DATE DEFAULT NULL
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
BEGIN
    RETURN QUERY
    SELECT * FROM get_projected_subscription_payments_with_status(
        p_user_id, 
        p_projection_end_date, 
        'unpaid'
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Create subscription payment record
-- Creates a payment tracking record for a specific projected payment
CREATE OR REPLACE FUNCTION create_subscription_payment_record(
    p_subscription_id UUID,
    p_projected_payment_date DATE
) RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    INSERT INTO subscription_payments (subscription_id, projected_payment_date, payment_status)
    VALUES (p_subscription_id, p_projected_payment_date, 'unpaid')
    ON CONFLICT (subscription_id, projected_payment_date) 
    DO UPDATE SET updated_at = now()
    RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark subscription payment as paid
-- Updates payment status and links transaction
CREATE OR REPLACE FUNCTION mark_subscription_payment_paid(
    p_payment_id UUID,
    p_transaction_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE subscription_payments 
    SET 
        payment_status = 'paid',
        transaction_id = p_transaction_id,
        paid_at = now(),
        updated_at = now()
    WHERE id = p_payment_id
    AND payment_status = 'unpaid'; -- Only allow transition from unpaid to paid
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark subscription payment as failed
-- Updates payment status for failed payment attempts
CREATE OR REPLACE FUNCTION mark_subscription_payment_failed(
    p_payment_id UUID,
    p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE subscription_payments 
    SET 
        payment_status = 'failed',
        updated_at = now()
    WHERE id = p_payment_id
    AND payment_status = 'unpaid'; -- Only allow transition from unpaid to failed
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Get subscription payment summary
-- Returns summary statistics for unpaid subscriptions
CREATE OR REPLACE FUNCTION get_subscription_payment_summary(p_user_id UUID)
RETURNS TABLE (
    total_unpaid_amount NUMERIC,
    unpaid_count INTEGER,
    overdue_count INTEGER,
    next_payment_date DATE,
    next_payment_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH unpaid_payments AS (
        SELECT * FROM get_unpaid_subscription_payments(p_user_id)
    ),
    summary_stats AS (
        SELECT 
            COALESCE(SUM(up.amount_in_idr), 0) as total_unpaid,
            COUNT(*)::INTEGER as unpaid_total,
            COUNT(CASE WHEN up.projected_payment_date < CURRENT_DATE THEN 1 END)::INTEGER as overdue_total
        FROM unpaid_payments up
    ),
    next_payment AS (
        SELECT 
            up.projected_payment_date,
            up.amount_in_idr
        FROM unpaid_payments up
        WHERE up.projected_payment_date >= CURRENT_DATE
        ORDER BY up.projected_payment_date ASC
        LIMIT 1
    )
    SELECT 
        ss.total_unpaid,
        ss.unpaid_total,
        ss.overdue_total,
        np.projected_payment_date,
        np.amount_in_idr
    FROM summary_stats ss
    LEFT JOIN next_payment np ON true;
END;
$$ LANGUAGE plpgsql;
