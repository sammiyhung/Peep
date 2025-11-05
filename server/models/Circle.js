const mongoose = require('mongoose');

const circleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  icon: {
    type: String,
    default: '🔥', // Default emoji icon
  },
  color: {
    type: String,
    default: '#8B5CF6', // Default purple color
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  maxMembers: {
    type: Number,
    default: 50,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true, // Index for efficient cleanup queries
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
  }],
  stats: {
    totalPosts: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Index for searching circles
circleSchema.index({ name: 'text', topic: 'text', tags: 'text' });

// Index for finding active circles
circleSchema.index({ isExpired: 1, expiresAt: 1 });

// Virtual to check if circle is still active
circleSchema.virtual('isActive').get(function() {
  return !this.isExpired && new Date() < this.expiresAt;
});

// Method to check if user is a member
circleSchema.methods.isMember = function(userId) {
  return this.members.some(memberId => memberId.toString() === userId.toString());
};

// Method to add member
circleSchema.methods.addMember = async function(userId) {
  if (!this.isMember(userId) && this.members.length < this.maxMembers) {
    this.members.push(userId);
    await this.save();
    return true;
  }
  return false;
};

// Method to remove member
circleSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(memberId => memberId.toString() !== userId.toString());
  await this.save();
};

// Static method to find active circles
circleSchema.statics.findActive = function(query = {}) {
  return this.find({
    ...query,
    isExpired: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to expire old circles
circleSchema.statics.expireOldCircles = async function() {
  const result = await this.updateMany(
    {
      isExpired: false,
      expiresAt: { $lte: new Date() },
    },
    {
      $set: { isExpired: true },
    }
  );
  return result;
};

module.exports = mongoose.model('Circle', circleSchema);
