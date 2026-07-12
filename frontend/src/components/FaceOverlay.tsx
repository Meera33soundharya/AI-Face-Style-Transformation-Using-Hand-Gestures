import React from 'react';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface FaceOverlayProps {
  imageSrc: string;
  faceResult: FaceLandmarkerResult;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({ imageSrc, faceResult, videoRef }) => {
  if (!faceResult || faceResult.faceLandmarks.length === 0 || !videoRef.current) return null;

  const landmarks = faceResult.faceLandmarks[0];
  const video = videoRef.current;

  // Calculate bounding box
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  landmarks.forEach((p: any) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  // Calculate face center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;

  // Use the transformation matrix to get rotation if available,
  // or calculate basic rotation from eye landmarks
  let rotationZ = 0;
  if (faceResult.facialTransformationMatrixes && faceResult.facialTransformationMatrixes.length > 0) {
    const matrix = faceResult.facialTransformationMatrixes[0].data;
    rotationZ = Math.atan2(matrix[1], matrix[5]);
  } else {
    // Fallback: estimate from eyes (indices 33 and 263 are approx outer eye corners)
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    if (leftEye && rightEye) {
      const dx = rightEye.x - leftEye.x;
      const dy = rightEye.y - leftEye.y;
      rotationZ = Math.atan2(dy, dx);
    }
  }

  const parentWidth = video.clientWidth;
  const parentHeight = video.clientHeight;

  // Invert X because of scale-x-[-1] on the video
  const invertedCenterX = 1 - centerX;
  
  const pxX = invertedCenterX * parentWidth;
  const pxY = centerY * parentHeight;
  
  // Use the larger dimension for the square box to match our crop logic
  const maxDim = Math.max(width, height);
  const padding = 1.5; // Match the 1.5 used in GestureStudio
  
  const pxSize = maxDim * parentWidth * padding;
  
  return (
    <div 
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      <img 
        src={imageSrc} 
        alt="AI Generated Face"
        className="absolute"
        style={{
          width: `${pxSize}px`,
          height: `${pxSize}px`, 
          // Center the image exactly on the face center
          left: `${pxX}px`,
          top: `${pxY}px`,
          // Apply negative rotationZ because we inverted X (mirrored)
          transform: `translate(-50%, -50%) rotate(${-rotationZ}rad)`,
          transformOrigin: 'center center',
          filter: 'drop-shadow(0px 10px 30px rgba(0,0,0,0.5))'
        }}
      />
    </div>
  );
};
