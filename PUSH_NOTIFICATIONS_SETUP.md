# 🔔 Push Notifications Setup Guide

## Overview
Complete web push notification system for Peep social platform with real-time delivery, user preferences, and cross-device support.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd server
npm install web-push
```

### 2. Generate VAPID Keys
```bash
cd server
node scripts/generateVapidKeys.js
```

### 3. Add Environment Variables
Add to your `.env` file:
```env
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### 4. Start the Server
```bash
npm run dev
```

## 📱 Features Implemented

### ✅ Backend Features
- **Push Notification Service** - Send notifications to users
- **VAPID Key Management** - Secure authentication
- **Subscription Management** - Handle user subscriptions
- **Bulk Notifications** - Send to multiple users
- **User Preferences** - Respect notification settings
- **Auto-cleanup** - Remove invalid subscriptions

### ✅ Frontend Features
- **Service Worker** - Handle push events
- **Push Settings UI** - Easy enable/disable
- **Permission Handling** - Request user consent
- **Test Notifications** - Development testing
- **Cross-device Support** - Multiple device subscriptions
- **Offline Support** - Background sync

### ✅ Notification Types
- 📝 **New Posts** - From followed users
- ❤️ **Likes** - On your posts
- 💬 **Comments** - On your posts
- 📨 **Messages** - Direct messages
- 👥 **Follows** - New followers
- ✨ **Vibe Requests** - Vibe interactions
- 🎉 **Vibe Accepted** - Successful connections

## 🔧 API Endpoints

### Push Notification Routes
```
GET  /api/push/vapid-public-key    # Get VAPID public key
POST /api/push/subscribe           # Subscribe to notifications
POST /api/push/unsubscribe         # Unsubscribe from notifications
POST /api/push/test               # Send test notification (dev only)
```

### Example Usage
```javascript
// Subscribe to push notifications
const response = await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ subscription })
});
```

## 🎯 User Experience

### 1. First Time Setup
1. User visits Settings → Notifications
2. Sees push notification card with explanation
3. Clicks "Enable Push Notifications"
4. Browser requests permission
5. Service worker registers subscription
6. Server stores subscription

### 2. Receiving Notifications
1. User receives real-time notification
2. Notification shows with custom icon/message
3. Click opens relevant page in app
4. Actions available (View/Dismiss)

### 3. Managing Notifications
1. Toggle on/off in settings
2. Test notifications in development
3. Automatic cleanup of invalid subscriptions
4. Respect user preferences per notification type

## 🔒 Security & Privacy

### VAPID Keys
- **Public Key** - Shared with browser
- **Private Key** - Server-side only
- **Subject** - Contact email for push service

### User Consent
- Explicit permission request
- Easy enable/disable
- Respects browser settings
- No notifications without consent

### Data Protection
- Minimal data in push payload
- Encrypted transmission
- Auto-cleanup invalid subscriptions
- User can unsubscribe anytime

## 🛠️ Development & Testing

### Test Notifications
```javascript
// Send test notification (development only)
await pushNotificationService.sendTestNotification();
```

### Debug Service Worker
1. Open Chrome DevTools
2. Go to Application → Service Workers
3. Check registration status
4. View push events in console

### Common Issues
1. **HTTPS Required** - Push notifications only work on HTTPS
2. **Permission Denied** - User must grant permission
3. **Service Worker** - Must be registered and active
4. **VAPID Keys** - Must be properly configured

## 📊 Analytics & Monitoring

### Success Metrics
- Subscription rate
- Notification delivery success
- Click-through rate
- User engagement

### Error Handling
- Invalid subscription cleanup
- Network failure retry
- Permission denied handling
- Service worker errors

## 🚀 Production Deployment

### 1. Environment Setup
```env
NODE_ENV=production
VAPID_PUBLIC_KEY=your_production_public_key
VAPID_PRIVATE_KEY=your_production_private_key
VAPID_SUBJECT=mailto:admin@yourapp.com
```

### 2. HTTPS Certificate
- Push notifications require HTTPS
- Use Let's Encrypt or similar
- Configure proper SSL/TLS

### 3. Service Worker Caching
- Service worker caches for offline support
- Update cache version when deploying
- Handle service worker updates

## 🔮 Future Enhancements

### Planned Features
- **Rich Notifications** - Images, buttons, progress
- **Notification Scheduling** - Send at optimal times
- **A/B Testing** - Test notification content
- **Analytics Dashboard** - Detailed metrics
- **Mobile App** - Native push notifications
- **Email Fallback** - When push unavailable

### Advanced Features
- **Geolocation** - Location-based notifications
- **Personalization** - AI-powered content
- **Batching** - Group similar notifications
- **Priority Levels** - Urgent vs normal
- **Custom Sounds** - Per notification type

## 📞 Support

### Troubleshooting
1. Check browser console for errors
2. Verify HTTPS is enabled
3. Confirm VAPID keys are correct
4. Test with different browsers
5. Check service worker registration

### Browser Support
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Safari 16+ (macOS/iOS)
- ✅ Edge 17+
- ❌ Internet Explorer (not supported)

---

**🎉 Your push notification system is now ready!**

Users will receive instant notifications for all interactions, keeping them engaged even when the app is closed. The system respects user preferences and provides a seamless cross-device experience.
