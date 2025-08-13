-- Fix voucher precision issues and add helper function
-- This migration addresses the "invalid input syntax for type integer" error

-- Create function to increment voucher usage count
CREATE OR REPLACE FUNCTION increment_voucher_usage(voucher_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE vouchers 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = voucher_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing vouchers to ensure proper data types
UPDATE vouchers 
SET discount_value = ROUND(discount_value::numeric, 2),
    min_purchase_amount = ROUND(min_purchase_amount::numeric, 2),
    max_discount_amount = CASE 
        WHEN max_discount_amount IS NOT NULL 
        THEN ROUND(max_discount_amount::numeric, 2)
        ELSE NULL 
    END
WHERE discount_value IS NOT NULL;

-- Ensure all price fields are properly rounded
UPDATE question_packages 
SET price = ROUND(price::numeric, 2)
WHERE price IS NOT NULL;

-- Add comment for future reference
COMMENT ON FUNCTION increment_voucher_usage(UUID) IS 'Increment voucher usage count safely';
