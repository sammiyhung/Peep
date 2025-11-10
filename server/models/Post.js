const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false, // Made optional for backward compatibility
  },
  imageId: {
    type: String,
    required: false, // Made optional for backward compatibility
  },
  // Multiple media support (images and videos)
  mediaUrls: {
    type: [String],
    default: [],
  },
  mediaIds: {
    type: [String],
    default: [],
  },
  mediaTypes: {
    type: [String], // 'image' or 'video'
    default: [],
  },
  location: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  likes: {
    type: [String],
    default: [],
  },
  // Enhanced Reactions
  reactions: {
    mindBlown: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    vibeCheck: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    realTalk: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    fire: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    heart: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  // Mood Tag
  mood: {
    type: String,
    enum: ['happy', 'inspired', 'chill', 'focused', 'creative', 'thoughtful', 'energetic', 'relaxed', 'neutral'],
    default: 'neutral',
  },
  // Trending Score
  trendingScore: {
    type: Number,
    default: 0,
  },
  // Energy Cost (for posting)
  energyCost: {
    type: Number,
    default: 5,
  },
  // Circle reference (optional - for posts shared in circles)
  circle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Circle',
    default: null,
  },
  // Comments count (virtual field will be populated from Comment model)
  commentsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for search functionality
postSchema.index({ caption: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);
