import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeHandLandmarker, detectHands } from '../services/gestureEngine';
import { recognizeGesture } from '../services/gestureRecognizer';
import type { GestureType } from '../services/gestureRecognizer';
import type { Landmark } from '@mediapipe/tasks-vision';

interface UseGesturesProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onStyleTrigger?: (gesture: GestureType, handedness: string, confidence: number) => void;
}

export const useGestures = ({ videoRef, onStyleTrigger }: UseGesturesProps) => {
  const [isReady, setIsReady] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  
  // Cooldown mechanism to prevent gesture spam
  const lastGestureTimeRef = useRef<number>(0);
  const activeGestureRef = useRef<GestureType>('none');

  useEffect(() => {
    const init = async () => {
      try {
        await initializeHandLandmarker();
        setIsReady(true);
      } catch (error) {
        console.error("Failed to init gesture engine:", error);
      }
    };
    init();
  }, []);

  const detectFrame = useCallback(() => {
    if (!isReady || !videoRef.current) return;
    
    const video = videoRef.current;
    
    if (video.readyState >= 2) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        const results = detectHands(video, performance.now());
        
        if (results && results.landmarks.length > 0) {
          const handLandmarks = results.landmarks[0];
          setLandmarks(handLandmarks);
          
          const gesture = recognizeGesture(handLandmarks);
          const handedness = results.handedness[0][0].categoryName;
          const confidence = results.handedness[0][0].score;
          
          const now = Date.now();
          if (gesture !== activeGestureRef.current) {
            if (now - lastGestureTimeRef.current > 800 || gesture === 'none') {
               setCurrentGesture(gesture);
               activeGestureRef.current = gesture;
               
               if (gesture !== 'none') {
                 lastGestureTimeRef.current = now;
                 if (onStyleTrigger) {
                   onStyleTrigger(gesture, handedness, confidence);
                 }
               }
            }
          }
          
        } else {
          setLandmarks(null);
          setCurrentGesture('none');
          activeGestureRef.current = 'none';
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [isReady, videoRef, onStyleTrigger]);

  useEffect(() => {
    if (isReady && videoRef.current) {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [isReady, detectFrame, videoRef]);

  return { isReady, currentGesture, landmarks };
};
