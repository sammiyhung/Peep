import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

import { Button } from "../ui/button";
import { useUserContext, INITIAL_USER } from "@/context/AuthContext";
import { useSignOutAccount, useGetUnreadNotificationsCount } from "@/lib/react-query/queries";
import NotificationPanel from "./NotificationPanel";

const Topbar = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, setUser, setIsAuthenticated } = useUserContext();
  const { mutate: signOut } = useSignOutAccount();
  const { data: unreadCount = 0 } = useGetUnreadNotificationsCount();

  const handleSignOut = () => {
    // Clear auth state first
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    
    // Call signout API (will clear localStorage)
    signOut();
    
    // Navigate to sign-in
    navigate("/sign-in", { replace: true });
  };

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.png"
            alt="logo"
            width={130}
            height={325}
          />
        </Link>


        <div className="flex gap-1">
          {/* Notifications Button - Navigate on mobile, panel on desktop */}
          <Link
            to="/notifications"
            className="md:hidden p-2 rounded-full hover:bg-dark-4 focus:outline-none relative transition-colors"
          >
            <Bell className="h-6 w-6 text-light-3" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          
          <button 
            className="hidden md:block p-2 rounded-full hover:bg-dark-4 focus:outline-none relative transition-colors"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell className="h-6 w-6 text-light-3" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <NotificationPanel 
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />

          {/* Settings Button */}
          <Link 
            to="/settings"
            className="p-2 hover:bg-gray-800 focus:outline-none relative rounded-full flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Button
            variant="ghost"
            className="shad-button_ghost"
            onClick={handleSignOut}>
            <img src="/assets/icons/logout.svg" alt="logout" />
          </Button>
          <Link to={`/profile/${user.id}`} className="flex-center gap-3">
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;
