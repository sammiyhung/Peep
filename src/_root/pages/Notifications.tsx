import { useState } from 'react';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/shared';
import {
  useGetNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/lib/react-query/queries';
import { multiFormatDateString } from '@/lib/utils';

const Notifications = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading } = useGetNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const notifications = data?.notifications || [];
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  const unreadCount = data?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    const iconClasses = "w-10 h-10 p-2 rounded-full";
    switch (type) {
      case 'vibe_request':
        return <div className={`${iconClasses} bg-pink-500/20 text-pink-500`}>💕</div>;
      case 'vibe_accepted':
        return <div className={`${iconClasses} bg-green-500/20 text-green-500`}>✨</div>;
      case 'follow':
        return <div className={`${iconClasses} bg-blue-500/20 text-blue-500`}>👤</div>;
      case 'like':
        return <div className={`${iconClasses} bg-red-500/20 text-red-500`}>❤️</div>;
      case 'comment':
        return <div className={`${iconClasses} bg-purple-500/20 text-purple-500`}>💬</div>;
      default:
        return <div className={`${iconClasses} bg-gray-500/20 text-gray-500`}>🔔</div>;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8" />
            <div>
              <h2 className="h3-bold md:h2-bold">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-light-3">{unreadCount} unread</p>
              )}
            </div>
          </div>

          {notifications && notifications.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllAsRead()}
              className="bg-dark-3 hover:bg-dark-4 border-dark-4"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-dark-4">
          <Button
            variant="ghost"
            className={`px-6 py-3 rounded-t-lg transition-all ${
              filter === 'all'
                ? 'bg-primary-500/20 border-b-2 border-primary-500 text-primary-500 font-semibold'
                : 'text-light-3 hover:bg-dark-4 hover:text-light-1'
            }`}
            onClick={() => setFilter('all')}
          >
            <Filter className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant="ghost"
            className={`px-6 py-3 rounded-t-lg transition-all ${
              filter === 'unread'
                ? 'bg-primary-500/20 border-b-2 border-primary-500 text-primary-500 font-semibold'
                : 'text-light-3 hover:bg-dark-4 hover:text-light-1'
            }`}
            onClick={() => setFilter('unread')}
          >
            <Bell className="w-4 h-4 mr-2" />
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </div>

        {/* Notifications List */}
        <div className="w-full max-w-5xl">
          {isLoading ? (
            <Loader />
          ) : filteredNotifications && filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map((notification: any) => (
                <div
                  key={notification._id}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                    notification.read
                      ? 'bg-dark-3 hover:bg-dark-4'
                      : 'bg-primary-500/10 border border-primary-500/30 hover:bg-primary-500/15'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {notification.link ? (
                      <Link
                        to={notification.link}
                        onClick={() => handleNotificationClick(notification)}
                        className="block"
                      >
                        <h4 className="font-semibold text-light-1 mb-1 hover:text-primary-500 transition-colors">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-light-3 mb-2">{notification.message}</p>
                        <p className="text-xs text-light-4">
                          {multiFormatDateString(notification.createdAt)}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <h4 className="font-semibold text-light-1 mb-1">{notification.title}</h4>
                        <p className="text-sm text-light-3 mb-2">{notification.message}</p>
                        <p className="text-xs text-light-4">
                          {multiFormatDateString(notification.createdAt)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-2 hover:bg-dark-4 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-2 hover:bg-dark-4 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-light-3">
              <Bell className="w-20 h-20 mb-4 opacity-50" />
              <p className="text-xl font-semibold mb-2">No notifications</p>
              <p className="text-sm text-center max-w-md">
                {filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet. When someone interacts with you, they'll appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
