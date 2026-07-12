import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWebcam } from '../../hooks/useWebcam';
import { useVision } from '../../hooks/useVision';
import { captureAlignedFace } from '../../utils/faceCrop';
import { ART_STYLES } from '../../data/artStyles';
import api from '../../services/api';
import { GestureIndicator } from '../../components/GestureIndicator';
import '../../styles/studio.css';

type Phase = 'INIT' | 'NO_FACE' | 'FACE_ONLY' | 'READY' | 'GENERATING' | 'SHOWING';

export const GestureStudio = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [phase, setPhase] = useState<Phase>('INIT');
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [hologramSrc, setHologramSrc] = useState<string | null>(null);
  const [hologramPos, setHologramPos] = useState<{ x: number; y: number; w: number; h: number; rot: number } | null>(null);

  const { videoRef, startWebcam, stopWebcam } = useWebcam();
  const { isReady, hasFace, hasBothHands, faceResult, frameBox, currentGesture } = useVision(videoRef);

  const containerRef = useRef<HTMLDivElement>(null);

  const isGeneratingRef = useRef<boolean>(false);
  const hologramSrcRef = useRef<string | null>(null);

  // Refs to avoid stale closures in async callbacks
  const phaseRef = useRef<Phase>('INIT');
  const activeStyleIndexRef = useRef<number>(0);
  const faceResultRef = useRef<any>(null);
  const frameBoxRef = useRef<any>(null);
  const hasBothHandsRef = useRef<boolean>(false);

  // Keep refs in sync with state
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeStyleIndexRef.current = activeStyleIndex; }, [activeStyleIndex]);
  useEffect(() => { faceResultRef.current = faceResult; }, [faceResult]);
  useEffect(() => { frameBoxRef.current = frameBox; }, [frameBox]);
  useEffect(() => { hasBothHandsRef.current = hasBothHands; }, [hasBothHands]);
  useEffect(() => { hologramSrcRef.current = hologramSrc; }, [hologramSrc]);

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  // State machine — stable transitions
  useEffect(() => {
    if (!isReady) { setPhase('INIT'); return; }
    if (!hasFace) { setPhase('NO_FACE'); return; }
    if (!hasBothHands) {
      setPhase(prev => {
        if (prev === 'SHOWING' || prev === 'GENERATING') {
          // Schedule cleanup on next tick to avoid setState-in-setState cascade
          setTimeout(() => {
            setHologramSrc(null);
            setHologramPos(null);
          }, 0);
        }
        return 'FACE_ONLY';
      });
      return;
    }
    setPhase(prev => (prev !== 'SHOWING' && prev !== 'GENERATING') ? 'READY' : prev);
  }, [isReady, hasFace, hasBothHands]);

  // Core generation function — uses refs to avoid stale closures
  const triggerGeneration = useCallback(async () => {
    if (!hasBothHandsRef.current) return;
    if (isGeneratingRef.current) return;

    if (!videoRef.current) return;
    const currentFaceResult = faceResultRef.current;
    if (!currentFaceResult?.faceLandmarks?.[0]) return;

    const faceLandmarks = currentFaceResult.faceLandmarks[0];
    const croppedBase64 = captureAlignedFace(videoRef.current, faceLandmarks);
    if (!croppedBase64) return;

    // Set hologram position from frameBox
    const fb = frameBoxRef.current;
    if (fb && containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const centerX = (1 - (fb.minX + fb.maxX) / 2) * cw;
      const centerY = ((fb.minY + fb.maxY) / 2) * ch;
      const CARD_W_REC = 340, CARD_H_REC = 260;
      const CARD_W_MIN = 320, CARD_H_MIN = 240;
      // Use recommended size if container fits it (with 40px margin), else fall back to minimum
      const w = cw >= CARD_W_REC + 40 ? CARD_W_REC : CARD_W_MIN;
      const h = ch >= CARD_H_REC + 40 ? CARD_H_REC : CARD_H_MIN;
      const rot = (Math.random() * 8) - 4; // random +/- 4 degrees
      setHologramPos({ x: centerX - w / 2, y: centerY - h / 2, w, h, rot });
    }

    isGeneratingRef.current = true;
    if (phaseRef.current === 'READY') {
      setPhase('GENERATING');
    }

    const styleName = ART_STYLES[activeStyleIndexRef.current].name;
    const styleSeed = 4242 + activeStyleIndexRef.current * 1337;

    try {
      const response = await api.post('/api/generate/', {
        image: croppedBase64,
        style: styleName,
        model: "flux.2-klein-4b",
        init_image: hologramSrcRef.current || croppedBase64,
        strength: 0.35,
        seed: styleSeed,
        steps: 4
      });

      setHologramSrc(response.data.generated_image);
      setPhase('SHOWING');
    } catch (err: any) {
      console.error('AI Generation failed:', err?.response?.data || err.message);
      if (phaseRef.current === 'GENERATING') {
        setPhase('READY');
      }
    } finally {
      isGeneratingRef.current = false;
    }
  }, [videoRef]);

  // Handle gesture commands
  useEffect(() => {
    if (currentGesture === 'none') return;
    
    if (currentGesture === 'open_palm') {
      setActiveStyleIndex(prev => (prev + 1) % ART_STYLES.length);
    } else if (currentGesture === 'closed_fist') {
      setActiveStyleIndex(prev => (prev - 1 + ART_STYLES.length) % ART_STYLES.length);
    } else if (currentGesture === 'pointing_up') {
      // Just a fun trigger, interval generation handles actual generation
    } else if (currentGesture === 'pinch') {
      // Future feature: Download
      if (hologramSrc) {
        const a = document.createElement('a');
        a.href = hologramSrc;
        a.download = `neuralos_${ART_STYLES[activeStyleIndex].id}.png`;
        a.click();
      }
    }
  }, [currentGesture, hologramSrc, activeStyleIndex]);

  // Continuous generation loop (approx. 3 fps)
  useEffect(() => {
    const interval = setInterval(() => {
      triggerGeneration();
    }, 350);
    return () => clearInterval(interval);
  }, [triggerGeneration]);

  const getFrameGuide = () => {
    if (!frameBox || !containerRef.current || !hasBothHands) return null;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const x = (1 - frameBox.maxX) * cw;
    const y = frameBox.minY * ch;
    const w = (frameBox.maxX - frameBox.minX) * cw;
    const h = (frameBox.maxY - frameBox.minY) * ch;
    const pad = 0.15;
    const isActive = phase === 'READY' || phase === 'SHOWING' || phase === 'GENERATING';
    const col = isActive ? '#22c55e' : ART_STYLES[activeStyleIndex].color;

    return (
      <div className="absolute pointer-events-none z-20 rounded-xl transition-all duration-150"
        style={{
          left: x - w * pad, top: y - h * pad,
          width: w * (1 + pad * 2), height: h * (1 + pad * 2),
          border: `2px solid ${col}`,
          boxShadow: `0 0 24px ${col}60, inset 0 0 16px ${col}15`,
        }}>
        {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
          <div key={c} className="absolute w-5 h-5" style={{
            top: c.startsWith('t') ? -2 : undefined,
            bottom: c.startsWith('b') ? -2 : undefined,
            left: c.endsWith('l') ? -2 : undefined,
            right: c.endsWith('r') ? -2 : undefined,
            borderTop: c.startsWith('t') ? `3px solid ${col}` : undefined,
            borderBottom: c.startsWith('b') ? `3px solid ${col}` : undefined,
            borderLeft: c.endsWith('l') ? `3px solid ${col}` : undefined,
            borderRight: c.endsWith('r') ? `3px solid ${col}` : undefined,
          }} />
        ))}
        {phase === 'READY' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">
              ✨ Initializing Style...
            </span>
          </div>
        )}
      </div>
    );
  };

  const getStatus = () => {
    const style = ART_STYLES[activeStyleIndex];
    switch (phase) {
      case 'INIT': return { text: 'Initializing AI...', color: 'text-gray-400', spin: true };
      case 'NO_FACE': return { text: 'Looking for face...', color: 'text-blue-400', spin: true };
      case 'FACE_ONLY': return { text: '🤙 Raise hands to frame your face', color: 'text-blue-400', spin: false };
      case 'READY': return { text: `✨ Applying ${style.emoji} ${style.name}...`, color: 'text-green-400', spin: true };
      case 'GENERATING': return { text: `⚡ FLUX Generating ${style.name}...`, color: 'text-yellow-400', spin: true };
      case 'SHOWING': return { text: `✨ ${style.emoji} ${style.name} — Pick a style below`, color: 'text-purple-300', spin: false };
    }
  };

  const status = getStatus();
  const activeStyle = ART_STYLES[activeStyleIndex];

  return (
    <div className="min-h-screen bg-black overflow-hidden relative select-none flex items-center justify-center p-8 pb-32 pt-24">
      {/* Top navigation bar */}
      <header className="absolute top-0 left-0 right-0 z-40 px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition bg-white/10 backdrop-blur px-3 py-2 rounded-xl border border-white/10">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

        <div className={`flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/15 ${status.color}`}>
          {status.spin && <Loader2 className="w-4 h-4 animate-spin" />}
          {!status.spin && phase === 'READY' && <Sparkles className="w-4 h-4" />}
          <span className="text-sm font-semibold">{status.text}</span>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-widest">Style</div>
          <div className="text-sm font-bold" style={{ color: activeStyle.color }}>
            {activeStyle.emoji} {activeStyle.name}
          </div>
        </div>
      </header>

      {/* Boxed Camera Container */}
      <div ref={containerRef} className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-gray-900">
        {/* Camera feed */}
        <video ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Frame guide with corner brackets */}
        {getFrameGuide()}

        {/* Gesture Indicator */}
        <GestureIndicator gesture={currentGesture} />

        {/* Hologram panel */}
        {hologramPos && (phase === 'SHOWING' || phase === 'GENERATING') && (
          <div className="absolute z-30 pointer-events-none transition-all duration-300"
            style={{ 
              left: hologramPos.x, top: hologramPos.y, 
              width: hologramPos.w, height: hologramPos.h,
              transform: `rotate(${hologramPos.rot}deg)`
            }}>
            <div className="absolute inset-0 overflow-hidden bg-black/60 card-pulse"
              style={{
                border: '22px solid white',
                boxShadow: `6px 10px 15px rgba(0,0,0,0.4), 0 0 40px ${activeStyle.color}60`,
              }}>
              {/* Generating state */}
              {phase === 'GENERATING' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                  <p className="text-white text-sm font-bold tracking-widest uppercase"
                    style={{ textShadow: `0 0 12px ${activeStyle.color}` }}>
                    AI Rendering...
                  </p>
                </div>
              )}

              {/* Generated image */}
              {phase === 'SHOWING' && hologramSrc && (
                <img src={hologramSrc} alt="AI Generated"
                  className="w-full h-full object-cover" />
              )}

              {/* Scanline overlay */}
              <div className="absolute inset-0 scanlines pointer-events-none" />
              {/* Top sheen */}
              <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)',
              }} />
              {/* Style badge */}
              <div className="absolute bottom-2 right-3 text-xs font-bold opacity-80"
                style={{ color: activeStyle.color, textShadow: `0 0 10px ${activeStyle.color}` }}>
                {activeStyle.emoji} {activeStyle.name}
              </div>
            </div>
          </div>
        )}

        {/* Instruction overlay */}
        {phase === 'FACE_ONLY' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-6xl mb-4">🤙</div>
              <p className="text-white text-xl font-bold">Frame your face with both hands</p>
              <p className="text-gray-400 text-sm mt-2">Make L-shapes — index finger up, thumb pointing out</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom art style carousel */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-5"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)' }}>
        <div className="text-center text-xs text-gray-500 uppercase tracking-widest mb-3">
          Select Art Style
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {ART_STYLES.map((style, idx) => (
            <button key={style.id}
              onClick={() => {
                setActiveStyleIndex(idx);
                if (phase === 'SHOWING') setPhase('READY');
              }}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-300 ${idx === activeStyleIndex ? 'style-btn-active' : ''}`}>
              <div className="w-13 h-13 rounded-xl flex items-center justify-center text-2xl border-2 transition-all duration-300"
                style={{
                  width: 52, height: 52,
                  background: `linear-gradient(135deg, ${style.color}35, ${style.color}15)`,
                  borderColor: idx === activeStyleIndex ? style.color : 'rgba(255,255,255,0.12)',
                  boxShadow: idx === activeStyleIndex ? `0 0 20px ${style.color}90` : 'none',
                  transform: idx === activeStyleIndex ? 'scale(1.22)' : 'scale(1)',
                }}>
                {style.emoji}
              </div>
              <span className="text-xs whitespace-nowrap"
                style={{ color: idx === activeStyleIndex ? style.color : 'rgba(255,255,255,0.4)' }}>
                {style.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
