const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

// Import models
const Message = require('./models/Message');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Initialize HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://peeps.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

console.log('Socket.io server initialized with CORS origin:', process.env.FRONTEND_URL || 'https://peeps.onrender.com');

// In-memory user storage (Consider using Redis for scalability)
const users = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining a chat
  socket.on('join', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} joined with socket ID ${socket.id}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ senderId, receiverId, message, tempId }) => {
    const receiverSocketId = users[receiverId];
    const senderSocketId = users[senderId];
    const timestamp = new Date();

    // Store the message in MongoDB first
    try {
      const newMessage = new Message({
        senderId,
        receiverId,
        content: message, // Store as 'content' in database
        timestamp,
      });

      const savedMessage = await newMessage.save();
      console.log('Message stored in MongoDB:', savedMessage._id);

      // Populate sender and receiver details
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('senderId', 'name username imageUrl')
        .populate('receiverId', 'name username imageUrl');

      // Emit the saved message to the receiver
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          _id: populatedMessage._id,
          senderId: populatedMessage.senderId._id,
          receiverId: populatedMessage.receiverId._id,
          content: populatedMessage.content,
          timestamp: populatedMessage.timestamp,
          edited: populatedMessage.edited,
        });
        
        // Notify receiver that unread count changed
        io.to(receiverSocketId).emit('unreadCountChanged');
        console.log(`Real-time message from ${senderId} to ${receiverId}`);
      }

      // Emit confirmation back to sender with saved message
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageSaved', {
          tempId, // Include tempId to replace the temporary message
          _id: populatedMessage._id,
          senderId: populatedMessage.senderId._id,
          receiverId: populatedMessage.receiverId._id,
          content: populatedMessage.content,
          timestamp: populatedMessage.timestamp,
          edited: populatedMessage.edited,
        });
      }
    } catch (error) {
      console.error('Error storing message in MongoDB:', error);
      // Emit error back to sender
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageFailed', { tempId });
      }
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { senderId });
      console.log(`User ${senderId} is typing to ${receiverId}`);
    }
  });

  // Handle message deletion
  socket.on('deleteMessage', ({ messageId, receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageDeleted', { messageId });
      console.log(`Message ${messageId} deleted`);
    }
  });

  // Handle message editing
  socket.on('editMessage', ({ messageId, content, receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageEdited', { messageId, content });
      console.log(`Message ${messageId} edited`);
    }
  });

  // Handle typing in chat list (for showing typing indicator in conversation list)
  socket.on('typingInChat', ({ senderId, receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userTypingInChat', { userId: senderId });
      console.log(`User ${senderId} is typing (chat list notification)`);
    }
  });

  // Handle stop typing in chat list
  socket.on('stopTypingInChat', ({ senderId, receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userStoppedTypingInChat', { userId: senderId });
    }
  });

  // Handle unread count update
  socket.on('updateUnreadCount', ({ receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('unreadCountChanged');
      console.log(`Unread count updated for user ${receiverId}`);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from users object
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];
        console.log(`User ${userId} removed from active users.`);
        break;
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
