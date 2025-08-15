-- Quick Test Mentor Access
-- Jalankan script ini di Supabase SQL Editor

-- 1. Check current user
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.is_admin,
  u.role
FROM users u
WHERE u.id = auth.uid();

-- 2. Test access to tentor_profiles
SELECT 
  'Access test' as test_type,
  COUNT(*) as total_profiles
FROM tentor_profiles;

-- 3. Test unverified profiles
SELECT 
  'Unverified test' as test_type,
  COUNT(*) as unverified_count
FROM tentor_profiles 
WHERE is_verified = false;

-- 4. Show unverified profiles with user details
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
