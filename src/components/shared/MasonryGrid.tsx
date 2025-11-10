import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark } from 'lucide-react';

type MasonryGridProps = {
  posts: any[];
  showUser?: boolean;
  showStats?: boolean;
};

const MasonryGrid = ({ posts, showUser = true, showStats = true }: MasonryGridProps) => {
  const [columns, setColumns] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine number of columns based on screen width
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);      // Mobile
      else if (width < 1024) setColumns(3); // Tablet
      else setColumns(4);                   // Desktop
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute posts into columns using shortest column algorithm
  const distributePostsToColumns = () => {
    const cols: any[][] = Array.from({ length: columns }, () => []);
    const colHeights: number[] = Array(columns).fill(0);
    
    posts.forEach((post) => {
      // Find the shortest column
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestColIndex].push(post);
      // Estimate height (you can adjust this based on actual image aspect ratios)
      colHeights[shortestColIndex] += 1;
    });

    return cols;
  };

  const columnPosts = distributePostsToColumns();

  const isVideo = (url: string) => {
    return url && url.match(/\.(mp4|webm|ogg)$/i);
  };

  return (
    <div 
      ref={containerRef}
      className="flex gap-2 sm:gap-3 lg:gap-4"
      style={{ width: '100%' }}
    >
      {columnPosts.map((columnItems, columnIndex) => (
        <div 
          key={columnIndex} 
          className="flex flex-col gap-2 sm:gap-3 lg:gap-4"
          style={{ flex: 1 }}
        >
          {columnItems.map((post) => {
            const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 
              ? post.mediaUrls[0] 
              : post.imageUrl;
            const isVideoPost = isVideo(mediaUrl);

            return (
              <div 
                key={post._id} 
                className="relative bg-dark-2 rounded-[24px] overflow-hidden group cursor-pointer"
              >
                <Link to={`/posts/${post._id}`} className="block">
                  {isVideoPost ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-auto object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="post"
                      className="w-full h-auto object-cover"
                    />
                  )}
                </Link>

                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
                  <div className="flex items-center justify-between w-full">
                    {showUser && (
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            post.creator.imageUrl ||
                            "/assets/icons/profile-placeholder.svg"
                          }
                          alt="creator"
                          className="w-7 h-7 rounded-full"
                        />
                        <p className="text-sm font-medium text-white">
                          {post.creator.name}
                        </p>
                      </div>
                    )}
                    
                    {showStats && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => e.preventDefault()}
                          className="flex items-center gap-1 text-white hover:text-red-500 transition-colors"
                        >
                          <Heart size={20} />
                          <span className="text-sm">
                            {post.reactions?.vibes?.length || 0}
                          </span>
                        </button>
                        <button 
                          onClick={(e) => e.preventDefault()}
                          className="text-white hover:text-primary-500 transition-colors"
                        >
                          <Bookmark size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
