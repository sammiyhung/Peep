// Service Worker for Push Notifications
const CACHE_NAME = 'peep-push-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Peep Notification',
    body: 'You have a new notification',
    icon: '/assets/images/logo.png',
    badge: '/assets/icons/badge.png',
    url: '/',
    data: {}
  };

  // Parse notification data if available
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag || 'peep-notification',
    data: {
      url: notificationData.url,
      ...notificationData.data
    },
    actions: notificationData.actions || [
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
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Handle notification click or 'view' action
  const urlToOpen = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window/tab, open a new one
        if (self.clients.openWindow) {
          const baseUrl = self.location.origin;
          return self.clients.openWindow(baseUrl + urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Optional: Track notification dismissal analytics
  const notification = event.notification;
  const data = notification.data;
  
  // You can send analytics data here if needed
});

// Background sync for offline notifications (optional)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(
      // Handle any pending notifications when back online
      handleBackgroundSync()
    );
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // This could fetch missed notifications when coming back online
    console.log('Handling background sync for notifications');
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Message event - for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event);
});
