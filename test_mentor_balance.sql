-- =====================================================
-- TEST MENTOR BALANCE SYSTEM
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor untuk test

-- 1. Check if tables exist
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

-- 2. Check if functions exist
SELECT 
  routine_name,
  CASE 
    WHEN routine_name = 'calculate_mentor_balance' THEN '✅ Calculate Balance Function'
    WHEN routine_name = 'update_mentor_balance' THEN '✅ Update Balance Function'
    WHEN routine_name = 'calculate_mentor_earnings_from_payments' THEN '✅ Calculate Earnings Function'
    ELSE '❌ Unknown Function'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%mentor%'
ORDER BY routine_name;

-- 3. Check if policies exist
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN policyname LIKE '%select%' THEN '✅ Select Policy'
    WHEN policyname LIKE '%insert%' THEN '✅ Insert Policy'
    WHEN policyname LIKE '%update%' THEN '✅ Update Policy'
    ELSE '❌ Unknown Policy'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename LIKE 'mentor_%'
ORDER BY tablename, policyname;

-- 4. Check existing mentor balances
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

-- 5. Check existing payments that could generate earnings
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
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Check existing mentor earnings
SELECT 
  me.id,
  me.mentor_id,
  u.full_name as mentor_name,
  me.payment_amount,
  me.commission_rate,
  me.commission_amount,
  me.status,
  me.created_at
FROM public.mentor_earnings me
LEFT JOIN public.users u ON me.mentor_id = u.id
ORDER BY me.created_at DESC;

-- 7. Check existing withdrawals
SELECT 
  mw.id,
  mw.mentor_id,
  u.full_name as mentor_name,
  mw.amount,
  mw.bank_name,
  mw.status,
  mw.created_at
FROM public.mentor_withdrawals mw
LEFT JOIN public.users u ON mw.mentor_id = u.id
ORDER BY mw.created_at DESC;

-- 8. Test calculate earnings function (if there are completed payments)
-- Uncomment if you want to test:
-- SELECT calculate_mentor_earnings_from_payments();

-- 9. Check users with tentor role
SELECT 
  id,
  full_name,
  email,
  role,
  created_at
FROM public.users 
WHERE role = 'tentor'
ORDER BY created_at DESC;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- 
-- ✅ Tables: mentor_balances, mentor_withdrawals, mentor_earnings
-- ✅ Functions: calculate_mentor_balance, update_mentor_balance, calculate_mentor_earnings_from_payments
-- ✅ Policies: select, insert, update policies for each table
-- ✅ Mentor balances: Should show existing mentors with 0.00 initial balance
-- ✅ Payments: Should show completed payments that can generate earnings
-- ✅ Earnings: Should show commission records (empty initially)
-- ✅ Withdrawals: Should show withdrawal requests (empty initially)
-- ✅ Users: Should show users with 'tentor' role
