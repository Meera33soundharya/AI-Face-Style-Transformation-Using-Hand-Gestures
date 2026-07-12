import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ArtStyle } from '../data/artStyles';

interface StyleCarouselProps {
  styles: ArtStyle[];
  activeStyleIndex: number;
  onSelect?: (index: number) => void;
}

export const StyleCarousel: React.FC<StyleCarouselProps> = ({ styles, activeStyleIndex, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center the active style
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[activeStyleIndex] as HTMLElement;
      if (activeElement) {
        const scrollPosition = activeElement.offsetLeft - (scrollRef.current.offsetWidth / 2) + (activeElement.offsetWidth / 2);
        scrollRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [activeStyleIndex]);

  return (
    <div className="w-full relative mt-6">
      {/* Edge gradients for fading effect */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-scroll py-8 px-1/2-screen scroll-smooth snap-x snap-mandatory"
        style={{ paddingLeft: '50%', paddingRight: '50%' }}
      >
        {styles.map((style, index) => {
          const isActive = index === activeStyleIndex;
          
          return (
            <motion.div
              key={style.id}
              initial={false}
              onClick={() => onSelect && onSelect(index)}
              animate={{ 
                scale: isActive ? 1.15 : 0.9,
                opacity: isActive ? 1 : 0.5,
                y: isActive ? -10 : 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`flex-shrink-0 w-48 rounded-2xl p-4 snap-center cursor-pointer transition-colors border-2 ${
                isActive 
                  ? `bg-gray-800 border-transparent shadow-[0_0_30px_rgba(255,255,255,0.1)]` 
                  : 'bg-black/40 border-white/5'
              }`}
            >
              <div className={`w-full h-24 rounded-xl mb-4 flex items-center justify-center text-4xl bg-gradient-to-br ${style.gradient} ${isActive ? 'shadow-lg' : ''}`}>
                {style.emoji}
              </div>
              <h3 className={`font-bold text-center ${isActive ? 'text-white text-lg' : 'text-gray-400 text-base'}`}>
                {style.name}
              </h3>
              {isActive && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-center text-gray-400 mt-2 line-clamp-2"
                >
                  {style.description}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Center indicator arrow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white/50">
        <motion.div 
          animate={{ y: [0, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ▲
        </motion.div>
      </div>
    </div>
  );
};
