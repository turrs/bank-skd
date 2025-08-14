-- Script untuk menambahkan kolom role ke tabel users
-- Jalankan ini di Supabase SQL Editor

-- 1. Tambahkan kolom role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student' 
CHECK (role IN ('student', 'tentor', 'admin'));

-- 2. Update user yang sudah ada menjadi admin jika is_admin = true
UPDATE users 
SET role = 'admin' 
WHERE is_admin = true;

-- 3. Buat index untuk role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Lihat hasil
SELECT id, email, full_name, is_admin, role FROM users;

-- 5. Test update role user tertentu (ganti email sesuai user yang ingin diupdate)
-- UPDATE users SET role = 'tentor' WHERE email = 'your-email@example.com';

-- 6. Reset role jika diperlukan
-- UPDATE users SET role = 'student' WHERE email = 'your-email@example.com';
