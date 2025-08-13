# Live Chat System Implementation

## Overview
This implementation provides a real-time live chat system for the SKD CPNS Tryout application where registered users can chat with each other and with admins.

## Features

### 🚀 **Real-time Messaging**
- Instant message delivery using Supabase real-time subscriptions
- Message read status tracking
- Typing indicators and loading states

### 👥 **Multi-user Support**
- Support for multiple chat rooms
- User participant management
- Online/offline status tracking

### 🔒 **Security & Privacy**
- Row Level Security (RLS) policies
- User authentication required
- Message access control based on room participation

### 📱 **Responsive Design**
- Desktop sidebar integration
- Mobile-friendly modal interface
- Collapsible sidebar support

## Database Schema

### Tables Created

#### 1. `chat_rooms`
- Stores chat room information
- Supports different room types: support, group, private
- Tracks room status and creation time

#### 2. `chat_participants`
- Manages user participation in chat rooms
- Tracks user roles (user, admin, moderator)
- Monitors online status and last seen

#### 3. `chat_messages`
- Stores all chat messages
- Supports different message types (text, image, file, system)
- Tracks message read status

#### 4. `chat_message_reads`
- Tracks which users have read which messages
- Enables read receipts and unread counts

### Database Functions

#### `get_user_chat_rooms(user_uuid)`
- Returns all chat rooms a user participates in
- Includes last message, unread count, and participant count

#### `get_room_messages(room_uuid, user_uuid, limit_count)`
- Returns messages for a specific room
- Automatically marks messages as read for the requesting user
- Supports pagination with limit parameter

## Setup Instructions

### 1. Database Migration
Run the SQL migration file to create the chat system tables:

```bash
# Apply the migration to your Supabase database
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/create_chat_system.sql
```

### 2. Environment Configuration
Ensure your Supabase configuration is properly set up in `src/lib/db/supabase.ts`

### 3. Dependencies
The system uses the following key dependencies:
- Supabase client for database operations
- React hooks for state management
- TypeScript for type safety

## Usage

### For Users

#### Starting a Chat
1. Click the "Chat" icon in the right sidebar
2. The system automatically joins the default support room
3. Start typing and sending messages

#### Chat Features
- Real-time message updates
- See who's online in the room
- Message read status
- Responsive design for all devices

### For Developers

#### Chat Hook
```typescript
import { useChat } from '@/hooks/useChat';

const { 
  currentRoom, 
  messages, 
  participants, 
  sendMessage, 
  joinRoom 
} = useChat();
```

#### Chat Service
```typescript
import { ChatService } from '@/lib/services/chatService';

// Send a message
await ChatService.sendMessage({
  room_id: 'room-uuid',
  message: 'Hello world!'
});

// Join a room
await ChatService.joinRoom('room-uuid');
```

## Architecture

### Frontend Components
- **Dashboard.tsx**: Main chat interface integration
- **useChat.ts**: Custom hook for chat state management
- **chatService.ts**: API service layer for chat operations

### Backend Services
- **Supabase**: Database and real-time subscriptions
- **RLS Policies**: Security and access control
- **Database Functions**: Optimized queries and operations

### Real-time Features
- **Message Subscriptions**: Instant message delivery
- **Participant Updates**: Live online status changes
- **Room Management**: Dynamic room joining/leaving

## Security Features

### Row Level Security (RLS)
- Users can only access rooms they participate in
- Message access restricted to room participants
- Admin-only room creation capabilities

### Authentication
- All chat operations require valid user authentication
- User ID validation on all operations
- Secure message ownership verification

## Performance Optimizations

### Database Indexes
- Optimized queries for room messages
- Efficient participant lookups
- Fast message retrieval with pagination

### Real-time Subscriptions
- Efficient channel management
- Automatic cleanup on component unmount
- Optimized message deduplication

## Troubleshooting

### Common Issues

#### Messages Not Loading
- Check user authentication status
- Verify room participation
- Check database connection

#### Real-time Not Working
- Ensure Supabase real-time is enabled
- Check subscription cleanup
- Verify channel configuration

#### Permission Errors
- Check RLS policies
- Verify user role assignments
- Ensure proper room access

### Debug Mode
Enable console logging for debugging:
```typescript
// In chatService.ts
console.log('Debug info:', data);
```

## Future Enhancements

### Planned Features
- File/image sharing
- Group chat creation
- Admin moderation tools
- Chat history export
- Push notifications

### Scalability Considerations
- Message pagination
- Room archiving
- User presence optimization
- Database query optimization

## Support

For technical support or questions about the chat system implementation, please refer to the main project documentation or contact the development team.
