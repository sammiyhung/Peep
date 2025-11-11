import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, Trash2, Heart, MessageSquare, UserPlus, Users, Coffee, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useGetNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/lib/react-query/queries';
import { multiFormatDateString } from '@/lib/utils';
import { Loader } from '@/components/shared';

type NotificationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const { data: notificationsData, isLoading } = useGetNotifications(
    50,
    0,
    filter === 'unread'
  );
  const { mutateAsync: markAsRead } = useMarkNotificationAsRead();
  const { mutateAsync: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutateAsync: deleteNotification } = useDeleteNotification();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    if (notification.link) {
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vibe_request':
        return <UserPlus className="w-5 h-5 text-primary-500" />;
      case 'vibe_accepted':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'coffee_chat':
        return <Coffee className="w-5 h-5 text-orange-500" />;
      case 'collaboration':
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-light-3" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-dark-2 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <h2 className="text-xl font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 p-4 border-b border-dark-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="ml-auto"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-light-3">
              <Bell className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-4">
              {notifications.map((notification: any) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-dark-3 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-dark-3/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-sm text-light-2 mt-1">{notification.message}</p>
                          <p className="text-xs text-light-4 mt-2">
                            {multiFormatDateString(notification.createdAt)}
                          </p>
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={(e) => handleDelete(notification._id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Link preview */}
                      {notification.link && (
                        <Link
                          to={notification.link}
                          className="text-xs text-primary-500 hover:underline mt-2 inline-block"
                          onClick={() => onClose()}
                        >
                          View →
                        </Link>
                      )}

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full absolute right-4 top-6" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
