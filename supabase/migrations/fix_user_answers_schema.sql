-- Fix user_answers table schema
-- Drop existing table if it exists
DROP TABLE IF EXISTS user_answers CASCADE;

-- Create user_answers table with correct schema
CREATE TABLE user_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES tryout_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(10) NOT NULL, -- A, B, C, D, E
    awarded_points INTEGER DEFAULT 0,
    is_correct BOOLEAN DEFAULT false,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of session and question
    UNIQUE(session_id, question_id)
);

-- Enable RLS
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own answers" ON user_answers
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM tryout_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own answers" ON user_answers
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM tryout_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own answers" ON user_answers
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM tryout_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own answers" ON user_answers
    FOR DELETE USING (
        session_id IN (
            SELECT id FROM tryout_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_user_answers_session_id ON user_answers(session_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_user_answer ON user_answers(user_answer);
