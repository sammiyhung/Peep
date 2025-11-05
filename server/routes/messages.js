const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ timestamp: -1 })
      .populate('senderId', 'name username imageUrl')
      .populate('receiverId', 'name username imageUrl');

    // Group messages by conversation partner and calculate unread count
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherUserId =
        message.senderId._id.toString() === userId
          ? message.receiverId._id.toString()
          : message.senderId._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        const otherUser =
          message.senderId._id.toString() === userId
            ? message.receiverId
            : message.senderId;

        conversationsMap.set(otherUserId, {
          _id: otherUserId,
          participants: [
            {
              _id: userId,
              name: req.user?.name || '',
              username: req.user?.username || '',
              imageUrl: req.user?.imageUrl || '',
            },
            {
              _id: otherUser._id,
              name: otherUser.name,
              username: otherUser.username,
              imageUrl: otherUser.imageUrl,
            },
          ],
          lastMessage: {
            content: message.content,
            timestamp: message.timestamp,
            senderId: message.senderId._id.toString(),
          },
          unreadCount: 0,
        });
      }
    });

    // Calculate unread count for each conversation
    for (const [otherUserId, conversation] of conversationsMap) {
      const unreadCount = await Message.countDocuments({
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationsMap.values());

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get total unread message count for current user
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false,
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// @route   PUT /api/messages/mark-read/:userId
// @desc    Mark all messages from a specific user as read
// @access  Private
router.put('/mark-read/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;
    
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { senderId, receiverId, content, replyTo } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Create new message
    const newMessage = new Message({
      senderId: req.userId, // Use authenticated user ID
      receiverId,
      content: content.trim(),
      timestamp: new Date(),
      replyTo: replyTo || undefined,
    });

    const savedMessage = await newMessage.save();

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'name username imageUrl')
      .populate('receiverId', 'name username imageUrl');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// @route   GET /api/messages
// @desc    Get messages between two users
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;

    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'Both user IDs are required' });
    }

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .sort({ timestamp: 1 })
      .populate('senderId', 'name username imageUrl')
      .populate('receiverId', 'name username imageUrl');

    // Format messages to ensure senderId and receiverId are strings for frontend comparison
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      senderId: msg.senderId._id.toString(), // Convert to string
      receiverId: msg.receiverId._id.toString(), // Convert to string
      content: msg.content,
      timestamp: msg.timestamp,
      edited: msg.edited || false,
      editedAt: msg.editedAt,
      loading: false,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully', messageId: req.params.id });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name username imageUrl')
      .populate('receiverId', 'name username imageUrl');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error editing message' });
  }
});

// @route   DELETE /api/messages/conversation/:userId
// @desc    Clear all messages in a conversation with a specific user
// @access  Private
router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    // Delete all messages between current user and the other user
    const result = await Message.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    });

    res.json({ 
      message: 'Conversation cleared successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ message: 'Server error clearing conversation' });
  }
});

module.exports = router;
