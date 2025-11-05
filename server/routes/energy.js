const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const {
  regenerateEnergy,
  spendEnergy,
  awardEnergy,
  updateStreak,
  awardBadge,
  ENERGY_CONFIG,
} = require('../utils/energyManager');

const router = express.Router();

// @route   GET /api/energy
// @desc    Get current user's energy status
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Regenerate energy based on time elapsed
    const energyUpdate = regenerateEnergy(user);
    user.energy = energyUpdate.energy;
    user.energyLastUpdated = energyUpdate.energyLastUpdated;
    
    // Update streak
    updateStreak(user);
    
    await user.save();
    
    res.json({
      energy: user.energy,
      maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
      level: user.level,
      streak: user.streak,
      badges: user.badges,
      regenerated: energyUpdate.regenerated,
    });
  } catch (error) {
    console.error('Get energy error:', error);
    res.status(500).json({ message: 'Server error fetching energy' });
  }
});

// @route   PUT /api/energy/mood
// @desc    Update user's current mood
// @access  Private
router.put('/mood', auth, async (req, res) => {
  try {
    const { mood } = req.body;
    
    const validMoods = ['happy', 'inspired', 'chill', 'focused', 'creative', 'thoughtful', 'energetic', 'relaxed', 'neutral'];
    
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ message: 'Invalid mood' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update mood
    user.currentMood = mood;
    
    // Add to mood history
    user.moodHistory.push({
      mood,
      timestamp: new Date(),
    });
    
    // Keep only last 30 mood entries
    if (user.moodHistory.length > 30) {
      user.moodHistory = user.moodHistory.slice(-30);
    }
    
    await user.save();
    
    res.json({
      currentMood: user.currentMood,
      moodHistory: user.moodHistory,
    });
  } catch (error) {
    console.error('Update mood error:', error);
    res.status(500).json({ message: 'Server error updating mood' });
  }
});

// @route   PUT /api/energy/interests
// @desc    Update user's interests
// @access  Private
router.put('/interests', auth, async (req, res) => {
  try {
    const { interests } = req.body;
    
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.interests = interests;
    await user.save();
    
    res.json({
      interests: user.interests,
    });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ message: 'Server error updating interests' });
  }
});

// @route   GET /api/energy/leaderboard
// @desc    Get energy leaderboard
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('name username imageUrl level energy vibeScore streak')
      .sort({ level: -1, energy: -1 })
      .limit(20);
    
    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

module.exports = router;
