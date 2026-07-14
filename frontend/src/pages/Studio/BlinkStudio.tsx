import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Sparkles, Download, RefreshCw,
  Loader2, Hand, Zap, Camera,
} from 'lucide-react';
import { useWebcam } from '../../hooks/useWebcam';
import { useEyeBlink } from '../../hooks/useEyeBlink';
import { captureAlignedFace } from '../../utils/faceCrop';
import { ART_STYLES } from '../../data/artStyles';
import api from '../../services/api';

type Phase = 'INIT' | 'NO_FACE' | 'READY' | 'GENERATING' | 'SHOWING';

/* ── tiny reusable status dot ── */
const Dot = ({ on, pulse = false, color = 'bg-green-400' }: {
  on: boolean; pulse?: boolean; color?: string;
}) => (
  <span className={`inline-block w-2 h-2 rounded-full transition-colors duration-300
    ${on ? color : 'bg-white/20'} ${on && pulse ? 'animate-pulse' : ''}`} />
);

export const BlinkStudio = () => {
  const [phase, setPhase]             = useState<Phase>('INIT');
  const [styleIndex, setStyleIndex]   = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [blinkCount, setBlinkCount]   = useState(0);
  const [fadeKey, setFadeKey]         = useState(0);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  const { videoRef, startWebcam, stopWebcam } = useWebcam();
  const { isReady, hasFace, isBlinking, faceResultRef } = useEyeBlink(videoRef);

  const generatingRef  = useRef(false);
  const styleIndexRef  = useRef(0);
  const phaseRef       = useRef<Phase>('INIT');
  const cacheRef       = useRef<Map<number, string>>(new Map());

  useEffect(() => { styleIndexRef.current = styleIndex; }, [styleIndex]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  /* phase machine */
  useEffect(() => {
    if (!isReady) { setPhase('INIT'); return; }
    if (!hasFace) {
      if (phaseRef.current !== 'GENERATING') setPhase('NO_FACE');
      return;
    }
    if (phaseRef.current === 'INIT' || phaseRef.current === 'NO_FACE')
      setPhase('READY');
  }, [isReady, hasFace]);

  /* ── core generation pipeline ── */
  const generate = useCallback(async (idx: number) => {
    if (generatingRef.current) return;

    /* cache hit */
    const cached = cacheRef.current.get(idx);
    if (cached) {
      setStyleIndex(idx);
      setResultIndex(idx);
      setGeneratedImg(cached);
      setPhase('SHOWING');
      setFadeKey(k => k + 1);
      return;
    }

    const video  = videoRef.current;
    const result = faceResultRef.current;
    if (!video || !result?.faceLandmarks?.[0]) {
      setErrorMsg('No face detected — centre your face in the frame.');
      return;
    }

    const cropped = captureAlignedFace(video, result.faceLandmarks[0]);
    if (!cropped) {
      setErrorMsg('Face crop failed — ensure good lighting.');
      return;
    }

    generatingRef.current = true;
    setErrorMsg(null);
    setStyleIndex(idx);
    setPhase('GENERATING');

    try {
      const { data } = await api.post('/api/generate/', {
        image:    cropped,
        style:    ART_STYLES[idx].name,
        model:    'flux.2-klein-4b',
        seed:     4242 + idx * 1337,
        steps:    4,
        strength: 0.70,
      });

      const src: string = data.generated_image;
      cacheRef.current.set(idx, src);
      setGeneratedImg(src);
      setResultIndex(idx);
      setPhase('SHOWING');
      setFadeKey(k => k + 1);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Unknown error';
      setErrorMsg(`Generation failed: ${msg}`);
      setPhase(hasFace ? 'READY' : 'NO_FACE');
    } finally {
      generatingRef.current = false;
    }
  }, [videoRef, faceResultRef, hasFace]);

  /* blink → next style */
  useEffect(() => {
    if (!isBlinking) return;
    if (!hasFace) return;
    const p = phaseRef.current;
    if (p === 'INIT' || p === 'NO_FACE' || p === 'GENERATING') return;
    const next = (styleIndexRef.current + 1) % ART_STYLES.length;
    setBlinkCount(c => c + 1);
    generate(next);
  }, [isBlinking, generate]);

  const handleStyleClick = (idx: number) => {
    if (phaseRef.current === 'GENERATING') return;
    generate(idx);
  };

  const handleDownload = () => {
    if (!generatedImg) return;
    const a = document.createElement('a');
    a.href = generatedImg;
    a.download = `ai_style_${ART_STYLES[resultIndex].id}.png`;
    a.click();
  };

  const handleClearCache = () => {
    cacheRef.current.clear();
    setGeneratedImg(null);
    setPhase(hasFace ? 'READY' : 'NO_FACE');
  };

  const active   = ART_STYLES[styleIndex];
  const result   = ART_STYLES[resultIndex];
  const isGen    = phase === 'GENERATING';

  return (
    <div className="min-h-screen text-white relative overflow-hidden">

      {/* ── animated background blobs ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: `radial-gradient(circle, ${active.color}60, transparent 70%)` }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: `radial-gradient(circle, ${active.color}40, transparent 70%)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#0f172a_60%)]" />
      </div>

      {/* ── header ── */}
      <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">Blink Studio</h1>
              <p className="text-xs text-white/40 mt-0.5">AI Face Style Transformation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="glass text-xs px-3 py-1.5 rounded-full text-white/60">
              Blinks <span className="text-white font-semibold ml-1">{blinkCount}</span>
            </span>

            {cacheRef.current.size > 0 && (
              <button
                onClick={handleClearCache}
                className="glass text-xs px-3 py-1.5 rounded-full text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {cacheRef.current.size} cached
              </button>
            )}

            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isGen
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  : phase === 'SHOWING'
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : hasFace
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              {phase === 'INIT'    && <><Loader2 className="w-3 h-3 animate-spin" /> Loading models</>}
              {phase === 'NO_FACE' && <><EyeOff className="w-3 h-3" /> No face</>}
              {phase === 'READY'   && <><Eye className="w-3 h-3" /> Ready — blink!</>}
              {isGen               && <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>}
              {phase === 'SHOWING' && <><Sparkles className="w-3 h-3" /> {result.name}</>}
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── main layout ── */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_1fr] gap-8 items-start">

        {/* ══ LEFT COLUMN ══ */}
        <div className="space-y-5">

          {/* webcam card */}
          <div className="glass-card overflow-hidden relative">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Camera className="w-4 h-4 text-white/50" />
                Live Camera
              </div>
              <div className="flex items-center gap-2">
                <Dot on={hasFace} color="bg-green-400" />
                <span className="text-xs text-white/40">{hasFace ? 'Face detected' : 'No face'}</span>
              </div>
            </div>

            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* blink flash */}
              <AnimatePresence>
                {isBlinking && (
                  <motion.div
                    key="blink-flash"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 bg-white pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* face ring */}
              {hasFace && (
                <motion.div
                  animate={{ borderColor: isGen ? '#facc15' : '#22c55e' }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-8 rounded-full pointer-events-none"
                  style={{
                    border: '1.5px solid',
                    boxShadow: `0 0 24px ${isGen ? '#facc1530' : '#22c55e30'}`,
                  }}
                />
              )}

              {/* bottom status bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-white/80">
                  {phase === 'INIT'       && '⏳ Loading AI models…'}
                  {phase === 'NO_FACE'    && '🔍 Position your face in frame'}
                  {phase === 'READY'      && '👁️ Blink to generate next style'}
                  {isGen                  && `⚡ Generating ${active.name}…`}
                  {phase === 'SHOWING'    && `✨ ${result.emoji} ${result.name} — blink for next`}
                </span>
                <AnimatePresence>
                  {isBlinking && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-bold bg-white text-slate-900 px-2 py-0.5 rounded-full"
                    >
                      BLINK
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* active style card */}
          <motion.div
            key={styleIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${active.color}40, ${active.color}15)`,
                border: `1.5px solid ${active.color}60`,
                boxShadow: `0 0 20px ${active.color}30`,
              }}
            >
              {active.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-lg leading-tight">{active.name}</p>
              <p className="text-sm text-white/50 mt-0.5 truncate">{active.description}</p>
              <p className="text-xs text-white/30 mt-1">Style {styleIndex + 1} / {ART_STYLES.length}</p>
            </div>
          </motion.div>

          {/* detection status */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Detection Status</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              {[
                { label: 'AI Models',    on: isReady,    color: 'bg-green-400' },
                { label: 'Face',         on: hasFace,    color: 'bg-green-400' },
                { label: 'Blink',        on: isBlinking, color: 'bg-white',    pulse: true },
                { label: 'Generating',   on: isGen,      color: 'bg-yellow-400', pulse: true },
              ].map(({ label, on, color, pulse }) => (
                <div key={label} className="flex items-center gap-2">
                  <Dot on={on} color={color} pulse={pulse} />
                  <span className="text-white/60">{label}</span>
                  <span className={`ml-auto text-xs font-medium ${on ? 'text-white' : 'text-white/20'}`}>
                    {on ? 'Active' : 'Idle'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* error */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* instructions */}
          <div className="glass-card p-4 space-y-2 text-sm text-white/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">How to use</p>
            {[
              ['👁️', 'Blink once', 'advances to next style and generates'],
              ['🖱️', 'Click a tile', 'generates that style directly'],
              ['⏱️', '1-second cooldown', 'prevents duplicate triggers'],
              ['💾', 'Cached styles', 'replay instantly without re-generating'],
            ].map(([icon, bold, rest]) => (
              <p key={bold}>{icon} <strong className="text-white/80">{bold}</strong> — {rest}</p>
            ))}
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="space-y-5">

          {/* result panel */}
          <div
            className="glass-card overflow-hidden relative"
            style={{ aspectRatio: '1 / 1' }}
          >
            {/* generating overlay */}
            <AnimatePresence>
              {isGen && (
                <motion.div
                  key="gen-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-slate-950/90 backdrop-blur-sm"
                >
                  {/* pulsing ring */}
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute w-24 h-24 rounded-full"
                      style={{ background: `radial-gradient(circle, ${active.color}60, transparent 70%)` }}
                    />
                    <Loader2 className="w-10 h-10 animate-spin text-violet-400 relative z-10" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-white">Generating {active.name}</p>
                    <p className="text-sm text-white/50">FLUX.2 is transforming your portrait…</p>
                    <p className="text-xs text-white/30">Preserving your identity</p>
                  </div>
                  {/* progress bar */}
                  <motion.div
                    className="w-48 h-1 rounded-full bg-white/10 overflow-hidden"
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${active.color}, #a855f7)` }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* generated image */}
            <AnimatePresence mode="wait">
              {generatedImg && !isGen && (
                <motion.img
                  key={fadeKey}
                  src={generatedImg}
                  alt={result.name}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover"
                />
              )}
            </AnimatePresence>

            {/* empty state */}
            {!generatedImg && !isGen && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                <Zap className="w-12 h-12" />
                <p className="text-sm font-medium text-white/30">Your AI portrait appears here</p>
                <p className="text-xs text-white/20">Blink or click a style to generate</p>
              </div>
            )}

            {/* style badge */}
            {generatedImg && !isGen && (
              <div className="absolute top-3 left-3 z-10">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md"
                  style={{
                    background: `${result.color}20`,
                    border: `1px solid ${result.color}50`,
                    color: result.color,
                  }}
                >
                  {result.emoji} {result.name}
                </span>
              </div>
            )}

            {/* cached badge */}
            {generatedImg && !isGen && cacheRef.current.has(resultIndex) && (
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  cached
                </span>
              </div>
            )}
          </div>

          {/* download */}
          <AnimatePresence>
            {generatedImg && !isGen && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${result.color}30, ${result.color}10)`,
                  border: `1px solid ${result.color}40`,
                  color: result.color,
                }}
              >
                <Download className="w-4 h-4" />
                Download {result.name} Portrait
              </motion.button>
            )}
          </AnimatePresence>

          {/* style grid */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                16 Art Styles
              </p>
              <p className="text-xs text-white/30">click to generate</p>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {ART_STYLES.map((s, i) => {
                const isCached = cacheRef.current.has(i);
                const isActive = i === styleIndex;
                return (
                  <motion.button
                    key={s.id}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStyleClick(i)}
                    disabled={isGen}
                    title={`${s.name}${isCached ? ' ✓ cached' : ''}`}
                    className="relative flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${s.color}50, ${s.color}20)`
                          : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${isActive ? s.color : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isActive ? `0 0 16px ${s.color}60` : 'none',
                      }}
                    >
                      {s.emoji}
                    </div>
                    {isCached && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-slate-900" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* style name labels row */}
            <div className="grid grid-cols-8 gap-2 mt-2">
              {ART_STYLES.map((s, i) => (
                <p
                  key={s.id}
                  className="text-center text-[9px] leading-tight truncate transition-colors duration-200"
                  style={{ color: i === styleIndex ? s.color : 'rgba(255,255,255,0.2)' }}
                >
                  {s.name}
                </p>
              ))}
            </div>
          </div>

          {/* gesture guide */}
          <div className="glass-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
              Gesture Guide
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-white/50">
              {[
                { icon: '👁️', label: 'Blink',        desc: 'Next style + generate' },
                { icon: '🖱️', label: 'Click tile',   desc: 'Generate that style' },
                { icon: '⏱️', label: '1s cooldown',  desc: 'One blink = one style' },
                { icon: '💾', label: 'Auto-cache',   desc: 'Instant replay' },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">{icon}</span>
                  <div>
                    <p className="font-semibold text-white/70">{label}</p>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
