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
    const { 
      name, 
      bio, 
      imageUrl, 
      imageId, 
      username, 
      currentMood,
      aboutMe,
      dateOfBirth,
      gender,
      location,
      website,
      phone,
      occupation,
      company,
      skills,
      interests,
      showEmail,
      showPhone,
      showLocation,
      showDateOfBirth
    } = req.body;

    // Check if user is updating their own profile
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is being changed and if it's available
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.trim();
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

    // Update basic user fields
    user.name = name || user.name;
    user.bio = bio !== undefined ? bio : user.bio;
    user.imageUrl = image.imageUrl;
    user.imageId = image.imageId;
    
    // Update additional profile fields
    if (aboutMe !== undefined) user.aboutMe = aboutMe;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (phone !== undefined) user.phone = phone;
    if (occupation !== undefined) user.occupation = occupation;
    if (company !== undefined) user.company = company;
    if (skills !== undefined) user.skills = skills;
    if (interests !== undefined) user.interests = interests;
    
    // Update privacy settings
    if (showEmail !== undefined) user.showEmail = showEmail === 'true' || showEmail === true;
    if (showPhone !== undefined) user.showPhone = showPhone === 'true' || showPhone === true;
    if (showLocation !== undefined) user.showLocation = showLocation === 'true' || showLocation === true;
    if (showDateOfBirth !== undefined) user.showDateOfBirth = showDateOfBirth === 'true' || showDateOfBirth === true;
    
    // Update mood if provided
    if (currentMood) {
      user.currentMood = currentMood.toLowerCase();
      user.moodHistory.push({
        mood: currentMood.toLowerCase(),
        timestamp: new Date(),
      });
      // Keep only last 30 mood entries
      if (user.moodHistory.length > 30) {
        user.moodHistory = user.moodHistory.slice(-30);
      }
    }

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// @route   POST /api/users/:id/save-post
// @desc    Save/unsave a post
// @access  Private
router.post('/:id/save-post', auth, async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const postIndex = user.saved.indexOf(postId);
    
    if (postIndex > -1) {
      // Unsave post
      user.saved.splice(postIndex, 1);
      await user.save();
      return res.json({ message: 'Post unsaved', saved: false });
    } else {
      // Save post
      user.saved.push(postId);
      await user.save();
      return res.json({ message: 'Post saved', saved: true });
    }
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/saved-posts
// @desc    Get user's saved posts
// @access  Private
router.get('/:id/saved-posts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'saved',
        populate: { path: 'creator', select: 'name username imageUrl' }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ posts: user.saved || [] });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/coffee-chat
// @desc    Request a coffee chat with user
// @access  Private
router.post('/:id/coffee-chat', auth, async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const targetUser = await User.findById(req.params.id);
    const requestingUser = await User.findById(req.userId);

    if (!targetUser || !requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.preferences.openToCoffeeChat) {
      return res.status(400).json({ message: 'User is not open to coffee chats' });
    }

    // Add coffee chat to both users
    const coffeeChatData = {
      withUser: targetUser._id,
      scheduledAt: scheduledAt || new Date(Date.now() + 10 * 60000), // Default 10 min from now
    };

    requestingUser.coffeeChats.push(coffeeChatData);
    targetUser.coffeeChats.push({
      withUser: requestingUser._id,
      scheduledAt: coffeeChatData.scheduledAt,
    });

    await requestingUser.save();
    await targetUser.save();

    res.json({ 
      message: 'Coffee chat requested!',
      coffeeChat: coffeeChatData 
    });
  } catch (error) {
    console.error('Coffee chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/collaborate
// @desc    Send collaboration request
// @access  Private
router.post('/:id/collaborate', auth, async (req, res) => {
  try {
    const { project, message } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.preferences.openToCollaboration) {
      return res.status(400).json({ message: 'User is not open to collaboration' });
    }

    targetUser.collaborationRequests.push({
      fromUser: req.userId,
      project,
      message,
      status: 'pending',
    });

    await targetUser.save();

    res.json({ message: 'Collaboration request sent!' });
  } catch (error) {
    console.error('Collaboration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/collaboration/:requestId
// @desc    Accept/decline collaboration request
// @access  Private
router.put('/:id/collaboration/:requestId', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.userId);
    const request = user.collaborationRequests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await user.save();

    res.json({ message: `Request ${status}`, request });
  } catch (error) {
    console.error('Update collaboration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/update-energy
// @desc    Update user's Peep Energy
// @access  Private
router.post('/:id/update-energy', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.energy = Math.max(0, Math.min(1000, user.energy + amount));
    user.energyLastUpdated = new Date();

    await user.save();

    res.json({ 
      energy: user.energy,
      message: `Energy ${amount > 0 ? 'gained' : 'spent'}: ${reason}` 
    });
  } catch (error) {
    console.error('Update energy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/calculate-authenticity
// @desc    Calculate and update authenticity score
// @access  Private
router.post('/:id/calculate-authenticity', auth, async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const Post = require('../models/Post');
    
    // Calculate authenticity based on various metrics
    const userPosts = await Post.find({ creator: user._id });
    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const avgLikesPerPost = userPosts.length > 0 ? totalLikes / userPosts.length : 0;
    
    // Authenticity formula (can be refined)
    let score = 50; // Base score
    
    // Positive factors
    score += Math.min(20, user.authenticityMetrics.genuineInteractions * 0.5);
    score += Math.min(15, user.authenticityMetrics.helpfulContent * 0.3);
    score += Math.min(10, avgLikesPerPost * 2);
    score += Math.min(10, user.streak.current * 0.5);
    
    // Negative factors
    score -= Math.min(30, user.authenticityMetrics.spamReports * 10);
    
    // Clamp between 0-100
    user.authenticityScore = Math.max(0, Math.min(100, Math.round(score)));
    user.authenticityMetrics.lastCalculated = new Date();
    
    await user.save();

    res.json({ authenticityScore: user.authenticityScore });
  } catch (error) {
    console.error('Calculate authenticity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow/unfollow a user
// @access  Private
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId
      );
      
      await currentUser.save();
      await targetUser.save();

      return res.json({ 
        message: 'Unfollowed successfully',
        isFollowing: false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      await currentUser.save();
      await targetUser.save();

      return res.json({ 
        message: 'Followed successfully',
        isFollowing: true,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Private
router.get('/:id/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name username imageUrl bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ followers: user.followers });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/following
// @desc    Get users that this user is following
// @access  Private
router.get('/:id/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name username imageUrl bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ following: user.following });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
