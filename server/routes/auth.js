const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const auth = require('../middleware/auth');
const { 
  generateVerificationToken, 
  sendVerificationEmail,
  sendPasswordResetEmail 
} = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate account ID
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get initials for avatar
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = new User({
      accountId,
      name,
      email,
      username,
      password: hashedPassword,
      imageUrl,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(newUser, verificationToken);

    // Return response without token (user needs to verify email first)
    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
      email: newUser.email,
      emailVerificationRequired: true,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/signin
// @desc    Login user
// @access  Public
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        emailVerificationRequired: true,
        email: user.email
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user without password
    const userResponse = {
      _id: user._id,
      accountId: user.accountId,
      name: user.name,
      email: user.email,
      username: user.username,
      imageUrl: user.imageUrl,
      bio: user.bio,
      isEmailVerified: user.isEmailVerified,
    };

    res.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin' });
  }
});

// @route   GET /api/auth/current
// @desc    Get current user
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Save = require('../models/Save');
    
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ creator: user._id })
      .populate('creator', 'name username imageUrl')
      .sort({ createdAt: -1 });

    // Get user's saved posts
    const saves = await Save.find({ user: user._id })
      .populate({
        path: 'post',
        populate: { path: 'creator', select: 'name username imageUrl' }
      });

    // Add posts and save to user object
    const userWithPosts = {
      ...user.toObject(),
      posts: posts,
      save: saves,
    };

    res.json(userWithPosts);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/signout
// @desc    Logout user
// @access  Private
router.post('/signout', auth, async (req, res) => {
  try {
    // With JWT, we don't need to do anything server-side
    // The client will remove the token
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if user is already verified (token was already used)
      const alreadyVerifiedUser = await User.findOne({
        isEmailVerified: true,
      }).sort({ updatedAt: -1 }).limit(1);

      // Check if token exists but is expired
      const expiredUser = await User.findOne({
        emailVerificationToken: token,
      });

      if (expiredUser) {
        // Check if already verified
        if (expiredUser.isEmailVerified) {
          return res.json({ 
            message: 'Email already verified! You can now login.',
            success: true,
            alreadyVerified: true
          });
        }
        
        return res.status(400).json({ 
          message: 'Verification token has expired. Please request a new verification email.' 
        });
      }

      return res.status(400).json({ 
        message: 'Invalid or expired verification token' 
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Email verified successfully! You can now use all features.',
      success: true 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public (users can't login without verification)
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists with this email, a verification email has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send email
    await sendVerificationEmail(user, verificationToken);

    res.json({ message: 'Verification email sent! Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue anyway - don't block the flow
    }

    res.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Password reset successfully! You can now log in with your new password.',
      success: true 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-username
// @desc    Check if username is available
// @access  Public
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    const user = await User.findOne({ username: username.trim() });
    
    res.json({ available: !user });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-email
// @desc    Check if email is available
// @access  Public
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    res.json({ available: !user });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
