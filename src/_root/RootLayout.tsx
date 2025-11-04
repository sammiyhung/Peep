import { useLocation, Outlet } from "react-router-dom";

import Topbar from "@/components/shared/Topbar";
import Bottombar from "@/components/shared/Bottombar";
import LeftSidebar from "@/components/shared/LeftSidebar";

const RootLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat/');
  
  return (
    <div className="w-full md:flex">
      {!isChatPage && (
          <Topbar />
      )}
      <LeftSidebar />

      <section className="flex flex-1 h-full">
        <Outlet />
      </section>

      {/* Show Bottombar on all pages including chat pages */}
      <Bottombar />
    </div>
  );
};

export default RootLayout;
