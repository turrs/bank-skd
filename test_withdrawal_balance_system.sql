-- =====================================================
-- TEST WITHDRAWAL BALANCE SYSTEM
-- =====================================================
-- Script ini untuk test sistem withdrawal balance yang sudah diperbaiki

-- =====================================================
-- STEP 1: CHECK CURRENT SYSTEM STATUS
-- =====================================================

-- 1.1 Check if all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'mentor_balances' THEN '✅ Balance Table'
    WHEN table_name = 'mentor_withdrawals' THEN '✅ Withdrawals Table'
    WHEN table_name = 'mentor_earnings' THEN '✅ Earnings Table'
    ELSE '❌ Unknown Table'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'mentor_%'
ORDER BY table_name;

-- 1.2 Check if all functions exist
SELECT 
  routine_name,
  CASE 
    WHEN routine_name = 'calculate_mentor_balance' THEN '✅ Calculate Balance Function'
    WHEN routine_name = 'update_mentor_balance' THEN '✅ Update Balance Function'
    WHEN routine_name = 'calculate_mentor_earnings_from_payments' THEN '✅ Calculate Earnings Function'
    WHEN routine_name = 'trigger_update_mentor_balance_on_withdrawal_change' THEN '✅ Withdrawal Trigger Function'
    WHEN routine_name = 'trigger_update_mentor_balance_on_earnings_change' THEN '✅ Earnings Trigger Function'
    WHEN routine_name = 'trigger_update_mentor_balance_on_earnings_insert' THEN '✅ Earnings Insert Trigger Function'
    WHEN routine_name = 'trigger_update_mentor_balance_on_withdrawal_insert' THEN '✅ Withdrawal Insert Trigger Function'
    ELSE '❌ Unknown Function'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%mentor%'
ORDER BY routine_name;

-- 1.3 Check if all triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  CASE 
    WHEN trigger_name = 'mentor_withdrawals_balance_update_trigger' THEN '✅ Withdrawal Update Trigger'
    WHEN trigger_name = 'mentor_earnings_balance_update_trigger' THEN '✅ Earnings Update Trigger'
    WHEN trigger_name = 'mentor_earnings_balance_insert_trigger' THEN '✅ Earnings Insert Trigger'
    WHEN trigger_name = 'mentor_withdrawals_balance_insert_trigger' THEN '✅ Withdrawal Insert Trigger'
    ELSE '❌ Unknown Trigger'
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND trigger_name LIKE '%mentor%'
ORDER BY trigger_name;

-- =====================================================
-- STEP 2: CHECK CURRENT DATA
-- =====================================================

-- 2.1 Check current mentor balances
SELECT 
  mb.id,
  mb.mentor_id,
  u.full_name as mentor_name,
  mb.total_earnings,
  mb.available_balance,
  mb.total_withdrawn,
  mb.created_at,
  mb.updated_at
FROM public.mentor_balances mb
LEFT JOIN public.users u ON mb.mentor_id = u.id
ORDER BY mb.available_balance DESC;

-- 2.2 Check current withdrawals
SELECT 
  mw.id,
  mw.mentor_id,
  u.full_name as mentor_name,
  mw.amount,
  mw.status,
  mw.bank_name,
  mw.created_at
FROM public.mentor_withdrawals mw
LEFT JOIN public.users u ON mw.mentor_id = u.id
ORDER BY mw.created_at DESC;

-- 2.3 Check current earnings
SELECT 
  me.id,
  me.mentor_id,
  u.full_name as mentor_name,
  me.payment_amount,
  me.commission_amount,
  me.status,
  me.created_at
FROM public.mentor_earnings me
LEFT JOIN public.users u ON me.mentor_id = u.id
ORDER BY me.created_at DESC;

-- =====================================================
-- STEP 3: TEST WITHDRAWAL STATUS CHANGE
-- =====================================================

-- 3.1 Test changing withdrawal status from 'approved' to 'completed'
-- (Uncomment and modify the withdrawal ID as needed)
/*
UPDATE public.mentor_withdrawals 
SET status = 'completed', 
    processed_at = NOW() 
WHERE id = 'your-withdrawal-id-here';
*/

