const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['vibe_request', 'vibe_accepted', 'follow', 'coffee_chat', 'collaboration', 'like', 'comment', 'mention'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String, // URL to navigate to when clicked
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // ID of related entity (vibe request, post, etc.)
  },
  relatedModel: {
    type: String, // Model name of related entity
    enum: ['VibeRequest', 'Post', 'User', 'Comment', null],
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for querying unread notifications
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
