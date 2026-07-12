import React from 'react';

// The EyeTracker component is primarily a logical node in the system design.
// Since actual blink detection logic is orchestrated centrally in useVision for performance,
// this component serves as a visual indicator of blink state if needed.

interface EyeTrackerProps {
  isBlinking: boolean;
  showDebug?: boolean;
}

export const EyeTracker: React.FC<EyeTrackerProps> = ({ isBlinking, showDebug = false }) => {
  if (!showDebug || !isBlinking) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 7 }}>
      <div className="bg-green-500/50 text-white font-bold px-4 py-2 rounded-full backdrop-blur">
        BLINK DETECTED
      </div>
    </div>
  );
};
