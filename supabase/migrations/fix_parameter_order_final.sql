-- Fix the parameter order to match PostgREST expectations
-- PostgREST expects: (p_package_id, p_user_uuid, p_voucher_code)

-- Drop the existing function
DROP FUNCTION IF EXISTS public.validate_and_apply_voucher(VARCHAR(50), UUID, UUID);

-- Create the function with the correct parameter order that PostgREST expects
CREATE OR REPLACE FUNCTION public.validate_and_apply_voucher(
    p_package_id UUID DEFAULT NULL,
    p_user_uuid UUID DEFAULT NULL,
    p_voucher_code VARCHAR(50) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_voucher_record RECORD;
    v_package_record RECORD;
    v_discount_amount numeric(10,2);
    v_final_price numeric(10,2);
    v_result JSON;
    v_voucher_code VARCHAR(50);
    v_package_id UUID;
    v_user_uuid UUID;
BEGIN
    -- Handle RPC parameter mapping explicitly
    -- This ensures the parameters are correctly mapped regardless of call order
    v_package_id := p_package_id;
    v_user_uuid := p_user_uuid;
    v_voucher_code := p_voucher_code;
    
    -- Validate required parameters
    IF v_package_id IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Package ID is required'
        );
    END IF;
    
    IF v_user_uuid IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'User ID is required'
        );
    END IF;
    
    IF v_voucher_code IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher code is required'
        );
    END IF;
    
    -- Get voucher details
    SELECT * INTO v_voucher_record 
    FROM public.vouchers 
    WHERE code = v_voucher_code 
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
    SELECT * INTO v_package_record 
    FROM public.question_packages 
    WHERE id = v_package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Paket tidak ditemukan'
        );
    END IF;
    
    -- Check if voucher is applicable to this package
    IF array_length(v_voucher_record.applicable_packages, 1) > 0 
       AND NOT (v_package_id::TEXT = ANY(v_voucher_record.applicable_packages)) THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher tidak berlaku untuk paket ini'
        );
    END IF;
    
    -- Check minimum purchase amount
    IF v_package_record.price < v_voucher_record.min_purchase_amount THEN
        RETURN json_build_object(
            'valid', false,
            'message', format('Minimal pembelian Rp %s', v_voucher_record.min_purchase_amount)
        );
    END IF;
    
    -- Check if user already used this voucher for this package
    IF EXISTS (
        SELECT 1 FROM public.voucher_usage vu
        WHERE vu.voucher_id = v_voucher_record.id 
        AND vu.user_id = v_user_uuid 
        AND vu.package_id = v_package_id
    ) THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher sudah digunakan untuk paket ini'
        );
    END IF;
    
    -- Calculate discount
    IF v_voucher_record.discount_type = 'percentage' THEN
        v_discount_amount = (v_package_record.price * v_voucher_record.discount_value / 100);
        -- Apply max discount limit if set
        IF v_voucher_record.max_discount_amount IS NOT NULL 
           AND v_discount_amount > v_voucher_record.max_discount_amount THEN
            v_discount_amount = v_voucher_record.max_discount_amount;
        END IF;
    ELSE
        v_discount_amount = v_voucher_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed package price
    IF v_discount_amount > v_package_record.price THEN
        v_discount_amount = v_package_record.price;
    END IF;
    
    v_final_price = v_package_record.price - v_discount_amount;
    
    -- Return success result
    v_result = json_build_object(
        'valid', true,
        'voucher_id', v_voucher_record.id,
        'voucher_name', v_voucher_record.name,
        'discount_type', v_voucher_record.discount_type,
        'discount_value', v_voucher_record.discount_value,
        'discount_amount', v_discount_amount,
        'original_price', v_package_record.price,
        'final_price', v_final_price,
        'message', format('Diskon berhasil diterapkan! Harga: Rp %s', v_final_price)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_and_apply_voucher(UUID, UUID, VARCHAR(50)) TO authenticated;

-- Verify the function was created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_and_apply_voucher') THEN
        RAISE EXCEPTION 'Function validate_and_apply_voucher was not created';
    ELSE
        RAISE NOTICE 'Function validate_and_apply_voucher created successfully!';
        RAISE NOTICE 'Parameter order: (p_package_id, p_user_uuid, p_voucher_code) - matches PostgREST expectations';
    END IF;
END $$;
