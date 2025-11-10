import React, { createContext, useContext, useState, useEffect } from 'react';

type VideoContextType = {
  globalMuted: boolean;
  setGlobalMuted: (muted: boolean) => void;
  toggleGlobalMute: () => void;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalMuted, setGlobalMuted] = useState(true); // Start muted

  // Listen for volume key presses
  useEffect(() => {
    const handleVolumeChange = () => {
      // When user presses volume up/down, unmute all videos
      setGlobalMuted(false);
    };

    // Listen for volume button events (works on some browsers/devices)
    window.addEventListener('volumechange', handleVolumeChange);

    return () => {
      window.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const toggleGlobalMute = () => {
    setGlobalMuted(prev => !prev);
  };

  return (
    <VideoContext.Provider value={{ globalMuted, setGlobalMuted, toggleGlobalMute }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

// Alias for consistency
export const useVideoContext = useVideo;
