import React from 'react';
import { Download, Share2, Film } from 'lucide-react';

interface GeneratedVideoViewProps {
  videoUrl: string;
  isGenerating: boolean;
}

const GeneratedVideoView: React.FC<GeneratedVideoViewProps> = ({ videoUrl, isGenerating }) => {
  if (isGenerating) {
    return (
      <div className="w-full aspect-[9/16] max-h-[70vh] bg-gray-900 rounded-xl overflow-hidden flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 overflow-hidden">
          {/* Cinematic loading particles / light rays simulation */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent animate-pulse"></div>
          <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]"></div>
        </div>
        
        <Film className="text-blue-500 w-16 h-16 animate-bounce mb-4 z-10" />
        <p className="text-white font-medium text-lg z-10">Directing AI Scene...</p>
        <p className="text-gray-400 text-sm mt-2 z-10 max-w-xs text-center">
          Applying cinematic lighting, dolly-in, and 4K ultra-realistic textures. This takes a moment.
        </p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full aspect-[9/16] max-h-[70vh] bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center shadow-inner">
        <div className="text-center p-6">
          <Film className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Video output will appear here</p>
          <p className="text-gray-600 text-sm mt-1">Make the 'Peace' gesture to generate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800">
      <div className="relative aspect-[9/16] max-h-[70vh] w-full bg-black flex justify-center items-center">
        <video 
          src={videoUrl} 
          className="max-w-full max-h-full object-contain"
          controls 
          autoPlay 
          loop 
          playsInline
        />
      </div>
      
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <div>
          <h3 className="text-white font-medium">Cinematic Portrait</h3>
          <p className="text-gray-400 text-sm">24 FPS • 4K Style</p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-white"
            title="Share Video"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <a 
            href={videoUrl}
            download="cinematic_ai_portrait.mp4"
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors text-white"
            title="Download Video"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GeneratedVideoView;
