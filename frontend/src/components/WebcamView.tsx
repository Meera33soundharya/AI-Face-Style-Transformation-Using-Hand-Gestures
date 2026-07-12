import React, { useRef, useEffect } from 'react';
import type { Landmark } from '@mediapipe/tasks-vision';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: Landmark[] | null;
  hasPermission: boolean | null;
  error: string | null;
}

export const WebcamView: React.FC<WebcamViewProps> = ({ 
  videoRef, 
  landmarks,
  hasPermission,
  error
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw landmarks overlay
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video aspect ratio
    canvas.width = videoRef.current.clientWidth;
    canvas.height = videoRef.current.clientHeight;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarks && landmarks.length > 0) {
      // Draw points
      ctx.fillStyle = '#ec4899'; // Pink-500
      ctx.strokeStyle = '#fbcfe8'; // Pink-200
      ctx.lineWidth = 2;

      // Draw connections (simplified for brevity)
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      ];

      // Draw lines
      ctx.beginPath();
      connections.forEach(([i, j]) => {
        const pt1 = landmarks[i];
        const pt2 = landmarks[j];
        if (pt1 && pt2) {
          ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
          ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
        }
      });
      ctx.stroke();

      // Draw joints
      landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [landmarks, videoRef]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6 bg-red-900/20 backdrop-blur-sm">
          <p className="text-red-400">
            {error || "Webcam access denied. Please grant permissions to use the gesture studio."}
          </p>
        </div>
      )}
      
      {hasPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300">Requesting camera access...</p>
          </div>
        </div>
      )}

      {/* The video element is mirrored using scale-x-[-1] for a natural mirror effect */}
      <video
        id="camera"
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
      
      {/* Canvas must also be mirrored to align with the video */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]"
      />
      
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-200">
          <div className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          Live
        </div>
      </div>
    </div>
  );
};
