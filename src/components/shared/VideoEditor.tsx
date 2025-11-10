import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui';

type VideoEditorProps = {
  videoUrl: string;
  onClose: () => void;
};

const VideoEditor = ({ videoUrl, onClose }: VideoEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Editing states
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      setTrimEnd(videoRef.current.duration || 0);
    }
  }, [duration]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const videoStyle = {
    transform: `rotate(${rotation}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-1/95 flex items-center justify-center p-4">
      <div className="bg-dark-2 w-full max-w-4xl max-h-[70vh] overflow-y-auto mb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-4">
          <h2 className="text-xl font-semibold text-light-1">Edit Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-3 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-light-1" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[500px]">
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-[500px]"
            style={videoStyle}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="bg-primary-500/80 hover:bg-primary-500 rounded-full p-4 transition-colors"
              >
                <Play className="w-8 h-8 text-white" fill="white" />
              </button>
            </div>
          )}
        </div>

        {/* Timeline Controls */}
        <div className="p-4 border-b border-dark-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-dark-3 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-light-1" />
              ) : (
                <Play className="w-5 h-5 text-light-1" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-dark-3 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-light-1" />
              ) : (
                <Volume2 className="w-5 h-5 text-light-1" />
              )}
            </button>

            <span className="text-sm text-light-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Timeline Slider */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #877EFF ${(currentTime / duration) * 100}%, #1F1F22 ${(currentTime / duration) * 100}%)`,
            }}
          />

          {/* Volume Control */}
          <div className="flex items-center gap-2 mt-3">
            <VolumeX className="w-4 h-4 text-light-3" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32 h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer"
            />
            <Volume2 className="w-4 h-4 text-light-3" />
          </div>
        </div>

        {/* Editing Tools */}
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRotate}
              className="flex items-center gap-2 px-4 py-2 bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-sm">Rotate</span>
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors"
            >
              <span className="text-sm">Reset Filters</span>
            </button>
          </div>

          {/* Brightness */}
          <div>
            <label className="text-sm text-light-2 mb-2 block">
              Brightness: {brightness}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <label className="text-sm text-light-2 mb-2 block">
              Contrast: {contrast}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="w-full h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div>
            <label className="text-sm text-light-2 mb-2 block">
              Saturation: {saturation}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              className="w-full h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Trim Controls */}
          <div className="border-t border-dark-4 pt-4">
            <h3 className="text-sm font-semibold text-light-1 mb-3">Trim Video</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-light-2 mb-2 block">
                  Start: {formatTime(trimStart)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="w-full h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-sm text-light-2 mb-2 block">
                  End: {formatTime(trimEnd)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="w-full h-2 bg-dark-4 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-4 border-t border-dark-4">
          <Button
            onClick={onClose}
            className="flex-1 bg-dark-3 hover:bg-dark-4"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // TODO: Implement save functionality
              onClose();
            }}
            className="flex-1 bg-primary-500 hover:bg-primary-600"
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
