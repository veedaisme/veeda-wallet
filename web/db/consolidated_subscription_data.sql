-- SQL function to retrieve all subscription data in a single call
-- This consolidates multiple API calls into one for better performance

CREATE OR REPLACE FUNCTION get_consolidated_subscription_data(p_user_id UUID, p_projection_end_date DATE DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_end_date DATE;
  result JSON;
BEGIN
  -- Set default projection end date to 12 months from now if not provided
  IF p_projection_end_date IS NULL THEN
    v_end_date := CURRENT_DATE + INTERVAL '12 months';
  ELSE
    v_end_date := p_projection_end_date;
  END IF;

  -- Construct a single JSON object containing all subscription data
  SELECT json_build_object(
    'subscriptions', (
      SELECT COALESCE(json_agg(s ORDER BY s.payment_date ASC), '[]'::json)
      FROM subscriptions s 
      WHERE s.user_id = p_user_id
    ),
    'projected_subscriptions', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM get_projected_subscription_payments(p_user_id, v_end_date) p
    ),
    'subscription_summary', (
      SELECT row_to_json(sum)
      FROM subscription_summary(p_user_id::text) sum
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comment for instruction:
-- Run this SQL in your Supabase SQL editor to create the function.
-- This function consolidates three separate API calls into one:
-- 1. Fetching regular subscriptions
-- 2. Fetching projected subscription payments
-- 3. Fetching subscription summary
--
-- The result is a single JSON object with three properties:
-- - subscriptions: Array of regular subscription records
-- - projected_subscriptions: Array of projected subscription payments
-- - subscription_summary: Object containing summary statistics
