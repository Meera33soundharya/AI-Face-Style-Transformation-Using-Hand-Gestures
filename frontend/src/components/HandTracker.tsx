import React, { useEffect, useRef } from 'react';
import { detectHands } from '../services/visionEngine';

interface HandTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showDebug?: boolean;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ videoRef, showDebug = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showDebug || !canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let requestRef: number;
    const draw = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const results = detectHands(video, performance.now());
        if (results && results.landmarks) {
          results.landmarks.forEach((handLandmarks) => {
            ctx.fillStyle = '#10b981'; // emerald-500
            handLandmarks.forEach((point) => {
              // Mirrored coordinate
              const x = (1 - point.x) * canvas.width;
              const y = point.y * canvas.height;
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, 2 * Math.PI);
              ctx.fill();
            });
          });
        }
      }
      requestRef = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(requestRef);
  }, [videoRef, showDebug]);

  if (!showDebug) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 6 }}
    />
  );
};
