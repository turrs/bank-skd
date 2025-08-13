-- Create chat settings table for admin configuration
CREATE TABLE IF NOT EXISTS chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default chat duration setting (10 minutes)
INSERT INTO chat_settings (setting_key, setting_value, setting_description) 
VALUES ('chat_duration_minutes', '10', 'Duration in minutes for chat messages to be loaded (10, 30, 60, 1440, 4320, 10080, 43200)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create RLS policies
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read chat settings" ON chat_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to update settings
CREATE POLICY "Allow admin users to update chat settings" ON chat_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Create function to get chat duration setting
CREATE OR REPLACE FUNCTION get_chat_duration_minutes()
RETURNS INTEGER AS $$
DECLARE
    duration_minutes INTEGER;
BEGIN
    SELECT COALESCE(
        (SELECT setting_value::INTEGER FROM chat_settings WHERE setting_key = 'chat_duration_minutes'),
        10  -- Default to 10 minutes if setting not found
    ) INTO duration_minutes;
    
    RETURN duration_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update chat duration setting (admin only)
CREATE OR REPLACE FUNCTION update_chat_duration_minutes(new_duration INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT COALESCE(users.is_admin, false) INTO is_admin
    FROM users 
    WHERE users.id = auth.uid();
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only admin users can update chat settings';
    END IF;
    
    -- Validate duration (must be one of the allowed values)
    IF new_duration NOT IN (10, 30, 60, 1440, 4320, 10080, 43200) THEN
        RAISE EXCEPTION 'Invalid duration. Must be one of: 10, 30, 60, 1440, 4320, 10080, 43200 minutes';
    END IF;
    
    -- Update setting
    UPDATE chat_settings 
    SET setting_value = new_duration::TEXT,
        updated_at = NOW()
    WHERE setting_key = 'chat_duration_minutes';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
