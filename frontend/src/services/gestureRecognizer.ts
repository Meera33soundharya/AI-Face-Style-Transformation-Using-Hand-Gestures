import type { Landmark } from '@mediapipe/tasks-vision';

export type GestureType = 'open_palm' | 'closed_fist' | 'pointing_up' | 'pinch' | 'none';

/**
 * Recognizes basic gestures from 21 hand landmarks using precise PIP joint heuristics.
 * Landmarks reference:
 * 0: Wrist, 4: Thumb tip, 8: Index tip, 12: Middle tip, 16: Ring tip, 20: Pinky tip
 * PIP Joints (or equivalent second joint): Thumb(3), Index(6), Middle(10), Ring(14), Pinky(18)
 */
export const recognizeGesture = (landmarks: Landmark[]): GestureType => {
  if (!landmarks || landmarks.length !== 21) return 'none';

  // Distance between thumb tip (4) and index tip (8) for pinch detection
  const pinchDistance = Math.hypot(
    landmarks[4].x - landmarks[8].x,
    landmarks[4].y - landmarks[8].y
  );

  // 1. Pinch Select
  if (pinchDistance < 0.04) {
    return 'pinch';
  }

  // 2. Open Palm (all 4 fingertip y-coordinates above their respective PIP joint y-coordinates)
  // In MediaPipe, y=0 is top, y=1 is bottom. So "above" means tip.y < pip.y
  const isIndexOpen = landmarks[8].y < landmarks[6].y;
  const isMiddleOpen = landmarks[12].y < landmarks[10].y;
  const isRingOpen = landmarks[16].y < landmarks[14].y;
  const isPinkyOpen = landmarks[20].y < landmarks[18].y;

  if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
    return 'open_palm';
  }

  // 3. Closed Fist (all 4 fingertip y-coordinates below their respective PIP joint y-coordinates)
  // So tip.y > pip.y
  const isIndexClosed = landmarks[8].y > landmarks[6].y;
  const isMiddleClosed = landmarks[12].y > landmarks[10].y;
  const isRingClosed = landmarks[16].y > landmarks[14].y;
  const isPinkyClosed = landmarks[20].y > landmarks[18].y;

  if (isIndexClosed && isMiddleClosed && isRingClosed && isPinkyClosed) {
    return 'closed_fist';
  }

  // 4. Pointing Up (index open, others closed)
  if (isIndexOpen && isMiddleClosed && isRingClosed && isPinkyClosed) {
    return 'pointing_up';
  }

  return 'none';
};
