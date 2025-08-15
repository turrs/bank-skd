-- Test Admin Access to Unverified Tentor Profiles
-- Jalankan script ini di Supabase SQL Editor

-- 1. Check current user admin status
SELECT 
  auth.uid() as current_user_id,
  u.email as current_user_email,
  u.is_admin as current_user_is_admin,
  u.role as current_user_role
FROM users u
WHERE u.id = auth.uid();

-- 2. Check if we can see unverified tentor profiles
SELECT 
  'Admin access test' as test_type,
  COUNT(*) as unverified_count
FROM tentor_profiles 
WHERE is_verified = false;

-- 3. Show sample unverified profiles (if admin can access)
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
ORDER BY tp.created_at DESC
LIMIT 5;

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

-- 5. Test direct query without RLS (this should work for admin)
SELECT 
  'Direct query test' as test_type,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
  COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_count
FROM tentor_profiles;
