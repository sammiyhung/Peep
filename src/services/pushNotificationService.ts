import { apiConfig } from '@/lib/api/config';

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;

  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if we're in a browser environment
      if (!this.isBrowser()) {
        console.warn('Not in browser environment');
        return false;
      }

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return false;
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return false;
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
      }

      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);

      // Get VAPID public key from server
      await this.getVapidPublicKey();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Get VAPID public key from server
   */
  private async getVapidPublicKey(): Promise<void> {
    try {
      const response = await fetch(`${apiConfig.baseURL}/api/push/vapid-public-key`);
      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isBrowser() || !('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(): Promise<boolean> {
    try {
      if (!this.isBrowser()) {
        console.warn('Not in browser environment');
        return false;
      }

      if (!this.swRegistration || !this.vapidPublicKey) {
        console.error('Push service not initialized');
        return false;
      }

      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Check if already subscribed
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        // Still send to server to ensure it's registered
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetch(`${apiConfig.baseURL}/api/push/subscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ subscription: existingSubscription })
            });
          } catch (error) {
            console.warn('Failed to register existing subscription:', error);
          }
        }
        return true;
      }

      // Create new subscription
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      // Send subscription to server
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return false;
      }

      const response = await fetch(`${apiConfig.baseURL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      if (response.ok) {
        console.log('Successfully subscribed to push notifications');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to subscribe to push notifications:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.isBrowser()) {
        console.warn('Not in browser environment');
        return false;
      }

      if (!this.swRegistration) {
        console.error('Service worker not registered');
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        console.log('No subscription found');
        return true;
      }

      // Unsubscribe from browser
      const successful = await subscription.unsubscribe();
      
      if (successful) {
        // Remove from server
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetch(`${apiConfig.baseURL}/api/push/unsubscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ endpoint: subscription.endpoint })
            });
          } catch (error) {
            console.warn('Failed to remove subscription from server:', error);
          }
        }

        console.log('Successfully unsubscribed from push notifications');
      }

      return successful;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isBrowser() || !this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Send test notification (development only)
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      if (!this.isBrowser()) {
        console.warn('Not in browser environment');
        return false;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return false;
      }

      const response = await fetch(`${apiConfig.baseURL}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test notification failed:', errorText);
      }

      return response.ok;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Convert VAPID key to Uint8Array (BufferSource compatible)
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!this.isBrowser() || typeof window.atob !== 'function') {
      throw new Error('atob function not available');
    }

    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance (safe for SSR)
let pushNotificationServiceInstance: PushNotificationService | null = null;

export const pushNotificationService = (() => {
  if (typeof window === 'undefined') {
    // Return a mock service for SSR environments
    return {
      initialize: async () => false,
      subscribe: async () => false,
      unsubscribe: async () => false,
      isSubscribed: async () => false,
      sendTestNotification: async () => false,
      requestPermission: async () => 'denied' as NotificationPermission,
    };
  }
  
  if (!pushNotificationServiceInstance) {
    pushNotificationServiceInstance = new PushNotificationService();
  }
  
  return pushNotificationServiceInstance;
})();
