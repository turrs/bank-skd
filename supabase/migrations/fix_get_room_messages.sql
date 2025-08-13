-- Fix get_room_messages function
-- Drop existing function
DROP FUNCTION IF EXISTS get_room_messages(UUID, UUID, INTEGER);

-- Create simpler function that just gets messages without complex logic
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
    -- Simple query to get messages
    RETURN QUERY
    SELECT 
        cm.id as message_id,
        cm.sender_id,
        COALESCE(
            (SELECT full_name FROM users WHERE id = cm.sender_id),
            (SELECT email FROM auth.users WHERE id = cm.sender_id),
            'Unknown'
        ) as sender_name,
        cm.message,
        cm.message_type,
        cm.created_at,
        CASE WHEN cmr.id IS NOT NULL THEN true ELSE false END as is_read
    FROM chat_messages cm
    LEFT JOIN chat_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = user_uuid
    WHERE cm.room_id = room_uuid
    ORDER BY cm.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
-- SELECT * FROM get_room_messages('YOUR_ROOM_ID', 'YOUR_USER_ID', 10);
