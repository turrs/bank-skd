import { apiClient } from './supabaseClient'

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  message: string
  message_type?: string
  is_read?: boolean
  created_at: string
  updated_at?: string
  user?: {
    name: string
    avatar_url?: string
  }
}

export interface ChatRoom {
  id: string
  name: string
  type: 'support' | 'group' | 'private' | 'global'
  is_active: boolean
  created_at: string
  updated_at: string
  last_message?: ChatMessage
}

export const chatService = {
  // Get chat rooms for a user
  async getChatRooms(userId: string): Promise<{ data: ChatRoom[]; error: any }> {
    try {
      const { data, error } = await apiClient.list('chat_rooms')
      
      if (error) throw error
      
      // Filter rooms for user (for now, return all rooms since we don't have user-specific rooms)
      const userRooms = data || []
      
      // Get last message for each room
      const roomsWithLastMessage = await Promise.all(
        userRooms.map(async (room: ChatRoom) => {
          const { data: messages } = await apiClient.list('chat_messages')
          const roomMessages = messages?.filter((msg: any) => msg.room_id === room.id) || []
          const lastMessage = roomMessages.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0] || null
          
          return {
            ...room,
            last_message: lastMessage
          }
        })
      )
      
      return { data: roomsWithLastMessage, error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // Get messages for a specific room
  async getMessages(roomId: string, limit = 50, offset = 0): Promise<{ data: ChatMessage[]; error: any }> {
    try {
      console.log('📥 Getting messages for room:', roomId);
      
      const { data, error } = await apiClient.list('chat_messages')
      
      if (error) throw error
      
      // Filter messages for specific room and apply limit/offset
      const roomMessages = data?.filter((msg: any) => msg.room_id === roomId) || []
      console.log('📊 Room messages found:', roomMessages.length);
      
      // Get user info for all messages
      const { data: users, error: userError } = await apiClient.list('users')
      if (userError) throw userError
      
      // Create user map for quick lookup
      const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])
      
      // Enhance messages with user info
      const enhancedMessages = roomMessages.map((msg: any) => {
        const user = userMap.get(msg.sender_id)
        return {
          ...msg,
          user: {
            name: user?.full_name || user?.email || 'Unknown User',
            avatar_url: user?.avatar_url
          }
        }
      })
      
      const sortedMessages = enhancedMessages.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      const limitedMessages = sortedMessages.slice(offset, offset + limit)
      console.log('✅ Enhanced messages ready:', limitedMessages.length);
      
      return { data: limitedMessages, error: null }
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      return { data: [], error }
    }
  },

  // Send a new message
  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ChatMessage | null; error: any }> {
    try {
      console.log('📤 Sending message:', message);
      
      const { data, error } = await apiClient.insert('chat_messages', {
        room_id: message.room_id,
        sender_id: message.sender_id,
        message: message.message,
        message_type: message.message_type || 'text',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      if (error) throw error
      
      console.log('✅ Message sent successfully:', data?.[0]);
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return { data: null, error }
    }
  },

  // Create a new chat room
  async createChatRoom(room: Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ChatRoom | null; error: any }> {
    try {
      const { data, error } = await apiClient.insert('chat_rooms', {
        ...room,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      if (error) throw error
      
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Subscribe to real-time messages
  async subscribeToMessages(roomId: string, callback: (message: ChatMessage) => void) {
    console.log('🔔 Setting up real-time subscription for room:', roomId);
    
    // Import supabase client directly for real-time
    const { supabase } = await import('@/lib/db/supabase');
    
    const channel = supabase.channel(`room:${roomId}`)
    
    channel
      .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
      }, (payload: any) => {
        console.log('📨 Real-time message received:', payload);
        callback(payload.new as ChatMessage)
      })
      .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
      }, (payload: any) => {
        console.log('📝 Real-time message updated:', payload);
        // Handle message updates if needed
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      })
    
    return () => {
      console.log('🔕 Unsubscribing from room:', roomId);
      channel.unsubscribe()
    }
  },

  // Get user info for messages
  async getUserInfo(userId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await apiClient.list('users')
      
      if (error) throw error
      
      // Find user by ID
      const user = data?.find((u: any) => u.id === userId)
      
      return { data: user || null, error: null }
    } catch (error) {
      return { data: null, error: null }
    }
  },

  // Get chat duration setting
  async getChatDurationSetting(): Promise<{ data: number; error: any }> {
    try {
      const { data, error } = await apiClient.list('chat_settings')
      
      if (error) throw error
      
      // Find chat duration setting by key
      const setting = data?.find((s: any) => s.setting_key === 'chat_duration_minutes')
      const duration = setting ? parseInt(setting.setting_value) : 10
      
      return { data: duration, error: null }
    } catch (error) {
      // Return default duration if error
      return { data: 10, error: null }
    }
  },

  // Update chat duration setting
  async updateChatDurationSetting(durationMinutes: number): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: existingSettings, error: findError } = await apiClient.list('chat_settings')
      
      if (findError) throw findError
      
      // Find existing chat duration setting
      const existingSetting = existingSettings?.find((s: any) => s.setting_key === 'chat_duration_minutes')
      
      if (existingSetting) {
        // Update existing setting
        const { error: updateError } = await apiClient.update('chat_settings', 
          { 
            setting_value: durationMinutes.toString(),
            updated_at: new Date().toISOString()
          },
          { column: 'id', value: existingSetting.id }
        )
        
        if (updateError) throw updateError
      } else {
        // Create new setting
        const { error: createError } = await apiClient.insert('chat_settings', {
          setting_key: 'chat_duration_minutes',
          setting_value: durationMinutes.toString(),
          setting_description: 'Durasi chat yang akan di-load (dalam menit)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        if (createError) throw createError
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Get or create global chat room
  async getGlobalChatRoom(): Promise<{ data: ChatRoom | null; error: any }> {
    try {
      console.log('🔍 Getting or creating global chat room...');
      
      // Try to find existing global room using list method
      const { data: existingRooms, error: findError } = await apiClient.list('chat_rooms')
      console.log('📊 Existing rooms:', { existingRooms, findError });
      
      if (findError) throw findError
      
      // Filter for global room - try different names
      const globalRoom = existingRooms?.find((room: any) => 
        room.name === 'Global Chat' || 
        room.name === 'CPNS Global Chat' ||
        room.type === 'global'
      )
      console.log('🌍 Found global room:', globalRoom);
      
      if (globalRoom) {
        console.log('✅ Using existing global room');
        return { data: globalRoom, error: null }
      }
      
      // Create global room if it doesn't exist
      console.log('🆕 Creating new global chat room...');
      const { data: newRoom, error: createError } = await apiClient.insert('chat_rooms', {
        name: 'Global Chat',
        type: 'global',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      console.log('📝 New room creation result:', { newRoom, createError });
      
      if (createError) throw createError
      
      const createdRoom = newRoom?.[0] || null;
      console.log('✅ Global room created:', createdRoom);
      
      return { data: createdRoom, error: null }
    } catch (error) {
      console.error('❌ Error in getGlobalChatRoom:', error);
      return { data: null, error }
    }
  },

  // Join global chat room
  async joinGlobalChatRoom(userId: string, roomId: string): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('👥 Joining global chat room:', { userId, roomId });
      
      // Check if user is already a participant
      const { data: existingParticipants, error: findError } = await apiClient.list('chat_participants')
      
      if (findError) throw findError
      
      const isAlreadyParticipant = existingParticipants?.some((p: any) => 
        p.room_id === roomId && p.user_id === userId
      )
      
      if (isAlreadyParticipant) {
        console.log('✅ User already participant');
        return { success: true }
      }
      
      // Add user as participant
      const { error: joinError } = await apiClient.insert('chat_participants', {
        room_id: roomId,
        user_id: userId,
        role: 'user',
        joined_at: new Date().toISOString(),
        is_online: true,
        last_seen: new Date().toISOString()
      })
      
      if (joinError) throw joinError
      
      console.log('✅ User joined global chat room successfully');
      return { success: true }
    } catch (error) {
      console.error('❌ Error joining global chat room:', error);
      return { success: false, error }
    }
  }
}
