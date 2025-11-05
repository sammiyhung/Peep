const express = require('express');
const Circle = require('../models/Circle');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { spendEnergy, awardEnergy, ENERGY_CONFIG } = require('../utils/energyManager');

const router = express.Router();

// @route   POST /api/circles
// @desc    Create a new circle
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, topic, description, icon, color, isPrivate, maxMembers, tags, duration = 24 } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ message: 'Name and topic are required' });
    }

    // Get user and check energy
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough energy to create a circle
    const energyCost = 10; // Cost to create a circle
    if (user.energy < energyCost) {
      return res.status(400).json({ 
        message: `Not enough energy. Need ${energyCost}, have ${user.energy}`,
        energyNeeded: energyCost,
        currentEnergy: user.energy,
      });
    }

    // Calculate expiration time (default 24 hours)
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);

    // Create circle
    const newCircle = new Circle({
      name,
      topic,
      description: description || '',
      creator: req.userId,
      members: [req.userId], // Creator is automatically a member
      icon: icon || '🔥',
      color: color || '#8B5CF6',
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 50,
      expiresAt,
      tags: tags || [],
    });

    await newCircle.save();

    // Spend energy
    await spendEnergy(user, energyCost, 'CREATE_CIRCLE');
    await user.save();

    // Populate creator info
    await newCircle.populate('creator', 'name username imageUrl');

    res.status(201).json({
      ...newCircle.toObject(),
      energySpent: energyCost,
      remainingEnergy: user.energy,
    });
  } catch (error) {
    console.error('Create circle error:', error);
    res.status(500).json({ message: 'Server error creating circle' });
  }
});

// @route   GET /api/circles
// @desc    Get all active circles
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, topic, limit = 20 } = req.query;

    let query = {
      isExpired: false,
      expiresAt: { $gt: new Date() },
    };

    // Search by name or topic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Filter by topic
    if (topic) {
      query.topic = { $regex: topic, $options: 'i' };
    }

    const circles = await Circle.find(query)
      .populate('creator', 'name username imageUrl')
      .populate('members', 'name username imageUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Add time remaining for each circle
    const circlesWithTimeRemaining = circles.map(circle => {
      const timeRemaining = circle.expiresAt - new Date();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

      return {
        ...circle.toObject(),
        timeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          total: timeRemaining,
        },
      };
    });

    res.json({ circles: circlesWithTimeRemaining });
  } catch (error) {
    console.error('Get circles error:', error);
    res.status(500).json({ message: 'Server error fetching circles' });
  }
});

// @route   GET /api/circles/my-circles
// @desc    Get circles user is a member of
// @access  Private
router.get('/my-circles', auth, async (req, res) => {
  try {
    const circles = await Circle.find({
      members: req.userId,
      isExpired: false,
      expiresAt: { $gt: new Date() },
    })
      .populate('creator', 'name username imageUrl')
      .populate('members', 'name username imageUrl')
      .sort({ createdAt: -1 });

    // Add time remaining for each circle
    const circlesWithTimeRemaining = circles.map(circle => {
      const timeRemaining = circle.expiresAt - new Date();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

      return {
        ...circle.toObject(),
        timeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          total: timeRemaining,
        },
      };
    });

    res.json({ circles: circlesWithTimeRemaining });
  } catch (error) {
    console.error('Get my circles error:', error);
    res.status(500).json({ message: 'Server error fetching your circles' });
  }
});

// @route   GET /api/circles/:id
// @desc    Get circle by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate('creator', 'name username imageUrl')
      .populate('members', 'name username imageUrl')
      .populate({
        path: 'posts',
        populate: { path: 'creator', select: 'name username imageUrl' },
        options: { sort: { createdAt: -1 } },
      });

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if circle is expired
    if (circle.isExpired || new Date() >= circle.expiresAt) {
      return res.status(410).json({ message: 'This circle has expired' });
    }

    // Calculate time remaining
    const timeRemaining = circle.expiresAt - new Date();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    res.json({
      ...circle.toObject(),
      timeRemaining: {
        hours: hoursRemaining,
        minutes: minutesRemaining,
        total: timeRemaining,
      },
      isMember: circle.isMember(req.userId),
    });
  } catch (error) {
    console.error('Get circle error:', error);
    res.status(500).json({ message: 'Server error fetching circle' });
  }
});

// @route   POST /api/circles/:id/join
// @desc    Join a circle
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if circle is expired
    if (circle.isExpired || new Date() >= circle.expiresAt) {
      return res.status(410).json({ message: 'This circle has expired' });
    }

    // Check if already a member
    if (circle.isMember(req.userId)) {
      return res.status(400).json({ message: 'Already a member of this circle' });
    }

    // Check if circle is full
    if (circle.members.length >= circle.maxMembers) {
      return res.status(400).json({ message: 'Circle is full' });
    }

    // Add member
    const added = await circle.addMember(req.userId);

    if (!added) {
      return res.status(400).json({ message: 'Could not join circle' });
    }

    // Award energy for joining
    const user = await User.findById(req.userId);
    await awardEnergy(user, 2, 'JOIN_CIRCLE');
    await user.save();

    await circle.populate('members', 'name username imageUrl');

    res.json({
      message: 'Successfully joined circle',
      circle: circle.toObject(),
      energyAwarded: 2,
    });
  } catch (error) {
    console.error('Join circle error:', error);
    res.status(500).json({ message: 'Server error joining circle' });
  }
});

// @route   POST /api/circles/:id/leave
// @desc    Leave a circle
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if user is a member
    if (!circle.isMember(req.userId)) {
      return res.status(400).json({ message: 'Not a member of this circle' });
    }

    // Creator cannot leave their own circle
    if (circle.creator.toString() === req.userId) {
      return res.status(400).json({ message: 'Creator cannot leave their own circle. Delete it instead.' });
    }

    // Remove member
    await circle.removeMember(req.userId);

    res.json({ message: 'Successfully left circle' });
  } catch (error) {
    console.error('Leave circle error:', error);
    res.status(500).json({ message: 'Server error leaving circle' });
  }
});

// @route   DELETE /api/circles/:id
// @desc    Delete a circle (creator only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Only creator can delete
    if (circle.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the creator can delete this circle' });
    }

    await Circle.findByIdAndDelete(req.params.id);

    res.json({ message: 'Circle deleted successfully' });
  } catch (error) {
    console.error('Delete circle error:', error);
    res.status(500).json({ message: 'Server error deleting circle' });
  }
});

// @route   GET /api/circles/:id/posts
// @desc    Get posts in a circle
// @access  Private
router.get('/:id/posts', auth, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if circle is expired
    if (circle.isExpired || new Date() >= circle.expiresAt) {
      return res.status(410).json({ message: 'This circle has expired' });
    }

    // Check if user is a member (for private circles)
    if (circle.isPrivate && !circle.isMember(req.userId)) {
      return res.status(403).json({ message: 'You must be a member to view posts' });
    }

    const posts = await Post.find({ _id: { $in: circle.posts } })
      .populate('creator', 'name username imageUrl')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    console.error('Get circle posts error:', error);
    res.status(500).json({ message: 'Server error fetching circle posts' });
  }
});

module.exports = router;
