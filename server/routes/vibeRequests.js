const express = require('express');
const User = require('../models/User');
const VibeRequest = require('../models/VibeRequest');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to create notification
const createNotification = async (recipientId, senderId, type, title, message, link, relatedId, relatedModel) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      link,
      relatedId,
      relatedModel,
    });
    await notification.save();
    
    // Emit socket event for real-time notification
    const io = require('../index').io;
    if (io) {
      io.to(recipientId.toString()).emit('notification', {
        ...notification.toObject(),
        sender: await User.findById(senderId).select('name username imageUrl'),
      });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// @route   POST /api/vibe-requests/send
// @desc    Send a vibe request to another user
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.userId;

    // Validate
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    if (receiverId === senderId) {
      return res.status(400).json({ message: 'Cannot send vibe request to yourself' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sender = await User.findById(senderId);

    // Check if already peeps
    if (sender.peeps.includes(receiverId)) {
      return res.status(400).json({ message: 'You are already peeps with this user' });
    }

    // Check if request already exists
    const existingRequest = await VibeRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Vibe request already pending' });
      }
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'You are already peeps' });
      }
      // If rejected, allow sending again by updating the existing request
      existingRequest.sender = senderId;
      existingRequest.receiver = receiverId;
      existingRequest.status = 'pending';
      existingRequest.message = message || '';
      existingRequest.createdAt = new Date();
      existingRequest.respondedAt = null;
      await existingRequest.save();

      // Create notification
      await createNotification(
        receiverId,
        senderId,
        'vibe_request',
        'New Vibe Request',
        `${sender.name} wants to vibe with you!`,
        `/profile/${senderId}`,
        existingRequest._id,
        'VibeRequest'
      );

      return res.status(200).json({
        message: 'Vibe request sent successfully',
        vibeRequest: existingRequest,
      });
    }

    // Create new vibe request
    const vibeRequest = new VibeRequest({
      sender: senderId,
      receiver: receiverId,
      message: message || '',
    });

    await vibeRequest.save();

    // Create notification
    await createNotification(
      receiverId,
      senderId,
      'vibe_request',
      'New Vibe Request',
      `${sender.name} wants to vibe with you!`,
      `/profile/${senderId}`,
      vibeRequest._id,
      'VibeRequest'
    );

    res.status(201).json({
      message: 'Vibe request sent successfully',
      vibeRequest,
    });
  } catch (error) {
    console.error('Send vibe request error:', error);
    res.status(500).json({ message: 'Server error sending vibe request' });
  }
});

