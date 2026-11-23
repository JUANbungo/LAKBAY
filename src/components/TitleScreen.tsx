import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Music2, Play, RotateCcw, Sliders, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { noirAudio } from '../game/audio';

interface TitleScreenProps {
  hasSave: boolean;
  savedZoneName: string;
  savedLevel: number;
  savedAwakenedCount?: number;
  bgmEnabled: boolean;
  voiceEnabled: boolean;
  sfxVolume: number;
  bgmVolume: number;
  onToggleBgm: () => void;
  onToggleVoice: () => void;
  onChangeSfxVolume: (val: number) => void;
  onChangeBgmVolume: (val: number) => void;
  onContinue: () => void;
  onNewJourney: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSave,
  savedZoneName,
  savedLevel,
  savedAwakenedCount = 0,
  bgmEnabled,
  voiceEnabled,
  sfxVolume,
  bgmVolume,
  onToggleBgm,
  onToggleVoice,
  onChangeSfxVolume,
  onChangeBgmVolume,
  onContinue,
  onNewJourney,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subtle floating golden embers / sunlight wisps over the 16-bit Bataan sunset art
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 14,
      vy: -12 - Math.random() * 24,
      r: 1.4 + Math.random() * 2.8,
      alpha: 0.25 + Math.random() * 0.65,
      twinkle: Math.random() * Math.PI * 2,
    }));

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.twinkle += dt * 3;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const a = p.alpha * (0.55 + 0.45 * Math.sin(p.twinkle));
        ctx.fillStyle = `rgba(253, 224, 71, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#0b1020] font-sans text-white">
      {/* FULL-BLEED 16-BIT BATAAN SUNSET BACKGROUND */}
      <img
        src="/assets/aistudio/bataan_title_bg_95fda21e.png"
        alt="Bataan: Laban sa Korapsyon — Mt. Samat Sunset Panorama"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Cinematic top & bottom framing vignette so logo & command bar pop cleanly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,12,24,0.48) 0%, rgba(8,12,24,0.06) 36%, rgba(8,12,24,0.12) 66%, rgba(6,10,20,0.86) 100%)',
        }}
      />

      {/* Floating Golden Embers Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* TOP BAR: Subtle Audio Toggles & Edition Tag */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-4 sm:pt-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/60 border border-amber-400/35 backdrop-blur-md text-[11px] font-bold tracking-[0.14em] uppercase text-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>16-Bit Philippine Open-World RPG</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleBgm}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold backdrop-blur-md transition cursor-pointer ${
              bgmEnabled
                ? 'bg-slate-950/65 border-amber-400/50 text-amber-200 hover:bg-slate-900/80'
                : 'bg-slate-950/55 border-slate-600/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>8-Bit BGM: {bgmEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleVoice}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold backdrop-blur-md transition cursor-pointer ${
              voiceEnabled
                ? 'bg-slate-950/65 border-sky-400/50 text-sky-200 hover:bg-slate-900/80'
                : 'bg-slate-950/55 border-slate-600/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>PH-EN Voice: {voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* CENTER-UPPER FLOATING GOLDEN PIXEL-ART CREST LOGO */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-4 sm:pt-7 px-4 pointer-events-none">
        <img
          src="/assets/aistudio/bataan_title_logo_transparent_722fda4b.png"
          alt="Bataan: Laban sa Korapsyon"
          className="w-[330px] sm:w-[470px] md:w-[560px] max-w-[92vw] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.82)]"
        />
        <p className="mt-1.5 px-4 py-1 rounded-full bg-slate-950/60 border border-amber-300/30 backdrop-blur-sm text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-amber-100 drop-shadow">
          Defend the 12 Towns of Bataan • Unmask the Balanga Syndicate
        </p>
      </div>

      {/* SLEEK BOTTOM JRPG COMMAND BAR + VOLUME MIXER */}
      <div className="absolute bottom-5 sm:bottom-7 inset-x-0 z-10 flex flex-col items-center gap-2.5 px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 p-3 rounded-2xl bg-slate-950/75 border border-amber-400/35 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
          {hasSave && (
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black tracking-wide text-sm sm:text-base shadow-[0_0_24px_rgba(251,191,36,0.45)] transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                CONTINUE — LV.{savedLevel} ({savedZoneName})
                {savedAwakenedCount > 0 ? ` • AWAKENED ×${savedAwakenedCount}` : ''}
              </span>
            </button>
          )}

          <button
            onClick={onNewJourney}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black tracking-wide text-sm sm:text-base transition-transform active:scale-95 cursor-pointer ${
              hasSave
                ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-100 border border-amber-400/40'
                : 'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.45)]'
            }`}
          >
            {hasSave ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>START NEW CAMPAIGN</span>
          </button>

          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-sky-200 border border-sky-400/35 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-300" />
            <span>GAME GUIDE &amp; FEATURES</span>
          </button>
        </div>

        {/* Audio Volume Sliders (Persisted in localStorage) */}
        <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-2 rounded-xl bg-slate-950/75 border border-slate-700/80 backdrop-blur-md text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-300 tracking-wide">
            <Sliders className="w-3.5 h-3.5" />
            AUDIO MIXER
          </span>
          <label className="flex items-center gap-2 text-slate-200 font-semibold">
            <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>SFX</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(sfxVolume * 100)}
              onChange={(e) => {
                const next = Number(e.target.value) / 100;
                onChangeSfxVolume(next);
              }}
              onPointerUp={() => noirAudio.playSfxPreview()}
              className="w-24 sm:w-28 accent-amber-400 cursor-pointer"
              aria-label="SFX Volume"
            />
            <span className="w-8 font-mono text-[11px] text-amber-200 tabular-nums text-right">
              {Math.round(sfxVolume * 100)}%
            </span>
          </label>
          <label className="flex items-center gap-2 text-slate-200 font-semibold">
            <Music2 className="w-3.5 h-3.5 text-sky-300" />
            <span>BGM</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(bgmVolume * 100)}
              onChange={(e) => onChangeBgmVolume(Number(e.target.value) / 100)}
              className="w-24 sm:w-28 accent-sky-400 cursor-pointer"
              aria-label="BGM Volume"
            />
            <span className="w-8 font-mono text-[11px] text-sky-200 tabular-nums text-right">
              {Math.round(bgmVolume * 100)}%
            </span>
          </label>
        </div>

        <div className="text-[11px] font-semibold text-amber-100/80 tracking-wide drop-shadow">
          Created by <span className="text-amber-300 font-black">Juan.exe</span> • Desktop Keyboard &amp; Mobile Touch UI Ready
        </div>
      </div>

      {/* CLEAN OPTIONAL GAME GUIDE & FEATURES MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-2xl bg-slate-900 border-2 border-amber-400/50 shadow-2xl p-5 sm:p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-amber-300 tracking-wide">
                  BATAAN: LABAN SA KORAPSYON — FIELD GUIDE
                </h2>
                <p className="text-xs text-slate-400">
                  12 Historic Municipalities • Tactical Combat • White &amp; Black Magic • Awakened Mode
                </p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-800/75 border border-slate-700/80">
                <h3 className="font-black text-amber-300 mb-1.5 uppercase tracking-wider text-xs">
                  Controls &amp; Combat
                </h3>
                <ul className="space-y-1 text-slate-200">
                  <li><span className="font-bold text-white">A / D or Arrows:</span> Walk / Sprint / Pedal Bike</li>
                  <li><span className="font-bold text-white">Left Click / J:</span> Attack &amp; 3-Hit Combo</li>
                  <li><span className="font-bold text-white">Right Click / K:</span> Ang Payong Shield &amp; Bullet Deflect</li>
                  <li><span className="font-bold text-white">Shift:</span> Dodge Dash / Bike Turbo Wheelie</li>
                  <li><span className="font-bold text-white">Space / W:</span> Jump / Bike Hop</li>
                  <li><span className="font-bold text-white">E:</span> Talk, Shop, Rest, Board Jeepney, Portals</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/75 border border-slate-700/80">
                <h3 className="font-black text-emerald-300 mb-1.5 uppercase tracking-wider text-xs">
                  RPG Progression &amp; Magic
                </h3>
                <ul className="space-y-1 text-slate-200">
                  <li><span className="font-bold text-white">Level Up:</span> +3 Stat Points (STR / VIT / AGI / INT) + Full Heal</li>
                  <li><span className="font-bold text-white">Skill Unlocks (Lv.5–60):</span> White &amp; Black Magic with 1–5 min Stat Buffs</li>
                  <li><span className="font-bold text-white">Payong Survival:</span> Open Payong [U] to prevent Rain Slow &amp; Sun Burn</li>
                  <li><span className="font-bold text-white">New Areas:</span> Palayan Farming Grounds &amp; Mt. Natib Mining Cave</li>
                  <li><span className="font-bold text-white">Life Skills:</span> Fishing (11 PH fish), Gathering, Cooking &amp; Side Jobs</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/75 border border-slate-700/80 sm:col-span-2">
                <h3 className="font-black text-sky-300 mb-1.5 uppercase tracking-wider text-xs">
                  Story Campaign, Spectral Heroes &amp; Awakened Mode
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Begin as a humble Bataan resident with no weapon and no bike. Earn Kap Ben&apos;s trust, claim your Green Defender Bike (6 curated skins including Bantay Patrol Sidecar) and Ang Payong, recruit combat allies like Bantay, Ate Linda, Teacher Clara, PO2 Luna, and Sgt. Reyes, and liberate all 12 municipalities before confronting <span className="text-red-300 font-bold">El Mastermind</span> and <span className="text-rose-300 font-bold">The Gracias Nomar</span> at the Balanga Capitol. Check in with <span className="text-sky-300 font-bold">Ate Maya&apos;s News Desk</span> for Bataan bulletins and visit Civic Dispatch for Food Delivery &amp; Taxi side jobs!
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer"
              >
                BACK TO TITLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
