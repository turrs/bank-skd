-- Migration: Add tentor role support to users table
-- Date: 2024-12-19
-- Description: Add role-based access control for tentor accounts

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student' 
CHECK (role IN ('student', 'tentor', 'admin'));

-- Update existing admin users to have 'admin' role
UPDATE users 
SET role = 'admin' 
WHERE is_admin = true;

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create tentor_profiles table for additional tentor information
CREATE TABLE IF NOT EXISTS tentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Tentor specific fields
  specialization TEXT[], -- Array of subjects they can teach
  experience_years INTEGER DEFAULT 0,
  education_level TEXT, -- S1, S2, S3, etc.
  certification TEXT[], -- Array of certifications
  bio TEXT, -- Tentor biography
  hourly_rate INTEGER DEFAULT 0, -- Rate per hour in IDR
  is_verified BOOLEAN DEFAULT FALSE, -- Admin verification status
  is_active BOOLEAN DEFAULT TRUE, -- Whether tentor is accepting students
  
  -- Contact information
  whatsapp TEXT,
  telegram TEXT,
  linkedin TEXT,
  
  -- Unique constraint
  UNIQUE(user_id)
);

-- Create index for tentor profiles
CREATE INDEX IF NOT EXISTS idx_tentor_profiles_user_id ON tentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tentor_profiles_verified ON tentor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_tentor_profiles_active ON tentor_profiles(is_active);

-- Create tentor_sessions table for tracking tentor-student interactions
CREATE TABLE IF NOT EXISTS tentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  tentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES question_packages(id) ON DELETE SET NULL,
  
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('consultation', 'review', 'practice', 'assessment')),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  
  notes TEXT, -- Session notes from tentor
  student_feedback TEXT, -- Feedback from student
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Student rating (1-5 stars)
  
  -- Payment related
  amount INTEGER DEFAULT 0, -- Session cost
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  
  -- Unique constraint
  UNIQUE(tentor_id, student_id, session_date)
);

-- Create indexes for tentor sessions
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_tentor_id ON tentor_sessions(tentor_id);
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_student_id ON tentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_status ON tentor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_date ON tentor_sessions(session_date);

-- Create tentor_availability table for scheduling
CREATE TABLE IF NOT EXISTS tentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  tentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Unique constraint
  UNIQUE(tentor_id, day_of_week, start_time)
);

-- Create index for tentor availability
CREATE INDEX IF NOT EXISTS idx_tentor_availability_tentor_id ON tentor_availability(tentor_id);
CREATE INDEX IF NOT EXISTS idx_tentor_availability_day_time ON tentor_availability(day_of_week, start_time);

-- Enable RLS on new tables
ALTER TABLE tentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentor_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tentor_profiles
CREATE POLICY "tentor_profiles_select_public" ON tentor_profiles FOR SELECT USING (is_verified = true AND is_active = true);
CREATE POLICY "tentor_profiles_select_own" ON tentor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tentor_profiles_insert_own" ON tentor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tentor_profiles_update_own" ON tentor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tentor_profiles_delete_own" ON tentor_profiles FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tentor_sessions
CREATE POLICY "tentor_sessions_select_participant" ON tentor_sessions FOR SELECT USING (auth.uid() IN (tentor_id, student_id));
CREATE POLICY "tentor_sessions_insert_participant" ON tentor_sessions FOR INSERT WITH CHECK (auth.uid() IN (tentor_id, student_id));
CREATE POLICY "tentor_sessions_update_participant" ON tentor_sessions FOR UPDATE USING (auth.uid() IN (tentor_id, student_id));
CREATE POLICY "tentor_sessions_delete_participant" ON tentor_sessions FOR DELETE USING (auth.uid() IN (tentor_id, student_id));

-- Create RLS policies for tentor_availability
CREATE POLICY "tentor_availability_select_public" ON tentor_availability FOR SELECT USING (true);
CREATE POLICY "tentor_availability_insert_own" ON tentor_availability FOR INSERT WITH CHECK (auth.uid() = tentor_id);
CREATE POLICY "tentor_availability_update_own" ON tentor_availability FOR UPDATE USING (auth.uid() = tentor_id);
CREATE POLICY "tentor_availability_delete_own" ON tentor_availability FOR DELETE USING (auth.uid() = tentor_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tentor_profiles_updated_at BEFORE UPDATE ON tentor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tentor_sessions_updated_at BEFORE UPDATE ON tentor_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tentor data (optional - for testing)
-- INSERT INTO users (email, full_name, role, is_admin) VALUES 
-- ('tentor1@skdcpns.com', 'Tentor SKD 1', 'tentor', false),
-- ('tentor2@skdcpns.com', 'Tentor SKD 2', 'tentor', false);

-- Insert sample tentor profiles (optional - for testing)
-- INSERT INTO tentor_profiles (user_id, specialization, experience_years, education_level, bio, is_verified, is_active) VALUES
-- ((SELECT id FROM users WHERE email = 'tentor1@skdcpns.com'), ARRAY['TWK', 'TIU'], 3, 'S1', 'Tentor berpengalaman di bidang TWK dan TIU', true, true),
-- ((SELECT id FROM users WHERE email = 'tentor2@skdcpns.com'), ARRAY['TKP'], 2, 'S2', 'Spesialis TKP dengan pengalaman mengajar', true, true);

-- Grant necessary permissions
GRANT ALL ON tentor_profiles TO authenticated;
GRANT ALL ON tentor_sessions TO authenticated;
GRANT ALL ON tentor_availability TO authenticated;
