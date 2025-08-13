-- Create voucher system tables
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    applicable_packages TEXT[], -- Array of package IDs, empty means all packages
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voucher usage tracking table
CREATE TABLE IF NOT EXISTS voucher_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES question_packages(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voucher_id, user_id, package_id) -- Prevent multiple usage of same voucher by same user for same package
);

-- Create indexes for better performance
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_active ON vouchers(is_active);
CREATE INDEX idx_vouchers_valid_until ON vouchers(valid_until);
CREATE INDEX idx_voucher_usage_voucher_id ON voucher_usage(voucher_id);
CREATE INDEX idx_voucher_usage_user_id ON voucher_usage(user_id);

-- Enable RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vouchers
CREATE POLICY "Allow authenticated users to read active vouchers" ON vouchers
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true 
        AND (valid_until IS NULL OR valid_until > NOW())
        AND used_count < usage_limit
    );

CREATE POLICY "Allow admin users to manage vouchers" ON vouchers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- RLS Policies for voucher_usage
CREATE POLICY "Allow users to read their own voucher usage" ON voucher_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow admin users to read all voucher usage" ON voucher_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Allow authenticated users to insert voucher usage" ON voucher_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to validate and apply voucher
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

-- Function to record voucher usage
CREATE OR REPLACE FUNCTION record_voucher_usage(
    voucher_id UUID,
    package_id UUID,
    user_uuid UUID,
    payment_id UUID,
    discount_amount DECIMAL(10,2),
    original_price DECIMAL(10,2),
    final_price DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert usage record
    INSERT INTO voucher_usage (
        voucher_id, user_id, package_id, payment_id, 
        discount_amount, original_price, final_price
    ) VALUES (
        voucher_id, user_uuid, package_id, payment_id,
        discount_amount, original_price, final_price
    );
    
    -- Update voucher usage count
    UPDATE vouchers 
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = voucher_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample vouchers
INSERT INTO vouchers (code, name, description, discount_type, discount_value, min_purchase_amount, usage_limit, valid_until) VALUES
('WELCOME20', 'Welcome Discount', 'Diskon 20% untuk member baru', 'percentage', 20, 50000, 100, NOW() + INTERVAL '30 days'),
('FLAT50K', 'Flat Discount', 'Potongan langsung Rp 50.000', 'fixed', 50000, 100000, 50, NOW() + INTERVAL '60 days'),
('SPECIAL15', 'Special Offer', 'Diskon 15% untuk semua paket', 'percentage', 15, 0, 200, NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;