// @route   POST /api/vibe-requests/accept/:requestId
// @desc    Accept a vibe request
// @access  Private
router.post('/accept/:requestId', auth, async (req, res) => {
  try {
    const vibeRequest = await VibeRequest.findById(req.params.requestId);

    if (!vibeRequest) {
      return res.status(404).json({ message: 'Vibe request not found' });
    }

    // Verify the current user is the receiver
    if (vibeRequest.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (vibeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    vibeRequest.status = 'accepted';
    vibeRequest.respondedAt = new Date();
    await vibeRequest.save();

    // Add each other to peeps list
    await User.findByIdAndUpdate(vibeRequest.sender, {
      $addToSet: { peeps: vibeRequest.receiver },
    });

    await User.findByIdAndUpdate(vibeRequest.receiver, {
      $addToSet: { peeps: vibeRequest.sender },
    });

    const receiver = await User.findById(vibeRequest.receiver);

    // Create notification for sender
    await createNotification(
      vibeRequest.sender,
      vibeRequest.receiver,
      'vibe_accepted',
      'Vibe Accepted',
      `${receiver.name} accepted your vibe request. You are now peeps!`,
      `/profile/${vibeRequest.receiver}`,
      vibeRequest._id,
      'VibeRequest'
    );

    res.json({
      message: 'Vibe accepted. You are now peeps!',
      vibeRequest,
    });
  } catch (error) {
    console.error('Accept vibe request error:', error);
    res.status(500).json({ message: 'Server error accepting vibe request' });
  }
});

// @route   POST /api/vibe-requests/reject/:requestId
// @desc    Reject a vibe request
// @access  Private
router.post('/reject/:requestId', auth, async (req, res) => {
  try {
    const vibeRequest = await VibeRequest.findById(req.params.requestId);

    if (!vibeRequest) {
      return res.status(404).json({ message: 'Vibe request not found' });
    }

    // Verify the current user is the receiver
    if (vibeRequest.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (vibeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    vibeRequest.status = 'rejected';
    vibeRequest.respondedAt = new Date();
    await vibeRequest.save();

    res.json({
      message: 'Vibe request rejected',
      vibeRequest,
    });
  } catch (error) {
    console.error('Reject vibe request error:', error);
    res.status(500).json({ message: 'Server error rejecting vibe request' });
  }
});

// @route   DELETE /api/vibe-requests/cancel/:requestId
// @desc    Cancel a sent vibe request
// @access  Private
router.delete('/cancel/:requestId', auth, async (req, res) => {
  try {
    const vibeRequest = await VibeRequest.findById(req.params.requestId);

    if (!vibeRequest) {
      return res.status(404).json({ message: 'Vibe request not found' });
    }

    // Verify the current user is the sender
    if (vibeRequest.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    if (vibeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    await VibeRequest.findByIdAndDelete(req.params.requestId);

    // Delete related notification
    await Notification.deleteMany({
      relatedId: req.params.requestId,
      type: 'vibe_request',
    });

    res.json({ message: 'Vibe request cancelled' });
  } catch (error) {
    console.error('Cancel vibe request error:', error);
    res.status(500).json({ message: 'Server error cancelling vibe request' });
  }
});

// @route   GET /api/vibe-requests/received
// @desc    Get vibe requests received by current user
// @access  Private
router.get('/received', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { receiver: req.userId };
    
    if (status) {
      query.status = status;
    }

    const vibeRequests = await VibeRequest.find(query)
      .populate('sender', 'name username imageUrl bio currentMood level')
      .sort({ createdAt: -1 });

    res.json({ vibeRequests });
  } catch (error) {
    console.error('Get received vibe requests error:', error);
    res.status(500).json({ message: 'Server error fetching vibe requests' });
  }
});

// @route   GET /api/vibe-requests/sent
// @desc    Get vibe requests sent by current user
// @access  Private
router.get('/sent', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { sender: req.userId };
    
    if (status) {
      query.status = status;
    }

    const vibeRequests = await VibeRequest.find(query)
      .populate('receiver', 'name username imageUrl bio currentMood level')
      .sort({ createdAt: -1 });

    res.json({ vibeRequests });
  } catch (error) {
    console.error('Get sent vibe requests error:', error);
    res.status(500).json({ message: 'Server error fetching vibe requests' });
  }
});

// @route   GET /api/vibe-requests/status/:userId
// @desc    Check vibe request status with a specific user
// @access  Private
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    // Check if already peeps
    const currentUser = await User.findById(currentUserId);
    const isPeeps = currentUser.peeps.includes(otherUserId);

    if (isPeeps) {
      return res.json({
        status: 'peeps',
        isPeeps: true,
        vibeRequest: null,
      });
    }

    // Check for existing vibe request
    const vibeRequest = await VibeRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).populate('sender receiver', 'name username imageUrl');

    if (!vibeRequest) {
      return res.json({
        status: 'none',
        isPeeps: false,
        vibeRequest: null,
      });
    }

    // Determine relationship
    const isSender = vibeRequest.sender._id.toString() === currentUserId;
    
    res.json({
      status: vibeRequest.status,
      isPeeps: false,
      isSender,
      isReceiver: !isSender,
      vibeRequest,
    });
  } catch (error) {
    console.error('Get vibe request status error:', error);
    res.status(500).json({ message: 'Server error checking vibe request status' });
  }
});

// @route   DELETE /api/vibe-requests/remove-peep/:userId
// @desc    Remove a peep (unfriend)
// @access  Private
router.delete('/remove-peep/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    // Remove from both users' peeps lists
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { peeps: otherUserId },
    });

    await User.findByIdAndUpdate(otherUserId, {
      $pull: { peeps: currentUserId },
    });

    // Update vibe request status to rejected
    await VibeRequest.findOneAndUpdate(
      {
        $or: [
          { sender: currentUserId, receiver: otherUserId },
          { sender: otherUserId, receiver: currentUserId },
        ],
        status: 'accepted',
      },
      { status: 'rejected', respondedAt: new Date() }
    );

    res.json({ message: 'Peep removed successfully' });
  } catch (error) {
    console.error('Remove peep error:', error);
    res.status(500).json({ message: 'Server error removing peep' });
  }
});

module.exports = router;
