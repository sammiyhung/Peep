import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

type MediaCarouselProps = {
  media: string[];
  className?: string;
  interval?: number;
  showVideoControls?: boolean;
};

const MediaCarousel = ({ 
  media, 
  className = '', 
  interval = 5000,
  showVideoControls = false
}: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Check if media item is a video
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video');
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  // Auto-play carousel for images (pause on videos)
  useEffect(() => {
    if (media.length <= 1) return;
    
    // Don't auto-advance if current item is a video
    if (isVideo(media[currentIndex])) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [nextSlide, interval, media, currentIndex]);

  // Handle video auto-play on scroll
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    videoRefs.current.forEach((video) => {
      if (video) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                video.play().catch(err => console.log('Auto-play prevented:', err));
              } else {
                video.pause();
              }
            });
          },
          { threshold: 0.5 }
        );

        observer.observe(video);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [media, currentIndex]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    prevSlide();
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    nextSlide();
  };

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // Single media item - no carousel needed
  if (media.length === 1) {
    const url = media[0];
    return (
      <div className={`w-full overflow-hidden rounded-[24px] ${className}`}>
        {isVideo(url) ? (
          <VideoPlayer
            src={url}
            className="w-full h-full"
            showControls={showVideoControls}
          />
        ) : (
          <img
            src={url}
            alt="post media"
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  }

  // Multiple media items - show carousel
  return (
    <div 
      className={`relative w-full overflow-hidden rounded-[24px] ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Media Display */}
      {media.map((url, index) => (
        <div
          key={index}
          className={`transition-opacity duration-500 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
        >
          {isVideo(url) ? (
            <VideoPlayer
              src={url}
              className="w-full h-full"
              showControls={showVideoControls}
            />
          ) : (
            <img
              src={url}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-r-lg hover:bg-black/70 transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-l-lg hover:bg-black/70 transition-colors"
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {media.map((_, index) => (
          <button
            key={index}
            onClick={(e) => goToSlide(index, e)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-4'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MediaCarousel;
