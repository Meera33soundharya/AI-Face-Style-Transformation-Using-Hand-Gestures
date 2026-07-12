import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GestureType } from '../services/gestureRecognizer';

interface GestureIndicatorProps {
  gesture: GestureType;
}

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({ gesture }) => {
  if (gesture === 'none') return null;

  const getGestureInfo = (g: GestureType) => {
    switch (g) {
      case 'open_palm':
        return { icon: '✋', label: 'Open Palm', action: 'Next Style' };
      case 'closed_fist':
        return { icon: '✊', label: 'Closed Fist', action: 'Prev Style' };
      case 'pointing_up':
        return { icon: '☝️', label: 'Point', action: 'Generate' };
      case 'pinch':
        return { icon: '🤏', label: 'Pinch', action: 'Download' };
      default:
        return null;
    }
  };

  const info = getGestureInfo(gesture);
  if (!info) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute top-6 right-6 z-50 flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-3 pr-6 rounded-full shadow-2xl shadow-pink-500/20"
      >
        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 rounded-full text-2xl shadow-inner">
          {info.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{info.action}</span>
          <span className="text-sm font-bold text-white">{info.label} detected</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
