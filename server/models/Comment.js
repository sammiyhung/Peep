const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
