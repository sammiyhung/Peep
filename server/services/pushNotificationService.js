const webpush = require('web-push');
const User = require('../models/User');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@peep.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to a user
 * @param {String} userId - User ID to send notification to
 * @param {Object} payload - Notification payload
 * @param {String} payload.title - Notification title
 * @param {String} payload.body - Notification body
 * @param {String} payload.icon - Notification icon URL
 * @param {String} payload.badge - Notification badge URL
 * @param {String} payload.url - URL to open when clicked
 * @param {Object} payload.data - Additional data
 */
async function sendPushNotification(userId, payload) {
  try {
    // Get user's push subscriptions
    const user = await User.findById(userId).select('pushSubscriptions');
    
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { success: false, reason: 'No subscriptions' };
    }

    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/assets/images/logo.png',
      badge: payload.badge || '/assets/icons/badge.png',
      url: payload.url || '/',
      data: {
        ...payload.data,
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/assets/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/assets/icons/close.png'
        }
      ],
      tag: payload.tag || 'peep-notification',
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
    };

    const results = [];
    
    // Send to all user's subscriptions (multiple devices)
    for (const subscription of user.pushSubscriptions) {
      try {
        const result = await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload),
          {
            TTL: 24 * 60 * 60, // 24 hours
            urgency: payload.urgency || 'normal', // low, normal, high
          }
        );
        
        results.push({ success: true, subscription: subscription.endpoint });
        console.log(`Push notification sent successfully to ${userId}`);
      } catch (error) {
        console.error(`Failed to send push notification to ${userId}:`, error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await User.findByIdAndUpdate(userId, {
            $pull: { pushSubscriptions: subscription }
          });
          console.log(`Removed invalid subscription for user ${userId}`);
        }
        
        results.push({ success: false, error: error.message, subscription: subscription.endpoint });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Push notification service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notifications to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} payload - Notification payload
 */
async function sendBulkPushNotifications(userIds, payload) {
  const results = [];
  
  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    results.push({ userId, ...result });
  }
  
  return results;
}

/**
 * Subscribe user to push notifications
 * @param {String} userId - User ID
 * @param {Object} subscription - Push subscription object
 */
async function subscribeToPush(userId, subscription) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if subscription already exists
    const existingSubscription = user.pushSubscriptions?.find(
      sub => sub.endpoint === subscription.endpoint
    );

    if (!existingSubscription) {
      // Add new subscription
      await User.findByIdAndUpdate(userId, {
        $addToSet: { pushSubscriptions: subscription }
      });
      console.log(`User ${userId} subscribed to push notifications`);
    }

    return { success: true };
  } catch (error) {
    console.error('Subscribe to push error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe user from push notifications
 * @param {String} userId - User ID
 * @param {String} endpoint - Subscription endpoint to remove
 */
async function unsubscribeFromPush(userId, endpoint) {
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint } }
    });
    
    console.log(`User ${userId} unsubscribed from push notifications`);
    return { success: true };
  } catch (error) {
    console.error('Unsubscribe from push error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  subscribeToPush,
  unsubscribeFromPush,
};
