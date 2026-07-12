import { FilesetResolver, HandLandmarker, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { HandLandmarkerResult, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

let handLandmarker: HandLandmarker | null = null;
let faceLandmarker: FaceLandmarker | null = null;

export const initializeVisionTasks = async () => {
  if (handLandmarker && faceLandmarker) return { handLandmarker, faceLandmarker };

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
    );
    
    // Initialize Hand Landmarker (configured for 2 hands, confidence > 0.8)
    if (!handLandmarker) {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.8,
        minHandPresenceConfidence: 0.8,
        minTrackingConfidence: 0.8,
      });
    }

    // Initialize Face Landmarker (for face crop and blink detection)
    if (!faceLandmarker) {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.8,
        minFacePresenceConfidence: 0.8,
        minTrackingConfidence: 0.8,
        outputFaceBlendshapes: true, // Need this for blink detection (EAR could also be used, but blendshapes provides eyeBlink_Left/Right directly)
        outputFacialTransformationMatrixes: false,
      });
    }
    
    return { handLandmarker, faceLandmarker };
  } catch (error) {
    console.error("Error initializing vision tasks:", error);
    throw error;
  }
};

export const detectHands = (
  video: HTMLVideoElement | HTMLCanvasElement,
  timestamp: number
): HandLandmarkerResult | null => {
  if (!handLandmarker) return null;
  return handLandmarker.detectForVideo(video, timestamp);
};

export const detectFace = (
  video: HTMLVideoElement | HTMLCanvasElement,
  timestamp: number
): FaceLandmarkerResult | null => {
  if (!faceLandmarker) return null;
  return faceLandmarker.detectForVideo(video, timestamp);
};
