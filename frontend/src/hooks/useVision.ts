import React, { useEffect, useState, useRef, useCallback } from 'react';
import { initializeVisionTasks, detectHands, detectFace } from '../services/visionEngine';
import { recognizeGesture, type GestureType } from '../services/gestureRecognizer';

export const useVision = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const [isReady, setIsReady] = useState(false);
  const [hasBothHands, setHasBothHands] = useState(false);
  const [hasFist, setHasFist] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [frameBox, setFrameBox] = useState<{ minX: number, maxX: number, minY: number, maxY: number } | null>(null);
  
  // Expose raw results for overlay rendering
  const [faceResult, setFaceResult] = useState<any>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');

  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cooldown and debounce refs
  const lastBlinkTimeRef = useRef<number>(0);
  const lastGestureTimeRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      await initializeVisionTasks();
      setIsReady(true);
    };
    init();
  }, []);

  const detectFrame = useCallback(() => {
    if (!isReady || !videoRef.current) return;
    const video = videoRef.current;

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const now = performance.now();

        // Prepare hidden canvas to fix MediaPipe IMAGE_DIMENSIONS warning
        if (!detectionCanvasRef.current) {
          detectionCanvasRef.current = document.createElement('canvas');
        }
        const canvas = detectionCanvasRef.current;
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 1. Detect Hands using the exact-sized canvas
          const handResults = detectHands(canvas as any, now);
          let leftHandFound = false;
          let rightHandFound = false;
          let fistDetected = false;
          
          if (handResults && handResults.handedness) {
            let minX = 1, maxX = 0, minY = 1, maxY = 0;
            let framePointsFound = 0;
            
            handResults.handedness.forEach((hand, index) => {
               if (hand[0].categoryName === 'Left') leftHandFound = true;
               if (hand[0].categoryName === 'Right') rightHandFound = true;
               
               // Check if this hand is a fist
               const landmarks = handResults.landmarks[index];
               if (landmarks) {
                 const fingerTips = [8, 12, 16, 20];
                 const mcpJoints = [5, 9, 13, 17];
                 const wrist = landmarks[0];
                 let closedCount = 0;
                 
                 for (let i = 0; i < 4; i++) {
                   const tip = landmarks[fingerTips[i]];
                   const mcp = landmarks[mcpJoints[i]];
                   const distTipToWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
                   const distMcpToWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
                   if (distTipToWrist < distMcpToWrist) {
                     closedCount++;
                   }
                 }
                 if (closedCount >= 3) fistDetected = true;
                 
                 // Collect bounding points for frameBox using Index tip (8) and Thumb tip (4)
                 const indexTip = landmarks[8];
                 const thumbTip = landmarks[4];
                 
                 if (indexTip.x < minX) minX = indexTip.x;
                 if (indexTip.x > maxX) maxX = indexTip.x;
                 if (indexTip.y < minY) minY = indexTip.y;
                 if (indexTip.y > maxY) maxY = indexTip.y;
                 
                 if (thumbTip.x < minX) minX = thumbTip.x;
                 if (thumbTip.x > maxX) maxX = thumbTip.x;
                 if (thumbTip.y < minY) minY = thumbTip.y;
                 if (thumbTip.y > maxY) maxY = thumbTip.y;
                 
                 framePointsFound += 2;
               }
            });
            
            // Run gesture recognition on the right hand (or first hand if no right hand)
            const mainHandIndex = handResults.handedness.findIndex((h: any) => h[0].categoryName === 'Right');
            const targetIndex = mainHandIndex >= 0 ? mainHandIndex : 0;
            const gesture = recognizeGesture(handResults.landmarks[targetIndex]);
            
            if (gesture !== 'none') {
              const currentTime = Date.now();
              if (currentTime - lastGestureTimeRef.current > 1000) { // 1 sec cooldown
                setCurrentGesture(gesture);
                lastGestureTimeRef.current = currentTime;
                // Reset gesture to none after short duration so it can fire again
                setTimeout(() => setCurrentGesture('none'), 500);
              }
            }
            
            if (framePointsFound >= 4) {
               setFrameBox({ minX, maxX, minY, maxY });
            } else {
               setFrameBox(null);
            }
          } else {
            setFrameBox(null);
          }
          setHasBothHands(leftHandFound && rightHandFound);
          setHasFist(fistDetected);

          // 2. Detect Face & Blinks using the exact-sized canvas
          const faceResults = detectFace(canvas as any, now);
          if (faceResults && faceResults.faceLandmarks.length > 0) {
            setHasFace(true);
            setFaceResult(faceResults);

            // Blink detection using blendshapes
            if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
              const blendshapes = faceResults.faceBlendshapes[0].categories;
              const leftBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')?.score || 0;
              const rightBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')?.score || 0;

              // Threshold for blinking
              if (leftBlink > 0.4 && rightBlink > 0.4) {
                const currentTime = Date.now();
                if (currentTime - lastBlinkTimeRef.current > 1000) { // 1 sec debounce on blink
                  setIsBlinking(true);
                  lastBlinkTimeRef.current = currentTime;
                  // Reset blink state after a short delay
                  setTimeout(() => setIsBlinking(false), 200);
                }
              }
            }
          } else {
            setHasFace(false);
            setFaceResult(null);
          }
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

  return { isReady, hasBothHands, hasFist, hasFace, isBlinking, faceResult, frameBox, currentGesture };
};
