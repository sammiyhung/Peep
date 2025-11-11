import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: '🟢 Back Online',
        description: 'Your internet connection has been restored.',
        className: 'bg-green-500/10 border-green-500',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '🔴 No Internet Connection',
        description: 'Please check your network connection.',
        variant: 'destructive',
        duration: Infinity, // Stay until back online
      });
    };

    const handleSlowConnection = () => {
      if (navigator.onLine) {
        toast({
          title: '🟡 Slow Connection',
          description: 'Your internet connection is slow.',
          className: 'bg-yellow-500/10 border-yellow-500',
        });
      }
    };

    // Check connection speed
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          handleSlowConnection();
        }
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return { isOnline };
};
