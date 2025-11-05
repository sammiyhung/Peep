const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  imageId: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  liked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  // Peep Energy System
  energy: {
    type: Number,
    default: 100,
    min: 0,
    max: 1000,
  },
  energyLastUpdated: {
    type: Date,
    default: Date.now,
  },
  // Mood-Based Feed
  currentMood: {
    type: String,
    enum: ['happy', 'inspired', 'chill', 'focused', 'creative', 'thoughtful', 'energetic', 'relaxed', 'neutral'],
    default: 'neutral',
  },
  moodHistory: [{
    mood: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  // Vibe Match Data
  interests: [{
    type: String,
  }],
  vibeScore: {
    type: Number,
    default: 0,
  },
  // Gamification
  level: {
    type: Number,
    default: 1,
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  streak: {
    current: {
      type: Number,
      default: 0,
    },
    longest: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
