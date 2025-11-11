const express = require('express');
const auth = require('../middleware/auth');
const { subscribeToPush, unsubscribeFromPush } = require('../services/pushNotificationService');

const router = express.Router();

// @route   GET /api/push/vapid-public-key
// @desc    Get VAPID public key for client-side subscription
// @access  Public
router.get('/vapid-public-key', (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

// @route   POST /api/push/subscribe
// @desc    Subscribe user to push notifications
// @access  Private
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ 
        message: 'Invalid subscription object' 
      });
    }

    const result = await subscribeToPush(req.userId, {
      ...subscription,
      userAgent: req.get('User-Agent')
    });

    if (result.success) {
      res.json({ 
        message: 'Successfully subscribed to push notifications',
        subscription: subscription.endpoint 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to subscribe to push notifications',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Server error subscribing to push notifications' });
  }
});

// @route   POST /api/push/unsubscribe
// @desc    Unsubscribe user from push notifications
// @access  Private
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ 
        message: 'Endpoint is required' 
      });
    }

    const result = await unsubscribeFromPush(req.userId, endpoint);

    if (result.success) {
      res.json({ 
        message: 'Successfully unsubscribed from push notifications' 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to unsubscribe from push notifications',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ message: 'Server error unsubscribing from push notifications' });
  }
});

// @route   POST /api/push/test
// @desc    Send test push notification (development only)
// @access  Private
router.post('/test', auth, async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Test notifications not allowed in production' });
    }

    const { sendPushNotification } = require('../services/pushNotificationService');
    
    const result = await sendPushNotification(req.userId, {
      title: '🔔 Test Notification',
      body: 'This is a test push notification from Peep!',
      icon: '/assets/images/logo.png',
      url: '/',
      data: { type: 'test' }
    });

    res.json({ 
      message: 'Test notification sent',
      result 
    });
  } catch (error) {
    console.error('Test push notification error:', error);
    res.status(500).json({ message: 'Server error sending test notification' });
  }
});

module.exports = router;
