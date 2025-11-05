import { Sparkles } from 'lucide-react';
import { MOODS } from './MoodSelector';

type VibeMatchScoreProps = {
  post: any;
  userMood: string;
};

const VibeMatchScore = ({ post, userMood }: VibeMatchScoreProps) => {
  // Calculate vibe match percentage
  const calculateMatch = () => {
    if (post.mood === userMood) return 100;
    
    // Mood compatibility matrix
    const compatibility: Record<string, string[]> = {
      happy: ['energetic', 'inspired', 'creative'],
      inspired: ['creative', 'thoughtful', 'happy'],
      chill: ['relaxed', 'thoughtful', 'neutral'],
      focused: ['thoughtful', 'energetic', 'neutral'],
      creative: ['inspired', 'happy', 'energetic'],
      thoughtful: ['focused', 'chill', 'inspired'],
      energetic: ['happy', 'creative', 'focused'],
      relaxed: ['chill', 'neutral', 'thoughtful'],
      neutral: ['chill', 'relaxed', 'focused'],
    };

    const compatible = compatibility[userMood] || [];
    if (compatible.includes(post.mood)) return 75;
    
    return 50;
  };

  const matchScore = calculateMatch();
  const postMood = MOODS.find(m => m.value === post.mood);

  if (matchScore < 75) return null; // Only show good matches

  return (
    <div className="glass-card p-3 rounded-lg mb-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-500" />
          <span className="small-medium text-light-2">Vibe Match</span>
        </div>
        <div className="flex items-center gap-2">
          {postMood && <span className="text-lg">{postMood.value}</span>}
          <div className="flex items-center gap-1">
            <div className="w-20 h-2 bg-dark-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <span className="text-xs font-bold text-primary-500">{matchScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibeMatchScore;
