import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, Sparkles, Download, RefreshCw } from 'lucide-react';
import { useWebcam } from '../../hooks/useWebcam';
import { useEyeBlink } from '../../hooks/useEyeBlink';
import { captureAlignedFace } from '../../utils/faceCrop';
import { ART_STYLES } from '../../data/artStyles';
import api from '../../services/api';
import '../../styles/studio.css';

type Phase = 'INIT' | 'NO_FACE' | 'READY' | 'GENERATING' | 'SHOWING';

export const EyeBlinkStudio = () => {
  const [phase, setPhase]               = useState<Phase>('INIT');
  const [styleIndex, setStyleIndex]     = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [displayedStyle, setDisplayedStyle] = useState(0);   // style shown on the result card
  const [blinkCount, setBlinkCount]     = useState(0);
  const [fadeIn, setFadeIn]             = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  const { videoRef, startWebcam, stopWebcam } = useWebcam();
  const { isReady, hasFace, isBlinking, faceResultRef } = useEyeBlink(videoRef);

  // Refs for values read inside async callbacks (avoid stale closures)
  const isGeneratingRef = useRef(false);
  const styleIndexRef   = useRef(0);
  const phaseRef        = useRef<Phase>('INIT');

  // Per-style image cache  Map<styleIndex, dataUrl>
  const cacheRef = useRef<Map<number, string>>(new Map());

  useEffect(() => { styleIndexRef.current = styleIndex; }, [styleIndex]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  // Phase transitions
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
   * generateImage — the core pipeline:
   * 1. Check cache
   * 2. Capture aligned face from webcam
   * 3. POST to /api/generate/ with style name
   * 4. Replace displayed image with AI result
   */
  const generateImage = useCallback(async (idx: number) => {
    if (isGeneratingRef.current) return;

    // Serve from cache instantly
    const cached = cacheRef.current.get(idx);
    if (cached) {
      setFadeIn(false);
      setGeneratedImage(cached);
      setDisplayedStyle(idx);
      setStyleIndex(idx);
      setPhase('SHOWING');
      setTimeout(() => setFadeIn(true), 40);
      return;
    }

    const video  = videoRef.current;
    const result = faceResultRef.current;          // always fresh ref
    if (!video || !result?.faceLandmarks?.[0]) {
      setErrorMsg('No face detected — position your face in the frame and try again.');
      return;
    }

    const cropped = captureAlignedFace(video, result.faceLandmarks[0]);
    if (!cropped) {
      setErrorMsg('Could not crop face — ensure good lighting and face visibility.');
      return;
    }

    isGeneratingRef.current = true;
    setErrorMsg(null);
    setStyleIndex(idx);
    setFadeIn(false);
    setPhase('GENERATING');

    try {
      const { data } = await api.post('/api/generate/', {
        image: cropped,
        style: ART_STYLES[idx].name,
        model: 'flux.1-schnell',
        seed: 4242 + idx * 1337,
        steps: 4,
        strength: 0.0,   // text-to-image; strength unused
      });

      const imgSrc: string = data.generated_image;
      cacheRef.current.set(idx, imgSrc);
      setGeneratedImage(imgSrc);
      setDisplayedStyle(idx);
      setPhase('SHOWING');
      setTimeout(() => setFadeIn(true), 40);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? 'Unknown error';
      console.error('Generation failed:', detail);
      setErrorMsg(`Generation failed: ${detail}`);
      setPhase(hasFace ? 'READY' : 'NO_FACE');
    } finally {
      isGeneratingRef.current = false;
    }
  }, [videoRef, faceResultRef, hasFace]);

  // Blink handler — reads phase via ref to avoid stale value
  useEffect(() => {
    if (!isBlinking) return;
    if (!hasFace) return;
    const p = phaseRef.current;
    if (p === 'INIT' || p === 'NO_FACE' || p === 'GENERATING') return;

    const next = (styleIndexRef.current + 1) % ART_STYLES.length;
    setBlinkCount(c => c + 1);
    generateImage(next);
  }, [isBlinking, generateImage]); // generateImage included so it’s never stale

  const handleStyleClick = (idx: number) => {
    if (phaseRef.current === 'GENERATING') return;
    generateImage(idx);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `face_style_${ART_STYLES[displayedStyle].id}.png`;
    a.click();
  };

  const handleClearCache = () => {
    cacheRef.current.clear();
    setGeneratedImage(null);
    setPhase(hasFace ? 'READY' : 'NO_FACE');
  };

  const activeStyle   = ART_STYLES[styleIndex];
  const resultStyle   = ART_STYLES[displayedStyle];
  const isGenerating  = phase === 'GENERATING';

  const statusLabel = () => {
    switch (phase) {
      case 'INIT':       return { text: '⏳ Loading AI models…',                  color: 'text-slate-400' };
      case 'NO_FACE':    return { text: '🔍 Position your face in the frame',      color: 'text-blue-400'  };
      case 'READY':      return { text: '👁️ Blink to generate next style',         color: 'text-green-400' };
      case 'GENERATING': return { text: `⚡ Generating ${activeStyle.name}…`,      color: 'text-yellow-400'};
      case 'SHOWING':    return { text: `✨ ${resultStyle.emoji} ${resultStyle.name} — Blink for next`, color: 'text-purple-300' };
    }
  };

  const { text: statusText, color: statusColor } = statusLabel();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="w-5 h-5 text-violet-400" /> Blink Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Blink to cycle through 16 AI art styles — powered by FLUX.1
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Blink counter */}
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
            Blinks: <span className="text-white font-semibold">{blinkCount}</span>
          </span>

          {/* Cache counter */}
          {cacheRef.current.size > 0 && (
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition"
              title="Clear image cache"
            >
              <RefreshCw className="w-3 h-3" />
              {cacheRef.current.size} cached
            </button>
          )}

          {/* Phase badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isGenerating       ? 'bg-yellow-500/20 text-yellow-300' :
            phase === 'SHOWING'? 'bg-purple-500/20 text-purple-300' :
            hasFace            ? 'bg-green-500/20  text-green-300'  :
                                 'bg-slate-700     text-slate-400'
          }`}>
            {phase === 'INIT'       && <><Loader2 className="w-3 h-3 animate-spin" /> Initializing</>}
            {phase === 'NO_FACE'    && <><EyeOff  className="w-3 h-3" /> No Face</>}
            {phase === 'READY'      && <><Eye     className="w-3 h-3" /> Ready</>}
            {isGenerating           && <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>}
            {phase === 'SHOWING'    && <><Sparkles className="w-3 h-3" /> {resultStyle.name}</>}
          </div>
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="flex-1 grid md:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto w-full items-start">

        {/* ── Left: Webcam + controls ── */}
        <div className="space-y-4">

          {/* Webcam feed */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 relative aspect-video">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Blink flash overlay */}
            {isBlinking && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.18)', transition: 'opacity 0.15s' }}
              />
            )}

            {/* Face detection ring */}
            {hasFace && (
              <div
                className="absolute inset-6 rounded-full pointer-events-none"
                style={{
                  border: `2px solid ${isGenerating ? '#facc15' : '#22c55e'}`,
                  boxShadow: `0 0 20px ${isGenerating ? '#facc1540' : '#22c55e40'}`,
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              />
            )}

            {/* Status overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="bg-black/75 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                {statusText}
              </span>
              <div className="flex items-center gap-2">
                {hasFace && (
                  <span className="bg-green-500/80 text-xs px-2 py-1 rounded-full font-medium">
                    Face ✓
                  </span>
                )}
                {isBlinking && (
                  <span className="bg-white/80 text-slate-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    BLINK
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active style card */}
          <div
            className="rounded-2xl border bg-slate-900 p-4 flex items-center gap-4 transition-all duration-300"
            style={{ borderColor: `${activeStyle.color}40` }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${activeStyle.color}40, ${activeStyle.color}15)`,
                border: `2px solid ${activeStyle.color}`,
                boxShadow: `0 0 18px ${activeStyle.color}50`,
              }}
            >
              {activeStyle.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-lg leading-tight">{activeStyle.name}</div>
              <div className="text-sm text-slate-400 mt-0.5 line-clamp-2">{activeStyle.description}</div>
              <div className="text-xs text-slate-500 mt-1">
                Style {styleIndex + 1} / {ART_STYLES.length}
              </div>
            </div>
          </div>

          {/* Blink detection status */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Detection Status</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-slate-600'}`} />
                <span className="text-slate-300">AI Models {isReady ? 'Ready' : 'Loading'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasFace ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-slate-300">Face {hasFace ? 'Detected' : 'Not Found'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isBlinking ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-slate-300">Blink {isBlinking ? 'Detected!' : 'Watching'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-yellow-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-slate-300">{isGenerating ? 'Generating…' : 'Idle'}</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-300 space-y-2">
            <p className="font-semibold text-white text-xs uppercase tracking-widest mb-2">How to use</p>
            <p>👁️ <strong>Blink</strong> once → next style + new AI portrait generated</p>
            <p>🖱️ <strong>Click</strong> any style tile to generate that style directly</p>
            <p>⏱️ 1-second cooldown prevents duplicate blink triggers</p>
            <p>💾 Previously generated styles are cached for instant replay</p>
          </div>
        </div>

        {/* ── Right: Generated image ── */}
        <div className="space-y-4">

          {/* Result panel */}
          <div
            className="rounded-2xl overflow-hidden border bg-slate-900 relative flex items-center justify-center"
            style={{
              aspectRatio: '1 / 1',
              borderColor: generatedImage ? `${resultStyle.color}40` : 'rgba(255,255,255,0.08)',
            }}
          >
            {/* Loading spinner */}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-10">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${activeStyle.color}30, transparent 70%)`,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Generating {activeStyle.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    FLUX.1 is transforming your portrait…
                  </p>
                  <p className="text-xs text-slate-500">
                    Preserving your identity across styles
                  </p>
                </div>
              </div>
            )}

            {/* Generated image with fade-in */}
            {generatedImage && (
              <img
                key={generatedImage}
                src={generatedImage}
                alt={resultStyle.name}
                className="w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: fadeIn ? 1 : 0 }}
              />
            )}

            {/* Empty state */}
            {!generatedImage && !isGenerating && (
              <div className="flex flex-col items-center gap-3 text-slate-600 p-8 text-center">
                <Sparkles className="w-12 h-12" />
                <p className="text-sm font-medium text-slate-500">
                  Your AI portrait will appear here
                </p>
                <p className="text-xs text-slate-600">
                  Blink or click a style below to generate
                </p>
              </div>
            )}

            {/* Style label on result */}
            {generatedImage && !isGenerating && (
              <div className="absolute top-3 left-3 z-10">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
                  style={{
                    background: `${resultStyle.color}25`,
                    border: `1px solid ${resultStyle.color}50`,
                    color: resultStyle.color,
                  }}
                >
                  {resultStyle.emoji} {resultStyle.name}
                </span>
              </div>
            )}

            {/* Cached badge */}
            {generatedImage && !isGenerating && cacheRef.current.has(displayedStyle) && (
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  cached
                </span>
              </div>
            )}
          </div>

          {/* Download button */}
          {generatedImage && !isGenerating && (
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all py-3 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download {resultStyle.name} Portrait
            </button>
          )}

          {/* Style grid */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">
              All 16 Styles — click to generate
            </p>
            <div className="grid grid-cols-8 gap-2">
              {ART_STYLES.map((s, i) => {
                const isCached  = cacheRef.current.has(i);
                const isActive  = i === styleIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleStyleClick(i)}
                    disabled={isGenerating}
                    title={`${s.name}${isCached ? ' (cached)' : ''}`}
                    className="flex flex-col items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base relative transition-all duration-200"
                      style={{
                        background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`,
                        border: `2px solid ${isActive ? s.color : 'rgba(255,255,255,0.08)'}`,
                        transform: isActive ? 'scale(1.18)' : 'scale(1)',
                        boxShadow: isActive ? `0 0 14px ${s.color}80` : 'none',
                      }}
                    >
                      {s.emoji}
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
