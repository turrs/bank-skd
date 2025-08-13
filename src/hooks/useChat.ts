import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/lib/services/chatService';
import { supabase } from '@/lib/db/supabase';
import { 
  ChatState, 
  ChatRoom, 
  RoomMessage, 
  ChatParticipant, 
  UserChatRoom,
  SendMessageData 
} from '@/types/chat';
import { toast } from '@/hooks/use-toast';

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    currentRoom: null,
    currentUser: null,
    messages: [],
    rooms: [],
    participants: [],
    isLoading: false,
    error: null
  });

  const messageSubscription = useRef<any>(null);
  const participantSubscription = useRef<any>(null);

  // Load user's chat rooms
  const loadChatRooms = useCallback(async () => {
    try {
      setChatState(prev => ({ ...prev, isLoading: true, error: null }));
      const { data: rooms, error } = await chatService.getChatRooms(chatState.currentUser?.id || '');
      if (error) throw error;
      setChatState(prev => ({ ...prev, rooms: rooms || [], isLoading: false }));
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setChatState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null
      }));
    }
  }, [chatState.currentUser?.id]);

  // Load room messages
  const loadRoomMessages = useCallback(async (roomId: string) => {
    try {
      console.log('📥 Loading room messages for room:', roomId);
      setChatState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data: messages, error } = await chatService.getMessages(roomId);
      if (error) throw error;
      
      console.log('📥 Messages loaded:', messages.length, 'messages');
      
      // Transform to RoomMessage format
      const roomMessages: RoomMessage[] = messages.map(msg => ({
        message_id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.user?.name || 'Unknown User',
        message: msg.message,
        message_type: msg.message_type || 'text',
        created_at: msg.created_at,
        is_read: msg.is_read || false
      }));
      
      // Sort chronologically
      const sortedMessages = roomMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      console.log('📥 Setting messages in state:', sortedMessages.map(m => ({ id: m.message_id, content: m.message, sender: m.sender_id })));
      
      setChatState(prev => ({ ...prev, messages: sortedMessages, isLoading: false }));
      
      console.log('✅ Messages set in state successfully');
      
      // Auto-scroll to bottom
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error loading room messages:', error);
      setChatState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null
      }));
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (messageData: SendMessageData) => {
    try {
      if (!chatState.currentUser) {
        throw new Error('No active user');
      }

      const { data: newMessage, error } = await chatService.sendMessage({
        room_id: messageData.room_id,
        sender_id: chatState.currentUser.id,
        message: messageData.message
      });
      
      if (error) throw error;
      if (!newMessage) throw new Error('Failed to send message');
      
      // Add message to local state immediately
      const roomMessage: RoomMessage = {
        message_id: newMessage.id,
        sender_id: newMessage.sender_id,
        sender_name: chatState.currentUser.full_name || chatState.currentUser.email || 'You',
        message: newMessage.message,
        message_type: newMessage.message_type || 'text',
        created_at: newMessage.created_at,
        is_read: newMessage.is_read || false
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, roomMessage]
      }));
      
      // Auto-scroll to bottom
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [chatState.currentUser]);

  // Subscribe to real-time room updates
  const subscribeToRoomUpdates = useCallback(async (roomId: string) => {
    console.log('🔌 Setting up real-time subscriptions for room:', roomId);
    
    // Unsubscribe from previous subscriptions
    if (messageSubscription.current) {
      console.log('🔕 Unsubscribing from previous subscription');
      messageSubscription.current();
      messageSubscription.current = null;
    }
    
    console.log('🔌 No previous subscription found, creating new one');

    // Subscribe to new messages
    messageSubscription.current = await chatService.subscribeToMessages(roomId, async (message) => {
      console.log('📨 Real-time message received:', message);
      
      // Check if message already exists (check by content and sender to prevent duplicates)
      const isDuplicate = chatState.messages.some(m => 
        m.message_id === message.id || 
        (m.sender_id === message.sender_id && 
         m.message === message.message && 
         Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 10000) // Within 10 seconds
      );
      
      if (isDuplicate) {
        console.log('🔄 Duplicate message detected, skipping:', { 
          id: message.id, 
          content: message.message, 
          sender: message.sender_id,
          existingMessages: chatState.messages.map(m => ({ id: m.message_id, content: m.message, sender: m.sender_id }))
        });
        return;
      }
      
      console.log('🆕 New message detected, adding to state:', { 
        id: message.id, 
        content: message.message, 
        sender: message.sender_id,
        existingCount: chatState.messages.length
      });
      
      // Get user info for new message
      let senderName = 'Unknown User';
      try {
        const { data: userInfo } = await chatService.getUserInfo(message.sender_id);
        if (userInfo) {
          senderName = userInfo.full_name || userInfo.email || 'Unknown User';
        }
      } catch (error) {
        console.warn('Could not fetch sender name for message:', message.id, error);
      }
      
      const roomMessage: RoomMessage = {
        message_id: message.id,
        sender_id: message.sender_id,
        sender_name: senderName,
        message: message.message,
        message_type: message.message_type || 'text',
        created_at: message.created_at,
        is_read: message.is_read || false
      };

      console.log('📝 Adding new message to state:', roomMessage);
      console.log('📊 Current messages before adding:', chatState.messages.map(m => ({ id: m.message_id, content: m.message, sender: m.sender_id })));
      
      console.log('📝 Current state before adding message:', {
        currentMessages: chatState.messages.map(m => ({ id: m.message_id, content: m.message, sender: m.sender_id })),
        newMessage: { id: roomMessage.message_id, content: roomMessage.message, sender: roomMessage.sender_id }
      });
      
      setChatState(prev => {
        const newMessages = [...prev.messages, roomMessage];
        console.log('🔄 State update - messages count:', prev.messages.length, '→', newMessages.length);
        return {
          ...prev,
          messages: newMessages
        };
      });
      
      console.log('✅ Message added to state successfully');
      
      // Auto-scroll to bottom
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);
    });

    console.log('✅ Real-time subscriptions set up successfully');
  }, []);

  // Join a room
  const joinRoom = useCallback(async (room: ChatRoom) => {
    try {
      console.log('Attempting to join room:', room.id, room.name);
      
      setChatState(prev => ({ ...prev, currentRoom: room }));
      
      await loadRoomMessages(room.id);
      
      // Subscribe to real-time updates
      await subscribeToRoomUpdates(room.id);
      
      toast({
        title: "Success",
        description: `Joined ${room.name}`,
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    }
  }, [loadRoomMessages, subscribeToRoomUpdates]);

  // Leave current room
  const leaveRoom = useCallback(async () => {
    if (!chatState.currentRoom) return;

    try {
      // Unsubscribe from updates
      if (messageSubscription.current) {
        messageSubscription.current();
        messageSubscription.current = null;
      }

      setChatState(prev => ({
        ...prev,
        currentRoom: null,
        messages: [],
        participants: []
      }));
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }, [chatState.currentRoom]);

  // Initialize chat system
  const initializeChat = useCallback(async () => {
    try {
      console.log('🚀 Initializing chat system...');
      
      // Get current user info
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setChatState(prev => ({
            ...prev,
            currentUser: {
              id: user.id,
              full_name: user.user_metadata?.full_name,
              email: user.email
            }
          }));
          console.log('👤 Current user set:', user.email);
        }
      }
      
      // Get or create global chat room
      const { data: globalRoom, error: globalError } = await chatService.getGlobalChatRoom();
      if (globalError) {
        console.error('❌ Error getting global chat room:', globalError);
        return;
      }
      
      if (globalRoom) {
        console.log('🌍 Global chat room found/created:', globalRoom);
        
        // Join the global room as participant
        if (chatState.currentUser?.id) {
          const { success, error: joinError } = await chatService.joinGlobalChatRoom(
            chatState.currentUser.id, 
            globalRoom.id
          )
          
          if (joinError) {
            console.error('❌ Error joining global room:', joinError);
          } else {
            console.log('✅ Successfully joined global room');
          }
        }
        
        setChatState(prev => ({ ...prev, currentRoom: globalRoom as any }));
        
        // Load messages for global room
        await loadRoomMessages(globalRoom.id);
        
        // Subscribe to real-time updates
        subscribeToRoomUpdates(globalRoom.id);
      }
      
      // Load user's chat rooms
      await loadChatRooms();
    } catch (error) {
      console.error('💥 Error initializing chat:', error);
    }
  }, [loadChatRooms, loadRoomMessages, subscribeToRoomUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current();
      }
    };
  }, []);

  return {
    ...chatState,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadChatRooms,
    loadRoomMessages,
    initializeChat
  };
};
