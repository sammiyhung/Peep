const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate account ID
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get initials for avatar
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    // Create new user
    const newUser = new User({
      accountId,
      name,
      email,
      username,
      password: hashedPassword,
      imageUrl,
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      accountId: newUser.accountId,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      imageUrl: newUser.imageUrl,
      bio: newUser.bio,
    };

    res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/signin
// @desc    Login user
// @access  Public
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user without password
    const userResponse = {
      _id: user._id,
      accountId: user.accountId,
      name: user.name,
      email: user.email,
      username: user.username,
      imageUrl: user.imageUrl,
      bio: user.bio,
    };

    res.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin' });
  }
});

// @route   GET /api/auth/current
// @desc    Get current user
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Save = require('../models/Save');
    
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ creator: user._id })
      .populate('creator', 'name username imageUrl')
      .sort({ createdAt: -1 });

    // Get user's saved posts
    const saves = await Save.find({ user: user._id })
      .populate({
        path: 'post',
        populate: { path: 'creator', select: 'name username imageUrl' }
      });

    // Add posts and save to user object
    const userWithPosts = {
      ...user.toObject(),
      posts: posts,
      save: saves,
    };

    res.json(userWithPosts);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/signout
// @desc    Logout user
// @access  Private
router.post('/signout', auth, async (req, res) => {
  try {
    // With JWT, we don't need to do anything server-side
    // The client will remove the token
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
