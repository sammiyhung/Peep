const express = require('express');
const multer = require('multer');
const Post = require('../models/Post');
const Save = require('../models/Save');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { spendEnergy, awardEnergy, regenerateEnergy, ENERGY_CONFIG } = require('../utils/energyManager');
const { calculateTrendingScore } = require('../utils/trendingCalculator');
const { notifyNewPost, notifyLike, notifyComment } = require('../utils/notificationHelper');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { caption, location, tags, mood = 'neutral', circleId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one media file is required' });
    }

    // Get user and check energy
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If posting to a circle, verify membership
    let circle = null;
    if (circleId) {
      const Circle = require('../models/Circle');
      circle = await Circle.findById(circleId);
      
      if (!circle) {
        return res.status(404).json({ message: 'Circle not found' });
      }
      
      if (circle.isExpired || new Date() >= circle.expiresAt) {
        return res.status(410).json({ message: 'This circle has expired' });
      }
      
      if (!circle.isMember(req.userId)) {
        return res.status(403).json({ message: 'You must be a member to post in this circle' });
      }
    }

    // Regenerate energy first
    const energyUpdate = regenerateEnergy(user);
    user.energy = energyUpdate.energy;
    user.energyLastUpdated = energyUpdate.energyLastUpdated;

    // Check if user has enough energy
    const energyCost = ENERGY_CONFIG.COSTS.CREATE_POST;
    if (user.energy < energyCost) {
      return res.status(400).json({ 
        message: `Not enough energy. Need ${energyCost}, have ${user.energy}`,
        energyNeeded: energyCost,
        currentEnergy: user.energy,
      });
    }

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file => {
      // Determine folder based on file type
      const folder = file.mimetype.startsWith('video/') ? 'peep/videos' : 'peep/posts';
      return uploadToCloudinary(file.buffer, folder, file.mimetype.startsWith('video/') ? 'video' : 'image');
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs, IDs, and types
    const mediaUrls = uploadResults.map(result => result.secure_url);
    const mediaIds = uploadResults.map(result => result.public_id);
    const mediaTypes = req.files.map(file => 
      file.mimetype.startsWith('video/') ? 'video' : 'image'
    );

    // Convert tags string to array
    const tagsArray = tags ? tags.replace(/ /g, '').split(',') : [];

    // Create post with multiple media support
    const newPost = new Post({
      creator: req.userId,
      caption,
      mediaUrls,
      mediaIds,
      mediaTypes,
      // Keep first media as imageUrl for backward compatibility
      imageUrl: mediaUrls[0],
      imageId: mediaIds[0],
      location: location || '',
      tags: tagsArray,
      mood: mood || user.currentMood || 'neutral',
      circle: circleId || null,
    });

    await newPost.save();

    // If posting to a circle, add post to circle
    if (circle) {
      circle.posts.push(newPost._id);
      circle.stats.totalPosts += 1;
      await circle.save();
    }

    // Spend energy
    await spendEnergy(user, energyCost, 'CREATE_POST');
    
    // Update vibe score
    user.vibeScore += 5;
    
    await user.save();

    // Populate creator info
    await newPost.populate('creator', '-password');

    // Notify followers about new post (async, don't wait)
    notifyNewPost(req.userId, newPost, req.app.get('io')).catch(err => 
      console.error('Notify new post error:', err)
    );

    res.status(201).json({
      ...newPost.toObject(),
      energySpent: energyCost,
      remainingEnergy: user.energy,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// @route   GET /api/posts
// @desc    Get recent posts with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { cursor, limit = 9, mood } = req.query;

    // Get current user for mood-based filtering
    const currentUser = await User.findById(req.userId);

    let query = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }

    // Mood-based filtering
    if (mood && mood !== 'all') {
      query.mood = mood;
    } else if (currentUser && currentUser.currentMood !== 'neutral') {
      // If user has a mood set, prioritize similar moods
      // But still show all posts (just reorder them)
    }

    const posts = await Post.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .populate('creator', '-password');

    // Calculate trending scores
    const postsWithScores = posts.map(post => ({
      ...post.toObject(),
      trendingScore: calculateTrendingScore(post),
    }));

    res.json({
      documents: postsWithScores,
      total: postsWithScores.length,
      userMood: currentUser?.currentMood,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
});

// @route   GET /api/posts/recent
// @desc    Get recent posts
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('creator', '-password');

    res.json({ documents: posts });
  } catch (error) {
    console.error('Get recent posts error:', error);
    res.status(500).json({ message: 'Server error fetching recent posts' });
  }
});

