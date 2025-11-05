import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { UserCard } from "@/components/shared";
import VibeMatches from "@/components/shared/VibeMatches";
import { useGetUsers } from "@/lib/react-query/queries";

const AllUsers = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  const { data: creators, isLoading, isError: isErrorCreators } = useGetUsers();

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="h3-bold md:h2-bold text-left w-full">Find Peeps</h2>
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
            className="w-full px-4 py-3 rounded-lg text-light-1 placeholder:text-light-3 focus:outline-none glass-card transition-all duration-300"
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
