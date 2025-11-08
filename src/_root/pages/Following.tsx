import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFollowing } from "@/lib/api/api";
import { Loader } from "@/components/shared";
import UserCard from "@/components/shared/UserCard";

const Following = () => {
  const { id } = useParams();
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFollowing = async () => {
    try {
      setIsLoading(true);
      const data = await getFollowing(id || "");
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFollowing();
    }
  }, [id, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  const handleFollowChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-9 w-full max-w-5xl">
      {following.length === 0 ? (
        <p className="text-light-4 text-center mt-10">Not following anyone yet</p>
      ) : (
        <ul className="user-grid">
          {following.map((user: any) => (
            <li key={user._id} className="flex-1 min-w-[200px] w-full">
              <UserCard user={user} onFollowChange={handleFollowChange} isFollowingContext={true} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Following;
