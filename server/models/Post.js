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
    required: true,
  },
  imageId: {
    type: String,
    required: true,
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
}, {
  timestamps: true,
});

// Index for search functionality
postSchema.index({ caption: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);
