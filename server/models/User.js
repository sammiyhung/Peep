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
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
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
  aboutMe: {
    type: String,
    default: '',
  },
  // Personal Information
  dateOfBirth: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  // Professional Information
  occupation: {
    type: String,
    default: '',
  },
  company: {
    type: String,
    default: '',
  },
  skills: {
    type: String,
    default: '',
  },
  // Privacy Settings
  showEmail: {
    type: Boolean,
    default: false,
  },
  showPhone: {
    type: Boolean,
    default: false,
  },
  showLocation: {
    type: Boolean,
    default: true,
  },
  showDateOfBirth: {
    type: Boolean,
    default: false,
  },
  liked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  saved: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  peeps: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    color: String,
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
  // Authenticity Score
  authenticityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  authenticityMetrics: {
    genuineInteractions: { type: Number, default: 0 },
    helpfulContent: { type: Number, default: 0 },
    spamReports: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now },
  },
  // Coffee Chat & Collaboration
  coffeeChats: [{
    withUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledAt: Date,
    completedAt: Date,
    rating: Number,
  }],
  collaborationRequests: [{
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: String,
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  }],
  // Preferences
  preferences: {
    openToCoffeeChat: { type: Boolean, default: true },
    openToCollaboration: { type: Boolean, default: true },
    preferredMoods: [String],
  },
  // Notification Settings
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    vibeRequestNotif: { type: Boolean, default: true },
    messageNotif: { type: Boolean, default: true },
    followNotif: { type: Boolean, default: true },
    likeNotif: { type: Boolean, default: false },
    commentNotif: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
