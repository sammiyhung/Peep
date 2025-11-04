# Message CRUD Operations & Chat Fixes

## ✅ Issues Fixed

### 1. **Messages Appearing on Wrong Side**
**Problem:** All messages were showing on the receiving side instead of their appropriate sides (sent vs received).

**Root Cause:** 
- Socket.io was emitting messages back to the sender
- Messages were being added twice (once locally, once from Socket)

**Solution:**
- Only add received messages if they're from the other user (not yourself)
- Sender adds message to local state immediately for instant feedback
- Receiver gets message via Socket.io

```typescript
// Only add message if it's from the other user
if (messageData.senderId !== currentUserId) {
  setMessages((prevMessages) => [...prevMessages, {
    senderId: messageData.senderId,
    content: messageData.message,
    timestamp: messageData.timestamp,
    _id: messageData._id || `msg-${Date.now()}`,
  }]);
}
```

### 2. **Message CRUD Operations Added**
Complete Create, Read, Update, Delete functionality for messages.

## 🎯 Features Implemented

### 1. **Create Message** ✅
- Send messages in real-time
- Instant local feedback
- Persisted to MongoDB
- Socket.io real-time delivery

### 2. **Read Messages** ✅
- Load message history
- Real-time message reception
- Proper sender/receiver display

### 3. **Update Message** ✅
- Edit your own messages
- Inline editing with input field
- Real-time sync to other user
- "edited" indicator shown
- Keyboard shortcuts (Enter to save, Escape to cancel)

### 4. **Delete Message** ✅
- Delete your own messages
- Real-time removal for both users
- Confirmation via hover menu

## 📁 Files Modified

### Backend

1. **`server/models/Message.js`**
   - Changed `message` field to `content`
   - Added `edited` boolean field
   - Added `editedAt` timestamp field

2. **`server/routes/messages.js`**
   - Added `DELETE /api/messages/:id` endpoint
   - Added `PUT /api/messages/:id` endpoint
   - Authorization checks (only sender can edit/delete)

3. **`server/index.js`**
   - Added `deleteMessage` Socket.io event handler
   - Added `editMessage` Socket.io event handler
   - Real-time sync for CRUD operations

### Frontend

4. **`src/_root/pages/Chat.tsx`**
   - Fixed message display logic (sender vs receiver)
   - Added edit/delete state management
   - Added hover menu for message actions
   - Added inline editing UI
   - Added Socket.io listeners for CRUD events
   - Imported `api` for HTTP requests

## 🎨 UI/UX Features

### Message Display
- **Sent messages:** Right-aligned, pink background
- **Received messages:** Left-aligned, gray background
- **Edited indicator:** Shows "(edited)" for modified messages
- **Hover menu:** Edit/delete buttons appear on hover (own messages only)

### Edit Mode
- Click edit button → inline input appears
- Type new content
- **Enter** to save
- **Escape** to cancel
- ✓ button to save
- ✕ button to cancel

### Delete
- Click delete button
- Message removed instantly
- Synced to other user in real-time

## 🔌 API Endpoints

### DELETE /api/messages/:id
**Description:** Delete a message  
**Auth:** Required (must be sender)  
**Response:**
```json
{
  "message": "Message deleted successfully",
  "messageId": "message_id"
}
```

### PUT /api/messages/:id
**Description:** Edit a message  
**Auth:** Required (must be sender)  
**Body:**
```json
{
  "content": "Updated message content"
}
```
**Response:**
```json
{
  "_id": "message_id",
  "senderId": {...},
  "receiverId": {...},
  "content": "Updated message content",
  "edited": true,
  "editedAt": "2024-11-03T12:00:00Z",
  "timestamp": "2024-11-03T11:00:00Z"
}
```

## 🔄 Socket.io Events

### Emit Events (Frontend → Backend)

1. **sendMessage**
   ```javascript
   socket.emit('sendMessage', {
     senderId: string,
     receiverId: string,
     message: string
   });
   ```

2. **deleteMessage**
   ```javascript
   socket.emit('deleteMessage', {
     messageId: string,
     receiverId: string
   });
   ```

3. **editMessage**
   ```javascript
   socket.emit('editMessage', {
     messageId: string,
     content: string,
     receiverId: string
   });
   ```

### Listen Events (Backend → Frontend)

1. **receiveMessage**
   ```javascript
   socket.on('receiveMessage', (data) => {
     // data: { senderId, message, timestamp }
   });
   ```

2. **messageDeleted**
   ```javascript
   socket.on('messageDeleted', (data) => {
     // data: { messageId }
   });
   ```

3. **messageEdited**
   ```javascript
   socket.on('messageEdited', (data) => {
     // data: { messageId, content }
   });
   ```

## 🚀 How to Use

### Sending Messages
1. Type message in input field
2. Press Enter or click send button
3. Message appears instantly on your side
4. Other user receives it in real-time

### Editing Messages
1. Hover over your own message
2. Click edit icon (pencil)
3. Modify text in input field
4. Press Enter or click ✓ to save
5. Press Escape or click ✕ to cancel
6. "(edited)" indicator appears

### Deleting Messages
1. Hover over your own message
2. Click delete icon (trash)
3. Message removed instantly
4. Other user sees deletion in real-time

## 🔒 Security

- **Authorization:** Only message sender can edit/delete
- **Validation:** Backend validates user ownership
- **Real-time sync:** Changes propagate securely via Socket.io
- **JWT tokens:** All API requests authenticated

## 🐛 Troubleshooting

### Messages still on wrong side?
1. Clear browser cache
2. Restart backend server
3. Check `currentUserId` is set correctly
4. Verify `senderId` in messages matches user ID

### Edit/Delete not working?
1. Check backend server is running
2. Verify JWT token in localStorage
3. Check browser console for errors
4. Ensure you're editing your own messages

### Socket.io not syncing?
1. Check Socket.io connection
2. Verify `VITE_API_URL` environment variable
3. Check backend Socket.io logs
4. Ensure both users are connected

## ✅ Testing Checklist

- [ ] Send message - appears on right side (sender)
- [ ] Receive message - appears on left side (receiver)
- [ ] Messages don't duplicate
- [ ] Hover over own message - see edit/delete buttons
- [ ] Click edit - inline input appears
- [ ] Edit message - save with Enter key
- [ ] Edit message - cancel with Escape key
- [ ] Edited message shows "(edited)" indicator
- [ ] Delete message - removes from both sides
- [ ] Other user sees edits in real-time
- [ ] Other user sees deletions in real-time
- [ ] Can't edit/delete other user's messages
- [ ] Messages persist after page refresh

## 📝 Database Schema

```javascript
{
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  content: String (required),
  timestamp: Date (default: now),
  edited: Boolean (default: false),
  editedAt: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## 🎯 Next Steps (Optional Enhancements)

- [ ] Confirmation dialog before delete
- [ ] Message reactions (emoji)
- [ ] Reply to specific messages
- [ ] Forward messages
- [ ] Message search
- [ ] Bulk delete
- [ ] Message status (sent, delivered, read)
- [ ] Edit history
- [ ] Undo delete (soft delete)
