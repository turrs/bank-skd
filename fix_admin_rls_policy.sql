-- Fix Admin RLS Policy for tentor_profiles
-- Jalankan script ini di Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "tentor_profiles_select_admin" ON tentor_profiles;
DROP POLICY IF EXISTS "tentor_profiles_update_admin" ON tentor_profiles;

-- Add admin policy to view all tentor profiles (including unverified ones)
CREATE POLICY "tentor_profiles_select_admin" ON tentor_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Add admin policy to update tentor profiles
CREATE POLICY "tentor_profiles_update_admin" ON tentor_profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Verify the policies were created
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
WHERE tablename = 'tentor_profiles';

-- Test if admin can access unverified profiles
-- (This will show the current user's admin status)
SELECT 
  auth.uid() as current_user_id,
  u.id as user_id,
  u.email,
  u.is_admin,
  tp.id as profile_id,
  tp.is_verified,
  tp.is_active
FROM users u
LEFT JOIN tentor_profiles tp ON u.id = tp.user_id
WHERE u.id = auth.uid();
