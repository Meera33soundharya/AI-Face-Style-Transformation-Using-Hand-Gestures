import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

// Eye Aspect Ratio landmark indices (MediaPipe Face Mesh 478-point model)
// Left eye:  p1=33, p2=160, p3=158, p4=133, p5=153, p6=144
// Right eye: p1=362, p2=385, p3=387, p4=263, p5=373, p6=380
const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const EAR_THRESHOLD = 0.25;      // raised: works for more people
const BLINK_COOLDOWN_MS = 1200;  // 1.2s cooldown — one style per blink

function ear(lm: { x: number; y: number }[], idx: number[]): number {
  const p = (i: number) => lm[idx[i]];
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  const vertical = (dist(p(1), p(5)) + dist(p(2), p(4))) / 2;
  const horizontal = dist(p(0), p(3));
  return horizontal > 0 ? vertical / horizontal : 0;
}

export const useEyeBlink = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const [isReady, setIsReady] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceLandmarkerResult | null>(null);

  // Expose latest faceResult as a ref so consumers can read it synchronously
  const faceResultRef = useRef<FaceLandmarkerResult | null>(null);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastBlinkTimeRef = useRef<number>(0);
  const eyesClosedRef = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );
      const lm = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.7,
        minFacePresenceConfidence: 0.7,
        minTrackingConfidence: 0.7,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      if (!cancelled) {
        landmarkerRef.current = lm;
        setIsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    if (!video || !lm || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = lm.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks?.[0];

      if (landmarks && landmarks.length >= 468) {
        setHasFace(true);
        faceResultRef.current = result;
        setFaceResult(result);

        const leftEAR  = ear(landmarks, LEFT_EYE);
        const rightEAR = ear(landmarks, RIGHT_EYE);
        const avgEAR   = (leftEAR + rightEAR) / 2;
        const closed   = avgEAR < EAR_THRESHOLD;

        // Rising edge: eyes were open, now closed → blink
        if (closed && !eyesClosedRef.current) {
          const now = Date.now();
          if (now - lastBlinkTimeRef.current > BLINK_COOLDOWN_MS) {
            lastBlinkTimeRef.current = now;
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 200);
          }
        }
        // Falling edge: eyes reopened — reset so next close fires again
        if (!closed && eyesClosedRef.current) {
          eyesClosedRef.current = false;
        }
        if (closed) eyesClosedRef.current = true;
      } else {
        setHasFace(false);
        faceResultRef.current = null;
        setFaceResult(null);
        eyesClosedRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(detectFrame);
  }, [videoRef]);

  useEffect(() => {
    if (!isReady) return;
    rafRef.current = requestAnimationFrame(detectFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isReady, detectFrame]);

  return { isReady, hasFace, isBlinking, faceResult, faceResultRef };
};
