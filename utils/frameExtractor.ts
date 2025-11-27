
import { ProcessedFrame, VideoMetadata } from '../types';

const MAX_DURATION_SECONDS = 300; // 5 Minutes

export const extractFramesFromVideo = async (
  videoFile: File,
  onProgress: (processed: number, total: number) => void
): Promise<{ frames: ProcessedFrame[], metadata: VideoMetadata }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: ProcessedFrame[] = [];

    // Create a URL for the video file
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    // ULTRA-DENSE SAMPLING TARGET
    // 256px width is sufficient for detecting cuts/composition but small enough 
    // to send 300+ frames in a single Gemini payload.
    const TARGET_WIDTH = 256;

    video.onloadedmetadata = () => {
      const duration = video.duration;

      // Check Duration Limit
      if (duration > MAX_DURATION_SECONDS) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("VIDEO_TOO_LONG"));
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      // OPTIMIZED SAMPLING to extract ~300 frames
      // < 30s: 10 fps (0.1s) -> ~300 frames
      // < 60s: 5 fps (0.2s) -> ~300 frames
      // < 150s: 2 fps (0.5s) -> ~300 frames
      // < 300s: 1 fps (1.0s) -> ~300 frames
      let intervalSeconds = 1.0;
      if (duration <= 30) {
        intervalSeconds = 0.1;
      } else if (duration <= 60) {
        intervalSeconds = 0.2;
      } else if (duration <= 150) {
        intervalSeconds = 0.5;
      } else {
        intervalSeconds = 1.0;
      }

      // Estimate total frames to extract
      const estimatedFrames = Math.floor(duration / intervalSeconds);
      let currentTime = 0;

      canvas.width = TARGET_WIDTH;
      canvas.height = (height / width) * TARGET_WIDTH;

      const seekAndCapture = async () => {
        if (currentTime >= duration) {
          URL.revokeObjectURL(videoUrl);
          resolve({
            frames,
            metadata: { width, height, duration }
          });
          return;
        }

        // Set video time
        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Low quality compression (0.4) to minimize payload size for high volume
          const base64 = canvas.toDataURL('image/jpeg', 0.4);

          frames.push({
            timestamp: currentTime,
            // Remove the data URL prefix for the API
            data: base64.split(',')[1],
          });

          onProgress(frames.length, estimatedFrames);

          currentTime += intervalSeconds;
          seekAndCapture();
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };

      video.onerror = (e) => {
        reject(new Error("Error processing video file"));
      };

      // Start the process
      seekAndCapture();
    };

    video.load();
  });
};
