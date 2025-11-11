import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { pushNotificationService } from '@/services/pushNotificationService';

const PushNotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Check if push notifications are supported
      const supported = await pushNotificationService.initialize();
      setIsSupported(supported);
      
      if (supported) {
        // Check current subscription status
        const subscribed = await pushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);
        
        // Check current permission
        setPermission(Notification.permission);
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      const success = await pushNotificationService.subscribe();
      
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        toast({
          title: '🔔 Push Notifications Enabled',
          description: 'You\'ll now receive push notifications for important updates!',
          className: 'bg-green-500/10 border-green-500',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable push notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        toast({
          title: '🔕 Push Notifications Disabled',
          description: 'You won\'t receive push notifications anymore.',
          className: 'bg-orange-500/10 border-orange-500',
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable push notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const success = await pushNotificationService.sendTestNotification();
      
      if (success) {
        toast({
          title: '📱 Test Notification Sent',
          description: 'Check your notifications!',
          className: 'bg-blue-500/10 border-blue-500',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send test notification.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  if (!isSupported) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <BellOff className="w-5 h-5 text-light-4" />
          <h3 className="text-lg font-semibold text-light-1">Push Notifications</h3>
        </div>
        <p className="text-sm text-light-4 mb-3">
          Push notifications are not supported in your browser.
        </p>
        <div className="text-xs text-light-4">
          <p>• Make sure you're using a modern browser</p>
          <p>• Enable JavaScript</p>
          <p>• Use HTTPS (required for push notifications)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <Bell className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-light-1">Push Notifications</h3>
      </div>
      
      <p className="text-sm text-light-4 mb-4">
        Get instant notifications for messages, likes, comments, and more - even when Peep is closed.
      </p>

      <div className="space-y-3">
        {permission === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-400 mb-2">
              ❌ Notifications are blocked in your browser
            </p>
            <p className="text-xs text-light-4">
              To enable: Click the 🔒 icon in your address bar → Allow notifications
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied'}
              className="flex-1 bg-primary-500 hover:bg-primary-600"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Enable Push Notifications
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="outline"
                className="flex-1 bg-dark-3 hover:bg-dark-4 border-dark-4"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-light-4 mr-2" />
                ) : (
                  <BellOff className="w-4 h-4 mr-2" />
                )}
                Disable
              </Button>
              
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="bg-blue-500/20 hover:bg-blue-500/30 border-blue-500"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Test
              </Button>
            </>
          )}
        </div>

        {isSubscribed && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-sm text-green-400 flex items-center">
              ✅ Push notifications are enabled
            </p>
            <p className="text-xs text-light-4 mt-1">
              You'll receive notifications for messages, likes, comments, and more
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-dark-4">
        <p className="text-xs text-light-4">
          💡 <strong>Tip:</strong> Push notifications work even when your browser is closed, 
          keeping you connected with your Peep community 24/7.
        </p>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
