-- Fix ambiguous column reference in validate_and_apply_voucher function
-- The issue was with 'package_id' being ambiguous between function parameter and table column

CREATE OR REPLACE FUNCTION validate_and_apply_voucher(
    voucher_code VARCHAR(50),
    package_id UUID,
    user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    voucher_record RECORD;
    package_record RECORD;
    discount_amount DECIMAL(10,2);
    final_price DECIMAL(10,2);
    result JSON;
BEGIN
    -- Get voucher details
    SELECT * INTO voucher_record 
    FROM vouchers 
    WHERE code = voucher_code 
    AND is_active = true 
    AND (valid_until IS NULL OR valid_until > NOW())
    AND used_count < usage_limit;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher tidak valid atau sudah tidak berlaku'
        );
    END IF;
    
    -- Get package details
    SELECT * INTO package_record 
    FROM question_packages 
    WHERE id = package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Paket tidak ditemukan'
        );
    END IF;
    
    -- Check if voucher is applicable to this package
    IF array_length(voucher_record.applicable_packages, 1) > 0 
       AND NOT (package_id::TEXT = ANY(voucher_record.applicable_packages)) THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher tidak berlaku untuk paket ini'
        );
    END IF;
    
    -- Check minimum purchase amount
    IF package_record.price < voucher_record.min_purchase_amount THEN
        RETURN json_build_object(
            'valid', false,
            'message', format('Minimal pembelian Rp %s', voucher_record.min_purchase_amount)
        );
    END IF;
    
    -- Check if user already used this voucher for this package
    IF EXISTS (
        SELECT 1 FROM voucher_usage 
        WHERE voucher_id = voucher_record.id 
        AND user_id = user_uuid 
        AND voucher_usage.package_id = package_id
    ) THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher sudah digunakan untuk paket ini'
        );
    END IF;
    
    -- Calculate discount
    IF voucher_record.discount_type = 'percentage' THEN
        discount_amount = (package_record.price * voucher_record.discount_value / 100);
        -- Apply max discount limit if set
        IF voucher_record.max_discount_amount IS NOT NULL 
           AND discount_amount > voucher_record.max_discount_amount THEN
            discount_amount = voucher_record.max_discount_amount;
        END IF;
    ELSE
        discount_amount = voucher_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed package price
    IF discount_amount > package_record.price THEN
        discount_amount = package_record.price;
    END IF;
    
    final_price = package_record.price - discount_amount;
    
    -- Return success result
    result = json_build_object(
        'valid', true,
        'voucher_id', voucher_record.id,
        'voucher_name', voucher_record.name,
        'discount_type', voucher_record.discount_type,
        'discount_value', voucher_record.discount_value,
        'discount_amount', discount_amount,
        'original_price', package_record.price,
        'final_price', final_price,
        'message', format('Diskon berhasil diterapkan! Harga: Rp %s', final_price)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
