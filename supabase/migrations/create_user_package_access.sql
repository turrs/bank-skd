-- Buat tabel user_package_access
CREATE TABLE IF NOT EXISTS user_package_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES question_packages(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Unique constraint untuk mencegah duplikasi akses
  UNIQUE(user_id, package_id)
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_user_package_access_user_id ON user_package_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_package_access_package_id ON user_package_access(package_id);
CREATE INDEX IF NOT EXISTS idx_user_package_access_active ON user_package_access(is_active);
