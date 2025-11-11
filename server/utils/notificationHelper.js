const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../services/pushNotificationService');

/**
 * Create a notification and emit via Socket.io + Push
 * @param {Object} params - Notification parameters
 * @param {String} params.recipient - User ID of recipient
 * @param {String} params.sender - User ID of sender
 * @param {String} params.type - Notification type
 * @param {String} params.message - Notification message
 * @param {String} params.link - Link to related content
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} io - Socket.io instance
 */
async function createNotification({ recipient, sender, type, message, link, metadata }, io) {
  try {
    // Don't create notification if sender is recipient
    if (recipient === sender) {
      return null;
    }

    // Check user's notification preferences
    const recipientUser = await User.findById(recipient).select('notificationSettings');
    if (!recipientUser) {
      return null;
    }

    // Check if this type of notification is enabled
    const notifSettings = recipientUser.notificationSettings;
    const shouldNotify = checkNotificationPermission(type, notifSettings);
    
    if (!shouldNotify) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      link,
      metadata,
    });

    // Populate sender info
    await notification.populate('sender', 'name username imageUrl');

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(recipient).emit('notification', notification);
    }

    // Send push notification if enabled
    if (notifSettings.pushNotifications) {
      const senderInfo = notification.sender;
      
      sendPushNotification(recipient, {
        title: `${senderInfo.name} ${message}`,
        body: getNotificationBody(type, senderInfo.name, metadata),
        icon: senderInfo.imageUrl || '/assets/images/logo.png',
        badge: '/assets/icons/badge.png',
        url: link,
        tag: `${type}-${sender}`,
        data: {
          type,
          senderId: sender,
          notificationId: notification._id.toString(),
          ...metadata
        }
      }).catch(err => console.error('Push notification error:', err));
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

/**
 * Check if notification type is allowed based on user settings
 */
function checkNotificationPermission(type, settings) {
  const permissionMap = {
    'post': true, // Always notify for posts from followed users
    'like': settings.likeNotif,
    'comment': settings.commentNotif,
    'message': settings.messageNotif,
    'follow': settings.followNotif,
    'vibe_request': settings.vibeRequestNotif,
    'vibe_accepted': settings.vibeRequestNotif,
    'mention': settings.commentNotif, // Use comment setting for mentions
  };

  return permissionMap[type] !== false;
}

/**
 * Generate notification body text based on type
 */
function getNotificationBody(type, senderName, metadata) {
  const bodyMap = {
    'post': 'shared a new post',
    'like': 'liked your post',
    'comment': metadata?.commentText ? `commented: "${metadata.commentText.substring(0, 50)}..."` : 'commented on your post',
    'message': metadata?.messagePreview ? `sent: "${metadata.messagePreview.substring(0, 50)}..."` : 'sent you a message',
    'follow': 'started following you',
    'vibe_request': 'wants to vibe with you!',
    'vibe_accepted': 'accepted your vibe request. You\'re now vibing!',
    'mention': 'mentioned you in a post',
  };

  return bodyMap[type] || 'sent you a notification';
}

/**
 * Create notification for new post
 */
async function notifyNewPost(postCreatorId, post, io) {
  const User = require('../models/User');
  
  try {
    // Get post creator's followers
    const creator = await User.findById(postCreatorId).select('followers');
    
    if (creator && creator.followers && creator.followers.length > 0) {
      // Create notifications for all followers
      const notifications = creator.followers.map(followerId =>
        createNotification({
          recipient: followerId.toString(),
          sender: postCreatorId,
          type: 'post',
          message: 'posted something new',
          link: `/posts/${post._id}`,
          metadata: { postId: post._id },
        }, io)
      );

      await Promise.all(notifications);
    }
  } catch (error) {
    console.error('Notify new post error:', error);
  }
}

/**
 * Create notification for like
 */
async function notifyLike(postOwnerId, likerId, postId, io) {
  return createNotification({
    recipient: postOwnerId,
    sender: likerId,
    type: 'like',
    message: 'liked your post',
    link: `/posts/${postId}`,
    metadata: { postId },
  }, io);
}

/**
 * Create notification for comment
 */
async function notifyComment(postOwnerId, commenterId, postId, commentText, io) {
  return createNotification({
    recipient: postOwnerId,
    sender: commenterId,
    type: 'comment',
    message: `commented: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    link: `/posts/${postId}`,
    metadata: { postId, commentText },
  }, io);
}

/**
 * Create notification for new message
 */
async function notifyMessage(recipientId, senderId, messagePreview, io) {
  return createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'message',
    message: `sent you a message: "${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`,
    link: `/chat/${senderId}`,
    metadata: { messagePreview },
  }, io);
}

/**
 * Create notification for new follower
 */
async function notifyFollow(followedUserId, followerId, io) {
  return createNotification({
    recipient: followedUserId,
    sender: followerId,
    type: 'follow',
    message: 'started following you',
    link: `/profile/${followerId}`,
    metadata: {},
  }, io);
}

/**
 * Create notification for vibe request
 */
async function notifyVibeRequest(recipientId, senderId, io) {
  return createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'vibe_request',
    message: 'sent you a vibe request',
    link: '/vibes',
    metadata: {},
  }, io);
}

/**
 * Create notification for vibe accepted
 */
async function notifyVibeAccepted(recipientId, accepterId, io) {
  return createNotification({
    recipient: recipientId,
    sender: accepterId,
    type: 'vibe_accepted',
    message: 'accepted your vibe request',
    link: '/vibes',
    metadata: {},
  }, io);
}

/**
 * Create notification for mention in post
 */
async function notifyMention(mentionedUserId, mentionerId, postId, io) {
  return createNotification({
    recipient: mentionedUserId,
    sender: mentionerId,
    type: 'mention',
    message: 'mentioned you in a post',
    link: `/posts/${postId}`,
    metadata: { postId },
  }, io);
}

module.exports = {
  createNotification,
  notifyNewPost,
  notifyLike,
  notifyComment,
  notifyMessage,
  notifyFollow,
  notifyVibeRequest,
  notifyVibeAccepted,
  notifyMention,
};
