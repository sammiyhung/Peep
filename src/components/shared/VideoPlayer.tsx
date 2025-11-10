import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useVideoContext } from '@/context/VideoContext';

type VideoPlayerProps = {
  src: string;
  className?: string;
  showControls?: boolean; // For PostDetails
  autoPlay?: boolean;
  loop?: boolean;
};

const VideoPlayer = ({ 
  src, 
  className = '', 
  showControls = false,
  autoPlay = true,
  loop = true
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { globalMuted, setGlobalMuted } = useVideoContext();

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync video muted state with global state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted]);

  // Handle video visibility for auto-play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && autoPlay) {
            video.play().catch(() => {});
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, [autoPlay]);

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    // On first tap, show controls instead of toggling play
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowControlsOverlay(true);
      setTimeout(() => setShowControlsOverlay(false), 3000);
      return;
    }
    
    // If controls are showing, don't toggle on video tap (only on button tap)
    if (showControlsOverlay && showControls) {
      return;
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      
      // Show controls briefly on interaction
      setShowControlsOverlay(true);
      setTimeout(() => setShowControlsOverlay(false), 2000);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGlobalMuted(!globalMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration)) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isFinite(percent) ? percent : 0);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (clientX: number) => {
    if (videoRef.current && timelineRef.current && videoRef.current.duration && isFinite(videoRef.current.duration)) {
      const rect = timelineRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percent * videoRef.current.duration;
      if (isFinite(newTime) && newTime >= 0) {
        videoRef.current.currentTime = newTime;
        // Update UI immediately for responsive feedback
        setProgress(percent * 100);
        setCurrentTime(newTime);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    handleSeek(e.touches[0].clientX);
    setShowControlsOverlay(true); // Keep controls visible while dragging
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSeek(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleSeek(e.touches[0].clientX);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Auto-hide controls after dragging
    if (isPlaying) {
      setTimeout(() => setShowControlsOverlay(false), 2000);
    }
  };

  // Add global mouse/touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover cursor-pointer"
        loop={loop}
        playsInline
        muted={globalMuted}
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
      />

      {/* Center Play/Pause Button */}
      {(showControlsOverlay || !isPlaying) && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              if (isPlaying) {
                videoRef.current.pause();
              } else {
                videoRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }
          }}
        >
          <div className="bg-black/70 rounded-full p-6 animate-fade-in cursor-pointer hover:bg-black/80 transition-colors">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Play className="w-8 h-8 text-white" fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Controls (for PostDetails) */}
      {showControls && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControlsOverlay || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {/* Timeline */}
          <div 
            ref={timelineRef}
            className="w-full py-2 mb-3 cursor-pointer relative -mx-2 px-2"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
          >
            <div className="w-full h-2 bg-white/30 rounded-full relative">
              <div 
                className="h-full bg-primary-500 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                {/* Draggable Thumb */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg -mr-2" />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              
              {/* Timer */}
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {globalMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mute Button (always visible in PostDetails) */}
      {showControls && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
        >
          {globalMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
