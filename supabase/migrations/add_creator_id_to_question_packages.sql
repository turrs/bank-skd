-- Migration: Add creator_id to question_packages table
-- Date: 2024-12-19
-- Description: Add creator_id field to track who created each question package

-- Add creator_id column to question_packages table
ALTER TABLE question_packages 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for creator_id queries
CREATE INDEX IF NOT EXISTS idx_question_packages_creator_id ON question_packages(creator_id);

-- Update existing packages to set creator_id (optional - for existing data)
-- UPDATE question_packages SET creator_id = (SELECT id FROM users WHERE is_admin = true LIMIT 1) WHERE creator_id IS NULL;

-- Grant necessary permissions
GRANT ALL ON question_packages TO authenticated;
