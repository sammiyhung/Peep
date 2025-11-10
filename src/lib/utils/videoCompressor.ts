/**
 * Video Compression Utility
 * Compresses videos client-side before upload to reduce file size while maintaining quality
 * Uses adaptive bitrate based on video resolution and duration
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  quality?: number;
  targetBitrate?: number;
  maxDuration?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  width: number;
  height: number;
}

// Recommended compression settings based on resolution
const COMPRESSION_PRESETS = {
  '4K': { width: 3840, height: 2160, bitrate: 20000000, quality: 0.85 }, // 20 Mbps
  '1440p': { width: 2560, height: 1440, bitrate: 12000000, quality: 0.85 }, // 12 Mbps
  '1080p': { width: 1920, height: 1080, bitrate: 8000000, quality: 0.85 }, // 8 Mbps
  '720p': { width: 1280, height: 720, bitrate: 5000000, quality: 0.85 }, // 5 Mbps
  '480p': { width: 854, height: 480, bitrate: 2500000, quality: 0.80 }, // 2.5 Mbps
  '360p': { width: 640, height: 360, bitrate: 1000000, quality: 0.75 }, // 1 Mbps
};

/**
 * Get video metadata (duration, dimensions)
 */
async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Determine optimal compression preset based on video dimensions
 */
function getOptimalPreset(width: number, height: number, maxWidth?: number, maxHeight?: number) {
  const maxDimension = Math.max(width, height);
  const userMaxWidth = maxWidth || 1920;
  const userMaxHeight = maxHeight || 1080;

  // Apply user constraints
  const constrainedWidth = Math.min(width, userMaxWidth);
  const constrainedHeight = Math.min(height, userMaxHeight);
  const constrainedMaxDimension = Math.max(constrainedWidth, constrainedHeight);

  // Select preset based on size
  if (maxDimension >= 2160 && constrainedMaxDimension >= 2160) return COMPRESSION_PRESETS['1440p']; // Downscale 4K to 1440p
  if (maxDimension >= 1440 && constrainedMaxDimension >= 1440) return COMPRESSION_PRESETS['1080p']; // Downscale 1440p to 1080p
  if (maxDimension >= 1080 && constrainedMaxDimension >= 1080) return COMPRESSION_PRESETS['1080p'];
  if (maxDimension >= 720 && constrainedMaxDimension >= 720) return COMPRESSION_PRESETS['720p'];
  if (maxDimension >= 480 && constrainedMaxDimension >= 480) return COMPRESSION_PRESETS['480p'];
  return COMPRESSION_PRESETS['360p'];
}

/**
 * Calculate target bitrate based on duration
 * Shorter videos can have higher bitrate, longer videos need lower bitrate
 */
function calculateAdaptiveBitrate(
  baseBitrate: number,
  duration: number,
  maxSizeMB: number = 50
): number {
  // Target file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Calculate bitrate needed to stay under max size
  // Formula: bitrate = (fileSize * 8) / duration
  const maxBitrate = (maxSizeBytes * 8) / duration;
  
  // Use the lower of base bitrate or calculated max bitrate
  // Add 20% buffer for audio and container overhead
  return Math.min(baseBitrate, maxBitrate * 0.8);
}

/**
 * Compress video using Canvas and MediaRecorder API
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxSizeMB = 50,
    targetBitrate,
    maxDuration = 300, // 5 minutes max
  } = options;

  // Get video metadata
  const metadata = await getVideoMetadata(file);
  
  // Check duration limit
  if (metadata.duration > maxDuration) {
    throw new Error(`Video duration (${Math.round(metadata.duration)}s) exceeds maximum allowed (${maxDuration}s)`);
  }

  // Determine optimal preset
  const preset = getOptimalPreset(metadata.width, metadata.height, maxWidth, maxHeight);
  
  // Calculate adaptive bitrate
  const adaptiveBitrate = targetBitrate || calculateAdaptiveBitrate(
    preset.bitrate,
    metadata.duration,
    maxSizeMB
  );

  // Calculate output dimensions maintaining aspect ratio
  const aspectRatio = metadata.width / metadata.height;
  let outputWidth = Math.min(metadata.width, preset.width, maxWidth);
  let outputHeight = Math.round(outputWidth / aspectRatio);

  if (outputHeight > Math.min(preset.height, maxHeight)) {
    outputHeight = Math.min(preset.height, maxHeight);
    outputWidth = Math.round(outputHeight * aspectRatio);
  }

  // Ensure dimensions are even numbers (required for some codecs)
  outputWidth = Math.round(outputWidth / 2) * 2;
  outputHeight = Math.round(outputHeight / 2) * 2;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    video.preload = 'auto';
    video.muted = true;

    // MediaRecorder options
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder;

    video.onloadedmetadata = () => {
      video.play();

      // Capture canvas stream
      const stream = canvas.captureStream(30); // 30 fps

      // Add audio track if available
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      videoElement.muted = false;
      
      videoElement.onloadedmetadata = () => {
        // @ts-ignore - srcObject exists
        if (videoElement.captureStream) {
          // @ts-ignore
          const videoStream = videoElement.captureStream();
          const audioTracks = videoStream.getAudioTracks();
          
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0]);
          }
        }

        // Create MediaRecorder with optimized settings
        mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: adaptiveBitrate,
          audioBitsPerSecond: 128000, // 128 kbps for audio
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: mimeType });
          const compressedFile = new File(
            [compressedBlob],
            file.name.replace(/\.[^/.]+$/, '.webm'),
            { type: mimeType }
          );

          URL.revokeObjectURL(video.src);
          URL.revokeObjectURL(videoElement.src);

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: file.size / compressedFile.size,
            duration: metadata.duration,
            width: outputWidth,
            height: outputHeight,
          });
        };

        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(video.src);
          URL.revokeObjectURL(videoElement.src);
          reject(new Error('MediaRecorder error: ' + e));
        };

        mediaRecorder.start(100); // Collect data every 100ms
        videoElement.play();
      };
    };

    // Draw video frames to canvas
    const drawFrame = () => {
      if (video.paused || video.ended) {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        return;
      }

      ctx.drawImage(video, 0, 0, outputWidth, outputHeight);
      requestAnimationFrame(drawFrame);
    };

    video.onplay = () => {
      drawFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Check if video needs compression
 */
export function shouldCompressVideo(file: File, maxSizeMB: number = 50): boolean {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB || !file.type.includes('webm');
}

/**
 * Batch compress multiple videos with progress tracking
 */
export async function compressVideos(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }

    try {
      if (shouldCompressVideo(file, options.maxSizeMB)) {
        const result = await compressVideo(file, options);
        results.push(result);
      } else {
        // File is already optimized, return as-is
        const metadata = await getVideoMetadata(file);
        results.push({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
        });
      }
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
