# 🔧 Fix Mentor Approval Issue

## Masalah
Data mentor yang status `is_verified = false` tidak muncul di halaman "Approve Mentor" di Admin Dashboard, padahal ada data di database.

## Penyebab
Row Level Security (RLS) policy di tabel `tentor_profiles` tidak mengizinkan admin untuk melihat profil mentor yang belum terverifikasi.

## Solusi

### Langkah 1: Jalankan Script SQL di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy dan paste script berikut:

```sql
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
```

5. Klik **Run** untuk menjalankan script

### Langkah 2: Verifikasi Hasil

Setelah menjalankan script, Anda akan melihat:

1. **Policies created**: 2 policy baru untuk admin
2. **Current user status**: Konfirmasi bahwa user Anda adalah admin
3. **Unverified profiles**: Daftar mentor yang belum terverifikasi

### Langkah 3: Test di Admin Dashboard

1. Refresh halaman Admin Dashboard
2. Buka tab "Approve Mentor"
3. Data mentor pending seharusnya sudah muncul

## File yang Dibuat

- `quick_fix_admin_rls.sql` - Script SQL untuk fix RLS policy
- `fix_admin_rls_policy.sql` - Script SQL lengkap dengan verifikasi
- `deploy_tentor_role.sh` - Script bash untuk deploy migration

## Troubleshooting

### Jika masih tidak muncul:

1. **Periksa RLS policies**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'tentor_profiles';
```

2. **Periksa data mentor**:
```sql
SELECT 
  tp.*,
  u.email,
  u.full_name,
  u.is_admin
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE tp.is_verified = false;
```

3. **Periksa user admin**:
```sql
SELECT id, email, is_admin, role FROM users WHERE is_admin = true;
```

### Jika ada error:

1. Pastikan tabel `tentor_profiles` sudah ada
2. Pastikan user Anda memiliki `is_admin = true`
3. Pastikan RLS sudah di-enable pada tabel

## Struktur RLS Policy

Setelah fix, RLS policy akan menjadi:

- `tentor_profiles_select_public` - Public bisa lihat profil terverifikasi
- `tentor_profiles_select_own` - User bisa lihat profil sendiri
- `tentor_profiles_select_admin` - **Admin bisa lihat semua profil**
- `tentor_profiles_update_admin` - **Admin bisa update semua profil**
- `tentor_profiles_insert_own` - User bisa insert profil sendiri
- `tentor_profiles_update_own` - User bisa update profil sendiri
- `tentor_profiles_delete_own` - User bisa delete profil sendiri

## Catatan Penting

- Script ini hanya memperbaiki RLS policy, tidak mengubah data
- Pastikan user admin Anda memiliki `is_admin = true` di database
- RLS policy ini memungkinkan admin untuk melihat dan mengubah semua profil mentor
- Untuk production, pertimbangkan untuk membatasi akses admin lebih spesifik
