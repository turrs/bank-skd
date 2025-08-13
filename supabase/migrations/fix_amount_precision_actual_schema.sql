-- Fix Amount Precision Issues - Based on Actual Schema
-- This migration ensures all amount fields are properly handled

-- 1. Update payments table - all fields are already INTEGER, no changes needed
-- payments.amount: integer
-- payments.discount_amount: integer
-- payments.original_amount: integer
SELECT 'payments table already uses INTEGER, no changes needed' as status;

-- 2. Update question_packages table - all fields are already INTEGER, no changes needed
-- question_packages.price: integer
-- question_packages.original_price: integer
SELECT 'question_packages table already uses INTEGER, no changes needed' as status;

-- 3. Update vouchers table - convert numeric to integer for consistency
-- vouchers.discount_value: numeric -> integer
-- vouchers.min_purchase_amount: numeric -> integer  
-- vouchers.max_discount_amount: numeric -> integer
UPDATE vouchers 
SET 
  discount_value = ROUND(COALESCE(discount_value, 0)),
  min_purchase_amount = ROUND(COALESCE(min_purchase_amount, 0)),
  max_discount_amount = ROUND(COALESCE(max_discount_amount, 0))
WHERE discount_value IS NOT NULL;

-- 4. Update voucher_usage table - convert numeric to integer for consistency
-- voucher_usage.discount_amount: numeric -> integer
-- voucher_usage.original_price: numeric -> integer
-- voucher_usage.final_price: numeric -> integer
UPDATE voucher_usage 
SET 
  discount_amount = ROUND(COALESCE(discount_amount, 0)),
  original_price = ROUND(COALESCE(original_price, 0)),
  final_price = ROUND(COALESCE(final_price, 0))
WHERE discount_amount IS NOT NULL;

-- 5. Alter table columns to ensure INTEGER type for consistency
-- Convert vouchers table numeric columns to integer
ALTER TABLE vouchers 
ALTER COLUMN discount_value TYPE INTEGER USING ROUND(COALESCE(discount_value, 0));

ALTER TABLE vouchers 
ALTER COLUMN min_purchase_amount TYPE INTEGER USING ROUND(COALESCE(min_purchase_amount, 0));

ALTER TABLE vouchers 
ALTER COLUMN max_discount_amount TYPE INTEGER USING ROUND(COALESCE(max_discount_amount, 0));

-- Convert voucher_usage table numeric columns to integer
ALTER TABLE voucher_usage 
ALTER COLUMN discount_amount TYPE INTEGER USING ROUND(COALESCE(discount_amount, 0));

ALTER TABLE voucher_usage 
ALTER COLUMN original_price TYPE INTEGER USING ROUND(COALESCE(original_price, 0));

ALTER TABLE voucher_usage 
ALTER COLUMN final_price TYPE INTEGER USING ROUND(COALESCE(final_price, 0));

-- 6. Add constraints to prevent future decimal values
-- Add constraints to vouchers table
ALTER TABLE vouchers 
ADD CONSTRAINT vouchers_discount_value_integer CHECK (discount_value = ROUND(COALESCE(discount_value, 0)));

ALTER TABLE vouchers 
ADD CONSTRAINT vouchers_min_purchase_amount_integer CHECK (min_purchase_amount = ROUND(COALESCE(min_purchase_amount, 0)));

ALTER TABLE vouchers 
ADD CONSTRAINT vouchers_max_discount_amount_integer CHECK (max_discount_amount = ROUND(COALESCE(max_discount_amount, 0)));

-- Add constraints to voucher_usage table
ALTER TABLE voucher_usage 
ADD CONSTRAINT voucher_usage_discount_amount_integer CHECK (discount_amount = ROUND(COALESCE(discount_amount, 0)));

ALTER TABLE voucher_usage 
ADD CONSTRAINT voucher_usage_original_price_integer CHECK (original_price = ROUND(COALESCE(original_price, 0)));

ALTER TABLE voucher_usage 
ADD CONSTRAINT voucher_usage_final_price_integer CHECK (final_price = ROUND(COALESCE(final_price, 0)));

-- 7. Verify the fixes
SELECT 
  'vouchers' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN discount_value = ROUND(COALESCE(discount_value, 0)) THEN 1 END) as valid_discounts,
  COUNT(CASE WHEN min_purchase_amount = ROUND(COALESCE(min_purchase_amount, 0)) THEN 1 END) as valid_min_amounts,
  COUNT(CASE WHEN max_discount_amount = ROUND(COALESCE(max_discount_amount, 0)) THEN 1 END) as valid_max_amounts
FROM vouchers
UNION ALL
SELECT 
  'voucher_usage' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN discount_amount = ROUND(COALESCE(discount_amount, 0)) THEN 1 END) as valid_discounts,
  COUNT(CASE WHEN original_price = ROUND(COALESCE(original_price, 0)) THEN 1 END) as valid_original_prices,
  COUNT(CASE WHEN final_price = ROUND(COALESCE(final_price, 0)) THEN 1 END) as valid_final_prices
FROM voucher_usage
UNION ALL
SELECT 
  'payments' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN amount = ROUND(COALESCE(amount, 0)) THEN 1 END) as valid_amounts,
  COUNT(CASE WHEN discount_amount = ROUND(COALESCE(discount_amount, 0)) THEN 1 END) as valid_discounts,
  COUNT(CASE WHEN original_amount = ROUND(COALESCE(original_amount, 0)) THEN 1 END) as valid_original_amounts
FROM payments
UNION ALL
SELECT 
  'question_packages' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN price = ROUND(COALESCE(price, 0)) THEN 1 END) as valid_prices,
  COUNT(CASE WHEN original_price = ROUND(COALESCE(original_price, 0)) THEN 1 END) as valid_original_prices,
  0 as valid_final_prices
FROM question_packages;

-- 8. Final status
SELECT 'Migration completed successfully - All amount fields converted to INTEGER' as final_status;
