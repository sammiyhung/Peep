import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      const response = await api.get('/vibe/matches');
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-red-500 to-pink-500';
    if (score >= 75) return 'from-purple-500 to-pink-500';
    if (score >= 60) return 'from-blue-500 to-purple-500';
    if (score >= 40) return 'from-green-500 to-blue-500';
    return 'from-gray-500 to-gray-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🔥';
    if (score >= 75) return '✨';
    if (score >= 60) return '💫';
    if (score >= 40) return '👋';
    return '🌱';
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
    <div className="glass-card p-6 rounded-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <h3 className="text-lg font-bold text-light-1">Your Vibe Matches</h3>
        </div>
        <button
          onClick={fetchVibeMatches}
          className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {matches.slice(0, 10).map((match) => (
          <Link
            key={match._id}
            to={`/profile/${match._id}`}
            className="block glass-card p-4 rounded-lg hover:scale-[1.02] transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={match.imageUrl || '/assets/icons/profile-placeholder.svg'}
                  alt={match.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-1"
                  style={{
                    background: `linear-gradient(135deg, ${getScoreColor(match.vibeMatchScore).split(' ')[0].replace('from-', '')}, ${getScoreColor(match.vibeMatchScore).split(' ')[2].replace('to-', '')})`,
                  }}
                >
                  {match.vibeMatchScore}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-light-1 truncate">
                    {match.name}
                  </p>
                  <span className="text-xs text-light-4">Lv.{match.level}</span>
                </div>
                <p className="text-xs text-light-3 truncate">@{match.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-400">
                    {getScoreEmoji(match.vibeMatchScore)} {match.vibeMatchLabel}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <svg
                className="w-5 h-5 text-light-4 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* View All */}
      {matches.length > 10 && (
        <button className="w-full mt-4 py-2 text-sm text-primary-500 hover:text-primary-400 transition-colors">
          View all {matches.length} matches →
        </button>
      )}
    </div>
  );
};

export default VibeMatches;
