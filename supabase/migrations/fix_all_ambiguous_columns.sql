-- Fix all ambiguous column references in voucher functions
-- This addresses the "column reference 'package_id' is ambiguous" error

-- 1. Fix the validate_and_apply_voucher function
CREATE OR REPLACE FUNCTION public.validate_and_apply_voucher(
    voucher_code VARCHAR(50),
    package_id UUID,
    user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    voucher_record RECORD;
    package_record RECORD;
    discount_amount numeric(10,2);
    final_price numeric(10,2);
    result JSON;
BEGIN
    -- Get voucher details
    SELECT * INTO voucher_record 
    FROM public.vouchers 
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
    FROM public.question_packages 
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
    -- Use explicit table aliases to avoid ambiguity
    IF EXISTS (
        SELECT 1 FROM public.voucher_usage vu
        WHERE vu.voucher_id = voucher_record.id 
        AND vu.user_id = user_uuid 
        AND vu.package_id = package_id
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

-- 2. Fix the record_voucher_usage function
CREATE OR REPLACE FUNCTION public.record_voucher_usage(
    voucher_id UUID,
    package_id UUID,
    user_uuid UUID,
    payment_id UUID,
    discount_amount numeric(10,2),
    original_price numeric(10,2),
    final_price numeric(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert usage record with explicit column names
    INSERT INTO public.voucher_usage (
        voucher_id, 
        user_id, 
        package_id, 
        payment_id, 
        discount_amount, 
        original_price, 
        final_price
    ) VALUES (
        voucher_id, 
        user_uuid, 
        package_id, 
        payment_id,
        discount_amount, 
        original_price, 
        final_price
    );
    
    -- Update voucher usage count
    UPDATE public.vouchers 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = voucher_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions again
GRANT EXECUTE ON FUNCTION public.validate_and_apply_voucher TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_voucher_usage TO authenticated;
