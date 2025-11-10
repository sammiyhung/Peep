import { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, CheckCircle, Upload } from 'lucide-react';

type UploadToastProps = {
  progress: number;
  fileName: string;
  isComplete: boolean;
  onClose: () => void;
};

const UploadToast = ({ progress, fileName, isComplete, onClose }: UploadToastProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);

  // Auto-close after completion
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setShouldClose(true);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onClose]);

  if (shouldClose) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ${
        shouldClose ? 'opacity-0 translate-y-[-20px]' : 'opacity-100'
      }`}
      style={{ width: isMinimized ? '280px' : '400px' }}
    >
      <div className="bg-dark-2 border border-dark-4 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-dark-3 border-b border-dark-4">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Upload className="w-5 h-5 text-primary-500 animate-pulse" />
            )}
            <span className="text-sm font-semibold text-light-1">
              {isComplete ? 'Upload Complete' : 'Uploading...'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-dark-4 rounded-lg transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-light-3" />
              ) : (
                <Minimize2 className="w-4 h-4 text-light-3" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-dark-4 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-light-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            <p className="text-sm text-light-2 mb-3 truncate" title={fileName}>
              {fileName}
            </p>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-dark-4 rounded-full overflow-hidden mb-2">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full ${
                  isComplete ? 'bg-green-500' : 'bg-primary-500'
                }`}
                style={{ width: `${progress}%` }}
              >
                {!isComplete && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
            </div>

            {/* Progress Text */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-light-3">
                {isComplete ? 'Successfully uploaded' : `${Math.round(progress)}% uploaded`}
              </span>
              {!isComplete && (
                <span className="text-light-4">
                  Uploading in background...
                </span>
              )}
            </div>

            {/* Success Message */}
            {isComplete && (
              <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-green-500 text-center">
                  Your post has been created successfully!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-light-3">
                {isComplete ? 'Complete' : `${Math.round(progress)}%`}
              </span>
              <div className="w-20 h-1.5 bg-dark-4 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isComplete ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadToast;
