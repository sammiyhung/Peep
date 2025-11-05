import { Link } from "react-router-dom";

import { PostStats } from "@/components/shared";
import GridPostSkeleton from "@/components/shared/GridPostSkeleton";
import { useUserContext } from "@/context/AuthContext";

type GridPostListProps = {
  posts: any[];
  showUser?: boolean;
  showStats?: boolean;
  isLoading?: boolean;
};

const GridPostList = ({
  posts,
  showUser = true,
  showStats = true,
  isLoading = false,
}: GridPostListProps) => {
  const { user } = useUserContext();

  if (isLoading) {
    return (
      <ul className="grid-container">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <li key={i}>
            <GridPostSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid-container">
      {posts.map((post) => (
        <li key={post._id} className="relative min-w-80 h-80">
          <Link to={`/posts/${post._id}`} className="grid-post_link">
            <img
              src={post.imageUrl}
              alt="post"
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="absolute bottom-0 w-full bg-gradient-to-t from-dark-3 to-transparent rounded-b-[24px] p-3 sm:p-5">
            <div className="flex flex-col gap-2 w-full">
              {showUser && (
                <div className="flex items-center gap-2">
                  <img
                    src={
                      post.creator.imageUrl ||
                      "/assets/icons/profile-placeholder.svg"
                    }
                    alt="creator"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                  />
                  <p className="line-clamp-1 small-medium sm:base-medium text-light-1">{post.creator.name}</p>
                </div>
              )}
              {showStats && (
                <div className="w-full overflow-x-auto">
                  <PostStats post={post} userId={user.id} />
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default GridPostList;
