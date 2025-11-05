const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const {
  getTrendingPosts,
  getTrendingTopics,
  getMoodTrending,
  calculateWaveHeight,
} = require('../utils/trendingCalculator');

const router = express.Router();

// @route   GET /api/trending/posts
// @desc    Get trending posts
// @access  Private
router.get('/posts', auth, async (req, res) => {
  try {
    const { mood, limit = 20 } = req.query;
    
    // Get recent posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let posts = await Post.find({
      createdAt: { $gte: sevenDaysAgo },
    }).populate('creator', 'name username imageUrl');
    
    let trendingPosts;
    
    if (mood) {
      // Get mood-specific trending
      trendingPosts = await getMoodTrending(posts, mood);
    } else {
      // Get overall trending
      trendingPosts = await getTrendingPosts(posts, parseInt(limit));
    }
    
    // Add wave heights for visualization
    const postsWithWaves = trendingPosts.map(post => ({
      ...post,
      waveHeight: calculateWaveHeight(post.trendingScore),
    }));
    
    res.json({ posts: postsWithWaves });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ message: 'Server error fetching trending posts' });
  }
});

// @route   GET /api/trending/topics
// @desc    Get trending topics/tags
// @access  Private
router.get('/topics', auth, async (req, res) => {
  try {
    // Get recent posts (last 48 hours)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const posts = await Post.find({
      createdAt: { $gte: twoDaysAgo },
    });
    
    const trendingTopics = getTrendingTopics(posts);
    
    // Add wave heights
    const topicsWithWaves = trendingTopics.map(topic => ({
      ...topic,
      waveHeight: Math.min((topic.score / 100) * 100, 100),
    }));
    
    res.json({ topics: topicsWithWaves });
  } catch (error) {
    console.error('Get trending topics error:', error);
    res.status(500).json({ message: 'Server error fetching trending topics' });
  }
});

// @route   GET /api/trending/waves
// @desc    Get trending waves visualization data
// @access  Private
router.get('/waves', auth, async (req, res) => {
  try {
    // Get posts from last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const posts = await Post.find({
      createdAt: { $gte: oneDayAgo },
    }).populate('creator', 'name username imageUrl');
    
    const trendingPosts = await getTrendingPosts(posts, 10);
    
    // Create wave data
    const waves = trendingPosts.map((post, index) => ({
      id: post._id,
      height: calculateWaveHeight(post.trendingScore),
      color: getWaveColor(index),
      post: {
        _id: post._id,
        caption: post.caption,
        imageUrl: post.imageUrl,
        creator: post.creator,
        trendingScore: post.trendingScore,
        mood: post.mood,
      },
    }));
    
    res.json({ waves });
  } catch (error) {
    console.error('Get trending waves error:', error);
    res.status(500).json({ message: 'Server error fetching trending waves' });
  }
});

/**
 * Get wave color based on position
 */
const getWaveColor = (index) => {
  const colors = [
    '#FF377A', // Primary pink
    '#FF1F6B', // Darker pink
    '#FF5E8F', // Lighter pink
    '#8B5CF6', // Purple
    '#6366F1', // Indigo
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
  ];
  
  return colors[index % colors.length];
};

module.exports = router;
