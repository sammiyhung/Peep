import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { INavLink } from "@/types";
import { sidebarLinks } from "@/constants";
import { Loader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useSignOutAccount } from "@/lib/react-query/queries";
import { useUserContext, INITIAL_USER } from "@/context/AuthContext";
import { api } from "@/lib/api/config";
import io from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, setUser, setIsAuthenticated, isLoading } = useUserContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const { mutate: signOut } = useSignOutAccount();

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

  const handleSignOut = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    signOut();
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate("/sign-in");
  };

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-7">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.png"
            alt="logo"
            width={170}
            height={40}
          />
        </Link>

        {isLoading || !user.email ? (
          <div className="h-14">
            <Loader />
          </div>
        ) : (
          <Link to={`/profile/${user.id}`} className="flex gap-3 items-center">
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-14 w-14 rounded-full"
            />
            <div className="flex flex-col">
              <p className="body-bold">{user.name}</p>
              <p className="small-regular text-light-3">@{user.username}</p>
            </div>
          </Link>
        )}

        <ul className="flex flex-col gap-6">
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;

            // Only make Chat tab active in /chats or /chat/:id routes
            const isChatsRoute = link.label === 'Chats' && (pathname === '/chats' || pathname.startsWith('/chat/'));
            const shouldShowActive = link.label === 'Chats' ? isChatsRoute : isActive;

            return (
              <li
                key={link.label}
                className={`leftsidebar-link group ${
                  shouldShowActive && "bg-primary-500"
                }`}>
                <NavLink
                  to={link.route}
                  className="flex gap-6 items-center p-3 w-full relative">
                  <img
                    src={link.imgURL}
                    alt={link.label}
                    className={`group-hover:invert-white ${
                      shouldShowActive && "invert-white"
                    }`}
                  />
                  {link.label}
                  {link.label === 'Chats' && unreadCount > 0 && (
                    <span className="absolute left-8 top-1 flex-center min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full text-xs font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <Button
        variant="ghost"
        className="shad-button_ghost"
        onClick={(e) => handleSignOut(e)}>
        <img src="/assets/icons/logout.svg" alt="logout" />
        <p className="small-medium lg:base-medium">Logout</p>
      </Button>
    </nav>
  );
};

export default LeftSidebar;
