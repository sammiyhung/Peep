const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { limit } = req.query;

    let query = User.find().select('-password').sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const users = await query;

    res.json({ documents: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Save = require('../models/Save');
    
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'liked',
        populate: { path: 'creator', select: 'name username imageUrl' }
      });

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
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { name, bio, imageUrl, imageId } = req.body;

    // Check if user is updating their own profile
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let image = { imageUrl, imageId };

    // If new file uploaded
    if (req.file) {
      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer, 'peep/profiles');
      image = {
        imageUrl: result.secure_url,
        imageId: result.public_id,
      };

      // Delete old image if it exists and is from Cloudinary
      if (user.imageId) {
        await deleteFromCloudinary(user.imageId);
      }
    }

    // Update user
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.imageUrl = image.imageUrl;
    user.imageId = image.imageId;

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

module.exports = router;
