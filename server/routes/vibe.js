const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { calculateVibeMatch, findTopVibeMatches, getVibeMatchLabel } = require('../utils/vibeMatch');

const router = express.Router();

// @route   GET /api/vibe/stats
// @desc    Get vibe statistics for the platform
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get mood distribution from recent posts
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select('mood');
    
    // Count moods
    const moodCounts = {
      happy: 0,
      inspired: 0,
      chill: 0,
      focused: 0,
      creative: 0,
      thoughtful: 0,
      energetic: 0,
      relaxed: 0,
      neutral: 0,
    };
    
    recentPosts.forEach(post => {
      const mood = post.mood || 'neutral';
      if (moodCounts.hasOwnProperty(mood)) {
        moodCounts[mood]++;
      }
    });
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get active users (posted in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activePosts = await Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    
    res.json({
      moodDistribution: moodCounts,
      totalUsers,
      activeUsers: activePosts,
      totalPosts: recentPosts.length,
    });
  } catch (error) {
    console.error('Get vibe stats error:', error);
    res.status(500).json({ message: 'Server error fetching vibe stats' });
  }
});

// @route   GET /api/vibe/matches
// @desc    Get top vibe matches for current user
// @access  Private
router.get('/matches', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all users except current user
    const allUsers = await User.find({ _id: { $ne: req.userId } })
      .select('name username imageUrl bio interests currentMood level streak vibeScore')
      .limit(100); // Limit for performance
    
    // Calculate vibe matches
    const matches = await findTopVibeMatches(currentUser, allUsers, 20);
    
    // Add labels
    const matchesWithLabels = matches.map(match => ({
      ...match.user.toObject(),
      vibeMatchScore: match.score,
      vibeMatchLabel: getVibeMatchLabel(match.score),
    }));
    
    res.json({ matches: matchesWithLabels });
  } catch (error) {
    console.error('Get vibe matches error:', error);
    res.status(500).json({ message: 'Server error fetching vibe matches' });
  }
});

// @route   GET /api/vibe/match/:userId
// @desc    Get vibe match score with specific user
// @access  Private
router.get('/match/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const otherUser = await User.findById(req.params.userId);
    
    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const score = calculateVibeMatch(currentUser, otherUser);
    const label = getVibeMatchLabel(score);
    
    res.json({
      score,
      label,
      user: {
        _id: otherUser._id,
        name: otherUser.name,
        username: otherUser.username,
        imageUrl: otherUser.imageUrl,
      },
    });
  } catch (error) {
    console.error('Get vibe match error:', error);
    res.status(500).json({ message: 'Server error calculating vibe match' });
  }
});

module.exports = router;
