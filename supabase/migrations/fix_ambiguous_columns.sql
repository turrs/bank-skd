-- Fix ambiguous column reference in get_user_chat_rooms function
-- Drop existing function
DROP FUNCTION IF EXISTS get_user_chat_rooms(UUID);

-- Create function with explicit column aliases
CREATE OR REPLACE FUNCTION get_user_chat_rooms(user_uuid UUID)
RETURNS TABLE (
    room_id UUID,
    room_name VARCHAR(255),
    room_type VARCHAR(50),
    room_description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id as room_id,
        cr.name as room_name,
        cr.type as room_type,
        cr.description as room_description,
        cr.is_active,
        cr.created_at,
        COALESCE(
            (SELECT MAX(created_at) FROM chat_messages WHERE room_id = cr.id),
            cr.created_at
        ) as last_message_at,
        COALESCE(
            (SELECT COUNT(*) FROM chat_messages cm
             LEFT JOIN chat_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = user_uuid
             WHERE cm.room_id = cr.id AND cmr.id IS NULL AND cm.sender_id != user_uuid),
            0
        ) as unread_count
    FROM chat_rooms cr
    INNER JOIN chat_participants cp ON cr.id = cp.room_id
    WHERE cp.user_id = user_uuid
    AND cr.is_active = true
    ORDER BY last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
