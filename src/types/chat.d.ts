export interface ChatRoom {
  id: string;
  name: string;
  type: 'support' | 'group' | 'private';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'user' | 'admin' | 'moderator';
  joined_at: string;
  is_online: boolean;
  last_seen: string;
  user?: {
    full_name?: string;
    email?: string;
  };
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name?: string;
    email?: string;
  };
}

export interface ChatMessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface UserChatRoom {
  room_id: string;
  room_name: string;
  room_type: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  participant_count: number;
}

export interface RoomMessage {
  message_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatState {
  currentRoom: ChatRoom | null;
  currentUser: {
    id: string;
    full_name?: string;
    email?: string;
  } | null;
  messages: RoomMessage[];
  rooms: UserChatRoom[];
  participants: ChatParticipant[];
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageData {
  room_id: string;
  message: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
}
