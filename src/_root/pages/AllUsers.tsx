import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserCard } from "@/components/shared";
import VibeMatches from "@/components/shared/VibeMatches";
import { useGetUsers, useGetReceivedVibeRequests } from "@/lib/react-query/queries";

const AllUsers = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [showVibesDropdown, setShowVibesDropdown] = useState(false);

  const { data: creators, isLoading, isError: isErrorCreators } = useGetUsers();
  const { data: vibeRequests = [] } = useGetReceivedVibeRequests('pending');
  const pendingVibesCount = vibeRequests?.length || 0;

  // Show error if the query fails
  if (isErrorCreators) {
    toast({ title: "Something went wrong." });
    return;
  }

  // Filter the users based on the search query
  const filteredUsers = creators?.documents?.filter((creator: any) =>
    creator?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    creator?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="common-container">
      <div className="user-container">
        {/* Header Section with Buttons */}
        <div className="flex items-center justify-between mb-4 w-full">
          <h2 className="h3-bold md:h2-bold text-left">Find Peeps</h2>
          
          {/* Vibes Dropdown - Only on small screens */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowVibesDropdown(!showVibesDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors relative"
            >
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span className="text-sm font-medium">Vibes</span>
              {pendingVibesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingVibesCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showVibesDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showVibesDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-2 border border-dark-4 rounded-lg shadow-lg z-50">
                <Link
                  to="/vibes"
                  className="block px-4 py-3 hover:bg-dark-3 transition-colors text-light-1 rounded-lg"
                  onClick={() => setShowVibesDropdown(false)}
                >
                  <div className="flex items-center justify-between">
                    <span>Vibe Requests</span>
                    {pendingVibesCount > 0 && (
                      <span className="bg-primary-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {pendingVibesCount}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Vibe Matches */}
        <VibeMatches />

        {/* Search Bar */}
        <div className="my-4">
          <input
            type="text"
            placeholder="Search by Username or Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query on change
            className="w-full min-w-[320px] px-4 py-3 rounded-lg text-light-1 placeholder:text-light-3 focus:outline-none glass-card transition-all duration-300"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          />
        </div>

        {/* Show loader while fetching data */}
        {isLoading && !creators ? (
          <ul className="user-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="animate-pulse">
                <div className="user-card">
                  <div className="w-14 h-14 bg-dark-4 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-dark-4 rounded w-24 mx-auto mb-2"></div>
                  <div className="h-3 bg-dark-4 rounded w-32 mx-auto mb-3"></div>
                  <div className="h-9 bg-dark-4 rounded w-full"></div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="user-grid">
            {/* Display filtered users */}
            {filteredUsers?.length > 0 ? (
              filteredUsers.map((creator: any) => (
                <li key={creator?._id} className="flex-1 min-w-[200px] w-full">
                  <UserCard user={creator} />
                </li>
              ))
            ) : (
              <p>No users found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
