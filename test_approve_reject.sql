-- Test Approve/Reject Mentor Functionality
-- Jalankan script ini di Supabase SQL Editor untuk test

-- 1. Check current user admin status
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.is_admin,
  u.role
FROM users u
WHERE u.id = auth.uid();

-- 2. Check current unverified tentor profiles
SELECT 
  'Current unverified profiles' as status,
  COUNT(*) as count
FROM tentor_profiles 
WHERE is_verified = false;

-- 3. Show current unverified profiles
SELECT 
  tp.id as profile_id,
  tp.user_id,
  tp.is_verified,
  tp.is_active,
  u.email,
  u.full_name,
  u.role
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE tp.is_verified = false
ORDER BY tp.created_at DESC;

-- 4. Test if we can update tentor_profiles (for approve)
-- This should work if admin RLS policy is correct
SELECT 
  'Update test - tentor_profiles' as test_type,
  COUNT(*) as can_update_count
FROM tentor_profiles 
WHERE is_verified = false;

-- 5. Test if we can update users table (for role change)
-- This should work if admin RLS policy is correct
SELECT 
  'Update test - users' as test_type,
  COUNT(*) as can_update_count
FROM users 
WHERE role = 'student';

-- 6. Check RLS policies for both tables
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('tentor_profiles', 'users')
ORDER BY tablename, policyname;

-- 7. Manual test: Try to update a tentor profile (optional)
-- Uncomment and modify the user_id below to test manually
/*
UPDATE tentor_profiles 
SET is_verified = true, updated_at = NOW()
WHERE user_id = 'USER_ID_HERE' 
RETURNING id, user_id, is_verified, updated_at;
*/

-- 8. Manual test: Try to update a user role (optional)
-- Uncomment and modify the user_id below to test manually
/*
UPDATE users 
SET role = 'tentor'
WHERE id = 'USER_ID_HERE' 
RETURNING id, email, role;
*/
