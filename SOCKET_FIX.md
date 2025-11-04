# Socket.io Connection Fix

## 🐛 Error Fixed
```
WebSocket connection to 'ws://localhost:10000/socket.io/?EIO=4&transport=websocket' failed: 
WebSocket is closed before the connection is established.
```

## ✅ Changes Made

### 1. **Message Model Field Update**
**File:** `server/models/Message.js`

Changed field name from `message` to `content` for consistency with frontend:
```javascript
// Before
message: {
  type: String,
  required: true,
}

// After
content: {
  type: String,
  required: true,
}
```

### 2. **Socket.io Handler Update**
**File:** `server/index.js`

Updated to use `content` field when saving to database:
```javascript
const newMessage = new Message({
  senderId,
  receiverId,
  content: message, // Store as 'content' in database
  timestamp,
});
```

### 3. **Enhanced Socket.io Configuration**
**File:** `server/index.js`

Added better configuration and logging:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

console.log('Socket.io server initialized with CORS origin:', process.env.FRONTEND_URL || 'http://localhost:5173');
```

## 🚀 How to Fix

### Step 1: Restart Backend Server
```bash
cd server
# Stop the current server (Ctrl+C)
npm run dev
```

You should see:
```
MongoDB connected successfully
Socket.io server initialized with CORS origin: http://localhost:5173
Server running on port 10000
```

### Step 2: Clear Browser Cache (Optional)
If the error persists:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 3: Test Connection
1. Navigate to your app
2. Open DevTools Console
3. Go to a chat page
4. You should see Socket.io connection logs

## 🔍 Verification

### Backend Console Should Show:
```
Socket.io server initialized with CORS origin: http://localhost:5173
Server running on port 10000
A user connected: <socket-id>
User <userId> joined with socket ID <socket-id>
```

### Frontend Console Should Show:
No WebSocket errors. Socket.io will automatically connect.

### Test Real-Time Messaging:
1. Open two browser windows (or one incognito)
2. Log in as different users
3. Start a chat
4. Send a message
5. Should appear instantly in both windows

## 🐛 Troubleshooting

### Still Getting WebSocket Error?

#### Check 1: Backend Server Running
```bash
# Should show "Server running on port 10000"
cd server
npm run dev
```

#### Check 2: Port Not in Use
```bash
# Windows
netstat -ano | findstr :10000

# If port is in use, kill the process or change PORT in .env
```

#### Check 3: Environment Variables
**File:** `server/.env`
```env
PORT=10000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_uri
```

#### Check 4: CORS Configuration
Make sure `FRONTEND_URL` in `server/.env` matches your frontend URL.

#### Check 5: Firewall/Antivirus
Some firewalls block WebSocket connections. Try:
- Temporarily disable firewall
- Add exception for port 10000

### Connection Works But Messages Not Sending?

#### Check Message Model
Make sure old messages in database use `content` field:
```javascript
// MongoDB Shell or Compass
db.messages.updateMany(
  { message: { $exists: true } },
  { $rename: { "message": "content" } }
)
```

#### Check Socket Events
Frontend sends: `sendMessage`
Backend receives: `sendMessage`
Backend emits: `receiveMessage`
Frontend receives: `receiveMessage`

## 📝 Database Migration (If Needed)

If you have existing messages with `message` field instead of `content`:

### Option 1: MongoDB Shell
```javascript
use your_database_name
db.messages.updateMany(
  { message: { $exists: true } },
  { $rename: { "message": "content" } }
)
```

### Option 2: MongoDB Compass
1. Connect to your database
2. Open Messages collection
3. Use Aggregation Pipeline:
```json
[
  {
    "$addFields": {
      "content": "$message"
    }
  },
  {
    "$unset": "message"
  },
  {
    "$out": "messages"
  }
]
```

### Option 3: Fresh Start
If you don't have important messages:
```javascript
db.messages.drop()
```

## ✅ Success Indicators

### Backend Logs:
```
✓ MongoDB connected successfully
✓ Socket.io server initialized with CORS origin: http://localhost:5173
✓ Server running on port 10000
✓ A user connected: abc123
✓ User 507f1f77bcf86cd799439011 joined with socket ID abc123
✓ Real-time message from 507f... to 608f...: Hello!
✓ Message stored in MongoDB
```

### Frontend:
- No WebSocket errors in console
- Messages send instantly
- Typing indicators work
- Messages persist after refresh

## 🎯 Testing Checklist

- [ ] Backend server starts without errors
- [ ] Socket.io initialization message appears
- [ ] No WebSocket errors in browser console
- [ ] Can open chat page without errors
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Messages persist after page refresh
- [ ] Typing indicators work
- [ ] Multiple users can chat simultaneously

## 📞 Still Having Issues?

Check these files for correct configuration:
1. `server/index.js` - Socket.io setup
2. `server/models/Message.js` - Message schema
3. `server/.env` - Environment variables
4. `src/_root/pages/Chat.tsx` - Frontend Socket connection
5. `.env` - Frontend environment variables

Make sure:
- Both servers are running (frontend and backend)
- MongoDB is connected
- No port conflicts
- CORS is properly configured
