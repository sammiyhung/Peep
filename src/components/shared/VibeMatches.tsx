import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api/config';

interface VibeMatch {
  _id: string;
  name: string;
  username: string;
  imageUrl: string;
  bio: string;
  vibeMatchScore: number;
  vibeMatchLabel: string;
  currentMood: string;
  level: number;
}

const VibeMatches = () => {
  const [matches, setMatches] = useState<VibeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVibeMatches();
  }, []);

  const fetchVibeMatches = async () => {
    try {
      const response = await api.get('/api/vibe/matches');
      setMatches(response.data.matches);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching vibe matches:', error);
      // If 404, the route doesn't exist yet - hide component
      if (error?.response?.status === 404) {
        console.log('Vibe Match API not available yet. Please restart the server.');
      }
      setIsLoading(false);
    }
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'linear-gradient(135deg, #ef4444, #ec4899)';
    if (score >= 75) return 'linear-gradient(135deg, #a855f7, #ec4899)';
    if (score >= 60) return 'linear-gradient(135deg, #3b82f6, #a855f7)';
    if (score >= 40) return 'linear-gradient(135deg, #22c55e, #3b82f6)';
    return 'linear-gradient(135deg, #6b7280, #4b5563)';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="w-3 h-3" />;
    if (score >= 75) return <Sparkles className="w-3 h-3" />;
    if (score >= 60) return <Sparkles className="w-3 h-3" />;
    if (score >= 40) return <TrendingUp className="w-3 h-3" />;
    return <TrendingUp className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-4 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-dark-4 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="glass-card p-6 rounded-xl text-center">
        <p className="text-light-3">No vibe matches yet. Complete your profile to find your tribe!</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary-500" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-light-1">Vibe Matches</h3>
        </div>
        <button
          onClick={fetchVibeMatches}
          className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 transition-colors px-2 py-1 rounded hover:bg-dark-4"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {matches.slice(0, 12).map((match) => (
          <Link
            key={match._id}
            to={`/profile/${match._id}`}
            className="glass-card p-4 rounded-xl hover:scale-[1.02] transition-all duration-300 group hover:border-primary-500/30 flex flex-col items-center text-center"
          >
            {/* Avatar */}
            <div className="relative mb-3">
              <img
                src={match.imageUrl || '/assets/icons/profile-placeholder.svg'}
                alt={match.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-2 ring-dark-4 group-hover:ring-primary-500/50 transition-all"
              />
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-1 shadow-lg"
                style={{
                  background: getScoreGradient(match.vibeMatchScore),
                }}
              >
                {match.vibeMatchScore}
              </div>
            </div>

            {/* Info */}
            <div className="w-full">
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-sm md:text-base font-semibold text-light-1 truncate">
                  {match.name}
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-4 text-light-3 flex-shrink-0">Lv.{match.level}</span>
              </div>
              <p className="text-xs text-light-3 truncate mb-2">@{match.username}</p>
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1 text-[10px] md:text-xs px-2 py-1 rounded-full bg-gradient-to-r from-primary-500/20 to-pink-500/20 text-primary-400 font-medium">
                  {getScoreIcon(match.vibeMatchScore)}
                  {match.vibeMatchLabel}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All */}
      {matches.length > 12 && (
        <button className="w-full mt-4 py-2 text-sm text-primary-500 hover:text-primary-400 transition-colors">
          View all {matches.length} matches →
        </button>
      )}
    </div>
  );
};

export default VibeMatches;
