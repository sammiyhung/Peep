import { useState } from 'react';
import { api } from '@/lib/api/config';
import { Smile, Sparkles, Wind, Target, Palette, Brain, Zap, Waves, Minus } from 'lucide-react';

interface MoodSelectorProps {
  currentMood: string;
  onMoodChange?: (mood: string) => void;
}

const MOODS = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'from-yellow-400 to-orange-500', iconColor: 'text-yellow-500' },
  { value: 'inspired', label: 'Inspired', icon: Sparkles, color: 'from-purple-400 to-pink-500', iconColor: 'text-purple-500' },
  { value: 'chill', label: 'Chill', icon: Wind, color: 'from-blue-400 to-cyan-500', iconColor: 'text-blue-500' },
  { value: 'focused', label: 'Focused', icon: Target, color: 'from-green-400 to-emerald-500', iconColor: 'text-green-500' },
  { value: 'creative', label: 'Creative', icon: Palette, color: 'from-pink-400 to-rose-500', iconColor: 'text-pink-500' },
  { value: 'thoughtful', label: 'Thoughtful', icon: Brain, color: 'from-indigo-400 to-purple-500', iconColor: 'text-indigo-500' },
  { value: 'energetic', label: 'Energetic', icon: Zap, color: 'from-red-400 to-orange-500', iconColor: 'text-red-500' },
  { value: 'relaxed', label: 'Relaxed', icon: Waves, color: 'from-teal-400 to-green-500', iconColor: 'text-teal-500' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'from-gray-400 to-gray-500', iconColor: 'text-gray-500' },
];

const MoodSelector = ({ currentMood, onMoodChange }: MoodSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState(currentMood || 'neutral');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMoodSelect = async (mood: string) => {
    try {
      await api.put('/api/energy/mood', { mood });
      setSelectedMood(mood);
      setIsExpanded(false);
      if (onMoodChange) {
        onMoodChange(mood);
      }
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const currentMoodData = MOODS.find(m => m.value === selectedMood) || MOODS[8];

  return (
    <div className="relative z-[500]">
      {/* Current Mood Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-card px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition-all duration-300 border border-dark-4"
        style={{
          background: isExpanded
            ? `linear-gradient(135deg, rgba(135, 126, 255, 0.2), rgba(135, 126, 255, 0.1))`
            : undefined,
        }}
      >
        <currentMoodData.icon size={20} className={currentMoodData.iconColor} />
        <span className="text-sm font-medium text-light-1">{currentMoodData.label}</span>
        <svg
          className={`w-4 h-4 text-light-3 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mood Options */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[250]" 
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full mt-2 right-0 rounded-xl p-3 animate-fade-in z-[300] w-[280px] max-w-[90vw] border border-dark-4/80 shadow-2xl" style={{ background: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(20px)' }}>
          <p className="text-xs font-semibold text-light-1 mb-2">How are you feeling?</p>
          <div className="grid grid-cols-3 gap-1.5">
            {MOODS.map((mood) => {
              const MoodIcon = mood.icon;
              return (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value)}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 border ${
                    selectedMood === mood.value
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-dark-4/50 border-dark-4 hover:bg-dark-3'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <MoodIcon size={20} className={selectedMood === mood.value ? 'text-primary-500' : mood.iconColor} />
                    <span className="text-[10px] text-light-2 font-medium">{mood.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default MoodSelector;
export { MOODS };
