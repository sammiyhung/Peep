import { useLocation, Outlet } from "react-router-dom";
import { useState } from "react";

import Topbar from "@/components/shared/Topbar";
import Bottombar from "@/components/shared/Bottombar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import ChatSidebar from "@/components/shared/ChatSidebar";

const RootLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat/');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  return (
    <div className="w-full md:flex">
      {!isChatPage && (
          <Topbar />
      )}
      <LeftSidebar />

      <section className="flex flex-1 h-full">
        <Outlet />
      </section>

      {/* Chat Sidebar - Hidden when bottombar is active (mobile) */}
      <div className="hidden xl:block">
        <ChatSidebar 
          isMinimized={isChatMinimized} 
          onToggle={() => setIsChatMinimized(!isChatMinimized)} 
        />
      </div>

      {/* Show Bottombar on all pages including chat pages */}
      <Bottombar />
    </div>
  );
};

export default RootLayout;
