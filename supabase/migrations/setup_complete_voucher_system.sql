-- Complete Voucher System Setup
-- This migration will create all missing components for the voucher system

-- 1. Insert default chat duration setting (if chat_settings table exists)
INSERT INTO public.chat_settings (setting_key, setting_value, setting_description) 
VALUES ('chat_duration_minutes', '10', 'Durasi chat yang akan di-load (dalam menit)')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON public.vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_valid_until ON public.vouchers(valid_until);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher_id ON public.voucher_usage(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_user_id ON public.voucher_usage(user_id);

-- 3. Enable RLS on tables that don't have it enabled
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing functions to start fresh
DROP FUNCTION IF EXISTS public.validate_and_apply_voucher(VARCHAR(50), UUID, UUID);
DROP FUNCTION IF EXISTS public.validate_and_apply_voucher(VARCHAR, UUID, UUID);
DROP FUNCTION IF EXISTS public.record_voucher_usage(UUID, UUID, UUID, UUID, numeric(10,2), numeric(10,2), numeric(10,2));
DROP FUNCTION IF EXISTS public.record_voucher_usage(UUID, UUID, UUID, UUID, numeric, numeric, numeric);

-- 5. Create the voucher validation function with explicit parameter handling
CREATE OR REPLACE FUNCTION public.validate_and_apply_voucher(
    p_voucher_code VARCHAR(50) DEFAULT NULL,
    p_package_id UUID DEFAULT NULL,
    p_user_uuid UUID DEFAULT NULL
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
    v_voucher_code := p_voucher_code;
    v_package_id := p_package_id;
    v_user_uuid := p_user_uuid;
    
    -- Validate required parameters
    IF v_voucher_code IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'message', 'Voucher code is required'
        );
    END IF;
    
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

-- 6. Create the voucher usage recording function
CREATE OR REPLACE FUNCTION public.record_voucher_usage(
    p_voucher_id UUID DEFAULT NULL,
    p_package_id UUID DEFAULT NULL,
    p_user_uuid UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_discount_amount numeric(10,2) DEFAULT NULL,
    p_original_price numeric(10,2) DEFAULT NULL,
    p_final_price numeric(10,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_voucher_id UUID;
    v_package_id UUID;
    v_user_uuid UUID;
    v_payment_id UUID;
    v_discount_amount numeric(10,2);
    v_original_price numeric(10,2);
    v_final_price numeric(10,2);
BEGIN
    -- Handle RPC parameter mapping explicitly
    v_voucher_id := p_voucher_id;
    v_package_id := p_package_id;
    v_user_uuid := p_user_uuid;
    v_payment_id := p_payment_id;
    v_discount_amount := p_discount_amount;
    v_original_price := p_original_price;
    v_final_price := p_final_price;
    
    -- Validate required parameters
    IF v_voucher_id IS NULL THEN
        RAISE EXCEPTION 'Voucher ID is required';
    END IF;
    
    IF v_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required';
    END IF;
    
    IF v_user_uuid IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    IF v_discount_amount IS NULL THEN
        RAISE EXCEPTION 'Discount amount is required';
    END IF;
    
    IF v_original_price IS NULL THEN
        RAISE EXCEPTION 'Original price is required';
    END IF;
    
    IF v_final_price IS NULL THEN
        RAISE EXCEPTION 'Final price is required';
    END IF;
    
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
        v_voucher_id, 
        v_user_uuid, 
        v_package_id, 
        v_payment_id,
        v_discount_amount, 
        v_original_price, 
        v_final_price
    );
    
    -- Update voucher usage count
    UPDATE public.vouchers 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = v_voucher_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get chat duration setting
CREATE OR REPLACE FUNCTION public.get_chat_duration_minutes()
RETURNS INTEGER AS $$
DECLARE
    duration_minutes INTEGER;
BEGIN
    SELECT COALESCE(setting_value::INTEGER, 10) INTO duration_minutes
    FROM public.chat_settings 
    WHERE setting_key = 'chat_duration_minutes' AND is_active = true;
    
    RETURN COALESCE(duration_minutes, 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to update chat duration setting
CREATE OR REPLACE FUNCTION public.update_chat_duration_minutes(new_duration INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.chat_settings 
    SET setting_value = new_duration::TEXT,
        updated_at = NOW()
    WHERE setting_key = 'chat_duration_minutes';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Insert sample vouchers (if they don't exist)
INSERT INTO public.vouchers (code, name, description, discount_type, discount_value, min_purchase_amount, usage_limit, valid_until) VALUES
('WELCOME20', 'Welcome Discount', 'Diskon 20% untuk member baru', 'percentage', 20, 50000, 100, NOW() + INTERVAL '30 days'),
('FLAT50K', 'Flat Discount', 'Potongan langsung Rp 50.000', 'fixed', 50000, 100000, 50, NOW() + INTERVAL '60 days'),
('SPECIAL15', 'Special Offer', 'Diskon 15% untuk semua paket', 'percentage', 15, 0, 200, NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

-- 10. Set up RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to read active vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Allow admin users to manage vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Allow users to read their own voucher usage" ON public.voucher_usage;
DROP POLICY IF EXISTS "Allow admin users to read all voucher usage" ON public.voucher_usage;
DROP POLICY IF EXISTS "Allow authenticated users to insert voucher usage" ON public.voucher_usage;

-- Create new policies
CREATE POLICY "Allow authenticated users to read active vouchers" ON public.vouchers
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true 
        AND (valid_until IS NULL OR valid_until > NOW())
        AND used_count < usage_limit
    );

CREATE POLICY "Allow admin users to manage vouchers" ON public.vouchers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Allow users to read their own voucher usage" ON public.voucher_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow admin users to read all voucher usage" ON public.voucher_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Allow authenticated users to insert voucher usage" ON public.voucher_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.vouchers TO authenticated;
GRANT ALL ON public.voucher_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_apply_voucher(VARCHAR(50), UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_voucher_usage(UUID, UUID, UUID, UUID, numeric(10,2), numeric(10,2), numeric(10,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_duration_minutes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chat_duration_minutes(INTEGER) TO authenticated;

-- 12. Final verification
DO $$
BEGIN
    -- Check if functions exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_and_apply_voucher') THEN
        RAISE EXCEPTION 'Function validate_and_apply_voucher was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_voucher_usage') THEN
        RAISE EXCEPTION 'Function record_voucher_usage was not created';
    END IF;
    
    -- Check if vouchers exist
    IF NOT EXISTS (SELECT 1 FROM public.vouchers LIMIT 1) THEN
        RAISE EXCEPTION 'No vouchers found in database';
    END IF;
    
    RAISE NOTICE 'All voucher system components created successfully!';
    RAISE NOTICE 'You can now test voucher validation.';
END $$;
