export interface ArtStyle {
  id: string;
  name: string;
  emoji: string;
  color: string;
  gradient: string;
  description: string;
  cssFilter: string;
}

export const ART_STYLES: ArtStyle[] = [
  { 
    id: 'oil_painting', name: 'Oil Painting', emoji: '🖼️', color: '#b45309', 
    gradient: 'from-amber-700 to-yellow-900', description: 'Dark Renaissance portrait with rich shadows',
    cssFilter: 'sepia(90%) contrast(200%) brightness(45%) saturate(300%)'
  },
  { 
    id: 'pencil_sketch', name: 'Pencil Sketch', emoji: '✏️', color: '#94a3b8', 
    gradient: 'from-slate-400 to-gray-600', description: 'Detailed graphite hatching and cross-hatching',
    cssFilter: 'grayscale(100%) contrast(600%) brightness(200%)'
  },
  { 
    id: 'watercolor', name: 'Watercolor', emoji: '💧', color: '#38bdf8', 
    gradient: 'from-sky-400 to-cyan-400', description: 'Soft pastel watercolor washes',
    cssFilter: 'saturate(60%) brightness(155%) contrast(55%) blur(1.5px) hue-rotate(195deg)'
  },
  { 
    id: 'comic_book', name: 'Comic Book', emoji: '🦸', color: '#f8fafc', 
    gradient: 'from-slate-100 to-gray-200', description: 'Bold ink outlines, graphic novel style',
    cssFilter: 'grayscale(100%) contrast(900%) brightness(140%)'
  },
  { 
    id: 'anime', name: 'Anime', emoji: '✨', color: '#ec4899', 
    gradient: 'from-pink-500 to-rose-500', description: 'Vibrant Studio Ghibli style animation',
    cssFilter: 'saturate(250%) brightness(120%) contrast(85%) hue-rotate(330deg)'
  },
  { 
    id: 'neon', name: 'Neon', emoji: '🌟', color: '#a855f7', 
    gradient: 'from-purple-500 to-fuchsia-600', description: 'Cyberpunk glowing synthwave lights',
    cssFilter: 'saturate(400%) brightness(70%) contrast(250%) hue-rotate(270deg)'
  },
  { 
    id: 'van_gogh', name: 'Van Gogh', emoji: '🌌', color: '#3b82f6', 
    gradient: 'from-blue-600 to-indigo-600', description: 'Starry Night post-impressionist swirls',
    cssFilter: 'saturate(220%) hue-rotate(195deg) contrast(160%) brightness(90%) blur(0.5px)'
  },
  { 
    id: 'pop_art', name: 'Pop Art', emoji: '💥', color: '#ef4444', 
    gradient: 'from-red-500 to-orange-500', description: 'Andy Warhol bold halftone dots',
    cssFilter: 'saturate(500%) contrast(300%) brightness(120%)'
  },
  { 
    id: 'cyberpunk', name: 'Cyberpunk', emoji: '🦾', color: '#06b6d4', 
    gradient: 'from-cyan-500 to-blue-500', description: 'Futuristic sci-fi glowing tech',
    cssFilter: 'saturate(300%) contrast(200%) brightness(60%) hue-rotate(165deg)'
  },
  { 
    id: 'graffiti', name: 'Graffiti', emoji: '🎨', color: '#10b981', 
    gradient: 'from-emerald-400 to-teal-500', description: 'Urban spray paint street art',
    cssFilter: 'saturate(350%) contrast(220%) brightness(85%) hue-rotate(110deg)'
  },
  { 
    id: 'pixel_art', name: 'Pixel Art', emoji: '👾', color: '#84cc16', 
    gradient: 'from-lime-400 to-green-500', description: 'Retro 16-bit arcade portrait',
    cssFilter: 'saturate(300%) contrast(250%) brightness(115%) hue-rotate(90deg)'
  },
  { 
    id: 'fantasy', name: 'Fantasy', emoji: '🔮', color: '#d946ef', 
    gradient: 'from-fuchsia-500 to-pink-600', description: 'Epic magical glowing concept art',
    cssFilter: 'saturate(300%) contrast(140%) brightness(135%) hue-rotate(285deg)'
  },
  { 
    id: '3d_cartoon', name: '3D Cartoon', emoji: '🧸', color: '#f59e0b', 
    gradient: 'from-amber-400 to-yellow-500', description: 'Pixar-style 3D animated character',
    cssFilter: 'saturate(200%) brightness(130%) contrast(90%)'
  },
  { 
    id: 'clay_art', name: 'Clay Art', emoji: '🏺', color: '#fb923c', 
    gradient: 'from-orange-400 to-amber-500', description: 'Claymation stop-motion sculpted look',
    cssFilter: 'saturate(150%) brightness(110%) contrast(120%) sepia(30%)'
  },
  { 
    id: 'digital_painting', name: 'Digital Painting', emoji: '🖌️', color: '#818cf8', 
    gradient: 'from-indigo-400 to-violet-500', description: 'ArtStation masterpiece concept art',
    cssFilter: 'saturate(180%) contrast(130%) brightness(105%)'
  },
  { 
    id: 'low_poly', name: 'Low Poly Art', emoji: '🔷', color: '#2dd4bf', 
    gradient: 'from-teal-400 to-emerald-400', description: 'Modern minimalist geometric polygons',
    cssFilter: 'saturate(200%) contrast(180%) brightness(120%)'
  }
];
