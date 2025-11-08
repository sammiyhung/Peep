import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { INavLink } from "@/types";
import { sidebarLinks } from "@/constants";
import { Loader } from "@/components/shared";
import { useSignOutAccount } from "@/lib/react-query/queries";
import { useUserContext, INITIAL_USER } from "@/context/AuthContext";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, setUser, setIsAuthenticated, isLoading } = useUserContext();
  const [isMinimized, setIsMinimized] = useState(false);

  const { mutate: signOut } = useSignOutAccount();

  const handleSignOut = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    
    // Clear auth state first
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    
    // Call signout API (will clear localStorage)
    signOut();
    
    // Navigate to sign-in
    navigate("/sign-in", { replace: true });
  };

  return (
    <nav className={`leftsidebar ${isMinimized ? 'minimized' : ''}`}>
      <div className="flex flex-col gap-3">
        {/* Logo and Toggle */}
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between'}`}>
          {!isMinimized && (
            <Link to="/" className="flex gap-3 items-center">
              <img
                src="/assets/images/logo.png"
                alt="logo"
                width={170}
                height={40}
              />
            </Link>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-dark-4 rounded-lg transition-all"
          >
            {isMinimized ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Profile Section */}
        {isLoading || !user.email ? (
          <div className="h-14 flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <Link 
            to={`/profile/${user.id}`} 
            className={`leftsidebar-link group flex items-center rounded-lg p-3 transition-all duration-300 ${
              isMinimized ? 'justify-center' : 'gap-3'
            } ${
              pathname.startsWith('/profile') ? 'bg-primary-500' : ''
            }`}
          >
            <div className={`flex-shrink-0 ${
              isMinimized ? 'w-12 h-12' : 'w-14 h-14'
            }`}>
              <img
                src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt="profile"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {!isMinimized && (
              <div className="flex flex-col transition-opacity duration-300">
                <p className="body-bold">{user.name}</p>
                <p className="small-regular text-light-3">@{user.username}</p>
              </div>
            )}
          </Link>
        )}

        <ul className="flex flex-col gap-3">
          {sidebarLinks.map((link: INavLink) => {
            // Skip Chats, Notifications, and Settings - they're in different sections
            if (link.label === 'Chats' || link.label === 'Notifications' || link.label === 'Settings') return null;

            const isActive = pathname === link.route;

            // Make Circles tab active for all circle routes
            const isCirclesRoute = link.label === 'Circles' && pathname.startsWith('/circles');
            const shouldShowActive = link.label === 'Circles' ? isCirclesRoute : isActive;

            return (
              <li
                key={link.label}
                className={`leftsidebar-link group ${
                  shouldShowActive && "bg-primary-500"
                } ${isMinimized ? 'flex justify-center' : ''}`}>
                <NavLink
                  to={link.route}
                  className={`flex items-center p-3 w-full relative ${
                    isMinimized ? 'justify-center' : 'gap-6'
                  }`}
                  title={isMinimized ? link.label : undefined}
                >
                  <img
                    src={link.imgURL}
                    alt={link.label}
                    className={`group-hover:invert-white ${
                      shouldShowActive && "invert-white"
                    }`}
                  />
                  {!isMinimized && (
                    <span className="transition-opacity duration-300">{link.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Section - Notifications, Settings, Logout */}
      <div className="flex flex-col gap-3">
        {/* Notifications */}
        <div className={`leftsidebar-link group ${
          pathname === '/notifications' && "bg-primary-500"
        } ${isMinimized ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/notifications"
            className={`flex items-center p-3 w-full relative ${
              isMinimized ? 'justify-center' : 'gap-6'
            }`}
            title={isMinimized ? "Notifications" : undefined}
          >
            <img
              src="/assets/icons/bell.svg"
              alt="Notifications"
              className={`group-hover:invert-white ${
                pathname === '/notifications' && "invert-white"
              }`}
            />
            {!isMinimized && (
              <span className="transition-opacity duration-300">Notifications</span>
            )}
          </NavLink>
        </div>

        {/* Settings */}
        <div className={`leftsidebar-link group ${
          pathname === '/settings' && "bg-primary-500"
        } ${isMinimized ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/settings"
            className={`flex items-center p-3 w-full relative ${
              isMinimized ? 'justify-center' : 'gap-6'
            }`}
            title={isMinimized ? "Settings" : undefined}
          >
            <img
              src="/assets/icons/settings.svg"
              alt="Settings"
              className={`group-hover:invert-white ${
                pathname === '/settings' && "invert-white"
              }`}
            />
            {!isMinimized && (
              <span className="transition-opacity duration-300">Settings</span>
            )}
          </NavLink>
        </div>

        {/* Logout */}
        <div className="leftsidebar-link group rounded-lg">
          <button
            className={`w-full flex items-center p-3 text-left ${isMinimized ? 'justify-center' : 'gap-6'}`}
            onClick={(e) => handleSignOut(e)}
            title={isMinimized ? "Logout" : undefined}
          >
            <img src="/assets/icons/logout.svg" alt="logout" className="group-hover:invert-white" />
            {!isMinimized && (
              <span className="small-medium lg:base-medium transition-opacity duration-300">Logout</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LeftSidebar;
