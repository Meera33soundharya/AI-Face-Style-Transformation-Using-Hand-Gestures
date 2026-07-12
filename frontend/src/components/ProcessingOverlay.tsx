import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  styleName: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ isProcessing, styleName }) => {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl"
        >
          <div className="relative">
            {/* Outer rotating dashed ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="w-48 h-48 rounded-full border-4 border-dashed border-pink-500/30 absolute -inset-4"
            />
            {/* Inner rotating solid ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="w-40 h-40 rounded-full border-4 border-transparent border-t-purple-500 border-l-pink-500"
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-2">✨</span>
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                AI Magic
              </span>
            </div>
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Applying {styleName} Style</h2>
            <p className="text-gray-400">Processing with FLUX.2... please wait.</p>
            <div className="mt-4 flex gap-1 justify-center">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 rounded-full bg-pink-500" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 rounded-full bg-purple-500" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
