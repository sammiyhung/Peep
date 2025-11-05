const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { awardEnergy } = require('../utils/energyManager');

const router = express.Router();

// @route   POST /api/comments
// @desc    Create a comment on a post
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create comment
    const comment = new Comment({
      post: postId,
      user: userId,
      text: text.trim(),
    });

    await comment.save();

    // Update post comments count
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    // Award energy to post creator (small amount for engagement)
    if (post.creator.toString() !== userId) {
      await awardEnergy(post.creator, 2, 'Comment received');
    }

    // Populate user data before sending response
    await comment.populate('user', 'name username imageUrl');

    res.status(201).json({
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error creating comment' });
  }
});

// @route   GET /api/comments/:postId
// @desc    Get all comments for a post
// @access  Private
router.get('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate('user', 'name username imageUrl');

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment owner
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Update post comments count
    const post = await Post.findById(comment.post);
    if (post) {
      post.commentsCount = Math.max((post.commentsCount || 1) - 1, 0);
      await post.save();
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

module.exports = router;
