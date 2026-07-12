import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';

let handLandmarker: HandLandmarker | null = null;
let runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';

export const initializeHandLandmarker = async () => {
  if (handLandmarker) return handLandmarker;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: runningMode,
      numHands: 1, // Only tracking one hand for gestures
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    return handLandmarker;
  } catch (error) {
    console.error("Error initializing HandLandmarker:", error);
    throw error;
  }
};

export const detectHands = (video: HTMLVideoElement, timestamp: number): HandLandmarkerResult | null => {
  if (!handLandmarker) return null;
  return handLandmarker.detectForVideo(video, timestamp);
};
