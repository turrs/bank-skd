-- Check actual table structure before running migration
-- This will help us understand what columns actually exist

-- 1. Check payments table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- 2. Check question_packages table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'question_packages' 
ORDER BY ordinal_position;

-- 3. Check vouchers table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vouchers' 
ORDER BY ordinal_position;

-- 4. Check voucher_usage table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'voucher_usage' 
ORDER BY ordinal_position;

-- 5. Check sample data to see what values exist
SELECT 'payments' as table_name, COUNT(*) as total_records FROM payments
UNION ALL
SELECT 'question_packages' as table_name, COUNT(*) as total_records FROM question_packages
UNION ALL
SELECT 'vouchers' as table_name, COUNT(*) as total_records FROM vouchers
UNION ALL
SELECT 'voucher_usage' as table_name, COUNT(*) as total_records FROM voucher_usage;
