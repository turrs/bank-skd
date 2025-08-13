-- Fix voucher functions step by step
-- This will help identify any syntax issues

-- Step 1: Drop any existing functions first
DROP FUNCTION IF EXISTS public.validate_and_apply_voucher(VARCHAR(50), UUID, UUID);
DROP FUNCTION IF EXISTS public.validate_and_apply_voucher(VARCHAR, UUID, UUID);
DROP FUNCTION IF EXISTS public.record_voucher_usage(UUID, UUID, UUID, UUID, numeric(10,2), numeric(10,2), numeric(10,2));
DROP FUNCTION IF EXISTS public.record_voucher_usage(UUID, UUID, UUID, UUID, numeric, numeric, numeric);

-- Step 2: Create the first function - validate_and_apply_voucher
CREATE OR REPLACE FUNCTION public.validate_and_apply_voucher(
    p_voucher_code VARCHAR(50),
    p_package_id UUID,
    p_user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    v_voucher_record RECORD;
    v_package_record RECORD;
    v_discount_amount numeric(10,2);
    v_final_price numeric(10,2);
    v_result JSON;
BEGIN
    -- Get voucher details
    SELECT * INTO v_voucher_record 
    FROM public.vouchers 
    WHERE code = p_voucher_code 
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
    WHERE id = p_package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Paket tidak ditemukan'
        );
    END IF;
    
    -- Check if voucher is applicable to this package
    IF array_length(v_voucher_record.applicable_packages, 1) > 0 
       AND NOT (p_package_id::TEXT = ANY(v_voucher_record.applicable_packages)) THEN
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
        AND vu.user_id = p_user_uuid 
        AND vu.package_id = p_package_id
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

-- Step 3: Verify the first function was created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_and_apply_voucher') THEN
        RAISE EXCEPTION 'Function validate_and_apply_voucher was not created';
    ELSE
        RAISE NOTICE 'Function validate_and_apply_voucher created successfully!';
    END IF;
END $$;

-- Step 4: Create the second function - record_voucher_usage
CREATE OR REPLACE FUNCTION public.record_voucher_usage(
    p_voucher_id UUID,
    p_package_id UUID,
    p_user_uuid UUID,
    p_payment_id UUID,
    p_discount_amount numeric(10,2),
    p_original_price numeric(10,2),
    p_final_price numeric(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert usage record
    INSERT INTO public.voucher_usage (
        voucher_id, 
        user_id, 
        package_id, 
        payment_id, 
        discount_amount, 
        original_price, 
        final_price
    ) VALUES (
        p_voucher_id, 
        p_user_uuid, 
        p_package_id, 
        p_payment_id,
        p_discount_amount, 
        p_original_price, 
        p_final_price
    );
    
    -- Update voucher usage count
    UPDATE public.vouchers 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = p_voucher_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify the second function was created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_voucher_usage') THEN
        RAISE EXCEPTION 'Function record_voucher_usage was not created';
    ELSE
        RAISE NOTICE 'Function record_voucher_usage created successfully!';
    END IF;
END $$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_and_apply_voucher(VARCHAR(50), UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_voucher_usage(UUID, UUID, UUID, UUID, numeric(10,2), numeric(10,2), numeric(10,2)) TO authenticated;

-- Step 7: Final verification
DO $$
BEGIN
    RAISE NOTICE 'All functions created and permissions granted successfully!';
    RAISE NOTICE 'You can now test voucher validation.';
END $$;
