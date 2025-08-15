-- Test All Mentors Without Limit
-- Jalankan script ini di Supabase SQL Editor

-- 1. Check current user admin status
SELECT 
  auth.uid() as current_user_id,
  u.email as current_user_email,
  u.is_admin as current_user_is_admin,
  u.role as current_user_role
FROM users u
WHERE u.id = auth.uid();

-- 2. Get ALL unverified tentor profiles (NO LIMIT!)
SELECT 
  'All unverified profiles' as test_type,
  COUNT(*) as total_unverified_count
FROM tentor_profiles 
WHERE is_verified = false;

-- 3. Show ALL unverified profiles with user details
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

-- 4. Check RLS policies for tentor_profiles
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

-- 5. Test if admin can access all profiles
SELECT 
  'Admin access test - All profiles' as test_type,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
  COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_count
FROM tentor_profiles;

-- 6. Test specific query that should work for admin
SELECT 
  tp.id,
  tp.user_id,
  tp.is_verified,
  tp.is_active,
  u.email,
  u.full_name
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE tp.is_verified = false;
