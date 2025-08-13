-- Fix Payment Amount Precision Issues
-- This migration ensures all amount fields are properly rounded integers

-- 1. Update existing payments table to round amounts
UPDATE payments 
SET 
  amount = ROUND(amount),
  discount_amount = ROUND(COALESCE(discount_amount, 0))
WHERE amount IS NOT NULL;

-- 2. Update question_packages table to round prices
UPDATE question_packages 
SET 
  price = ROUND(price),
  original_price = ROUND(COALESCE(original_price, price))
WHERE price IS NOT NULL;

-- 3. Update vouchers table to round amounts
UPDATE vouchers 
SET 
  discount_value = ROUND(COALESCE(discount_value, 0)),
  min_purchase_amount = ROUND(COALESCE(min_purchase_amount, 0)),
  max_discount_amount = ROUND(COALESCE(max_discount_amount, 0))
WHERE discount_value IS NOT NULL;

-- 4. Update voucher_usage table to round amounts
UPDATE voucher_usage 
SET 
  discount_amount = ROUND(COALESCE(discount_amount, 0)),
  final_amount = ROUND(COALESCE(final_amount, 0))
WHERE discount_amount IS NOT NULL;

-- 5. Alter table columns to ensure INTEGER type (if needed)
-- Note: Only run this if your columns are not already INTEGER
-- ALTER TABLE payments ALTER COLUMN amount TYPE INTEGER USING ROUND(amount);
-- ALTER TABLE payments ALTER COLUMN discount_amount TYPE INTEGER USING ROUND(COALESCE(discount_amount, 0));
-- ALTER TABLE question_packages ALTER COLUMN price TYPE INTEGER USING ROUND(price);
-- ALTER TABLE question_packages ALTER COLUMN original_price TYPE INTEGER USING ROUND(COALESCE(original_price, price));

-- 6. Add constraints to prevent future decimal values
ALTER TABLE payments 
ADD CONSTRAINT payments_amount_integer CHECK (amount = ROUND(amount));

ALTER TABLE payments 
ADD CONSTRAINT payments_discount_amount_integer CHECK (discount_amount = ROUND(COALESCE(discount_amount, 0)));

-- 7. Verify the fixes
SELECT 
  'payments' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN amount = ROUND(amount) THEN 1 END) as valid_amounts,
  COUNT(CASE WHEN discount_amount = ROUND(COALESCE(discount_amount, 0)) THEN 1 END) as valid_discounts
FROM payments
UNION ALL
SELECT 
  'question_packages' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN price = ROUND(price) THEN 1 END) as valid_prices,
  COUNT(CASE WHEN original_price = ROUND(COALESCE(original_price, price)) THEN 1 END) as valid_original_prices
FROM question_packages
UNION ALL
SELECT 
  'vouchers' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN discount_value = ROUND(COALESCE(discount_value, 0)) THEN 1 END) as valid_discounts,
  COUNT(CASE WHEN min_purchase_amount = ROUND(COALESCE(min_purchase_amount, 0)) THEN 1 END) as valid_min_amounts
FROM vouchers;
