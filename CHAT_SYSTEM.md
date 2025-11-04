# Real-Time Chat System Documentation

## 🎯 Overview
Complete real-time chat system with chat list, individual conversations, and Socket.io integration.

## ✅ Features Implemented

### 1. **Chat List (`/chats`)**
- Displays all active conversations
- Shows last message preview
- Displays message timestamps (smart formatting)
- Search functionality to filter conversations
- "No Chats Yet" empty state with CTA button
- Direct link to find Peeps to start chatting

### 2. **Individual Chat (`/chat/:userId`)**
- Real-time messaging with Socket.io
- Message history loaded from database
- Typing indicators
- Message search within conversation
- User profile link in header
- Back button to return to chat list
- Scroll to bottom functionality
- Message timestamps

### 3. **Navigation Updates**
- Sidebar: "Chats" tab → `/chats`
- Bottom bar: "Chats" tab → `/chats`
- Icon changed to chat icon

## 📁 Files Created/Modified

### New Files
1. **`src/_root/pages/ChatList.tsx`**
   - Main chat list component
   - Fetches all conversations
   - Displays conversation previews
   - Search and filter functionality

### Modified Files
1. **`src/App.tsx`**
   - Added `/chats` route for ChatList
   - Kept `/chat/:userId` for individual chats

2. **`src/_root/pages/index.ts`**
   - Exported ChatList component

3. **`src/constants/index.ts`**
   - Updated navigation links to point to `/chats`
   - Changed icon to chat icon

4. **`src/_root/pages/Chat.tsx`**
   - Updated back button to navigate to `/chats`
   - Improved styling

5. **`server/routes/messages.js`**
   - Added `GET /api/messages/conversations` endpoint
   - Returns list of all user conversations with last message

## 🔌 API Endpoints

### GET /api/messages/conversations
**Description:** Get all conversations for current user  
**Auth:** Required  
**Response:**
```json
[
  {
    "_id": "userId",
    "participants": [
      {
        "_id": "user1Id",
        "name": "User 1",
        "username": "user1",
        "imageUrl": "url"
      },
      {
        "_id": "user2Id",
        "name": "User 2",
        "username": "user2",
        "imageUrl": "url"
      }
    ],
    "lastMessage": {
      "content": "Hello!",
      "timestamp": "2024-11-03T12:00:00Z",
      "senderId": "user1Id"
    },
    "unreadCount": 0
  }
]
```

### GET /api/messages
**Description:** Get messages between two users  
**Auth:** Required  
**Query Params:** `userId1`, `userId2`  
**Response:** Array of messages

## 🎨 UI/UX Features

### Chat List
- **Empty State:** Shows when no conversations exist
  - Icon illustration
  - "No Chats Yet" message
  - "Find Peeps to Chat" button → navigates to `/all-users`
  
- **Conversation Item:**
  - User avatar (circular, 56px)
  - User name (bold)
  - Last message preview (truncated)
  - Timestamp (smart formatting: time, day, or date)
  - "You:" prefix for sent messages
  - Unread count badge (if applicable)
  - Hover effect for better UX

- **Search Bar:**
  - Filter by name or username
  - Real-time filtering
  - Styled with dark theme

### Individual Chat
- **Header:**
  - Back button (returns to chat list)
  - User avatar and name
  - Link to user profile
  - Search, notifications, help, settings buttons

- **Messages:**
  - Sender messages: right-aligned, pink background
  - Receiver messages: left-aligned, gray background
  - Timestamps below each message
  - Typing indicator
  - Auto-scroll to bottom

- **Input:**
  - Text input with emoji support
  - Send button
  - Real-time typing detection

## 🔄 Real-Time Features (Socket.io)

### Events
1. **join** - User joins their room
2. **sendMessage** - Send a message
3. **receiveMessage** - Receive a message
4. **typing** - User is typing
5. **disconnect** - User disconnects

### Socket URL
- Development: `http://localhost:10000`
- Uses `VITE_API_URL` environment variable

## 🚀 How to Use

### For Users
1. Click "Chats" in sidebar or bottom bar
2. If no chats:
   - Click "Find Peeps to Chat"
   - Select a user
   - Click "Chat" button on their profile/card
3. If chats exist:
   - Click on any conversation to open
   - Send messages in real-time
   - Use back button to return to list

### For Developers
1. **Start Backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Chat:**
   - Create two user accounts
   - Log in with both (different browsers/incognito)
   - Start a conversation
   - Test real-time messaging

## 🔧 Configuration

### Environment Variables
**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:10000
```

**Backend (`server/.env`):**
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=10000
FRONTEND_URL=http://localhost:5173
```

## 📝 Future Enhancements
- [ ] Unread message count implementation
- [ ] Message read receipts
- [ ] Image/file sharing in chat
- [ ] Voice messages
- [ ] Group chats
- [ ] Message reactions
- [ ] Delete/edit messages
- [ ] Block users
- [ ] Online/offline status indicators
- [ ] Push notifications

## 🐛 Troubleshooting

### Chat list not loading
- Check backend server is running
- Verify JWT token in localStorage
- Check browser console for errors
- Verify `/api/messages/conversations` endpoint

### Messages not sending in real-time
- Check Socket.io connection
- Verify `VITE_API_URL` is correct
- Check backend Socket.io server is running
- Look for Socket errors in console

### "No Chats Yet" showing when chats exist
- Refresh the page
- Check if messages exist in database
- Verify conversation endpoint returns data

## ✅ Testing Checklist
- [ ] Navigate to `/chats` from sidebar
- [ ] Navigate to `/chats` from bottom bar
- [ ] See "No Chats Yet" when no conversations
- [ ] Click "Find Peeps to Chat" button
- [ ] Start a chat from user profile
- [ ] See conversation in chat list
- [ ] Click conversation to open chat
- [ ] Send messages in real-time
- [ ] See typing indicator
- [ ] Use back button to return to list
- [ ] Search conversations by name
- [ ] View message timestamps
- [ ] Open user profile from chat header
