-- Script lengkap untuk membuat sistem tentor
-- Jalankan ini di Supabase SQL Editor

-- 1. Tambahkan kolom role ke tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student' 
CHECK (role IN ('student', 'tentor', 'admin'));

-- 2. Update user yang sudah ada menjadi admin jika is_admin = true
UPDATE users 
SET role = 'admin' 
WHERE is_admin = true;

-- 3. Buat index untuk role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Tambahkan kolom creator_id ke question_packages
ALTER TABLE question_packages 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 5. Buat index untuk creator_id
CREATE INDEX IF NOT EXISTS idx_question_packages_creator_id ON question_packages(creator_id);

-- 6. Buat tabel tentor_profiles
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

-- 7. Buat tabel tentor_sessions
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

-- 8. Buat tabel tentor_availability
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

-- 9. Buat indexes
CREATE INDEX IF NOT EXISTS idx_tentor_profiles_user_id ON tentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tentor_profiles_verified ON tentor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_tentor_profiles_active ON tentor_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_tentor_sessions_tentor_id ON tentor_sessions(tentor_id);
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_student_id ON tentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_status ON tentor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tentor_sessions_date ON tentor_sessions(session_date);

CREATE INDEX IF NOT EXISTS idx_tentor_availability_tentor_id ON tentor_availability(tentor_id);
CREATE INDEX IF NOT EXISTS idx_tentor_availability_day_time ON tentor_availability(day_of_week, start_time);

-- 10. Buat function untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; $$ language 'plpgsql';

-- 11. Buat triggers
CREATE TRIGGER update_tentor_profiles_updated_at 
  BEFORE UPDATE ON tentor_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tentor_sessions_updated_at 
  BEFORE UPDATE ON tentor_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Enable RLS
ALTER TABLE tentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentor_availability ENABLE ROW LEVEL SECURITY;

-- 13. Buat RLS policies
-- Policy untuk tentor_profiles
CREATE POLICY "Users can view tentor profiles" ON tentor_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own tentor profile" ON tentor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tentor profile" ON tentor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tentor profile" ON tentor_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Policy untuk tentor_sessions
CREATE POLICY "Users can view sessions they're involved in" ON tentor_sessions
  FOR SELECT USING (auth.uid() = tentor_id OR auth.uid() = student_id);

CREATE POLICY "Users can insert sessions" ON tentor_sessions
  FOR INSERT WITH CHECK (auth.uid() = tentor_id OR auth.uid() = student_id);

CREATE POLICY "Users can update sessions they're involved in" ON tentor_sessions
  FOR UPDATE USING (auth.uid() = tentor_id OR auth.uid() = student_id);

CREATE POLICY "Users can delete sessions they're involved in" ON tentor_sessions
  FOR DELETE USING (auth.uid() = tentor_id OR auth.uid() = student_id);

-- Policy untuk tentor_availability
CREATE POLICY "Users can view tentor availability" ON tentor_availability
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own availability" ON tentor_availability
  FOR ALL USING (auth.uid() = tentor_id);

-- 14. Grant permissions
GRANT ALL ON tentor_profiles TO authenticated;
GRANT ALL ON tentor_sessions TO authenticated;
GRANT ALL ON tentor_availability TO authenticated;

-- 15. Lihat hasil
SELECT 'Users table updated with role column' as status;
SELECT id, email, full_name, is_admin, role FROM users LIMIT 5;

-- 16. Test update role user tertentu (ganti email sesuai user yang ingin diupdate)
-- UPDATE users SET role = 'tentor' WHERE email = 'your-email@example.com';
-- SELECT id, email, full_name, is_admin, role FROM users WHERE email = 'your-email@example.com';
