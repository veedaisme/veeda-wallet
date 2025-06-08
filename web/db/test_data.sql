-- Test Data for Dashboard Testing
-- This script inserts sample transactions for testing the dashboard functionality
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from auth.users

-- Note: You need to replace 'YOUR_USER_ID_HERE' with a real user ID
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Sample transactions for testing dashboard summary
INSERT INTO transactions (user_id, amount, category, note, date, created_at, updated_at) VALUES
-- Today's transactions
('YOUR_USER_ID_HERE', 25000, 'Food', 'Morning coffee', CURRENT_DATE + TIME '08:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 45000, 'Food', 'Lunch', CURRENT_DATE + TIME '12:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 15000, 'Transportation', 'Bus fare', CURRENT_DATE + TIME '09:00:00', NOW(), NOW()),

-- Yesterday's transactions
('YOUR_USER_ID_HERE', 35000, 'Food', 'Dinner', CURRENT_DATE - INTERVAL '1 day' + TIME '19:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 20000, 'Transportation', 'Taxi', CURRENT_DATE - INTERVAL '1 day' + TIME '17:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 50000, 'Shopping', 'Groceries', CURRENT_DATE - INTERVAL '1 day' + TIME '16:00:00', NOW(), NOW()),

-- This week's transactions (2-6 days ago)
('YOUR_USER_ID_HERE', 75000, 'Entertainment', 'Movie tickets', CURRENT_DATE - INTERVAL '2 days' + TIME '20:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 30000, 'Food', 'Breakfast', CURRENT_DATE - INTERVAL '3 days' + TIME '08:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 40000, 'Transportation', 'Grab ride', CURRENT_DATE - INTERVAL '4 days' + TIME '14:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 60000, 'Shopping', 'Clothes', CURRENT_DATE - INTERVAL '5 days' + TIME '15:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 25000, 'Food', 'Snacks', CURRENT_DATE - INTERVAL '6 days' + TIME '16:00:00', NOW(), NOW()),

-- Last week's transactions (7-13 days ago)
('YOUR_USER_ID_HERE', 80000, 'Food', 'Restaurant dinner', CURRENT_DATE - INTERVAL '7 days' + TIME '19:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 35000, 'Transportation', 'Fuel', CURRENT_DATE - INTERVAL '8 days' + TIME '10:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 120000, 'Shopping', 'Electronics', CURRENT_DATE - INTERVAL '9 days' + TIME '14:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 45000, 'Food', 'Lunch meeting', CURRENT_DATE - INTERVAL '10 days' + TIME '12:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 30000, 'Entertainment', 'Concert', CURRENT_DATE - INTERVAL '11 days' + TIME '20:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 55000, 'Food', 'Weekend brunch', CURRENT_DATE - INTERVAL '12 days' + TIME '11:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 25000, 'Transportation', 'Parking', CURRENT_DATE - INTERVAL '13 days' + TIME '09:30:00', NOW(), NOW()),

-- This month's transactions (14-20 days ago)
('YOUR_USER_ID_HERE', 500000, 'Housing', 'Rent payment', CURRENT_DATE - INTERVAL '14 days' + TIME '10:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 150000, 'Utilities', 'Electricity bill', CURRENT_DATE - INTERVAL '15 days' + TIME '11:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 75000, 'Health', 'Doctor visit', CURRENT_DATE - INTERVAL '16 days' + TIME '14:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 200000, 'Shopping', 'Monthly groceries', CURRENT_DATE - INTERVAL '17 days' + TIME '16:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 100000, 'Entertainment', 'Gym membership', CURRENT_DATE - INTERVAL '18 days' + TIME '18:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 85000, 'Food', 'Family dinner', CURRENT_DATE - INTERVAL '19 days' + TIME '19:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 40000, 'Transportation', 'Monthly transport', CURRENT_DATE - INTERVAL '20 days' + TIME '08:00:00', NOW(), NOW()),

-- Last month's transactions (31-40 days ago)
('YOUR_USER_ID_HERE', 480000, 'Housing', 'Previous rent', CURRENT_DATE - INTERVAL '31 days' + TIME '10:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 140000, 'Utilities', 'Previous electricity', CURRENT_DATE - INTERVAL '32 days' + TIME '11:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 90000, 'Health', 'Pharmacy', CURRENT_DATE - INTERVAL '33 days' + TIME '15:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 180000, 'Shopping', 'Previous groceries', CURRENT_DATE - INTERVAL '34 days' + TIME '17:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 95000, 'Entertainment', 'Previous gym', CURRENT_DATE - INTERVAL '35 days' + TIME '18:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 70000, 'Food', 'Previous family dinner', CURRENT_DATE - INTERVAL '36 days' + TIME '19:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 45000, 'Transportation', 'Previous transport', CURRENT_DATE - INTERVAL '37 days' + TIME '08:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 60000, 'Food', 'Previous restaurant', CURRENT_DATE - INTERVAL '38 days' + TIME '20:00:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 35000, 'Shopping', 'Previous shopping', CURRENT_DATE - INTERVAL '39 days' + TIME '15:30:00', NOW(), NOW()),
('YOUR_USER_ID_HERE', 25000, 'Food', 'Previous coffee', CURRENT_DATE - INTERVAL '40 days' + TIME '09:00:00', NOW(), NOW());

-- Instructions:
-- 1. First, get your user ID by running:
--    SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 2. Replace all instances of 'YOUR_USER_ID_HERE' with your actual user ID
-- 3. Run this script in your Supabase SQL editor
-- 4. Test the dashboard to see the spending summaries

-- Expected results after running this script:
-- - Today: 85,000 (coffee + lunch + bus)
-- - Yesterday: 105,000 (dinner + taxi + groceries)  
-- - This week: ~400,000+ (including today and yesterday)
-- - Last week: ~390,000 (7 transactions from last week)
-- - This month: ~1,500,000+ (including all above + monthly expenses)
-- - Last month: ~1,230,000 (10 transactions from previous month)