-- 3.2 Check balance after status change
-- (Run this after the update above)
/*
SELECT 
  mb.id,
  mb.mentor_id,
  u.full_name as mentor_name,
  mb.total_earnings,
  mb.available_balance,
  mb.total_withdrawn,
  mb.updated_at
FROM public.mentor_balances mb
LEFT JOIN public.users u ON mb.mentor_id = u.id
WHERE mb.mentor_id = 'mentor-id-from-withdrawal-above';
*/

-- =====================================================
-- STEP 4: TEST EARNINGS CALCULATION
-- =====================================================

-- 4.1 Check if there are completed payments without earnings
SELECT 
  p.id as payment_id,
  p.user_id as student_id,
  p.package_id,
  p.amount,
  p.status,
  p.created_at,
  qp.creator_id as mentor_id,
  u.full_name as mentor_name
FROM public.payments p
JOIN public.question_packages qp ON p.package_id = qp.id
LEFT JOIN public.users u ON qp.creator_id = u.id
WHERE p.status = 'completed'
AND p.id NOT IN (
  SELECT payment_id FROM public.mentor_earnings
)
AND qp.creator_id IS NOT NULL
ORDER BY p.created_at DESC;

-- 4.2 Test calculate earnings function (if there are completed payments)
-- (Uncomment if there are completed payments without earnings)
/*
SELECT calculate_mentor_earnings_from_payments();
*/

-- =====================================================
-- STEP 5: VERIFICATION QUERIES
-- =====================================================

-- 5.1 Verify balance calculation logic
SELECT 
  mb.mentor_id,
  u.full_name as mentor_name,
  mb.total_earnings,
  mb.total_withdrawn,
  mb.available_balance,
  -- Manual calculation for verification
  (SELECT COALESCE(SUM(commission_amount), 0) FROM public.mentor_earnings WHERE mentor_id = mb.mentor_id AND status = 'paid') as calculated_earnings,
  (SELECT COALESCE(SUM(amount), 0) FROM public.mentor_withdrawals WHERE mentor_id = mb.mentor_id AND status = 'completed') as calculated_withdrawn,
  (SELECT COALESCE(SUM(commission_amount), 0) FROM public.mentor_earnings WHERE mentor_id = mb.mentor_id AND status = 'paid') - 
  (SELECT COALESCE(SUM(amount), 0) FROM public.mentor_withdrawals WHERE mentor_id = mb.mentor_id AND status = 'completed') as calculated_available
FROM public.mentor_balances mb
LEFT JOIN public.users u ON mb.mentor_id = u.id
ORDER BY mb.available_balance DESC;

-- 5.2 Check withdrawal status distribution
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM public.mentor_withdrawals
GROUP BY status
ORDER BY status;

-- 5.3 Check earnings status distribution
SELECT 
  status,
  COUNT(*) as count,
  SUM(commission_amount) as total_commission
FROM public.mentor_earnings
GROUP BY status
ORDER BY status;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- 
-- ✅ Tables: mentor_balances, mentor_withdrawals, mentor_earnings
-- ✅ Functions: calculate_mentor_balance, update_mentor_balance, calculate_mentor_earnings_from_payments
-- ✅ Trigger Functions: 4 trigger functions for automatic balance updates
-- ✅ Triggers: 4 triggers on mentor_withdrawals and mentor_earnings tables
-- ✅ Balance Logic: available_balance = total_earnings - total_withdrawn (only completed withdrawals)
-- ✅ Auto-update: Balance updates automatically when withdrawal/earnings status changes
-- 
-- =====================================================
-- TESTING SCENARIOS
-- =====================================================
-- 
-- 1. ✅ Create new withdrawal → Balance should not change (pending status)
-- 2. ✅ Approve withdrawal → Balance should not change (approved status)
-- 3. ✅ Complete withdrawal → Balance should DECREASE (completed status)
-- 4. ✅ Reject withdrawal → Balance should not change (rejected status)
-- 5. ✅ New payment completed → Balance should INCREASE (new earnings)
-- 6. ✅ Earnings status change → Balance should update automatically
