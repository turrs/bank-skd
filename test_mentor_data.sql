-- Test Mentor Data
-- Jalankan script ini di Supabase SQL Editor untuk memeriksa data mentor

-- 1. Check if tentor_profiles table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'tentor_profiles';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tentor_profiles'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tentor_profiles'
ORDER BY policyname;

-- 4. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tentor_profiles';

-- 5. Count total tentor profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_profiles,
  COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_profiles,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_profiles,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_profiles
FROM tentor_profiles;

-- 6. Show sample unverified profiles
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
  u.role,
  u.is_admin
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE tp.is_verified = false
ORDER BY tp.created_at DESC
LIMIT 10;

-- 7. Check current user permissions
SELECT 
  auth.uid() as current_user_id,
  u.email as current_user_email,
  u.is_admin as current_user_is_admin,
  u.role as current_user_role
FROM users u
WHERE u.id = auth.uid();

-- 8. Test admin access to unverified profiles
-- This should work after fixing RLS policies
SELECT 
  'Admin can see unverified profiles' as test_description,
  COUNT(*) as unverified_count
FROM tentor_profiles 
WHERE is_verified = false;
