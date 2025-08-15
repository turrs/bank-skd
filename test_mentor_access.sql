-- Test Mentor Access for Admin
-- Jalankan script ini di Supabase SQL Editor

-- 1. Check current user admin status
SELECT 
  auth.uid() as current_user_id,
  u.email as current_user_email,
  u.is_admin as current_user_is_admin,
  u.role as current_user_role
FROM users u
WHERE u.id = auth.uid();

-- 2. Test if we can access tentor_profiles table
SELECT 
  'Table access test' as test_type,
  COUNT(*) as total_profiles
FROM tentor_profiles;

-- 3. Test if we can see unverified profiles
SELECT 
  'Unverified profiles test' as test_type,
  COUNT(*) as unverified_count
FROM tentor_profiles 
WHERE is_verified = false;

-- 4. Show all unverified profiles with user details
SELECT 
  tp.id as profile_id,
  tp.user_id,
  tp.is_verified,
  tp.is_active,
  tp.specialization,
  tp.experience_years,
  tp.education_level,
  tp.bio,
  tp.hourly_rate,
  tp.created_at,
  u.email,
  u.full_name,
  u.role
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE tp.is_verified = false
ORDER BY tp.created_at DESC;

-- 5. Check RLS policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tentor_profiles'
ORDER BY policyname;
