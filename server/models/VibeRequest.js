const mongoose = require('mongoose');

const vibeRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  message: {
    type: String,
    maxlength: 200,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
});

// Compound index to prevent duplicate requests
vibeRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Index for querying by receiver and status
vibeRequestSchema.index({ receiver: 1, status: 1 });

// Index for querying by sender and status
vibeRequestSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('VibeRequest', vibeRequestSchema);
