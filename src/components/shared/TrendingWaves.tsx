import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api/config';
import { TrendingUp, Flame, ChevronDown } from 'lucide-react';

interface Wave {
  id: string;
  height: number;
  color: string;
  post: {
    _id: string;
    caption: string;
    imageUrl: string;
    creator: {
      name: string;
      username: string;
      imageUrl: string;
    };
    trendingScore: number;
    mood: string;
  };
}

const TrendingWaves = () => {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchTrendingWaves();
    // Refresh every 2 minutes
    const interval = setInterval(fetchTrendingWaves, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrendingWaves = async () => {
    try {
      const response = await api.get('/api/trending/waves');
      setWaves(response.data.waves);
      setHasLoaded(true);
    } catch (error: any) {
      console.error('Error fetching trending waves:', error);
      // If 404, the route doesn't exist yet - hide component
      if (error?.response?.status === 404) {
        console.log('Trending API not available yet. Please restart the server.');
      }
      setHasLoaded(true);
    }
  };

  // Show loading skeleton only on first load
  if (!hasLoaded) {
    return (
      <div className="glass-card p-2 sm:p-3 rounded-xl border border-dark-4/50">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-dark-4 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-3 bg-dark-4 rounded w-20 mb-1"></div>
            <div className="h-2 bg-dark-4 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (waves.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-2 sm:p-3 rounded-xl animate-fade-in border border-dark-4/50 relative z-10">
      {/* Compact Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-dark-4/30 rounded-lg transition-all p-1 -m-1"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-center shadow-lg flex-shrink-0">
            <TrendingUp size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] sm:text-sm font-bold text-light-1 whitespace-nowrap">Trending</p>
            <p className="text-[10px] sm:text-xs text-light-3 whitespace-nowrap">{waves.length} posts</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-medium text-green-400">Live</span>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-light-3 transition-transform duration-300 sm:w-[18px] sm:h-[18px] ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Waves Visualization - Overlay */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl p-3 sm:p-4 z-[100] border border-dark-4/80 shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="space-y-3">
          <div className="relative h-32 sm:h-40 flex items-end gap-1.5 sm:gap-2 p-3 bg-dark-4/30 rounded-xl">
        {waves.map((wave, index) => (
          <button
            key={wave.id}
            onClick={() => setSelectedWave(wave)}
            className="flex-1 rounded-xl transition-all duration-300 hover:scale-105 relative group shadow-lg"
            style={{
              height: `${wave.height}%`,
              background: `linear-gradient(180deg, ${wave.color}, ${wave.color}CC)`,
              minHeight: '30%',
              boxShadow: selectedWave?.id === wave.id ? `0 0 20px ${wave.color}80` : 'none',
            }}
          >
            {/* Shimmer Effect */}
            <div
              className="absolute inset-0 rounded-xl opacity-40"
              style={{
                background: `linear-gradient(180deg, transparent, ${wave.color})`,
                animation: 'wave 3s ease-in-out infinite',
                animationDelay: `${index * 0.3}s`,
              }}
            />
            
            {/* Score Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="glass-card px-2 py-1 rounded-lg shadow-xl border border-dark-4">
                <div className="flex items-center gap-1">
                  <Flame size={12} className="text-orange-500" />
                  <span className="text-xs font-bold text-light-1">{wave.post.trendingScore}</span>
                </div>
              </div>
            </div>

            {/* Rank Number */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-dark-1/80 flex-center">
              <span className="text-xs font-bold text-white">#{index + 1}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Wave Details */}
      {selectedWave && (
        <Link
          to={`/posts/${selectedWave.post._id}`}
          className="block bg-dark-4/30 p-3 sm:p-4 rounded-xl hover:bg-dark-4/50 transition-all duration-300 border border-dark-4"
        >
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={selectedWave.post.imageUrl}
                alt="Post"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
              />
              <div
                className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-center shadow-lg"
                style={{ background: selectedWave.color }}
              >
                <TrendingUp size={12} className="text-white sm:w-[14px] sm:h-[14px]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={selectedWave.post.creator.imageUrl || '/assets/icons/profile-placeholder.svg'}
                  alt={selectedWave.post.creator.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-dark-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-light-1 truncate">
                    {selectedWave.post.creator.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-light-4 truncate">@{selectedWave.post.creator.username}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-light-3 line-clamp-2 mb-2">
                {selectedWave.post.caption}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
                  style={{
                    background: `${selectedWave.color}20`,
                    border: `1px solid ${selectedWave.color}40`,
                  }}
                >
                  <Flame size={10} className="sm:w-3 sm:h-3" style={{ color: selectedWave.color }} />
                  <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap" style={{ color: selectedWave.color }}>
                    {selectedWave.post.trendingScore} pts
                  </span>
                </div>
                <div className="px-2 py-1 rounded-full bg-dark-4 text-[10px] sm:text-xs text-light-3 whitespace-nowrap">
                  {selectedWave.post.mood}
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}
        </div>
        </div>
        </>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-8px) scale(1.05);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default TrendingWaves;
