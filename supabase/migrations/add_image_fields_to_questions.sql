-- Tambah kolom untuk gambar di tabel questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_image_url TEXT,
ADD COLUMN IF NOT EXISTS question_image_path TEXT,
ADD COLUMN IF NOT EXISTS option_a_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_a_image_path TEXT,
ADD COLUMN IF NOT EXISTS option_b_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_b_image_path TEXT,
ADD COLUMN IF NOT EXISTS option_c_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_c_image_path TEXT,
ADD COLUMN IF NOT EXISTS option_d_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_d_image_path TEXT,
ADD COLUMN IF NOT EXISTS option_e_image_url TEXT,
ADD COLUMN IF NOT EXISTS option_e_image_path TEXT,
ADD COLUMN IF NOT EXISTS explanation_image_url TEXT,
ADD COLUMN IF NOT EXISTS explanation_image_path TEXT;

-- Buat tabel untuk menyimpan file upload
CREATE TABLE IF NOT EXISTS question_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'explanation')),
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  
  -- Unique constraint untuk mencegah duplikasi
  UNIQUE(question_id, image_type)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_question_images_question_id ON question_images(question_id);
CREATE INDEX IF NOT EXISTS idx_question_images_type ON question_images(image_type);
