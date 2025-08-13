-- Complete Voucher System Migration
-- This adds the missing tables and fixes the validation function

-- 1. Create vouchers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vouchers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying(50) NOT NULL UNIQUE,
    name character varying(255) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10,2) NOT NULL,
    min_purchase_amount numeric(10,2) DEFAULT 0,
    max_discount_amount numeric(10,2),
    usage_limit integer DEFAULT 1,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    applicable_packages text[], -- Array of package IDs, empty means all packages
    created_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vouchers_pkey PRIMARY KEY (id)
);

-- 2. Create chat_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    setting_key character varying NOT NULL UNIQUE,
    setting_value text NOT NULL,
    setting_description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_settings_pkey PRIMARY KEY (id)
);

-- 3. Insert default chat duration setting
INSERT INTO public.chat_settings (setting_key, setting_value, setting_description) 
VALUES ('chat_duration_minutes', '10', 'Durasi chat yang akan di-load (dalam menit)')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON public.vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_valid_until ON public.vouchers(valid_until);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher_id ON public.voucher_usage(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usage_user_id ON public.voucher_usage(user_id);

-- 5. Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for vouchers
DROP POLICY IF EXISTS "Allow authenticated users to read active vouchers" ON public.vouchers;
CREATE POLICY "Allow authenticated users to read active vouchers" ON public.vouchers
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true 
        AND (valid_until IS NULL OR valid_until > NOW())
        AND used_count < usage_limit
    );

DROP POLICY IF EXISTS "Allow admin users to manage vouchers" ON public.vouchers;
CREATE POLICY "Allow admin users to manage vouchers" ON public.vouchers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- 7. RLS Policies for voucher_usage
DROP POLICY IF EXISTS "Allow users to read their own voucher usage" ON public.voucher_usage;
CREATE POLICY "Allow users to read their own voucher usage" ON public.voucher_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin users to read all voucher usage" ON public.voucher_usage;
CREATE POLICY "Allow admin users to read all voucher usage" ON public.voucher_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Allow authenticated users to insert voucher usage" ON public.voucher_usage;
CREATE POLICY "Allow authenticated users to insert voucher usage" ON public.voucher_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policies for chat_settings
DROP POLICY IF EXISTS "Allow authenticated users to read chat settings" ON public.chat_settings;
CREATE POLICY "Allow authenticated users to read chat settings" ON public.chat_settings
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin users to update chat settings" ON public.chat_settings;
CREATE POLICY "Allow admin users to update chat settings" ON public.chat_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- 9. Create or replace the voucher validation function with proper table references
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
    IF EXISTS (
        SELECT 1 FROM public.voucher_usage 
        WHERE voucher_id = voucher_record.id 
        AND user_id = user_uuid 
        AND public.voucher_usage.package_id = package_id
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

-- 10. Create or replace the voucher usage recording function
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
    -- Insert usage record
    INSERT INTO public.voucher_usage (
        voucher_id, user_id, package_id, payment_id, 
        discount_amount, original_price, final_price
    ) VALUES (
        voucher_id, user_uuid, package_id, payment_id,
        discount_amount, original_price, final_price
    );
    
    -- Update voucher usage count
    UPDATE public.vouchers 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = voucher_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get chat duration setting
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

-- 12. Create function to update chat duration setting
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

-- 13. Insert some sample vouchers
INSERT INTO public.vouchers (code, name, description, discount_type, discount_value, min_purchase_amount, usage_limit, valid_until) VALUES
('WELCOME20', 'Welcome Discount', 'Diskon 20% untuk member baru', 'percentage', 20, 50000, 100, NOW() + INTERVAL '30 days'),
('FLAT50K', 'Flat Discount', 'Potongan langsung Rp 50.000', 'fixed', 50000, 100000, 50, NOW() + INTERVAL '60 days'),
('SPECIAL15', 'Special Offer', 'Diskon 15% untuk semua paket', 'percentage', 15, 0, 200, NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.vouchers TO authenticated;
GRANT ALL ON public.voucher_usage TO authenticated;
GRANT ALL ON public.chat_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_apply_voucher TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_voucher_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_duration_minutes TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chat_duration_minutes TO authenticated;
