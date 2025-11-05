import { useEffect, useState } from 'react';
import { api } from '@/lib/api/config';
import { Zap, Flame, ChevronDown, Award } from 'lucide-react';

interface EnergyData {
  energy: number;
  maxEnergy: number;
  level: number;
  streak: {
    current: number;
    longest: number;
  };
  badges: Array<{
    name: string;
    icon: string;
  }>;
}

const EnergyBar = () => {
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchEnergyData();
    // Refresh every minute in background
    const interval = setInterval(fetchEnergyData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEnergyData = async () => {
    try {
      const response = await api.get('/api/energy');
      setEnergyData(response.data);
      setHasLoaded(true);
    } catch (error: any) {
      console.error('Error fetching energy:', error);
      setHasLoaded(true);
      // If 404, the route doesn't exist yet - hide component
      if (error?.response?.status === 404) {
        console.log('Energy API not available yet. Please restart the server.');
      }
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

  if (!energyData) {
    return null;
  }

  const energyPercentage = (energyData.energy / energyData.maxEnergy) * 100;
  const getEnergyColor = () => {
    if (energyPercentage > 70) return 'from-green-500 to-emerald-600';
    if (energyPercentage > 40) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="glass-card p-2 sm:p-3 rounded-xl animate-fade-in border border-dark-4/50 relative z-10">
      {/* Compact Summary View */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-dark-4/30 rounded-lg transition-all p-1 -m-1"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex-center shadow-lg">
              <Zap size={16} className="text-white sm:w-[18px] sm:h-[18px]" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary-500 flex-center text-white text-[9px] sm:text-[10px] font-bold shadow-md">
              {energyData.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5 gap-1">
              <p className="text-[10px] sm:text-sm font-bold text-light-1 whitespace-nowrap">Peep Energy</p>
              <p className="text-[10px] sm:text-xs font-bold text-light-1 whitespace-nowrap">{energyData.energy}/{energyData.maxEnergy}</p>
            </div>
            <div className="relative w-full h-2 sm:h-2.5 bg-dark-4 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getEnergyColor()} transition-all duration-700`}
                style={{ width: `${energyPercentage}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 flex-shrink-0">
          {energyData.streak.current > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/20">
              <Flame size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-400">{energyData.streak.current}</span>
            </div>
          )}
          <ChevronDown 
            size={16} 
            className={`text-light-3 transition-transform duration-300 sm:w-[18px] sm:h-[18px] ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Details View - Overlay */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl p-3 sm:p-4 z-[100] border border-dark-4/80 shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="space-y-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Level & Progress */}
            <div className="bg-dark-4/50 rounded-xl p-3 border border-dark-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-yellow-500" />
                <span className="text-xs font-medium text-light-3">Level</span>
              </div>
              <p className="text-xl font-bold text-light-1">{energyData.level}</p>
              <p className="text-xs text-light-4 mt-1">{energyPercentage.toFixed(0)}% charged</p>
            </div>

            {/* Streak */}
            <div className="bg-dark-4/50 rounded-xl p-3 border border-dark-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} className="text-orange-500" />
                <span className="text-xs font-medium text-light-3">Streak</span>
              </div>
              <p className="text-xl font-bold text-light-1">{energyData.streak.current}</p>
              <p className="text-xs text-light-4 mt-1">Best: {energyData.streak.longest} days</p>
            </div>
          </div>

          {/* Badges */}
          {energyData.badges.length > 0 && (
            <div className="bg-dark-4/50 rounded-xl p-3 border border-dark-4">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-primary-500" />
                <span className="text-xs font-medium text-light-3">Badges Earned</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {energyData.badges.slice(0, 5).map((badge, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex-center shadow-lg"
                    title={badge.name}
                  >
                    <Award size={16} className="text-white" />
                  </div>
                ))}
                {energyData.badges.length > 5 && (
                  <div className="w-8 h-8 rounded-lg bg-dark-3 flex-center text-xs text-light-3 font-bold">
                    +{energyData.badges.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Low Energy Warning */}
          {energyPercentage < 30 && (
            <div className="p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Zap size={16} className="text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Low Energy!</p>
                  <p className="text-xs text-light-3 mt-1">
                    Engage with posts to earn more energy or wait for regeneration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnergyBar;
