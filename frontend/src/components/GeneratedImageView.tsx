import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles } from 'lucide-react';

interface GeneratedImageViewProps {
  imageSrc: string | null;
  styleName: string;
  onDownload: () => void;
  isDownloading?: boolean;
}

export const GeneratedImageView: React.FC<GeneratedImageViewProps> = ({ 
  imageSrc, 
  styleName,
  onDownload,
  isDownloading = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Trigger tooltip when download gesture happens
  React.useEffect(() => {
    if (isDownloading) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isDownloading]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl flex items-center justify-center">
      <AnimatePresence mode="wait">
        {imageSrc ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-full group"
          >
            {imageSrc.endsWith('.mp4') ? (
              <video 
                id="result"
                src={imageSrc} 
                autoPlay 
                loop 
                controls
                muted 
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={imageSrc} 
                alt={`Generated in ${styleName} style`} 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Style Badge */}
            <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium text-white">{styleName}</span>
            </div>

            {/* Download Hint / Button */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg text-sm font-medium backdrop-blur-md"
                  >
                    Image Saved!
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={onDownload}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-white group-hover:bg-pink-600 group-hover:border-pink-500"
                title="Pinch to Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
            
            {/* Download Gesture Hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none backdrop-blur-sm">
              <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <span className="text-4xl block mb-2">🤏</span>
                <span className="text-white font-bold tracking-wide">Pinch to Download</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center p-8"
          >
            <div className="w-24 h-24 mb-6 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 shadow-inner">
              <Sparkles className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Awaiting Transformation</h3>
            <p className="text-gray-400 max-w-sm">
              Select a style and point your finger <span className="inline-block mx-1">☝️</span> at the camera to generate your AI portrait.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
