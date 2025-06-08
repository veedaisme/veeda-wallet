-- Dashboard Summary RPC Function
-- This function calculates spending summaries for a specific user
-- Returns spending data for today, yesterday, this week, last week, this month, and last month

CREATE OR REPLACE FUNCTION dashboard_summary(user_id UUID)
RETURNS TABLE (
  spent_today NUMERIC,
  spent_yesterday NUMERIC,
  spent_this_week NUMERIC,
  spent_last_week NUMERIC,
  spent_this_month NUMERIC,
  spent_last_month NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
  today_start DATE;
  yesterday_start DATE;
  this_week_start DATE;
  last_week_start DATE;
  last_week_end DATE;
  this_month_start DATE;
  last_month_start DATE;
  last_month_end DATE;
BEGIN
  -- Calculate date boundaries
  today_start := CURRENT_DATE;
  yesterday_start := CURRENT_DATE - INTERVAL '1 day';
  
  -- Week starts on Monday (ISO week)
  this_week_start := DATE_TRUNC('week', CURRENT_DATE);
  last_week_start := this_week_start - INTERVAL '1 week';
  last_week_end := this_week_start - INTERVAL '1 day';
  
  -- Month boundaries
  this_month_start := DATE_TRUNC('month', CURRENT_DATE);
  last_month_start := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  last_month_end := this_month_start - INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- Today's spending
    COALESCE((
      SELECT SUM(amount)
      FROM transactions t
      WHERE t.user_id = dashboard_summary.user_id
        AND DATE(t.date) = today_start
    ), 0) as spent_today,
    
    -- Yesterday's spending
    COALESCE((
      SELECT SUM(amount)
      FROM transactions t
      WHERE t.user_id = dashboard_summary.user_id
        AND DATE(t.date) = yesterday_start
    ), 0) as spent_yesterday,
    
    -- This week's spending
    COALESCE((
      SELECT SUM(amount)
      FROM transactions t
      WHERE t.user_id = dashboard_summary.user_id
        AND DATE(t.date) >= this_week_start
        AND DATE(t.date) <= CURRENT_DATE
    ), 0) as spent_this_week,
    
    -- Last week's spending
    COALESCE((
      SELECT SUM(amount)
      FROM transactions t
      WHERE t.user_id = dashboard_summary.user_id
        AND DATE(t.date) >= last_week_start
        AND DATE(t.date) <= last_week_end
    ), 0) as spent_last_week,
    
    -- This month's spending
    COALESCE((
      SELECT SUM(amount)
      FROM transactions t
      WHERE t.user_id = dashboard_summary.user_id
        AND DATE(t.date) >= this_month_start
        AND DATE(t.date) <= CURRENT_DATE
    ), 0) as spent_this_month,
    
    -- Last month's spending
    COALESCE((
      SELECT SUM(amount)
      FROM transactions t
      WHERE t.user_id = dashboard_summary.user_id
        AND DATE(t.date) >= last_month_start
        AND DATE(t.date) <= last_month_end
    ), 0) as spent_last_month;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION dashboard_summary(UUID) TO authenticated;

-- Comment for instruction:
-- Run this SQL in your Supabase SQL editor to create the dashboard_summary function.
-- This function will be called from the frontend with a user_id parameter to get
-- user-specific spending summaries for different time periods.
--
-- Usage example:
-- SELECT * FROM dashboard_summary('user-uuid-here');
