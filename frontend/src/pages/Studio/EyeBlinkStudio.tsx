import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, Sparkles, Download } from 'lucide-react';
import { useWebcam } from '../../hooks/useWebcam';
import { useEyeBlink } from '../../hooks/useEyeBlink';
import { captureAlignedFace } from '../../utils/faceCrop';
import { ART_STYLES } from '../../data/artStyles';
import api from '../../services/api';
import '../../styles/studio.css';

type Phase = 'INIT' | 'NO_FACE' | 'READY' | 'GENERATING' | 'SHOWING';

export const EyeBlinkStudio = () => {
  const [phase, setPhase] = useState<Phase>('INIT');
  const [styleIndex, setStyleIndex] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  const { videoRef, startWebcam, stopWebcam } = useWebcam();
  const { isReady, hasFace, isBlinking, faceResultRef } = useEyeBlink(videoRef);

  // Use refs for values read inside async callbacks to avoid stale closures
  const isGeneratingRef = useRef(false);
  const styleIndexRef   = useRef(0);
  const phaseRef        = useRef<Phase>('INIT');

  // Per-style image cache: Map<styleIndex, base64DataUrl>
  const imageCacheRef = useRef<Map<number, string>>(new Map());

  useEffect(() => { styleIndexRef.current = styleIndex; }, [styleIndex]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  // Phase transitions based on detection state
  useEffect(() => {
    if (!isReady) { setPhase('INIT'); return; }
    if (!hasFace) {
      if (phaseRef.current !== 'GENERATING') setPhase('NO_FACE');
      return;
    }
    if (phaseRef.current === 'INIT' || phaseRef.current === 'NO_FACE') {
      setPhase('READY');
    }
  }, [isReady, hasFace]);

  /**
   * Core generation function.
   * - Reads faceResultRef synchronously (no stale closure)
   * - Checks cache first; skips API call if already generated for this style
   * - Sends image + identity-preserving style prompt to FLUX.2
   * - Replaces the displayed image with the new result
   */
  const generateImage = useCallback(async (idx: number) => {
    if (isGeneratingRef.current) return;

    // Serve from cache if available
    const cached = imageCacheRef.current.get(idx);
    if (cached) {
      setGeneratedImage(cached);
      setStyleIndex(idx);
      setFadeIn(false);
      setPhase('SHOWING');
      setTimeout(() => setFadeIn(true), 50);
      return;
    }

    const video = videoRef.current;
    const result = faceResultRef.current;          // always fresh — no stale closure
    if (!video || !result?.faceLandmarks?.[0]) return;

    const cropped = captureAlignedFace(video, result.faceLandmarks[0]);
    if (!cropped) return;

    isGeneratingRef.current = true;
    setStyleIndex(idx);
    setPhase('GENERATING');
    setFadeIn(false);

    try {
      const { data } = await api.post('/api/generate/', {
        image: cropped,
        style: ART_STYLES[idx].name,
        model: 'flux.2-klein-4b',
        init_image: cropped,
        strength: 0.35,
        seed: 4242 + idx * 1337,
        steps: 4,
      });

      const imgSrc: string = data.generated_image;
      imageCacheRef.current.set(idx, imgSrc);   // cache result
      setGeneratedImage(imgSrc);
      setPhase('SHOWING');
      setTimeout(() => setFadeIn(true), 50);
    } catch (err) {
      console.error('Generation failed:', err);
      setPhase(hasFace ? 'READY' : 'NO_FACE');
    } finally {
      isGeneratingRef.current = false;
    }
  }, [videoRef, faceResultRef, hasFace]);

  // Blink handler — uses phaseRef to avoid stale phase value
  useEffect(() => {
    if (!isBlinking) return;
    if (!hasFace) return;
    const p = phaseRef.current;
    if (p === 'INIT' || p === 'NO_FACE' || p === 'GENERATING') return;

    const next = (styleIndexRef.current + 1) % ART_STYLES.length;
    setBlinkCount(c => c + 1);
    generateImage(next);
  }, [isBlinking]);   // intentionally only isBlinking — all other values via refs

  const activeStyle = ART_STYLES[styleIndex];

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `blink_style_${activeStyle.id}.png`;
    a.click();
  };

  // Style grid click: switch style AND generate (not just update text)
  const handleStyleClick = (idx: number) => {
    if (idx === styleIndexRef.current && phase === 'SHOWING') return;
    if (phaseRef.current === 'GENERATING') return;
    generateImage(idx);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">👁️ Blink Studio</h1>
          <p className="text-xs text-slate-400 mt-0.5">Blink to cycle through 16 AI art styles</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">Blinks: <span className="text-white font-semibold">{blinkCount}</span></span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            phase === 'GENERATING' ? 'bg-yellow-500/20 text-yellow-300' :
            phase === 'SHOWING'    ? 'bg-purple-500/20 text-purple-300' :
            hasFace                ? 'bg-green-500/20 text-green-300'   :
                                     'bg-slate-700 text-slate-400'
          }`}>
            {phase === 'INIT'       && <><Loader2 className="w-3 h-3 animate-spin" /> Initializing</>}
            {phase === 'NO_FACE'    && <><EyeOff className="w-3 h-3" /> No Face</>}
            {phase === 'READY'      && <><Eye className="w-3 h-3" /> Ready — Blink!</>}
            {phase === 'GENERATING' && <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>}
            {phase === 'SHOWING'    && <><Sparkles className="w-3 h-3" /> {activeStyle.name}</>}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid md:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto w-full">

        {/* Left: Webcam */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 relative aspect-video">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Blink flash */}
            {isBlinking && (
              <div className="absolute inset-0 bg-white/20 pointer-events-none rounded-2xl" style={{ animation: 'none', opacity: 0.6 }} />
            )}

            {/* Status badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="bg-black/70 text-xs px-3 py-1.5 rounded-full backdrop-blur">
                {phase === 'INIT'       && '⏳ Loading AI models…'}
                {phase === 'NO_FACE'    && '🔍 Position your face in frame'}
                {phase === 'READY'      && '👁️ Blink to generate next style'}
                {phase === 'GENERATING' && `⚡ Generating ${activeStyle.name}…`}
                {phase === 'SHOWING'    && `✨ ${activeStyle.emoji} ${activeStyle.name} — Blink for next`}
              </span>
              {hasFace && (
                <span className="bg-green-500/80 text-xs px-2 py-1 rounded-full backdrop-blur font-medium">
                  Face ✓
                </span>
              )}
            </div>
          </div>

          {/* Active style card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${activeStyle.color}40, ${activeStyle.color}15)`,
                border: `2px solid ${activeStyle.color}`,
                boxShadow: `0 0 16px ${activeStyle.color}50`,
              }}
            >
              {activeStyle.emoji}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-lg transition-all duration-300">{activeStyle.name}</div>
              <div className="text-sm text-slate-400 truncate">{activeStyle.description}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Style {styleIndex + 1} of {ART_STYLES.length}
                {imageCacheRef.current.size > 0 && (
                  <span className="ml-2 text-violet-400">{imageCacheRef.current.size} cached</span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-300 space-y-2">
            <p className="font-semibold text-white text-xs uppercase tracking-widest mb-3">How to use</p>
            <p>👁️ <strong>Blink</strong> once → advances style + generates new AI image</p>
            <p>🖱️ <strong>Click</strong> any style tile below to generate that style directly</p>
            <p>⏱️ 1-second cooldown between blinks prevents duplicates</p>
            <p>💾 Previously generated styles are cached — instant re-display</p>
          </div>
        </div>

        {/* Right: Generated image */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 relative aspect-video flex items-center justify-center">

            {/* Loading state */}
            {phase === 'GENERATING' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                <span className="text-sm text-slate-300">
                  Generating <span className="text-white font-semibold">{activeStyle.name}</span>…
                </span>
                <span className="text-xs text-slate-500">FLUX.2 is transforming your face</span>
              </div>
            )}

            {/* Generated image with fade-in */}
            {generatedImage && (
              <img
                key={generatedImage}                  // force re-mount on new image → re-triggers fade
                src={generatedImage}
                alt={activeStyle.name}
                className="w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: fadeIn ? 1 : 0 }}
              />
            )}

            {/* Empty state */}
            {!generatedImage && phase !== 'GENERATING' && (
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Sparkles className="w-10 h-10" />
                <span className="text-sm">Blink to generate your first styled portrait</span>
              </div>
            )}

            {/* Style label overlay on result */}
            {generatedImage && phase === 'SHOWING' && (
              <div className="absolute top-3 left-3 z-10">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur"
                  style={{
                    background: `${activeStyle.color}30`,
                    border: `1px solid ${activeStyle.color}60`,
                    color: activeStyle.color,
                  }}
                >
                  {activeStyle.emoji} {activeStyle.name}
                </span>
              </div>
            )}
          </div>

          {/* Download */}
          {generatedImage && (
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 transition py-3 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download {activeStyle.name}
            </button>
          )}

          {/* Style grid — clicking generates, not just updates text */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">All Styles — click to generate</p>
            <div className="grid grid-cols-8 gap-2">
              {ART_STYLES.map((s, i) => {
                const isCached = imageCacheRef.current.has(i);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleStyleClick(i)}
                    title={`${s.name}${isCached ? ' (cached)' : ''}`}
                    disabled={phase === 'GENERATING'}
                    className="flex flex-col items-center gap-1 disabled:opacity-40"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-200 relative"
                      style={{
                        background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`,
                        border: `2px solid ${i === styleIndex ? s.color : 'rgba(255,255,255,0.08)'}`,
                        transform: i === styleIndex ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: i === styleIndex ? `0 0 12px ${s.color}80` : 'none',
                      }}
                    >
                      {s.emoji}
                      {/* Green dot for cached styles */}
                      {isCached && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 border border-slate-900" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
