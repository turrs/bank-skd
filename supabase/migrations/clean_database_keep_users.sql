-- Migration: Clean Database (Keep Users Only)
-- This migration will remove all data except user accounts
-- Run this carefully as it will delete all other data permanently

-- Disable RLS temporarily for cleanup
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_package_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE tryout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_tag_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings DISABLE ROW LEVEL SECURITY;

-- Clean chat system
DELETE FROM chat_messages;
DELETE FROM chat_rooms;
DELETE FROM chat_settings;

-- Clean voucher system
DELETE FROM voucher_usage;
DELETE FROM vouchers;

-- Clean payment system
DELETE FROM payments;
DELETE FROM user_package_access;
DELETE FROM payment_settings;

-- Clean tryout system
DELETE FROM tryout_sessions;
DELETE FROM user_answers;
DELETE FROM questions;
DELETE FROM question_packages;
DELETE FROM question_tag_stats;

-- Reset sequences (auto-increment counters)
ALTER SEQUENCE chat_messages_id_seq RESTART WITH 1;
ALTER SEQUENCE chat_rooms_id_seq RESTART WITH 1;
ALTER SEQUENCE chat_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE vouchers_id_seq RESTART WITH 1;
ALTER SEQUENCE voucher_usage_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE user_package_access_id_seq RESTART WITH 1;
ALTER SEQUENCE tryout_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE user_answers_id_seq RESTART WITH 1;
ALTER SEQUENCE questions_id_seq RESTART WITH 1;
ALTER SEQUENCE question_packages_id_seq RESTART WITH 1;
ALTER SEQUENCE question_tag_stats_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_settings_id_seq RESTART WITH 1;

-- Re-enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_package_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tag_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Insert default chat settings
INSERT INTO chat_settings (chat_duration_minutes) VALUES (60);

-- Insert sample vouchers for testing
INSERT INTO vouchers (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_purchase_amount, 
  max_discount_amount, 
  usage_limit, 
  used_count, 
  valid_from, 
  valid_until, 
  is_active
) VALUES 
('WELCOME20', 'Diskon 20% untuk pembelian pertama', 'percentage', 20, 50000, 100000, 100, 0, NOW(), NOW() + INTERVAL '1 year', true),
('FLAT50K', 'Potongan langsung Rp 50.000', 'fixed', 50000, 100000, 50000, 50, 0, NOW(), NOW() + INTERVAL '6 months', true),
('STUDENT15', 'Diskon 15% untuk pelajar', 'percentage', 15, 25000, 75000, 200, 0, NOW(), NOW() + INTERVAL '2 years', true);

-- Insert sample question packages
INSERT INTO question_packages (
  name, 
  description, 
  price, 
  question_count, 
  duration_minutes, 
  is_active
) VALUES 
('Paket Dasar SKD', 'Paket soal dasar untuk persiapan SKD CPNS', 99000, 100, 90, true),
('Paket Menengah SKD', 'Paket soal menengah dengan tingkat kesulitan sedang', 149000, 150, 135, true),
('Paket Lengkap SKD', 'Paket soal lengkap untuk persiapan maksimal', 199000, 200, 180, true),
('Paket Premium SKD', 'Paket soal premium dengan pembahasan detail', 299000, 250, 225, true);

-- Insert sample questions
INSERT INTO questions (
  package_id, 
  question_text, 
  option_a, 
  option_b, 
  option_c, 
  option_d, 
  correct_answer, 
  explanation, 
  difficulty_level
) VALUES 
(1, 'Apa kepanjangan dari SKD?', 'Seleksi Kompetensi Dasar', 'Seleksi Kemampuan Dasar', 'Seleksi Keterampilan Dasar', 'Seleksi Keahlian Dasar', 'A', 'SKD adalah singkatan dari Seleksi Kompetensi Dasar', 'easy'),
(1, 'Berapa lama waktu yang diberikan untuk mengerjakan SKD?', '60 menit', '90 menit', '120 menit', '150 menit', 'B', 'Waktu pengerjaan SKD adalah 90 menit', 'easy'),
(1, 'Apa yang dimaksud dengan TWK dalam SKD?', 'Tes Wawasan Kebangsaan', 'Tes Wawasan Keagamaan', 'Tes Wawasan Keilmuan', 'Tes Wawasan Kesehatan', 'A', 'TWK adalah Tes Wawasan Kebangsaan', 'easy'),
(2, 'Siapa yang menciptakan lagu Indonesia Raya?', 'W.R. Supratman', 'Ibu Sud', 'Kusbini', 'Cornel Simanjuntak', 'A', 'Lagu Indonesia Raya diciptakan oleh Wage Rudolf Supratman', 'medium'),
(2, 'Kapan Indonesia merdeka?', '16 Agustus 1945', '17 Agustus 1945', '18 Agustus 1945', '19 Agustus 1945', 'B', 'Indonesia merdeka pada tanggal 17 Agustus 1945', 'medium'),
(3, 'Apa nama ibukota Indonesia?', 'Bandung', 'Surabaya', 'Jakarta', 'Semarang', 'C', 'Ibukota Indonesia adalah Jakarta', 'easy'),
(3, 'Berapa provinsi di Indonesia saat ini?', '32', '33', '34', '35', 'C', 'Indonesia memiliki 34 provinsi', 'medium'),
(4, 'Apa nama mata uang Indonesia?', 'Ringgit', 'Baht', 'Rupiah', 'Dollar', 'C', 'Mata uang Indonesia adalah Rupiah', 'easy'),
(4, 'Siapa presiden pertama Indonesia?', 'Soeharto', 'Soekarno', 'Habibie', 'Megawati', 'B', 'Presiden pertama Indonesia adalah Ir. Soekarno', 'medium');

-- Insert sample payment settings
INSERT INTO payment_settings (
  midtrans_server_key, 
  midtrans_client_key, 
  midtrans_merchant_id, 
  is_active
) VALUES 
('SB-Mid-server-YourSandboxServerKey', 'Mid-client-zguOU-eS_hhsufkC', 'G123456789', true);

-- Verify cleanup
SELECT 
  'Users' as table_name, COUNT(*) as record_count 
FROM auth.users
UNION ALL
SELECT 'Chat Messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'Chat Rooms', COUNT(*) FROM chat_rooms
UNION ALL
SELECT 'Vouchers', COUNT(*) FROM vouchers
UNION ALL
SELECT 'Question Packages', COUNT(*) FROM question_packages
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'Payment Settings', COUNT(*) FROM payment_settings;

-- Success message
SELECT 'Database cleaned successfully! All data removed except users. Sample data inserted for testing.' as status;
