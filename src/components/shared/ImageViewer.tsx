import { X } from "lucide-react";
import { useEffect } from "react";

type ImageViewerProps = {
  imageUrl: string;
  onClose: () => void;
};

const ImageViewer = ({ imageUrl, onClose }: ImageViewerProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when overlay is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-dark-4/80 hover:bg-dark-3 transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-light-1" />
      </button>

      {/* Image container */}
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
