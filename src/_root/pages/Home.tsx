import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PostCard, UserCard, VibeMatchScore } from "@/components/shared";
import EnergyBar from "@/components/shared/EnergyBar";
import MoodSelector from "@/components/shared/MoodSelector";
import TrendingWaves from "@/components/shared/TrendingWaves";
import { useGetRecentPosts, useGetUsers } from "@/lib/react-query/queries";
import { Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { api } from '@/lib/api/config';

const Home = () => {
  const navigate = useNavigate();
  const [currentMood, setCurrentMood] = useState('neutral');
  const [feedFilter, setFeedFilter] = useState<'all' | 'mood' | 'trending'>('all');
  const [vibeStats, setVibeStats] = useState<any>(null);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  
  const {
    data: posts,
    isLoading: isPostLoading,
    isError: isErrorPosts,
  } = useGetRecentPosts();
  const {
    data: creators,
    isLoading: isUserLoading,
    isError: isErrorCreators,
  } = useGetUsers(10);

  // Fetch vibe stats
  useEffect(() => {
    fetchVibeStats();
  }, []);

  // Filter posts based on mood and filter type
  useEffect(() => {
    if (posts?.documents) {
      filterPosts(posts.documents);
    }
  }, [posts, currentMood, feedFilter]);

  const fetchVibeStats = async () => {
    try {
      const response = await api.get('/api/vibe/stats');
      setVibeStats(response.data);
    } catch (error) {
      console.error('Error fetching vibe stats:', error);
    }
  };

  const filterPosts = (allPosts: any[]) => {
    let filtered = [...allPosts];

    if (feedFilter === 'mood' && currentMood !== 'neutral') {
      // Show posts matching current mood
      filtered = filtered.filter(post => post.mood === currentMood);
    } else if (feedFilter === 'trending') {
      // Sort by trending score
      filtered = filtered.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
    }

    setFilteredPosts(filtered);
  };

  const handleMoodChange = (mood: string) => {
    setCurrentMood(mood);
    if (mood !== 'neutral') {
      setFeedFilter('mood');
    }
  };

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
        <div className="home-creators">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          {/* Enhanced Header */}
          <div className="glass-card p-4 rounded-xl mb-6 overflow-visible relative z-[600]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="h3-bold md:h2-bold text-light-1">Your Feed</h2>
                <p className="small-regular text-light-3">Personalized for your vibe</p>
              </div>
              <MoodSelector currentMood={currentMood} onMoodChange={handleMoodChange} />
            </div>

            {/* Feed Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  feedFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>All Posts</span>
                </div>
              </button>
              <button
                onClick={() => setFeedFilter('mood')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  feedFilter === 'mood'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  <span>Mood Match</span>
                </div>
              </button>
              <button
                onClick={() => setFeedFilter('trending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  feedFilter === 'trending'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-4 text-light-3 hover:bg-dark-3'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span>Trending</span>
                </div>
              </button>
            </div>
          </div>

          {/* Compact Stats Row - Always Side by Side */}
          <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
            <EnergyBar />
            <TrendingWaves />
          </div>

          {/* Vibe Stats - Compact */}
          {vibeStats && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="glass-card p-2 rounded-lg text-center">
                <Sparkles size={16} className="text-primary-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-light-1">{vibeStats.vibeScore || 0}</p>
                <p className="text-[10px] text-light-4">Vibe</p>
              </div>
              <div className="glass-card p-2 rounded-lg text-center">
                <TrendingUp size={16} className="text-green-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-light-1">{vibeStats.streak || 0}</p>
                <p className="text-[10px] text-light-4">Streak</p>
              </div>
              <div className="glass-card p-2 rounded-lg text-center">
                <Users size={16} className="text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-light-1">{vibeStats.connections || 0}</p>
                <p className="text-[10px] text-light-4">Connects</p>
              </div>
              <div className="glass-card p-2 rounded-lg text-center">
                <Zap size={16} className="text-yellow-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-light-1">L{vibeStats.level || 1}</p>
                <p className="text-[10px] text-light-4">Level</p>
              </div>
            </div>
          )}

          {/* Create Post CTA */}
          <button
            className="w-full glass-card p-4 rounded-xl mb-6 hover:scale-[1.02] transition-all duration-300 group"
            type="button"
            onClick={() => navigate(`/create-post`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="base-semibold text-light-1">Share your vibe</p>
                  <p className="small-regular text-light-3">Create a new post</p>
                </div>
              </div>
            </div>
          </button>

          {/* Filter Info */}
          {feedFilter !== 'all' && (
            <div className="glass-card p-3 rounded-lg mb-4">
              <p className="small-regular text-light-3">
                {feedFilter === 'mood' && `Showing posts matching your ${currentMood} mood`}
                {feedFilter === 'trending' && 'Showing trending posts'}
                {filteredPosts.length === 0 && ' - No posts found'}
              </p>
            </div>
          )}

          {/* Posts Feed */}
          {isPostLoading && !posts ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 rounded-xl animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-dark-4 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-dark-4 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-dark-4 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-dark-4 rounded w-full mb-2"></div>
                  <div className="h-4 bg-dark-4 rounded w-3/4 mb-4"></div>
                  <div className="h-64 bg-dark-4 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass-card p-10 rounded-xl text-center flex flex-col items-center">
              <p className="body-medium text-light-3 mb-4">No posts match your current filter</p>
              <button
                onClick={() => setFeedFilter('all')}
                className="shad-button_primary p-2 rounded-md"
              >
                Show All Posts
              </button>
            </div>
          ) : (
            <ul className="flex flex-col flex-1 gap-6 w-full">
              {filteredPosts.map((post: any) => (
                <li key={post._id} className="flex justify-center w-full">
                  <div className="w-full">
                    {feedFilter === 'mood' && <VibeMatchScore post={post} userMood={currentMood} />}
                    <PostCard post={post} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="home-creators">
        <h3 className="h3-bold text-light-1">Top Creators</h3>
        {isUserLoading && !creators ? (
          <div className="grid 2xl:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-dark-4 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-dark-4 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-dark-4 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {creators?.documents.map((creator: any) => (
              <li key={creator?._id}>
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
