-- Create chat system tables
-- Migration: create_chat_system

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'support', -- 'support', 'group', 'private'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'moderator'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat message read status table
CREATE TABLE IF NOT EXISTS chat_message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- Create RLS policies
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view chat rooms they participate in" ON chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_rooms.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_rooms.id AND user_id = auth.uid() AND role = 'admin'
        )
    );

-- Chat participants policies
CREATE POLICY "Users can view participants in their rooms" ON chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants cp2
            WHERE cp2.room_id = chat_participants.room_id AND cp2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join global rooms" ON chat_participants
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT id FROM chat_rooms 
            WHERE type = 'global' AND is_active = true
        )
    );

-- Chat messages policies
CREATE POLICY "Users can view messages in their rooms" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their rooms" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

-- Chat message reads policies
CREATE POLICY "Users can view read status of messages in their rooms" ON chat_message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants cp
            JOIN chat_messages cm ON cp.room_id = cm.room_id
            WHERE cm.id = chat_message_reads.message_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can mark messages as read" ON chat_message_reads
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_participants cp
            JOIN chat_messages cm ON cp.room_id = cm.room_id
            WHERE cm.id = chat_message_reads.message_id AND cp.user_id = auth.uid()
        )
    );

-- Insert default global chat room
INSERT INTO chat_rooms (id, name, type, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SKD CPNS Global Chat',
    'global',
    true
) ON CONFLICT DO NOTHING;

-- Create function to get user's chat rooms
CREATE OR REPLACE FUNCTION get_user_chat_rooms(user_uuid UUID)
RETURNS TABLE (
    room_id UUID,
    room_name VARCHAR(255),
    room_type VARCHAR(50),
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    participant_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id as room_id,
        cr.name as room_name,
        cr.type as room_type,
        cm.message as last_message,
        cm.created_at as last_message_time,
        COALESCE(unread.unread_count, 0) as unread_count,
        COALESCE(participants.participant_count, 0) as participant_count
    FROM chat_rooms cr
    INNER JOIN chat_participants cp ON cr.id = cp.room_id
    LEFT JOIN LATERAL (
        SELECT message, created_at
        FROM chat_messages 
        WHERE room_id = cr.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) cm ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as unread_count
        FROM chat_messages cm2
        LEFT JOIN chat_message_reads cmr ON cm2.id = cmr.message_id AND cmr.user_id = user_uuid
        WHERE cm2.room_id = cr.id 
        AND cm2.sender_id != user_uuid
        AND cmr.id IS NULL
    ) unread ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as participant_count
        FROM chat_participants cp2
        WHERE cp2.room_id = cr.id
    ) participants ON true
    WHERE cp.user_id = user_uuid
    AND cr.is_active = true
    ORDER BY cm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get room messages
CREATE OR REPLACE FUNCTION get_room_messages(room_uuid UUID, user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    message_id UUID,
    sender_id UUID,
    sender_name TEXT,
    message TEXT,
    message_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN
) AS $$
BEGIN
    -- Mark messages as read for this user
    INSERT INTO chat_message_reads (message_id, user_id)
    SELECT cm.id, user_uuid
    FROM chat_messages cm
    LEFT JOIN chat_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = user_uuid
    WHERE cm.room_id = room_uuid 
    AND cm.sender_id != user_uuid
    AND cmr.id IS NULL
    ON CONFLICT DO NOTHING;

    RETURN QUERY
    SELECT 
        cm.id as message_id,
        cm.sender_id,
        COALESCE(up.full_name, up.email) as sender_name,
        cm.message,
        cm.message_type,
        cm.created_at,
        CASE WHEN cmr.id IS NOT NULL THEN true ELSE false END as is_read
    FROM chat_messages cm
    LEFT JOIN chat_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = user_uuid
    LEFT JOIN user_profiles up ON cm.sender_id = up.id
    WHERE cm.room_id = room_uuid
    ORDER BY cm.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
