import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeFaceDetector, detectFaces } from '../services/faceDetector';
import type { Detection } from '@mediapipe/tasks-vision';

export const useFaceDetection = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const [isReady, setIsReady] = useState(false);
  const [faceDetection, setFaceDetection] = useState<Detection | null>(null);
  
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeFaceDetector();
        setIsReady(true);
      } catch (error) {
        console.error("Failed to init face detector:", error);
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
        
        const results = detectFaces(video, performance.now());
        
        if (results && results.detections.length > 0) {
          // Use the most prominent face
          setFaceDetection(results.detections[0]);
        } else {
          setFaceDetection(null);
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [isReady, videoRef]);

  useEffect(() => {
    if (isReady && videoRef.current) {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [isReady, detectFrame, videoRef]);

  const captureFace = useCallback((): string | null => {
    if (!videoRef.current || !faceDetection) return null;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Draw the full video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a production app, we would crop this using faceDetection.boundingBox
    // For this demo with FLUX, passing the full frame works fine and often
    // gives better context for the style transfer.
    
    // Return base64 jpeg
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [faceDetection, videoRef]);

  return { isReady, faceDetection, captureFace };
};
