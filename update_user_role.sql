-- Script untuk mengupdate user role untuk testing
-- Jalankan ini di Supabase SQL Editor

-- Lihat user yang ada
SELECT id, email, full_name, is_admin, role FROM users;

-- Update user tertentu menjadi tentor (ganti email sesuai user yang ingin diupdate)
UPDATE users 
SET role = 'tentor' 
WHERE email = 'user@example.com'; -- Ganti dengan email user yang ingin diupdate

-- Update user tertentu menjadi admin
UPDATE users 
SET role = 'admin', is_admin = true 
WHERE email = 'admin@example.com'; -- Ganti dengan email admin

-- Lihat hasil update
SELECT id, email, full_name, is_admin, role FROM users;

-- Reset user menjadi student jika diperlukan
UPDATE users 
SET role = 'student' 
WHERE email = 'user@example.com'; -- Ganti dengan email user yang ingin direset
