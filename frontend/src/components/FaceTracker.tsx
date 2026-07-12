import React, { useEffect, useRef } from 'react';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface FaceTrackerProps {
  faceResult: FaceLandmarkerResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showDebug?: boolean;
}

export const FaceTracker: React.FC<FaceTrackerProps> = ({ faceResult, videoRef, showDebug = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showDebug || !canvasRef.current || !videoRef.current || !faceResult) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video aspect ratio
    canvas.width = videoRef.current.clientWidth;
    canvas.height = videoRef.current.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceResult.faceLandmarks.length > 0) {
      const landmarks = faceResult.faceLandmarks[0];
      
      ctx.fillStyle = '#3b82f6'; // Blue-500
      ctx.beginPath();
      landmarks.forEach((point) => {
        // Mirrored coordinate
        const x = (1 - point.x) * canvas.width;
        const y = point.y * canvas.height;
        ctx.fillRect(x, y, 2, 2);
      });
      ctx.fill();
    }
  }, [faceResult, videoRef, showDebug]);

  if (!showDebug) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};
