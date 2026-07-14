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
import { EyeTracker } from '../../components/EyeTracker';
import '../../styles/studio.css';

type Phase = 'INIT' | 'NO_FACE' | 'FACE_ONLY' | 'READY' | 'GENERATING' | 'SHOWING';

export const GestureStudio = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [phase, setPhase] = useState<Phase>('INIT');
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [hologramSrc, setHologramSrc] = useState<string | null>(null);
  const [hologramPos, setHologramPos] = useState<{ x: number; y: number; w: number; h: number; rot: number } | null>(null);

  const { videoRef, startWebcam, stopWebcam } = useWebcam();
  const { isReady, hasFace, hasBothHands, isBlinking, faceResult, frameBox, currentGesture } = useVision(videoRef);

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
  const triggerGeneration = useCallback(async (styleIndex = activeStyleIndexRef.current) => {
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
      const w = cw >= CARD_W_REC + 40 ? CARD_W_REC : CARD_W_MIN;
      const h = ch >= CARD_H_REC + 40 ? CARD_H_REC : CARD_H_MIN;
      const rot = (Math.random() * 8) - 4;
      setHologramPos({ x: centerX - w / 2, y: centerY - h / 2, w, h, rot });
    }

    isGeneratingRef.current = true;
    if (phaseRef.current === 'READY') {
      setPhase('GENERATING');
    }

    const styleName = ART_STYLES[styleIndex].name;
    const styleSeed = 4242 + styleIndex * 1337;

    try {
      const response = await api.post('/api/generate/', {
        image: croppedBase64,
        style: styleName,
        model: "flux.2-klein-4b",
        init_image: croppedBase64,
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
      setPhase('READY');
    } else if (currentGesture === 'closed_fist') {
      setActiveStyleIndex(prev => (prev - 1 + ART_STYLES.length) % ART_STYLES.length);
      setPhase('READY');
    } else if (currentGesture === 'pointing_up') {
      triggerGeneration(activeStyleIndexRef.current);
    } else if (currentGesture === 'pinch') {
      if (hologramSrc) {
        const a = document.createElement('a');
        a.href = hologramSrc;
        a.download = `neuralos_${ART_STYLES[activeStyleIndex].id}.png`;
        a.click();
      }
    }
  }, [currentGesture, hologramSrc, triggerGeneration, activeStyleIndex]);

  useEffect(() => {
    if (!isBlinking || !hasBothHands || phase === 'INIT' || phase === 'NO_FACE') return;

    setBlinkCount((prev) => prev + 1);
    const nextIndex = (activeStyleIndexRef.current + 1) % ART_STYLES.length;
    setActiveStyleIndex(nextIndex);
    setPhase('READY');
    triggerGeneration(nextIndex);
  }, [isBlinking, hasBothHands, phase, triggerGeneration]);

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
      case 'READY': return { text: `✨ ${hasBothHands ? 'Ready' : 'Waiting for hands'} — Blink now to switch style`, color: 'text-green-400', spin: false };
      case 'GENERATING': return { text: `⚡ FLUX Generating ${style.name}...`, color: 'text-yellow-400', spin: true };
      case 'SHOWING': return { text: `✨ ${style.emoji} ${style.name} — Pick a style below`, color: 'text-purple-300', spin: false };
    }
  };

  const status = getStatus();
  const activeStyle = ART_STYLES[activeStyleIndex];

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">VisionAI</div>
            <div className="text-sm text-slate-400 mt-1">Gesture-powered art generation with MediaPipe + FLUX.2</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <button className="hover:text-white transition">Home</button>
            <button className="hover:text-white transition">Demo</button>
            <button className="hover:text-white transition">Features</button>
            <button className="hover:text-white transition">About</button>
            <button className="hover:text-white transition">Contact</button>
            <button className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20">
              Launch AI
            </button>
          </div>
        </nav>

        <div className="grid gap-10 xl:grid-cols-[0.95fr_0.9fr] items-start py-8">
          <div className="space-y-8">
            <div className="max-w-2xl space-y-6">
              <div className="text-sm uppercase tracking-[0.35em] text-pink-300">VisionAI</div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                Transform Your Face Into<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">16 Amazing AI Art Styles</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-xl">
                Experience gesture-controlled AI image generation using MediaPipe and FLUX.2.
                Blink to switch style, use gestures to interact, and watch your portrait transform live.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={startWebcam}
                  className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400 transition"
                >
                  Start Camera
                </button>
                <button className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition">
                  View Demo
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-3">Gesture Detected</div>
                <div className="text-3xl font-bold text-white">{currentGesture === 'none' ? 'Waiting...' : currentGesture.replace('_', ' ')}</div>
                <p className="mt-3 text-sm text-slate-400">Raise both hands to frame your face. Blink to change your art style instantly.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-3">Current Style</div>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl shadow-lg shadow-violet-500/20">
                    {activeStyle.emoji}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{activeStyle.name}</div>
                    <div className="text-sm text-slate-400">{activeStyle.description}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/85 shadow-2xl shadow-black/20 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Live Camera Preview</div>
                  <div className="text-sm text-slate-300">AI Illustration</div>
                </div>
                <button
                  onClick={startWebcam}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition"
                >
                  Start Camera
                </button>
              </div>
              <div className="relative aspect-[16/9] bg-black">
                <video ref={videoRef} autoPlay playsInline muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <EyeTracker isBlinking={isBlinking} showDebug />
                {getFrameGuide()}
                <GestureIndicator gesture={currentGesture} />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-black/70 px-4 py-2 text-xs text-slate-200">
                  {status.text}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-black/20">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-3">Status</div>
                <div className="text-sm text-slate-200 mb-3">{phase === 'INIT' ? 'Initializing models...' : phase === 'NO_FACE' ? 'Looking for face...' : phase === 'FACE_ONLY' ? 'Frame your face with your hands' : phase === 'READY' ? 'Ready to generate' : phase === 'GENERATING' ? 'Generating art...' : 'Showing result'}</div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Face detected: {hasFace ? 'Yes' : 'No'}</div>
                  <div>Hands detected: {hasBothHands ? 'Yes' : 'No'}</div>
                  <div>Style switches by blink: <span className="font-semibold text-white">{blinkCount}</span></div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-black/20">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-3">Instructions</div>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li>• Blink to change the art style</li>
                  <li>• Use both hands to frame and enable generation</li>
                  <li>• Point up to generate on demand</li>
                  <li>• Pinch to download the latest image</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
          <div className="text-center text-xs uppercase tracking-[0.28em] text-slate-400 mb-4">Select Art Style</div>
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
    </div>
  );
};
