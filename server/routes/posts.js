const express = require('express');
const multer = require('multer');
const Post = require('../models/Post');
const Save = require('../models/Save');
const auth = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { caption, location, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'peep/posts');

    // Convert tags string to array
    const tagsArray = tags ? tags.replace(/ /g, '').split(',') : [];

    // Create post
    const newPost = new Post({
      creator: req.userId,
      caption,
      imageUrl: result.secure_url,
      imageId: result.public_id,
      location: location || '',
      tags: tagsArray,
    });

    await newPost.save();

    // Populate creator info
    await newPost.populate('creator', '-password');

    res.status(201).json(newPost);
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
    const { cursor, limit = 9 } = req.query;

    let query = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .populate('creator', '-password');

    res.json({
      documents: posts,
      total: posts.length,
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
router.put('/:id', auth, upload.single('file'), async (req, res) => {
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

    let image = { imageUrl, imageId };

    // If new file uploaded
    if (req.file) {
      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer, 'peep/posts');
      image = {
        imageUrl: result.secure_url,
        imageId: result.public_id,
      };

      // Delete old image
      if (post.imageId) {
        await deleteFromCloudinary(post.imageId);
      }
    }

    // Convert tags string to array
    const tagsArray = tags ? tags.replace(/ /g, '').split(',') : [];

    // Update post
    post.caption = caption;
    post.imageUrl = image.imageUrl;
    post.imageId = image.imageId;
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

    // Delete image from Cloudinary
    if (post.imageId) {
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

module.exports = router;
