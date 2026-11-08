import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker> | null = null;

// Official Google MediaPipe CDN resources for WebAssembly binaries and model weights
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/**
 * Initializes and returns a cached singleton instance of Google MediaPipe PoseLandmarker.
 * Tries WebGL/GPU acceleration first, falling back to CPU if unsupported.
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // 1. Load WebAssembly vision fileset resolver
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      // 2. Attempt GPU delegate for 30-60 FPS acceleration
      try {
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseLandmarkerInstance = landmarker;
        isInitializing = false;
        return landmarker;
      } catch (gpuError) {
        console.warn('MediaPipe GPU acceleration unavailable, falling back to CPU delegate:', gpuError);
        // Fallback to CPU
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseLandmarkerInstance = landmarker;
        isInitializing = false;
        return landmarker;
      }
    } catch (err: any) {
      isInitializing = false;
      initPromise = null;
      console.error('Failed to initialize MediaPipe Pose Landmarker:', err);
      throw new Error(
        `Failed to initialize AI Pose Engine: ${err?.message || 'Network error loading MediaPipe vision model'}`
      );
    }
  })();

  return initPromise;
}

/**
 * Performs synchronous frame inference on a video element at the given high-resolution timestamp.
 */
export function detectPoseInVideo(
  landmarker: PoseLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): PoseLandmarkerResult | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0) {
    return null;
  }

  try {
    return landmarker.detectForVideo(video, timestampMs);
  } catch (err) {
    console.warn('Frame detection skipped:', err);
    return null;
  }
}
