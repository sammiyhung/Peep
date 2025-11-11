// Chat.tsx
import { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchMessages, getChatPartner } from './ChatService'; 
import { getCurrentUser } from '@/lib/api/api';
import { api } from '@/lib/api/config';
import io, { Socket } from 'socket.io-client'; // Socket.io client
import TypingIndicator from './TypingIndicator'; // Typing indicator component
import { useToast } from '@/components/ui/use-toast';


const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'; // Socket.io server URL (same as API)

const Chat = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // States for Search Functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // States for Overlays
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  
  // Chat Customization Settings with localStorage persistence
  const [chatBgColor, setChatBgColor] = useState(() => 
    localStorage.getItem('chatBgColor') || '#09090b'
  );
  const [messageBubbleStyle, setMessageBubbleStyle] = useState(() => 
    localStorage.getItem('messageBubbleStyle') || 'rounded'
  );
  const [fontSize, setFontSize] = useState(() => 
    localStorage.getItem('fontSize') || 'medium'
  );
  const [showTimestamps, setShowTimestamps] = useState(() => 
    localStorage.getItem('showTimestamps') !== 'false'
  );
  const [soundEnabled, setSoundEnabled] = useState(() => 
    localStorage.getItem('soundEnabled') !== 'false'
  );

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatBgColor', chatBgColor);
  }, [chatBgColor]);

  useEffect(() => {
    localStorage.setItem('messageBubbleStyle', messageBubbleStyle);
  }, [messageBubbleStyle]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('showTimestamps', String(showTimestamps));
  }, [showTimestamps]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);
  
  // States for Message CRUD
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Ref for last message and message end
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Ref to track scroll position
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize Socket.io client
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // Specify transports if needed
    });

    // Once socket is connected, emit 'join' event with currentUserId
    if (currentUserId) {
      socketRef.current.emit('join', currentUserId);
    }

    // Listen for incoming messages from other user ONLY
    socketRef.current.on('receiveMessage', (messageData: any) => {
      // Only add message if it's NOT from current user (i.e., it's from the other person)
      if (messageData.senderId !== currentUserId) {
        setMessages((prevMessages) => [...prevMessages, {
          _id: messageData._id,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          timestamp: messageData.timestamp,
          edited: messageData.edited,
          loading: false,
        }]);
        scrollToBottom();
      }
    });

    // Listen for message saved confirmation (for sender)
    socketRef.current.on('messageSaved', (messageData: any) => {
      console.log('Message saved event received:', messageData);
      setMessages((prevMessages) => {
        const updated = prevMessages.map(msg =>
          msg._id === messageData.tempId
            ? {
                _id: messageData._id,
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                content: messageData.content,
                timestamp: messageData.timestamp,
                edited: messageData.edited,
                loading: false,
              }
            : msg
        );
        console.log('Updated messages:', updated);
        return updated;
      });
      scrollToBottom();
    });

    // Listen for message failed
    socketRef.current.on('messageFailed', ({ tempId }: { tempId: string }) => {
      setMessages((prevMessages) =>
        prevMessages.map(msg =>
          msg._id === tempId ? { ...msg, failed: true, loading: false } : msg
        )
      );
    });

    // Listen for typing indicators
    socketRef.current.on('typing', ({ senderId }: { senderId: string }) => {
      if (senderId !== currentUserId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000); // Hide after 3 seconds
      }
    });

    // Listen for message deletion
    socketRef.current.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
    });

    // Listen for message editing
    socketRef.current.on('messageEdited', ({ messageId, content }: { messageId: string; content: string }) => {
      setMessages((prevMessages) =>
        prevMessages.map(msg =>
          msg._id === messageId ? { ...msg, content, edited: true } : msg
        )
      );
    });

  }, [currentUserId, SOCKET_SERVER_URL]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setCurrentUserId(currentUser._id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchChatPartnerDetails = async () => {
      if (userId) {
        setIsLoadingPartner(true);
        try {
          const partnerData = await getChatPartner(userId);
          setChatPartner(partnerData);
        } catch (error) {
          console.error('Error fetching chat partner:', error);
        } finally {
          setIsLoadingPartner(false);
        }
      }
    };
    fetchChatPartnerDetails();
  }, [userId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (currentUserId && userId) {
        const messages = await fetchMessages(currentUserId, userId);
        setMessages(messages);
        scrollToBottom();
        
        // Mark messages as read when opening chat
        try {
          await api.put(`/api/messages/mark-read/${userId}`);
          // Notify other user that unread count changed
          socketRef.current?.emit('updateUnreadCount', { receiverId: userId });
          // Also emit to self to update own badge
          socketRef.current?.emit('updateUnreadCount', { receiverId: currentUserId });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    };
    loadMessages();
  }, [currentUserId, userId]);

  useEffect(() => {
    // Scroll to bottom on message updates
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom on page load
    scrollToBottom();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !userId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: userId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      loading: true,
      replyTo: replyToMessage ? {
        _id: replyToMessage._id,
        senderId: replyToMessage.senderId,
        content: replyToMessage.content,
      } : undefined,
    };

    // Add to local state immediately
    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setNewMessage('');
    cancelReply(); // Clear reply state
    scrollToBottom();

    // Send via Socket.io ONLY (socket will save to database)
    socketRef.current?.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: userId,
      message: newMessage.trim(),
      tempId: tempId,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socketRef.current && currentUserId && userId) {
      // Emit typing for in-chat indicator
      socketRef.current.emit('typing', {
        senderId: currentUserId,
        receiverId: userId,
      });

      // Emit typing for chat list indicator
      socketRef.current.emit('typingInChat', {
        senderId: currentUserId,
        receiverId: userId,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set a timeout to reset typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        // Emit stop typing for chat list
        socketRef.current?.emit('stopTypingInChat', {
          senderId: currentUserId,
          receiverId: userId,
        });
      }, 3000);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Show confirmation dialog
    setDeleteConfirmId(messageId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      // Delete from backend
      await api.delete(`/api/messages/${deleteConfirmId}`);

      // Remove from local state
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== deleteConfirmId));

      // Emit Socket.io event to notify other user
      socketRef.current?.emit('deleteMessage', {
        messageId: deleteConfirmId,
        receiverId: userId,
      });

      // Show success toast
      toast({
        title: "Message deleted",
        description: "The message has been removed",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Clear Chat
  const handleClearChat = async () => {
    try {
      // Delete all messages with this user
      await api.delete(`/api/messages/conversation/${userId}`);
      
      setMessages([]);
      setShowClearChatConfirm(false);
      
      toast({
        title: "Chat cleared",
        description: "All messages have been deleted",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat",
        variant: "destructive",
      });
    }
  };

  // Export Chat
  const handleExportChat = () => {
    const chatData = messages.map(msg => ({
      sender: msg.senderId === currentUserId ? 'You' : chatPartner?.name,
      message: msg.content,
      timestamp: new Date(msg.timestamp).toLocaleString(),
    }));
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-with-${chatPartner?.username}-${Date.now()}.json`;
    link.click();
    
    toast({
      title: "Chat exported",
      description: "Chat history downloaded successfully",
    });
    
    setIsMenuOpen(false);
  };

  // Block User
  const handleBlockUser = async () => {
    try {
      await api.post(`/api/users/block/${userId}`);
      
      toast({
        title: "User blocked",
        description: `${chatPartner?.name} has been blocked`,
      });
      
      setShowBlockConfirm(false);
      navigate('/chats');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  // Copy Message
  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
    
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Reply to Message
  const handleReplyToMessage = (message: any) => {
    setReplyToMessage(message);
    document.querySelector<HTMLInputElement>('.message-input')?.focus();
  };

  // Cancel Reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) {
      toast({
        title: "Empty message",
        description: "Message cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update on backend
      await api.put(`/api/messages/${messageId}`, {
        content: editingContent.trim(),
      });

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map(msg =>
          msg._id === messageId ? { ...msg, content: editingContent.trim(), edited: true } : msg
        )
      );

      // Emit Socket.io event to notify other user
      socketRef.current?.emit('editMessage', {
        messageId,
        content: editingContent.trim(),
        receiverId: userId,
      });

      setEditingMessageId(null);
      setEditingContent('');

      // Show success toast
      toast({
        title: "Message updated",
        description: "Your message has been edited",
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    }
  };




  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Search Functionality with special character escaping
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    // Escape special regex characters for literal search
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = messages
      .map((msg, index) => {
        try {
          return new RegExp(escapedQuery, 'i').test(msg.content) ? index : -1;
        } catch {
          return msg.content.toLowerCase().includes(query.toLowerCase()) ? index : -1;
        }
      })
      .filter(index => index !== -1);
    setSearchResults(results);
    setCurrentSearchIndex(0);
  };

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex]);
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex]);
  };

  const scrollToMessage = (index: number) => {
    const messageElement = document.getElementById(`message-${index}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle Scroll to Show/Hide Down Arrow - Smart version
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Only show if there are messages AND user scrolled up more than 100px
      setShowJumpButton(messages.length > 0 && distanceFromBottom > 100);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Initialize settings tab to theme when opened
  useEffect(() => {
    if (isSettingsOpen && !activeSettingsTab) {
      setActiveSettingsTab('theme');
    }
  }, [isSettingsOpen]);

  // Close overlays when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the overlay
      if (target.closest('.glass-card')) return;
      
      // Close all overlays
      if (isMenuOpen) setIsMenuOpen(false);
      if (isSettingsOpen) setIsSettingsOpen(false);
    };

    if (isMenuOpen || isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen, isSettingsOpen]);

  // Render Highlighted Message Content with escaped regex
  const renderMessageContent = (content: string) => {
    if (!searchQuery) return content;
    try {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = content.split(regex);
      return parts.map((part, index) => 
        regex.test(part) ? <span key={index} className="bg-yellow-200 text-gray-900">{part}</span> : part
      );
    } catch {
      return content;
    }
  };

  return (
    <div className="chat-page-container h-full flex flex-col justify-between w-full sm:overflow-x-hidden sm:overflow-y-hidden">
      {/* Header/Top Bar */}
      <div className="chat-header flex items-center justify-between p-4 relative glass-card animate-fade-in z-30" style={{
        background: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chats')} className="back-button hover:bg-gray-800 p-2 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Menu Dropdown Button */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div className="absolute left-0 mt-2 w-56 glass-card rounded-xl p-2 z-50 animate-scale-in shadow-2xl">
                  <button
                    onClick={handleExportChat}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-light-2 hover:bg-dark-3 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">Export Chat</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowClearChatConfirm(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-light-2 hover:bg-dark-3 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm font-medium">Clear Chat</span>
                  </button>
                  
                  <div className="my-1 border-t border-gray-700"></div>
                  
                  <button
                    onClick={() => {
                      setShowBlockConfirm(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium">Block User</span>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Skeleton Loader or Profile */}
          {isLoadingPartner ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 animate-shimmer" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-600 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <Link to={`/profile/${chatPartner?._id}`} className="flex items-center group">
              <img 
                src={chatPartner?.imageUrl || '/assets/icons/profile-placeholder.svg'} 
                alt="Avatar" 
                className="h-10 w-10 rounded-full mr-2 ring-2 ring-transparent group-hover:ring-primary-500 transition-all" 
              />
              <div>
                <p className="font-bold text-md text-white group-hover:text-primary-500 transition-colors">{chatPartner?.name}</p>
                <p className="text-sm text-gray-400">@{chatPartner?.username}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Search and Icon Buttons */}
        <div className="flex items-center gap-1">
          {/* Search Bar for Large Screens */}
          <div className="hidden lg:flex relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search Chat"
              className="px-1 py-1 text-white rounded-md border border-gray-300 focus:outline-none focus:bg-gray-800 bg-gray-700"
            />
            {searchQuery && (
              <div className="absolute right-10 top-1 flex flex-col">
                <button onClick={goToPrevResult} className="bg-gray-600 text-white p-1 rounded mb-1">
                  ↑
                </button>
                <button onClick={goToNextResult} className="bg-gray-600 text-white p-1 rounded">
                  ↓
                </button>
              </div>
            )}
          </div>

          {/* Search Button for Small Screens */}
          <button 
            className="lg:hidden p-1 rounded-full hover:bg-gray-800 focus:outline-none"
            onClick={() => setIsSearchActive(!isSearchActive)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 text-gray-400" fill="gray">
              <path d="M23.111 20.058l-4.977-4.977c.965-1.52 1.523-3.322 1.523-5.251 0-5.42-4.409-9.83-9.829-9.83-5.42 0-9.828 4.41-9.828 9.83s4.408 9.83 9.829 9.83c1.834 0 3.552-.505 5.022-1.383l5.021 5.021c2.144 2.141 5.384-1.096 3.239-3.24zm-20.064-10.228c0-3.739 3.043-6.782 6.782-6.782s6.782 3.042 6.782 6.782-3.043 6.782-6.782 6.782-6.782-3.043-6.782-6.782zm2.01-1.764c1.984-4.599 8.664-4.066 9.922.749-2.534-2.974-6.993-3.294-9.922-.749z"/>
            </svg>
          </button>

          {/* Improved Search Overlay for Small Screens */}
          {isSearchActive && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
                onClick={() => setIsSearchActive(false)}
              />
              
              {/* Search Panel */}
              <div className="absolute top-16 left-0 right-0 glass-card p-4 z-50 mx-4 rounded-xl shadow-2xl animate-slide-in-top">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search messages..."
                    className="flex-1 p-2 text-white bg-dark-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsSearchActive(false)} 
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {searchQuery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {searchResults.length > 0 ? `${currentSearchIndex + 1} of ${searchResults.length}` : 'No results'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={goToPrevResult} 
                        disabled={searchResults.length === 0}
                        className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={goToNextResult} 
                        disabled={searchResults.length === 0}
                        className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}


          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-800 focus:outline-none"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 text-gray-400" fill="gray">
                <path d="M19 18c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-14-3c-1.654 0-3 1.346-3 3s1.346 3 3 3h14c1.654 0 3-1.346 3-3s-1.346-3-3-3h-14zm19 3c0 2.761-2.239 5-5 5h-14c-2.761 0-5-2.239-5-5s2.239-5 5-5h14c2.761 0 5 2.239 5 5zm0-12c0 2.761-2.239 5-5 5h-14c-2.761 0-5-2.239-5-5s2.239-5 5-5h14c2.761 0 5 2.239 5 5zm-15 0c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2z"/>
              </svg>
            </button>
            
            {/* Enhanced Settings Overlay */}
            {isSettingsOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSettingsOpen(false);
                  }}
                />
                
                {/* Settings Panel */}
                <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl p-4 z-50 animate-scale-in shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-light-1">Chat Settings</h3>
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {['theme', 'display', 'notifications'].map(tab => (
                      <button
                        key={tab}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSettingsTab(tab);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${
                          activeSettingsTab === tab
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tab Content */}
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {/* Theme Settings */}
                    {activeSettingsTab === 'theme' && (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="text-sm text-light-2 mb-2 block font-medium">Background Color</label>
                          <input
                            type="color"
                            value={chatBgColor}
                            onChange={(e) => {
                              setChatBgColor(e.target.value);
                              toast({ title: "Theme updated", description: "Background color changed" });
                            }}
                            className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-600"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-light-2 mb-2 block font-medium">Bubble Style</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['rounded', 'square', 'pill'].map(style => (
                              <button
                                key={style}
                                onClick={() => {
                                  setMessageBubbleStyle(style);
                                  toast({ title: "Style updated", description: `Bubble style: ${style}` });
                                }}
                                className={`px-3 py-2 rounded-lg transition-all text-sm ${
                                  messageBubbleStyle === style
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-light-2 mb-2 block font-medium">Font Size</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['small', 'medium', 'large'].map(size => (
                              <button
                                key={size}
                                onClick={() => {
                                  setFontSize(size);
                                  toast({ title: "Font updated", description: `Font size: ${size}` });
                                }}
                                className={`px-3 py-2 rounded-lg transition-all text-sm ${
                                  fontSize === size
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Display Settings */}
                    {activeSettingsTab === 'display' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-light-1">Show Timestamps</p>
                            <p className="text-xs text-light-4">Display message time</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowTimestamps(!showTimestamps);
                              toast({ 
                                title: showTimestamps ? "Timestamps hidden" : "Timestamps shown",
                                description: "Display setting updated"
                              });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              showTimestamps ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                showTimestamps ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                          <p className="text-xs text-light-4 mb-2">Preview</p>
                          <div className="bg-dark-4 p-3 rounded-lg">
                            <div className="bg-primary-500 text-white px-4 py-2 rounded-lg inline-block text-sm">
                              Sample message
                            </div>
                            {showTimestamps && (
                              <p className="text-xs text-gray-400 mt-1">12:34 PM</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Notification Settings */}
                    {activeSettingsTab === 'notifications' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-light-1">Sound Effects</p>
                            <p className="text-xs text-light-4">Play sound on new messages</p>
                          </div>
                          <button
                            onClick={() => {
                              setSoundEnabled(!soundEnabled);
                              toast({ 
                                title: soundEnabled ? "Sound disabled" : "Sound enabled",
                                description: "Notification setting updated"
                              });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              soundEnabled ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                soundEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                          <p className="text-xs text-light-4 mb-3">Quick Actions</p>
                          <button
                            onClick={() => {
                              // Reset all settings
                              setChatBgColor('#09090b');
                              setMessageBubbleStyle('rounded');
                              setFontSize('medium');
                              setShowTimestamps(true);
                              setSoundEnabled(true);
                              toast({ title: "Settings reset", description: "All settings restored to default" });
                            }}
                            className="w-full px-4 py-2 bg-dark-4 text-light-2 rounded-lg hover:bg-dark-3 transition-colors text-sm"
                          >
                            Reset to Default
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Default view when no tab selected */}
                    {!activeSettingsTab && (
                      <div className="text-center py-8 animate-fade-in">
                        <svg className="w-16 h-16 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-light-3 text-sm">Select a tab to customize your chat</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notifications and Help Overlays Handling Outside Buttons */}
        {/* (Optional: To close overlays when clicking outside) */}
        {/* You can implement this using additional logic if required */}

      </div>

      {/* Message display */}
      <div 
        className="messages-container flex-grow overflow-y-auto p-4 relative z-10"
        ref={messagesContainerRef}
        style={{ backgroundColor: chatBgColor }}
      >
        {/* Empty State - Only show if no messages have ever been sent */}
        {messages.length === 0 && !isTyping && (
          <div className="flex-1 flex items-center justify-center h-full p-8">
            <div className="text-center space-y-4 animate-fade-in max-w-md">
              <div className="text-7xl animate-bounce mb-4">💬</div>
              <h3 className="text-2xl font-bold text-light-1 mb-2">Start the Conversation!</h3>
              <p className="text-light-3 mb-6">
                Say hello to {chatPartner?.name || 'your friend'}! Break the ice and start chatting.
              </p>
              <div className="flex flex-col gap-2 text-sm text-light-4">
                <p>💡 <span className="text-light-3">Tip:</span> Be friendly and authentic</p>
                <p>✨ <span className="text-light-3">Tip:</span> Ask about their interests</p>
                <p>🎯 <span className="text-light-3">Tip:</span> Keep it casual and fun</p>
              </div>
              <div className="mt-6">
                <button 
                  onClick={() => document.querySelector<HTMLInputElement>('.message-input')?.focus()}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg"
                >
                  Send First Message ✨
                </button>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div 
            id={`message-${index}`} 
            key={message._id} 
            className={`message-item m-2 ${message.senderId === currentUserId ? 'text-right' : 'text-left'} group`}
            onMouseEnter={() => setHoveredMessageId(message._id)}
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            <div className="inline-block relative">
              {editingMessageId === message._id ? (
                // Edit mode
                <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg">
                  <input
                    type="text"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(message._id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <button
                    onClick={() => handleSaveEdit(message._id)}
                    className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                // Display mode
                <>
                  <div className={`px-4 py-2 ${
                    messageBubbleStyle === 'rounded' ? 'rounded-2xl' :
                    messageBubbleStyle === 'square' ? 'rounded-md' :
                    'rounded-full'
                  } ${
                    fontSize === 'small' ? 'text-sm' :
                    fontSize === 'large' ? 'text-lg' :
                    'text-base'
                  } ${
                    message.loading 
                      ? 'bg-gray-600 text-gray-300 opacity-60' 
                      : message.senderId === currentUserId 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-800'
                  } max-w-md transition-all`}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="mb-2 pb-2 border-l-2 border-white/30 pl-2 opacity-70">
                        <p className="text-xs">Replying to {message.replyTo.senderId === currentUserId ? 'yourself' : chatPartner?.name}</p>
                        <p className="text-sm truncate">{message.replyTo.content}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="flex-1">{renderMessageContent(message.content)}</p>
                    {message.loading && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                      {message.failed && (
                        <span className="text-red-400 text-xs">Failed</span>
                      )}
                      {message.edited && !message.loading && (
                        <span className="text-xs opacity-70 italic"> (edited)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced Message Actions - show on hover */}
                  {hoveredMessageId === message._id && !message.loading && !message.failed && (
                    <div className="absolute -top-8 right-0 flex gap-1 bg-gray-800 rounded-md p-1 shadow-lg animate-fade-in">
                      {/* Copy Button - for all messages */}
                      <button
                        onClick={() => handleCopyMessage(message.content, message._id)}
                        className="p-1 hover:bg-gray-700 rounded text-white transition-colors"
                        title="Copy message"
                      >
                        {copiedMessageId === message._id ? (
                          <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      
                      {/* Reply Button - for all messages */}
                      <button
                        onClick={() => handleReplyToMessage(message)}
                        className="p-1 hover:bg-gray-700 rounded text-white transition-colors"
                        title="Reply to message"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      
                      {/* Edit/Delete - only for own messages */}
                      {message.senderId === currentUserId && (
                        <>
                          <button
                            onClick={() => handleStartEdit(message._id, message.content)}
                            className="p-1 hover:bg-gray-700 rounded text-white transition-colors"
                            title="Edit message"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="p-1 hover:bg-gray-700 rounded text-red-400 transition-colors"
                            title="Delete message"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {showTimestamps && (
                <small className="block text-xs text-gray-500 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </small>
              )}
            </div>
          </div>
        ))}
        {/* Typing Indicator */}
        {isTyping && (
          <div className="message-item m-2 text-left">
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800 max-w-md">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Jump to Last Message Button */}
      {showJumpButton && (
        <button 
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all animate-fade-in z-50 group"
          title="Jump to latest message"
        >
          <svg
            className="w-6 h-6 group-hover:translate-y-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          {/* Unread count badge (if needed) */}
          {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span> */}
        </button>
      )}


      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card p-6 rounded-xl max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-light-1">Delete Message?</h3>
                <p className="text-sm text-light-3">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card p-6 rounded-xl max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-light-1">Clear All Messages?</h3>
                <p className="text-sm text-light-3">This will delete your entire chat history</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearChat}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105"
              >
                Clear Chat
              </button>
              <button
                onClick={() => setShowClearChatConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card p-6 rounded-xl max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-light-1">Block {chatPartner?.name}?</h3>
                <p className="text-sm text-light-3">They won't be able to message you</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBlockUser}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105"
              >
                Block User
              </button>
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="message-input-form p-4 bg-gray-900" style={{ backgroundColor: chatBgColor }}>
        {/* Reply Preview */}
        {replyToMessage && (
          <div className="mb-2 flex items-center justify-between bg-dark-4 p-3 rounded-lg animate-slide-in-top">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-light-4">Replying to {replyToMessage.senderId === currentUserId ? 'yourself' : chatPartner?.name}</p>
                <p className="text-sm text-light-2 truncate">{replyToMessage.content}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="message-input w-full p-2 text-white bg-gray-800 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-secondary-500 to-primary-600 px-4 py-2 rounded-xl text-white hover:scale-105 transition-all shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M24 0l-6 22-8.129-7.239 7.802-8.234-10.458 7.227-7.215-1.754 24-12zm-15 16.668v7.332l3.258-4.431-3.258-2.901z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;