import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { bottombarLinks } from "@/constants";
import { useUserContext } from "@/context/AuthContext";
import { api } from "@/lib/api/config";
import io from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const Bottombar = () => {
  const { pathname } = useLocation();
  const { user } = useUserContext();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user.id) {
      fetchUnreadCount();

      // Setup Socket.io for real-time unread count updates
      const socket = io(SOCKET_SERVER_URL);
      socket.emit('join', user.id);

      socket.on('unreadCountChanged', () => {
        fetchUnreadCount();
      });

      socket.on('receiveMessage', () => {
        fetchUnreadCount();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user.id]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/messages/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
        const isActive = pathname === link.route;
        // Only make Chat tab active in /chats or /chat/:id routes
        const isChatsRoute = link.label === 'Chats' && (pathname === '/chats' || pathname.startsWith('/chat/'));
        // Make Circles tab active for all circle routes
        const isCirclesRoute = link.label === 'Circles' && pathname.startsWith('/circles');
        const shouldShowActive = link.label === 'Chats' ? isChatsRoute : link.label === 'Circles' ? isCirclesRoute : isActive;

        return (
          <Link
            key={`bottombar-${link.label}`}
            to={link.route}
            className={`flex-center flex-col gap-1 p-3 transition-all duration-300 relative group rounded-xl ${
              shouldShowActive ? "scale-110" : ""
            }`}
            onClick={(e) => {
              // If clicking Home while already on home page, scroll to top smoothly
              if (link.route === '/' && pathname === '/') {
                e.preventDefault();
                const homeContainer = document.querySelector('.home-container');
                if (homeContainer) {
                  homeContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }
                // Clear saved scroll state so it doesn't restore
                sessionStorage.setItem('homeScrollSaved', 'false');
                sessionStorage.removeItem('homeScrollPosition');
                sessionStorage.removeItem('homeScrollTimestamp');
              }
            }}
            style={{
              background: shouldShowActive 
                ? 'rgba(255, 55, 122, 0.25)'
                : 'transparent',
              backdropFilter: shouldShowActive ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: shouldShowActive ? 'blur(20px)' : 'none',
              border: shouldShowActive ? '1px solid rgba(255, 55, 122, 0.5)' : 'none',
              boxShadow: shouldShowActive 
                ? '0 4px 20px rgba(255, 55, 122, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
                : 'none',
            }}>
            <div className={`relative transition-transform duration-300 ${shouldShowActive ? 'scale-110' : 'group-hover:scale-105'}`}>
              <img
                src={link.imgURL}
                alt={link.label}
                width={24}
                height={24}
                className={`transition-all duration-300 ${shouldShowActive && "invert-white"}`}
              />
              {link.label === 'Chats' && unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex-center min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-red-600 rounded-full text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <p className={`tiny-medium transition-all duration-300 ${
              shouldShowActive 
                ? 'text-white font-bold' 
                : 'text-light-2 group-hover:text-light-1'
            }`}>
              {link.label}
            </p>
          </Link>
        );
      })}
    </section>
  );
};

export default Bottombar;
