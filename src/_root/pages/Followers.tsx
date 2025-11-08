import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFollowers } from "@/lib/api/api";
import { Loader } from "@/components/shared";
import UserCard from "@/components/shared/UserCard";

const Followers = () => {
  const { id } = useParams();
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setIsLoading(true);
        const data = await getFollowers(id || "");
        setFollowers(data);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchFollowers();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-9 w-full max-w-5xl">
      {followers.length === 0 ? (
        <p className="text-light-4 text-center mt-10">No followers yet</p>
      ) : (
        <ul className="user-grid">
          {followers.map((user: any) => (
            <li key={user._id} className="flex-1 min-w-[200px] w-full">
              <UserCard user={user} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Followers;