// @route   GET /api/posts/search
// @desc    Search posts
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const posts = await Post.find({
      $text: { $search: q }
    })
      .populate('creator', '-password');

    res.json({ documents: posts });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error searching posts' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('creator', '-password');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error fetching post' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { caption, location, tags, imageUrl, imageId } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the creator
    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // If new files uploaded
    if (req.files && req.files.length > 0) {
      // Delete old media files
      if (post.mediaIds && post.mediaIds.length > 0) {
        const deletePromises = post.mediaIds.map(id => deleteFromCloudinary(id));
        await Promise.all(deletePromises);
      } else if (post.imageId) {
        await deleteFromCloudinary(post.imageId);
      }

      // Upload new files
      const uploadPromises = req.files.map(file => {
        const folder = file.mimetype.startsWith('video/') ? 'peep/videos' : 'peep/posts';
        return uploadToCloudinary(file.buffer, folder);
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Update media arrays
      post.mediaUrls = uploadResults.map(result => result.secure_url);
      post.mediaIds = uploadResults.map(result => result.public_id);
      post.mediaTypes = req.files.map(file => 
        file.mimetype.startsWith('video/') ? 'video' : 'image'
      );
      
      // Update backward compatibility fields
      post.imageUrl = post.mediaUrls[0];
      post.imageId = post.mediaIds[0];
    }

    // Convert tags string to array
    const tagsArray = tags ? tags.replace(/ /g, '').split(',') : [];

    // Update post
    post.caption = caption;
    post.location = location || '';
    post.tags = tagsArray;

    await post.save();
    await post.populate('creator', '-password');

    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error updating post' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the creator
    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete all media from Cloudinary
    if (post.mediaIds && post.mediaIds.length > 0) {
      // Delete all media files
      const deletePromises = post.mediaIds.map(id => deleteFromCloudinary(id));
      await Promise.all(deletePromises);
    } else if (post.imageId) {
      // Backward compatibility: delete single image
      await deleteFromCloudinary(post.imageId);
    }

    // Delete post
    await Post.findByIdAndDelete(req.params.id);

    // Delete all saves related to this post
    await Save.deleteMany({ post: req.params.id });

    res.json({ status: 'Ok', message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

// @route   PUT /api/posts/:id/like
// @desc    Like/Unlike post
// @access  Private
router.put('/:id/like', auth, async (req, res) => {
  try {
    const { likesArray } = req.body;
    const User = require('../models/User');

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Update post likes
    post.likes = likesArray;
    await post.save();
    await post.populate('creator', '-password');

    // Update user's liked posts array
    const user = await User.findById(req.userId);
    if (user) {
      const isLiked = likesArray.includes(req.userId);
      
      if (isLiked && !user.liked.includes(req.params.id)) {
        // Add to liked array
        user.liked.push(req.params.id);
        await user.save();
        
        // Notify post owner about like
        if (post.creator._id.toString() !== req.userId) {
          notifyLike(post.creator._id.toString(), req.userId, req.params.id, req.app.get('io'))
            .catch(err => console.error('Notify like error:', err));
        }
      } else if (!isLiked && user.liked.includes(req.params.id)) {
        // Remove from liked array
        user.liked = user.liked.filter(id => id.toString() !== req.params.id);
        await user.save();
      }
    }

    res.json(post);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error liking post' });
  }
});

// @route   POST /api/posts/:id/save
// @desc    Save post
// @access  Private
router.post('/:id/save', auth, async (req, res) => {
  try {
    const existingSave = await Save.findOne({
      user: req.userId,
      post: req.params.id,
    });

    if (existingSave) {
      return res.status(400).json({ message: 'Post already saved' });
    }

    const newSave = new Save({
      user: req.userId,
      post: req.params.id,
    });

    await newSave.save();
    res.status(201).json(newSave);
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Server error saving post' });
  }
});

// @route   DELETE /api/posts/save/:saveId
// @desc    Delete saved post
// @access  Private
router.delete('/save/:saveId', auth, async (req, res) => {
  try {
    const save = await Save.findById(req.params.saveId);

    if (!save) {
      return res.status(404).json({ message: 'Saved post not found' });
    }

    // Check if user owns this save
    if (save.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Save.findByIdAndDelete(req.params.saveId);

    res.json({ status: 'Ok', message: 'Saved post deleted successfully' });
  } catch (error) {
    console.error('Delete saved post error:', error);
    res.status(500).json({ message: 'Server error deleting saved post' });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get user's posts
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ creator: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('creator', '-password');

    res.json({ documents: posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error fetching user posts' });
  }
});

// ============================================================
// REACTIONS
// ============================================================

// @route   POST /api/posts/:postId/react
// @desc    Add or change reaction to a post
// @access  Private
router.post('/:postId/react', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.userId;

    // Validate reaction type
    const validReactions = ['mindBlown', 'vibeCheck', 'realTalk', 'fire', 'heart'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Remove user from all reaction arrays
    validReactions.forEach(type => {
      post.reactions[type] = post.reactions[type].filter(
        id => id.toString() !== userId
      );
    });

    // Add user to the new reaction type
    if (!post.reactions[reactionType].includes(userId)) {
      post.reactions[reactionType].push(userId);
    }

    // Recalculate trending score
    post.trendingScore = calculateTrendingScore(post);

    await post.save();

    // Award energy to post creator (small amount for engagement)
    if (post.creator.toString() !== userId) {
      await awardEnergy(post.creator, 1, 'Reaction received');
    }

    res.json({ 
      message: 'Reaction added successfully',
      reactions: post.reactions 
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error adding reaction' });
  }
});

// @route   DELETE /api/posts/:postId/react
// @desc    Remove reaction from a post
// @access  Private
router.delete('/:postId/react', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Remove user from all reaction arrays
    const validReactions = ['mindBlown', 'vibeCheck', 'realTalk', 'fire', 'heart'];
    validReactions.forEach(type => {
      post.reactions[type] = post.reactions[type].filter(
        id => id.toString() !== userId
      );
    });

    // Recalculate trending score
    post.trendingScore = calculateTrendingScore(post);

    await post.save();

    res.json({ 
      message: 'Reaction removed successfully',
      reactions: post.reactions 
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error removing reaction' });
  }
});

// @route   GET /api/posts/:postId/reactions
// @desc    Get all reactions for a post with user details
// @access  Private
router.get('/:postId/reactions', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('reactions.mindBlown', 'name username imageUrl')
      .populate('reactions.vibeCheck', 'name username imageUrl')
      .populate('reactions.realTalk', 'name username imageUrl')
      .populate('reactions.fire', 'name username imageUrl')
      .populate('reactions.heart', 'name username imageUrl');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add reaction type to each user object
    const reactionsWithType = {};
    Object.keys(post.reactions).forEach(type => {
      reactionsWithType[type] = post.reactions[type].map(user => ({
        ...user.toObject(),
        reactionType: type
      }));
    });

    res.json(reactionsWithType);
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ message: 'Server error fetching reactions' });
  }
});

module.exports = router;
