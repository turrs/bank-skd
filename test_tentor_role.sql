-- Test Script untuk Sistem Role Tentor
-- Jalankan setelah migration berhasil

-- 1. Check struktur tabel yang baru dibuat
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('tentor_profiles', 'tentor_sessions', 'tentor_availability')
ORDER BY table_name, ordinal_position;

-- 2. Check RLS policies
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
WHERE tablename LIKE 'tentor%'
ORDER BY tablename, policyname;

-- 3. Insert sample tentor users
INSERT INTO users (email, full_name, role, is_admin) VALUES 
('tentor1@skdcpns.com', 'Tentor SKD 1', 'tentor', false),
('tentor2@skdcpns.com', 'Tentor SKD 2', 'tentor', false),
('tentor3@skdcpns.com', 'Tentor SKD 3', 'tentor', false)
ON CONFLICT (email) DO NOTHING;

-- 4. Insert sample tentor profiles
INSERT INTO tentor_profiles (user_id, specialization, experience_years, education_level, bio, hourly_rate, is_verified, is_active, whatsapp, telegram) VALUES
(
    (SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), 
    ARRAY['TWK', 'TIU'], 
    3, 
    'S1', 
    'Tentor berpengalaman di bidang TWK dan TIU dengan pengalaman 3 tahun mengajar SKD CPNS. Spesialis dalam materi Pancasila, UUD 1945, dan logika matematika.', 
    100000, 
    true, 
    true,
    '+6281234567890',
    '@tentor1_skd'
),
(
    (SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), 
    ARRAY['TKP'], 
    5, 
    'S2', 
    'Spesialis TKP dengan pengalaman 5 tahun. Ahli dalam pelayanan publik, profesionalisme, dan anti korupsi. Berpengalaman melatih ribuan peserta SKD CPNS.', 
    150000, 
    true, 
    true,
    '+6281234567891',
    '@tentor2_skd'
),
(
    (SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 
    ARRAY['TWK', 'TIU', 'TKP'], 
    7, 
    'S1', 
    'Tentor all-round dengan pengalaman 7 tahun. Menguasai semua materi SKD CPNS dan memiliki track record tinggi dalam membantu peserta lulus SKD.', 
    200000, 
    true, 
    true,
    '+6281234567892',
    '@tentor3_skd'
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Insert sample tentor availability
INSERT INTO tentor_availability (tentor_id, day_of_week, start_time, end_time, is_available) VALUES
-- Tentor 1: Senin-Jumat, 09:00-17:00
((SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), 1, '09:00', '17:00', true),
((SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), 2, '09:00', '17:00', true),
((SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), 3, '09:00', '17:00', true),
((SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), 4, '09:00', '17:00', true),
((SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), 5, '09:00', '17:00', true),

-- Tentor 2: Selasa-Sabtu, 13:00-21:00
((SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), 2, '13:00', '21:00', true),
((SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), 3, '13:00', '21:00', true),
((SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), 4, '13:00', '21:00', true),
((SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), 5, '13:00', '21:00', true),
((SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), 6, '13:00', '21:00', true),

-- Tentor 3: Setiap hari, 08:00-22:00
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 0, '08:00', '22:00', true),
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 1, '08:00', '22:00', true),
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 2, '08:00', '22:00', true),
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 3, '08:00', '22:00', true),
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 4, '08:00', '22:00', true),
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 5, '08:00', '22:00', true),
((SELECT id FROM users WHERE email = 'tentor3@skdcpns.com'), 6, '08:00', '22:00', true);

-- 6. Insert sample tentor sessions
INSERT INTO tentor_sessions (tentor_id, student_id, package_id, session_type, session_date, duration_minutes, status, amount, payment_status) VALUES
(
    (SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'),
    (SELECT id FROM users WHERE email != 'tentor1@skdcpns.com' AND role = 'student' LIMIT 1),
    (SELECT id FROM question_packages LIMIT 1),
    'consultation',
    NOW() + INTERVAL '1 day',
    60,
    'scheduled',
    100000,
    'pending'
),
(
    (SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'),
    (SELECT id FROM users WHERE email != 'tentor2@skdcpns.com' AND role = 'student' LIMIT 1),
    (SELECT id FROM question_packages LIMIT 1),
    'review',
    NOW() + INTERVAL '2 days',
    90,
    'scheduled',
    225000,
    'pending'
);

-- 7. Verify data insertion
SELECT 'Users with tentor role:' as info;
SELECT id, email, full_name, role, is_admin FROM users WHERE role = 'tentor';

SELECT 'Tentor profiles:' as info;
SELECT 
    tp.id,
    u.email,
    tp.specialization,
    tp.experience_years,
    tp.education_level,
    tp.hourly_rate,
    tp.is_verified,
    tp.is_active
FROM tentor_profiles tp
JOIN users u ON tp.user_id = u.id;

SELECT 'Tentor availability:' as info;
SELECT 
    u.email,
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    ta.is_available
FROM tentor_availability ta
JOIN users u ON ta.tentor_id = u.id
ORDER BY u.email, ta.day_of_week, ta.start_time;

SELECT 'Tentor sessions:' as info;
SELECT 
    ts.id,
    t.email as tentor_email,
    s.email as student_email,
    ts.session_type,
    ts.session_date,
    ts.duration_minutes,
    ts.status,
    ts.amount,
    ts.payment_status
FROM tentor_sessions ts
JOIN users t ON ts.tentor_id = t.id
JOIN users s ON ts.student_id = s.id;

-- 8. Test queries for different user roles
SELECT 'Testing role-based access:' as info;

-- Check if role field is working
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
    COUNT(CASE WHEN role = 'tentor' THEN 1 END) as tentors,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM users;

-- Check tentor specializations
SELECT 
    u.full_name,
    tp.specialization,
    tp.experience_years,
    tp.hourly_rate
FROM users u
JOIN tentor_profiles tp ON u.id = tp.user_id
WHERE u.role = 'tentor' AND tp.is_verified = true AND tp.is_active = true
ORDER BY tp.experience_years DESC;

-- Check available time slots for a specific tentor
SELECT 
    u.full_name as tentor_name,
    CASE ta.day_of_week
        WHEN 0 THEN 'Minggu'
        WHEN 1 THEN 'Senin'
        WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu'
        WHEN 4 THEN 'Kamis'
        WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu'
    END as day_name,
    ta.start_time,
    ta.end_time
FROM tentor_availability ta
JOIN users u ON ta.tentor_id = u.id
WHERE u.email = 'tentor1@skdcpns.com' AND ta.is_available = true
ORDER BY ta.day_of_week, ta.start_time;

-- 9. Cleanup (optional - uncomment if you want to remove test data)
-- DELETE FROM tentor_sessions WHERE tentor_id IN (SELECT id FROM users WHERE email LIKE 'tentor%@skdcpns.com');
-- DELETE FROM tentor_availability WHERE tentor_id IN (SELECT id FROM users WHERE email LIKE 'tentor%@skdcpns.com');
-- DELETE FROM tentor_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'tentor%@skdcpns.com');
-- DELETE FROM users WHERE email LIKE 'tentor%@skdcpns.com';
