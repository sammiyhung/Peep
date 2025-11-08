import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useUserContext } from '@/context/AuthContext';
import { api } from '@/lib/api/config';
import io, { Socket } from 'socket.io-client';
import ChatListSkeleton from '@/components/shared/ChatListSkeleton';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    username: string;
    imageUrl: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount?: number;
}

const ChatList = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [showMenu, setShowMenu] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [user.id]);

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    if (user.id) {
      socketRef.current.emit('join', user.id);
    }

    // Listen for typing indicators
    socketRef.current.on('userTypingInChat', ({ userId }: { userId: string }) => {
      setTypingUsers(prev => new Set(prev).add(userId));
    });

    socketRef.current.on('userStoppedTypingInChat', ({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Listen for unread count changes
    socketRef.current.on('unreadCountChanged', () => {
      fetchConversations(); // Refresh conversations to get updated unread count
    });

    // Listen for new messages
    socketRef.current.on('receiveMessage', () => {
      fetchConversations(); // Refresh to show new message in list
    });

  }, [user.id]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/messages/conversations');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherParticipant = (participants: Conversation['participants']) => {
    return participants.find(p => p._id !== user.id);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherParticipant(conv.participants);
    if (!otherUser) return false;
    
    // Search filter
    const matchesSearch = otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const unreadCount = conv.unreadCount ?? 0;
    const matchesFilter = 
      filterType === 'all' ? true :
      filterType === 'unread' ? unreadCount > 0 :
      filterType === 'read' ? unreadCount === 0 :
      true;
    
    return matchesSearch && matchesFilter;
  });

  const handleClearAllChats = async () => {
    if (!confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) return;
    
    try {
      setConversations([]);
      await api.delete('/api/messages/conversations/all');
    } catch (error) {
      console.error('Error clearing conversations:', error);
      fetchConversations();
    }
  };

  if (isLoading) {
    return (
      <div className="common-container">
        <div className="max-w-5xl w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="h3-bold md:h2-bold">Messages</h2>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <ChatListSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="common-container">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="h3-bold md:h2-bold">Messages</h2>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-light-1 placeholder:text-light-3 focus:outline-none glass-card transition-all duration-300"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          />
        </div>

        {/* Filter Buttons and Menu */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'glass-card text-light-2 hover:text-light-1'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filterType === 'unread'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'glass-card text-light-2 hover:text-light-1'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterType('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filterType === 'read'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'glass-card text-light-2 hover:text-light-1'
              }`}
            >
              Read
            </button>
          </div>
          
          {/* CRUD Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg glass-card hover:bg-dark-4 transition-all"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      handleClearAllChats();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-dark-4 transition-all flex items-center gap-2 text-red-500"
                  >
                    <Trash2 size={16} />
                    Clear All Chats
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <img
              src="/assets/icons/chat.svg"
              alt="no chats"
              className="w-24 h-24 mb-6 opacity-50"
            />
            <h3 className="h3-bold text-light-2 mb-2">No Chats Yet</h3>
            <p className="text-light-3 text-center mb-6 max-w-md">
              Start a conversation by selecting someone from your Peeps
            </p>
            <button
              onClick={() => navigate('/all-users')}
              className="shad-button_primary px-8 py-3 rounded-lg"
            >
              Find Peeps to Chat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation.participants);
              if (!otherUser) return null;

              return (
                <Link
                  key={conversation._id}
                  to={`/chat/${otherUser._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 glass-card glass-hover animate-fade-in"
                >
                  {/* User Avatar */}
                  <img
                    src={otherUser.imageUrl || '/assets/icons/profile-placeholder.svg'}
                    alt={otherUser.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />

                  {/* Message Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                    <h3 className="base-medium text-light-1 truncate">
                      {otherUser.name}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="small-regular text-light-3">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="small-regular text-light-3 truncate flex-1">
                      {typingUsers.has(otherUser._id) ? (
                        <span className="text-primary-500 italic">typing...</span>
                      ) : conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === user.id && 'You: '}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        'Start a conversation'
                      )}
                      </p>
                      {(conversation.unreadCount ?? 0) > 0 && (
                        <span className="flex-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold text-white animate-pulse" style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                        }}>
                          {(conversation.unreadCount ?? 0) > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
