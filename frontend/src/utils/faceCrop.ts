import type { Landmark } from '@mediapipe/tasks-vision';

/**
 * Extracts and aligns the face region using MediaPipe Face Mesh landmarks.
 * - Bounding region uses the 36 face oval landmarks.
 * - Aligns the crop based on the inter-eye axis (rotation normalization).
 * - Pads the bounding box by 1.15x.
 * - Returns a base64 Data URL of the cropped face, with feathered mask edges (8-12px) for seamless blending.
 */
export const captureAlignedFace = (
  video: HTMLVideoElement,
  faceLandmarks: Landmark[],
): string | null => {
  if (!faceLandmarks || faceLandmarks.length < 468) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // 1. Calculate Bounding Box from Face Oval
  const ovalIndices = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 
    162, 21, 54, 103, 67, 109
  ];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const idx of ovalIndices) {
    const pt = faceLandmarks[idx];
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  // Convert normalized coordinates to pixel coordinates
  const cx = ((minX + maxX) / 2) * vw;
  const cy = ((minY + maxY) / 2) * vh;
  let w = (maxX - minX) * vw;
  let h = (maxY - minY) * vh;

  // Apply 1.15x padding
  w *= 1.15;
  h *= 1.15;
  const size = Math.max(w, h); // Keep it square for FLUX.2 optimization (512x512 later)

  // 2. Compute Inter-Eye Axis for Rotation Normalization
  const leftEyeIndices = [33, 133, 159, 145];
  const rightEyeIndices = [362, 263, 386, 374];

  const getCenter = (indices: number[]) => {
    let sumX = 0, sumY = 0;
    for (const idx of indices) {
      sumX += faceLandmarks[idx].x * vw;
      sumY += faceLandmarks[idx].y * vh;
    }
    return { x: sumX / indices.length, y: sumY / indices.length };
  };

  const leftEye = getCenter(leftEyeIndices);
  const rightEye = getCenter(rightEyeIndices);

  // Angle between eyes (in radians)
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const angle = Math.atan2(dy, dx); 
  // We want to rotate the canvas by -angle to make the eyes perfectly horizontal

  // 3. Create Canvas and draw rotated/aligned crop
  const canvas = document.createElement('canvas');
  // FLUX.2 optimized fast crop size
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Set up transform to extract the rotated crop
  ctx.translate(canvas.width / 2, canvas.height / 2);
  // Mirror X to match display
  ctx.scale(-1, 1);
  // Rotate to neutralize head tilt
  ctx.rotate(-angle);
  
  // Draw the video frame shifted so the face center is at the origin
  const scale = canvas.width / size;
  ctx.scale(scale, scale);
  ctx.drawImage(video, -cx, -cy, vw, vh);
  
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

  // 4. Feather mask edges (8-12px) for seamless blend
  ctx.globalCompositeOperation = 'destination-in';
  
  // Create a radial gradient for feathering
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, (canvas.width / 2) - 12, // Inner solid region
    canvas.width / 2, canvas.height / 2, canvas.width / 2         // Outer transparent edge
  );
  gradient.addColorStop(0, 'rgba(0,0,0,1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.globalCompositeOperation = 'source-over';

  return canvas.toDataURL('image/png');
};
