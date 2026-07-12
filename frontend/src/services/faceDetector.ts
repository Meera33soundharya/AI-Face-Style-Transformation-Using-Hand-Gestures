import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';
import type { FaceDetectorResult } from '@mediapipe/tasks-vision';

let faceDetector: FaceDetector | null = null;
let runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';

export const initializeFaceDetector = async () => {
  if (faceDetector) return faceDetector;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        delegate: 'GPU'
      },
      runningMode: runningMode,
      minDetectionConfidence: 0.5,
    });
    
    return faceDetector;
  } catch (error) {
    console.error("Error initializing FaceDetector:", error);
    throw error;
  }
};

export const detectFaces = (video: HTMLVideoElement, timestamp: number): FaceDetectorResult | null => {
  if (!faceDetector) return null;
  return faceDetector.detectForVideo(video, timestamp);
};
