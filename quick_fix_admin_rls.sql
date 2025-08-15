-- Quick Fix for Admin RLS Policy
-- Jalankan script ini di Supabase SQL Editor

-- 1. Drop existing admin policies if they exist
DROP POLICY IF EXISTS "tentor_profiles_select_admin" ON tentor_profiles;
DROP POLICY IF EXISTS "tentor_profiles_update_admin" ON tentor_profiles;

-- 2. Create new admin policies
CREATE POLICY "tentor_profiles_select_admin" ON tentor_profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "tentor_profiles_update_admin" ON tentor_profiles 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- 3. Verify policies were created
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'tentor_profiles'
ORDER BY policyname;

-- 4. Test current user admin status
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.is_admin,
  u.role
FROM users u
WHERE u.id = auth.uid();

-- 5. Check if we can now see unverified tentor profiles
SELECT 
  tp.id,
  tp.user_id,
  tp.is_verified,
  tp.is_active,
  u.email,
  u.full_name
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE tp.is_verified = false
LIMIT 5;
