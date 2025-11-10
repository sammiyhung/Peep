import { useCallback, useEffect, useRef, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui";
import { convertFileToUrl } from "@/lib/utils";
import { compressVideo, shouldCompressVideo, formatFileSize } from "@/lib/utils/videoCompressor";
import VideoEditor from "./VideoEditor";

type FileUploaderProps = {
  fieldChange: (files: File[]) => void;
  mediaUrl: string | string[];
};

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>(
    Array.isArray(mediaUrl) ? mediaUrl : mediaUrl ? [mediaUrl] : []
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');
  const [videoLoadingStates, setVideoLoadingStates] = useState<Record<number, boolean>>({});
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const registerObjectUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      objectUrlsRef.current.push(url);
    }
    return url;
  }, []);

  const revokeObjectUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current = objectUrlsRef.current.filter((existing) => existing !== url);
    }
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      setIsCompressing(true);
      const processedFiles: File[] = [];
      const processedUrls: string[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        
        // Check if it's a video that needs compression
        if (file.type.startsWith('video/') && shouldCompressVideo(file)) {
          try {
            setCompressionProgress(`Compressing video ${i + 1}/${acceptedFiles.length}...`);
            
            const result = await compressVideo(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              maxSizeMB: 50,
              maxDuration: 300, // 5 minutes
            });

            const tempVideo = document.createElement('video');
            const canPlayCompressed = tempVideo.canPlayType(result.file.type || '');
            const previewFile = canPlayCompressed ? result.file : file;
            const previewUrl = registerObjectUrl(convertFileToUrl(previewFile));

            console.log(
              `Video compressed: ${file.name}\n` +
              `Original: ${formatFileSize(result.originalSize)}\n` +
              `Compressed: ${formatFileSize(result.compressedSize)}\n` +
              `Ratio: ${result.compressionRatio.toFixed(2)}x\n` +
              `Resolution: ${result.width}x${result.height}`
            );

            processedFiles.push(result.file);
            processedUrls.push(previewUrl);
          } catch (error) {
            console.error('Video compression failed:', error);
            // Fall back to original file if compression fails
            processedFiles.push(file);
            processedUrls.push(registerObjectUrl(convertFileToUrl(file)));
          }
        } else {
          // Images and already optimized videos
          processedFiles.push(file);
          processedUrls.push(registerObjectUrl(convertFileToUrl(file)));
        }
      }

      const newFiles = [...files, ...processedFiles];
      const newUrls = [...fileUrls, ...processedUrls];
      
      setFiles(newFiles);
      setFileUrls(newUrls);
      fieldChange(newFiles);
      setIsCompressing(false);
      setCompressionProgress('');
    },
    [files, fileUrls, fieldChange]
  );

  const removeFile = (index: number) => {
    const urlToRemove = fileUrls[index];
    if (urlToRemove) {
      revokeObjectUrl(urlToRemove);
    }
    const newFiles = files.filter((_, i) => i !== index);
    const newUrls = fileUrls.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFileUrls(newUrls);
    fieldChange(newFiles);
  };

  const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
  };

  const isVideoIndex = (index: number) => {
    const url = fileUrls[index];
    const file = files[index];
    if (file) {
      return file.type.startsWith('video/');
    }
    return url ? isVideoUrl(url) : false;
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".ogg"],
    },
    multiple: true,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Preview Grid */}
      {fileUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {fileUrls.map((url, index) => {
            const file = files[index];
            const isVideoFile = isVideoIndex(index);
            const videoType = file?.type || (isVideoUrl(url) ? 'video/mp4' : undefined);

            return (
              <div key={url || index} className="relative group">
                {isVideoFile ? (
                  <div className="relative">
                    <video
                      className="w-full h-40 object-cover rounded-lg cursor-pointer"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedData={() => {
                        setVideoLoadingStates(prev => ({ ...prev, [index]: false }));
                      }}
                      onLoadStart={() => {
                        setVideoLoadingStates(prev => ({ ...prev, [index]: true }));
                      }}
                      onClick={() => setSelectedVideoIndex(index)}
                    >
                      <source src={url} type={videoType} />
                      Your browser does not support the video tag.
                    </video>
                    {videoLoadingStates[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-dark-4/50 rounded-lg">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`upload ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg cursor-pointer"
                    onClick={() => {
                      // Open image viewer or editor for images if needed
                      // For now, images don't have an editor
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-dark-1 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-4 h-4 text-light-1" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Editor Modal */}
      {selectedVideoIndex !== null && isVideoIndex(selectedVideoIndex) && (
        <VideoEditor
          videoUrl={fileUrls[selectedVideoIndex]}
          onClose={() => setSelectedVideoIndex(null)}
        />
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer">
        <input {...getInputProps()} className="cursor-pointer" disabled={isCompressing} />

        <div className="file_uploader-box">
          {isCompressing ? (
            <>
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <h3 className="base-medium text-light-2 mb-2 mt-6">
                {compressionProgress}
              </h3>
              <p className="text-light-4 small-regular mb-6">
                Optimizing video for faster upload...
              </p>
            </>
          ) : (
            <>
              <img
                src="/assets/icons/file-upload.svg"
                width={96}
                height={77}
                alt="file upload"
              />

              <h3 className="base-medium text-light-2 mb-2 mt-6">
                {fileUrls.length > 0 ? 'Add more files' : 'Drag photos or videos here'}
              </h3>
              <p className="text-light-4 small-regular mb-6 text-center">
                PNG, JPG, GIF, MP4, WEBM (Videos auto-compressed)
              </p>

              <Button type="button" className="shad-button_dark_4">
                Select from computer
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
