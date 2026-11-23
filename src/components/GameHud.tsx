import React, { useEffect, useRef, useState } from 'react';
import {
  Backpack,
  BookOpen,
  Briefcase,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Eye,
  FileCheck2,
  Fish,
  Flame,
  Home,
  Lock,
  Map,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Music,
  Newspaper,
  Pause,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Trophy,
  Users,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { noirAudio } from '../game/audio';
import { BossProfile, getFinalBossProgress } from '../game/bataanData';
import { AchievementDef } from '../game/expansionData';
import { GAME_CONFIG } from '../game/gameConfig';
import { getMagicSkillIconKey, isSkillUnlockedForLevel, MAGIC_SKILLS } from '../game/magicSkillsData';
import { drawBossPortrait, drawHeroHudPortrait } from '../game/noirRenderer';
import { drawAtlasIconOrPortrait, initSpriteAtlases, subscribeAtlasLoaded } from '../game/spriteAtlas';
import { ActiveModal, HudSnapshot, PlayerProgress, WorldBridge } from '../game/types';
import { drawV2Icon, initV2Sprites, subscribeV2Loaded } from '../game/v2Sprites';
import { FOODS, ZONES } from '../game/worldData';
import { WEATHER_LABELS } from '../game/worldPolishAndWeather';

interface GameHudProps {
  progress: PlayerProgress;
  hud: HudSnapshot;
  bridgeRef: React.MutableRefObject<WorldBridge | null>;
  achievementToast?: AchievementDef | null;
  onOpenModal: (modal: ActiveModal) => void;
  onToggleBgm: () => void;
  onToggleVoice: () => void;
  onChangeSfxVolume: (val: number) => void;
  onChangeBgmVolume: (val: number) => void;
  onChangeHudLayoutMode: (mode: 'auto' | 'desktop' | 'mobile') => void;
  onCancelSideJob: () => void;
  onPause: () => void;
  onEatEquippedFood: () => void;
  onToggleBike: () => void;
  onToggleUmbrella: () => void;
  onCastMagicSkill: (skillId: string) => void;
}

const MagicIconCanvas: React.FC<{ iconKey: string; size?: number }> = ({ iconKey, size = 28 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    initV2Sprites();
    const render = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      drawV2Icon(ctx, iconKey, size);
    };
    render();
    return subscribeV2Loaded(render);
  }, [iconKey, size]);
  return <canvas ref={ref} width={size} height={size} className="block shrink-0" />;
};

const AtlasMiniIcon: React.FC<{ spriteId: string; size?: number }> = ({ spriteId, size = 18 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    initSpriteAtlases();
    const render = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      drawAtlasIconOrPortrait(ctx, spriteId, size, 0, 'contain');
    };
    render();
    return subscribeAtlasLoaded(render);
  }, [spriteId, size]);

  return <canvas ref={ref} width={size} height={size} className="block shrink-0" />;
};

const HeroHudPortrait: React.FC<{ progress: PlayerProgress }> = ({ progress }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    initSpriteAtlases();
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      drawHeroHudPortrait(ctx, progress, 64, (now - start) / 1000);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [progress.ridingBike, progress.equippedOutfitId, progress.equippedHairId, progress.equippedHeadgearId, progress]);

  return (
    <div className="relative shrink-0 border-2 border-[#F4C542] bg-[#102132] p-0.5 shadow-[0_0_0_2px_#09121B]">
      <canvas ref={ref} width={64} height={64} className="block h-13 w-13 sm:h-15 sm:w-15" />
      <span className="absolute -bottom-1.5 -right-1.5 border border-[#09121B] bg-[#F4C542] px-1 py-0.5 font-mono text-[10px] font-bold leading-none text-[#102030] tabular-nums">
        LV.{progress.level}
      </span>
    </div>
  );
};

const BossMiniPortrait: React.FC<{ profile: BossProfile }> = ({ profile }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    initSpriteAtlases();
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      drawBossPortrait(ctx, profile, 54, (now - start) / 1000);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [profile]);
  return (
    <div className="shrink-0 border-2 border-[#DC2626] bg-[#121D2B] p-0.5 shadow-[0_0_0_2px_#09121B]">
      <canvas ref={ref} width={54} height={54} className="block h-12 w-12 sm:h-14 sm:w-14" />
    </div>
  );
};

const VirtualJoystick: React.FC<{ onMoveDir: (dir: -1 | 0 | 1) => void }> = ({ onMoveDir }) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    if (dx < -10) onMoveDir(-1);
    else if (dx > 10) onMoveDir(1);
    else onMoveDir(0);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onMoveDir(0);
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        activePointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        resetStick();
      }}
      onPointerCancel={resetStick}
      className="relative flex h-28 w-28 touch-none select-none items-center justify-center rounded-full border-2 border-[#7FA4BE]/85 bg-[#0C1926]/75 shadow-[0_6px_20px_rgba(0,0,0,0.65)] backdrop-blur-sm"
      aria-label="Movement Joystick"
    >
      <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-[#4D7391]/60" />
      <span className="pointer-events-none absolute left-2 font-mono text-[10px] font-bold text-[#8BB3CF]">◀</span>
      <span className="pointer-events-none absolute right-2 font-mono text-[10px] font-bold text-[#8BB3CF]">▶</span>
      <div
        className="pointer-events-none h-12 w-12 rounded-full border-2 border-[#FFF0B3] bg-gradient-to-b from-[#F4C542] to-[#C88E1A] shadow-[0_3px_10px_rgba(0,0,0,0.6)] transition-transform duration-75"
        style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
      />
    </div>
  );
};

function formatClock(hourFloat: number): string {
  const totalMins = Math.floor((((hourFloat % 24) + 24) % 24) * 60);
  const h24 = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
}

function formatTimer(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}

export const GameHud: React.FC<GameHudProps> = ({
  progress,
  hud,
  bridgeRef,
  achievementToast,
  onOpenModal,
  onToggleBgm,
  onToggleVoice,
  onChangeSfxVolume,
  onChangeBgmVolume,
  onChangeHudLayoutMode,
  onCancelSideJob,
  onPause,
  onEatEquippedFood,
  onToggleBike,
  onToggleUmbrella,
  onCastMagicSkill,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [autoTouchDetected, setAutoTouchDetected] = useState(false);

  useEffect(() => {
    const detect = () => {
      const hasTouch =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024);
      setAutoTouchDetected(hasTouch);
    };
    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, []);

  const isMobileUi =
    progress.hudLayoutMode === 'mobile' || (progress.hudLayoutMode !== 'desktop' && autoTouchDetected);

  const zone = ZONES[progress.zoneId];
  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const spPct = Math.max(0, Math.min(100, (hud.sp / Math.max(1, hud.maxSp)) * 100));
  const xpPct = Math.max(0, Math.min(100, (hud.xp / Math.max(1, hud.xpNext)) * 100));
  const equippedFood = progress.equippedFoodId ? FOODS.find((f) => f.id === progress.equippedFoodId) : null;
  const equippedFoodQty = progress.equippedFoodId ? progress.foodPouch[progress.equippedFoodId] || 0 : 0;
  const caseProg = getFinalBossProgress(progress.bossProgression);
  const lowHp = hpPct <= 28;
  const debuffs = hud.playerDebuffs;
  const shieldCd = hud.shieldCooldown || 0;
  const dodgeCd = hud.dodgeCooldown || 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between px-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3">
      {/* ==================== TOP ROW: CHARACTER MAIN BAR + COMPACT MENU DOCK ==================== */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Professional Character Main Bar (Portrait, Name, Level, Pesos, HP/SP/EXP, Buffs/Debuffs) */}
        <div className="arcade-panel pointer-events-auto flex max-w-[min(92vw,440px)] items-start gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5">
          <HeroHudPortrait progress={progress} />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Header Row: Name + Combo + Pesos */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-display text-xs font-bold tracking-wide text-[#F4C542] sm:text-sm">
                  BATAAN DEFENDER
                </span>
                {progress.awakenedCount >= 1 && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 border border-[#5EEAD4] bg-[#0F3D3E] px-1 py-0.5 font-mono text-[9px] font-bold text-[#5EEAD4]">
                    <Sparkles className="h-2.5 w-2.5" />
                    AW{progress.awakenedCount}
                  </span>
                )}
                {hud.comboCount >= 2 && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 border border-[#FFF0B3] bg-[#D63A3A] px-1 py-0.5 font-mono text-[9px] font-bold text-[#FFFFFF] tabular-nums">
                    <Zap className="h-2.5 w-2.5 text-[#F4C542]" />
                    {hud.comboCount}×
                  </span>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs font-bold text-[#7AE582] tabular-nums">
                ₱{progress.pesos.toLocaleString()}
              </span>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 font-mono text-[10px] font-bold text-[#FCA5A5]">HP</span>
              <div className="relative h-3.5 flex-1 overflow-hidden border border-[#09121B] bg-[#0F1E2C] shadow-[inset_0_2px_0_rgba(0,0,0,0.65)]">
                <div
                  className={`relative h-full transition-all duration-150 ${
                    lowHp ? 'animate-pulse bg-[#EF4444]' : 'bg-gradient-to-r from-[#C82828] to-[#EF4444]'
                  }`}
                  style={{ width: `${hpPct}%` }}
                >
                  <div className="h-1 w-full bg-white/30" />
                </div>
                <div className="arcade-segments pointer-events-none absolute inset-0" />
              </div>
              <span className="min-w-[60px] text-right font-mono text-[11px] font-bold text-[#FFFFFF] tabular-nums">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>

            {/* SP Bar */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 font-mono text-[10px] font-bold text-[#7DD3FC]">SP</span>
              <div className="relative h-2.5 flex-1 overflow-hidden border border-[#09121B] bg-[#0F1E2C]">
                <div
                  className="relative h-full bg-gradient-to-r from-[#1D87C2] to-[#38BDF8] transition-all duration-150"
                  style={{ width: `${spPct}%` }}
                >
                  <div className="h-0.5 w-full bg-white/35" />
                </div>
              </div>
              <span className="min-w-[60px] text-right font-mono text-[10px] font-semibold text-[#D6E6F2] tabular-nums">
                {hud.sp}/{hud.maxSp}
              </span>
            </div>

            {/* EXP Bar */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 font-mono text-[9px] font-bold text-[#FDE047]">EXP</span>
              <div className="relative h-2 flex-1 overflow-hidden border border-[#09121B] bg-[#0F1E2C]">
                <div
                  className="h-full bg-gradient-to-r from-[#D97706] to-[#FACC15] transition-all duration-200"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <span className="min-w-[60px] text-right font-mono text-[9px] font-semibold text-[#FDE68A] tabular-nums">
                {hud.xp}/{hud.xpNext}
              </span>
            </div>

            {/* Compact Zone · Clock · Weather · Evidence · Accuracy Strip */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-[#3C5E77]/80 pt-1 font-mono text-[10px] tabular-nums">
              <span className="font-bold text-[#FFFFFF]">{zone.name}</span>
              <button
                type="button"
                onClick={() => bridgeRef.current?.toggleDayNight()}
                title="Toggle Day / Night"
                className="inline-flex cursor-pointer items-center gap-0.5 font-semibold text-[#F4C542] hover:underline"
              >
                {hud.isNight ? <Moon className="h-2.5 w-2.5" /> : <Sun className="h-2.5 w-2.5" />}
                {formatClock(hud.timeOfDay)}
              </button>
              <button
                type="button"
                onClick={() => bridgeRef.current?.cycleWeather()}
                title="Cycle Weather (Clear / Drizzle / Rain / Storm / Fog)"
                className="inline-flex cursor-pointer items-center gap-0.5 border border-[#4D7391] bg-[#162C40] px-1 py-0.5 font-semibold text-[#BAE6FD] hover:border-[#F4C542]"
              >
                {hud.weatherMode === 'monsoon_storm' ? (
                  <CloudLightning className="h-2.5 w-2.5 text-[#FDE047]" />
                ) : hud.weatherMode === 'heavy_rain' ? (
                  <CloudRain className="h-2.5 w-2.5 text-[#7DD3FC]" />
                ) : hud.weatherMode === 'drizzle' ? (
                  <CloudDrizzle className="h-2.5 w-2.5 text-[#BAE6FD]" />
                ) : hud.weatherMode === 'fog' ? (
                  <CloudFog className="h-2.5 w-2.5 text-[#CBD5E1]" />
                ) : (
                  <Sun className="h-2.5 w-2.5 text-[#FACC15]" />
                )}
                {WEATHER_LABELS[hud.weatherMode || 'clear']}
              </button>
              <button
                type="button"
                onClick={() => onOpenModal({ type: 'map' })}
                className={`inline-flex cursor-pointer items-center gap-0.5 font-bold hover:underline ${
                  caseProg.isUnlocked ? 'text-[#7AE582]' : 'text-[#F4C542]'
                }`}
              >
                <FileCheck2 className="h-2.5 w-2.5" />
                {caseProg.collected}/{caseProg.total}
              </button>
              {hud.accuracyPct < 100 && (
                <span
                  title="Night (-25%) and Fog (-50%) lower combat accuracy"
                  className="inline-flex items-center gap-0.5 border border-[#CBD5E1] bg-[#1E293B] px-1 py-0.5 font-bold text-[#FDE047]"
                >
                  <Eye className="h-2.5 w-2.5" />
                  ACC {hud.accuracyPct}%
                </span>
              )}
            </div>

            {/* Active Stat Buffs & Debuffs Row */}
            {(hud.activeBuffs.length > 0 ||
              hud.sanctuaryBuffSec > 0 ||
              (debuffs &&
                (debuffs.soaked ||
                  debuffs.burn ||
                  debuffs.poison > 0 ||
                  debuffs.stun > 0 ||
                  debuffs.freeze > 0 ||
                  debuffs.confusion > 0 ||
                  debuffs.shadow > 0 ||
                  debuffs.slow > 0 ||
                  debuffs.bleed > 0 ||
                  debuffs.blind > 0))) && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5 font-mono text-[9px] font-bold tabular-nums">
                {hud.sanctuaryBuffSec > 0 && (
                  <span className="border border-[#F4C542] bg-[#3B2F0E] px-1 py-0.5 text-[#FDE68A]">
                    RESTED {formatTimer(hud.sanctuaryBuffSec)}
                  </span>
                )}
                {hud.activeBuffs.map((b) => (
                  <span
                    key={b.stat}
                    className="border border-[#5EEAD4] bg-[#0F3D3E] px-1 py-0.5 text-[#99F6E4]"
                  >
                    ▲ {b.label} {formatTimer(b.remainingSec)}
                  </span>
                ))}
                {debuffs?.soaked && (
                  <span className="border border-[#38BDF8] bg-[#0C4A6E] px-1 py-0.5 text-[#E0F2FE]">
                    SOAKED -25% SPD
                  </span>
                )}
                {debuffs?.burn && (
                  <span className="inline-flex items-center gap-0.5 border border-[#FB923C] bg-[#7C2D12] px-1 py-0.5 text-[#FFEDD5]">
                    <Flame className="h-2.5 w-2.5" />
                    SUNBURN
                  </span>
                )}
                {debuffs && debuffs.poison > 0 && (
                  <span className="border border-[#4ADE80] bg-[#14532D] px-1 py-0.5 text-[#DCFCE7]">
                    POISON {Math.ceil(debuffs.poison)}s
                  </span>
                )}
                {debuffs && debuffs.stun > 0 && (
                  <span className="border border-[#FACC15] bg-[#713F12] px-1 py-0.5 text-[#FEF08A]">
                    STUN {Math.ceil(debuffs.stun)}s
                  </span>
                )}
                {debuffs && debuffs.freeze > 0 && (
                  <span className="border border-[#67E8F9] bg-[#164E63] px-1 py-0.5 text-[#CFFAFE]">
                    FREEZE {Math.ceil(debuffs.freeze)}s
                  </span>
                )}
                {debuffs && debuffs.confusion > 0 && (
                  <span className="border border-[#E879F9] bg-[#581C87] px-1 py-0.5 text-[#FAE8FF]">
                    CONFUSED {Math.ceil(debuffs.confusion)}s
                  </span>
                )}
                {debuffs && debuffs.shadow > 0 && (
                  <span className="border border-[#A78BFA] bg-[#2E1065] px-1 py-0.5 text-[#EDE9FE]">
                    SHADOW {Math.ceil(debuffs.shadow)}s
                  </span>
                )}
                {debuffs && debuffs.slow > 0 && (
                  <span className="border border-[#38BDF8] bg-[#0C4A6E] px-1 py-0.5 text-[#E0F2FE]">
                    SLOW {Math.ceil(debuffs.slow)}s
                  </span>
                )}
                {debuffs && debuffs.bleed > 0 && (
                  <span className="border border-[#F87171] bg-[#7F1D1D] px-1 py-0.5 text-[#FEE2E2]">
                    BLEED {Math.ceil(debuffs.bleed)}s
                  </span>
                )}
                {debuffs && debuffs.blind > 0 && (
                  <span className="border border-[#FDE047] bg-[#713F12] px-1 py-0.5 text-[#FEF9C3]">
                    BLIND {Math.ceil(debuffs.blind)}s
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top-Right: Clean Non-Overlapping Menu Dock + Collapsible Drawer */}
        <div className="relative pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="arcade-panel flex items-center gap-1 p-1.5">
            <button
              type="button"
              onClick={() => onOpenModal({ type: 'inventory' })}
              className="relative flex cursor-pointer items-center gap-1 whitespace-nowrap border-2 border-[#7FA4BE] bg-[#294965] px-2 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
            >
              <Backpack className="h-3.5 w-3.5 text-[#F4C542]" />
              <span className="hidden sm:inline">Bag</span>
              {(hud.availableStatPoints || 0) > 0 && (
                <span className="border border-[#09121B] bg-[#F4C542] px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-[#102030]">
                  +{hud.availableStatPoints}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenModal({ type: 'map' })}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap border-2 border-[#7FA4BE] bg-[#1F374D] px-2 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
            >
              <Map className="h-3.5 w-3.5 text-[#F4C542]" />
              <span className="hidden sm:inline">Map</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal({ type: 'cooking' })}
              title="Filipino Cooking Hearth"
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap border-2 border-[#7FA4BE] bg-[#1F374D] px-2 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 text-[#FB923C]" />
              <span className="hidden md:inline">Cook</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex cursor-pointer items-center gap-1 whitespace-nowrap border-2 px-2 py-1.5 font-display text-xs font-bold ${
                menuOpen
                  ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                  : 'border-[#7FA4BE] bg-[#1F374D] text-[#FFFFFF] hover:border-[#F4C542]'
              }`}
            >
              {menuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5 text-[#F4C542]" />}
              <span className="hidden sm:inline">Menu</span>
            </button>

            <button
              type="button"
              onClick={onPause}
              title="Pause"
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap border-2 border-[#7FA4BE] bg-[#16293B] px-2 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Collapsible Drawer: Quests, Houses, Allies, Trophies, News, Jobs, Audio Mixer & HUD Mode */}
          {menuOpen && (
            <div className="arcade-panel w-72 space-y-2.5 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.75)]">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenModal({ type: 'story' });
                  }}
                  className="flex cursor-pointer items-center gap-1.5 border border-[#7FA4BE] bg-[#1F374D] px-2.5 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#F4C542]" />
                  Quests [Q]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenModal({ type: 'houses' });
                  }}
                  className="flex cursor-pointer items-center gap-1.5 border border-[#7FA4BE] bg-[#1F374D] px-2.5 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
                >
                  <Home className="h-3.5 w-3.5 text-[#F4C542]" />
                  Houses [H]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenModal({ type: 'tropa' });
                  }}
                  className="flex cursor-pointer items-center gap-1.5 border border-[#7FA4BE] bg-[#1F374D] px-2.5 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
                >
                  <Users className="h-3.5 w-3.5 text-[#F4C542]" />
                  Allies [G]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenModal({ type: 'achievements' });
                  }}
                  className="flex cursor-pointer items-center gap-1.5 border border-[#F4C542] bg-[#2A3F2B] px-2.5 py-1.5 font-display text-xs font-bold text-[#F4C542]"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Trophies [V]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenModal({ type: 'news' });
                  }}
                  className="flex cursor-pointer items-center gap-1.5 border border-[#38BDF8] bg-[#17334A] px-2.5 py-1.5 font-display text-xs font-bold text-[#BAE6FD]"
                >
                  <Newspaper className="h-3.5 w-3.5 text-[#38BDF8]" />
                  Bataan News
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenModal({ type: 'side_jobs' });
                  }}
                  className="flex cursor-pointer items-center gap-1.5 border border-[#7AE582] bg-[#18382A] px-2.5 py-1.5 font-display text-xs font-bold text-[#BBF7D0]"
                >
                  <Briefcase className="h-3.5 w-3.5 text-[#7AE582]" />
                  Side Jobs
                </button>
              </div>

              {/* Audio Toggles & Sliders */}
              <div className="space-y-1.5 border-t border-[#3C5E77] pt-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleBgm}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1 border px-2 py-1 font-mono text-[11px] font-bold ${
                      progress.bgmEnabled
                        ? 'border-[#F4C542] bg-[#16293B] text-[#F4C542]'
                        : 'border-[#56748B] bg-[#132231] text-[#8CA8BE]'
                    }`}
                  >
                    <Music className="h-3 w-3" />
                    BGM: {progress.bgmEnabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleVoice}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1 border px-2 py-1 font-mono text-[11px] font-bold ${
                      progress.voiceEnabled
                        ? 'border-[#7FA4BE] bg-[#16293B] text-[#FFFFFF]'
                        : 'border-[#56748B] bg-[#132231] text-[#8CA8BE]'
                    }`}
                  >
                    {progress.voiceEnabled ? (
                      <Volume2 className="h-3 w-3 text-[#7AE582]" />
                    ) : (
                      <VolumeX className="h-3 w-3" />
                    )}
                    Voice: {progress.voiceEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <label className="flex items-center justify-between gap-2 font-mono text-[10px] text-[#D6E6F2]">
                  <span>SFX</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((progress.sfxVolume ?? GAME_CONFIG.audio.defaultSfxVolume) * 100)}
                    onChange={(e) => onChangeSfxVolume(Number(e.target.value) / 100)}
                    onPointerUp={() => noirAudio.playSfxPreview()}
                    className="flex-1 accent-[#F4C542] cursor-pointer"
                  />
                  <span className="w-8 text-right tabular-nums">
                    {Math.round((progress.sfxVolume ?? GAME_CONFIG.audio.defaultSfxVolume) * 100)}%
                  </span>
                </label>

                <label className="flex items-center justify-between gap-2 font-mono text-[10px] text-[#D6E6F2]">
                  <span>BGM</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((progress.bgmVolume ?? GAME_CONFIG.audio.defaultBgmVolume) * 100)}
                    onChange={(e) => onChangeBgmVolume(Number(e.target.value) / 100)}
                    className="flex-1 accent-[#38BDF8] cursor-pointer"
                  />
                  <span className="w-8 text-right tabular-nums">
                    {Math.round((progress.bgmVolume ?? GAME_CONFIG.audio.defaultBgmVolume) * 100)}%
                  </span>
                </label>
              </div>

              {/* HUD Layout Mode Switcher (Auto / Desktop / Mobile Touch) */}
              <div className="border-t border-[#3C5E77] pt-2">
                <p className="mb-1 font-mono text-[10px] font-bold text-[#9BC0D9]">CONTROLS LAYOUT</p>
                <div className="grid grid-cols-3 gap-1">
                  {(['auto', 'desktop', 'mobile'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChangeHudLayoutMode(mode)}
                      className={`flex cursor-pointer items-center justify-center gap-1 border px-1.5 py-1 font-mono text-[10px] font-bold uppercase ${
                        (progress.hudLayoutMode || 'auto') === mode
                          ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                          : 'border-[#56748B] bg-[#16293B] text-[#C8DFEE]'
                      }`}
                    >
                      {mode === 'desktop' ? (
                        <Monitor className="h-3 w-3" />
                      ) : mode === 'mobile' ? (
                        <Smartphone className="h-3 w-3" />
                      ) : null}
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== UPPER-CENTER: ACHIEVEMENTS, BOSS BAR, SIDE JOB, SPEECH ==================== */}
      <div className="mx-auto mt-1 flex w-full max-w-2xl flex-col items-center gap-1.5">
        {achievementToast && (
          <div className="arcade-gold-plate pointer-events-auto flex w-full max-w-lg items-center gap-3 border-[#F4C542] bg-[#142B3E] px-4 py-2 shadow-[0_6px_0_#09121B]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#09121B] bg-[#F4C542] text-[#102030]">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-mono text-[10px] font-bold tracking-wider text-[#5EEAD4]">
                ACHIEVEMENT UNLOCKED · TROPHIES [V]
              </p>
              <p className="truncate font-display text-sm font-bold text-[#F4C542]">{achievementToast.title}</p>
              <p className="truncate font-mono text-[11px] text-[#E4EFF7]">Reward: {achievementToast.rewardLabel}</p>
            </div>
          </div>
        )}

        {hud.activeSideJob && (
          <div className="arcade-panel pointer-events-auto flex w-full max-w-xl items-center justify-between gap-2 border-[#7AE582] px-3 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <Briefcase className="h-4 w-4 shrink-0 text-[#7AE582]" />
              <div className="min-w-0">
                <p className="truncate font-display text-xs font-bold text-[#F4C542]">
                  {hud.activeSideJob.title} → {hud.activeSideJob.targetZoneName} ({hud.activeSideJob.targetLabel})
                </p>
                <p className="font-mono text-[10px] text-[#C8DFEE]">
                  Pay: ₱{hud.activeSideJob.basePay} (+₱{hud.activeSideJob.bonusPay} speed tip) · +{hud.activeSideJob.xpReward} EXP
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`border px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums ${
                  hud.activeSideJob.remainingSec <= 20
                    ? 'border-[#FCA5A5] bg-[#7F1D1D] text-[#FEE2E2]'
                    : 'border-[#7AE582] bg-[#14532D] text-[#DCFCE7]'
                }`}
              >
                {formatTimer(hud.activeSideJob.remainingSec)}
              </span>
              <button
                type="button"
                onClick={onCancelSideJob}
                title="Cancel Side Job"
                className="cursor-pointer border border-[#56748B] bg-[#16293B] p-1 text-[#C8DFEE] hover:border-[#FCA5A5] hover:text-[#FCA5A5]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {hud.bossHud && (
          <div className="arcade-panel flex w-full items-center gap-3 border-[#DC2626] px-3 py-2">
            <span className="shrink-0 border border-[#09121B] bg-[#F4C542] px-1.5 py-0.5 font-display text-[10px] font-bold text-[#102030]">
              VS
            </span>
            {hud.bossHud.profile && <BossMiniPortrait profile={hud.bossHud.profile} />}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-display text-sm font-bold tracking-wide text-[#F4C542]">
                      {hud.bossHud.name}
                    </p>
                    {hud.bossHud.weakSpotActive && (
                      <span className="animate-pulse border border-[#09121B] bg-[#FDE047] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#09121B]">
                        ★ WEAK SPOT 2.0× DMG!
                      </span>
                    )}
                    {!hud.bossHud.weakSpotActive && hud.bossHud.telegraphLabel && (
                      <span className="border border-[#FCA5A5] bg-[#7F1D1D] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FEF2E2]">
                        ⚠ {hud.bossHud.telegraphLabel}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-mono text-[10px] text-[#C8DFEE]">{hud.bossHud.title}</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#FFFFFF] tabular-nums whitespace-nowrap">
                  {hud.bossHud.immune ? 'IMMUNE (24/24 REQ)' : `${hud.bossHud.hp} / ${hud.bossHud.maxHp}`}
                </span>
              </div>
              <div className="relative mt-1 h-3.5 w-full overflow-hidden border-2 border-[#09121B] bg-[#0F1E2C]">
                <div
                  className={`relative h-full transition-all duration-150 ${
                    hud.bossHud.immune ? 'bg-[#F4C542]' : 'bg-[#D63A3A]'
                  }`}
                  style={{ width: `${Math.max(0, (hud.bossHud.hp / Math.max(1, hud.bossHud.maxHp)) * 100)}%` }}
                >
                  <div className="h-1 w-full bg-white/30" />
                </div>
                <div className="arcade-segments pointer-events-none absolute inset-0" />
              </div>
              {hud.bossHud.shieldMax && hud.bossHud.shieldMax > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#38BDF8] whitespace-nowrap">
                    {hud.bossHud.shieldHp && hud.bossHud.shieldHp > 0
                      ? 'SHIELD · PRESS [L] TO SHATTER'
                      : 'SHIELD BROKEN!'}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden border border-[#09121B] bg-[#0F1E2C]">
                    <div
                      className="h-full bg-[#38BDF8] transition-all duration-150"
                      style={{
                        width: `${Math.max(0, ((hud.bossHud.shieldHp || 0) / hud.bossHud.shieldMax) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {hud.speechBanner && (
          <div className="arcade-gold-plate w-full max-w-xl px-4 py-1.5 text-center">
            <p className="font-display text-xs font-bold tracking-wide text-[#F4C542]">
              {hud.speechBanner.speaker}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#FFFFFF]">{hud.speechBanner.text}</p>
          </div>
        )}
      </div>

      {/* ==================== FISHING MINI-GAME OVERLAY ==================== */}
      {hud.fishingHud && (
        <div className="pointer-events-auto mx-auto my-auto w-full max-w-md px-2">
          <div className="arcade-panel border-[#38BDF8] bg-[#0E2235]/95 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-[#38BDF8]" />
                <div>
                  <p className="font-display text-sm font-bold text-[#F4C542]">
                    {hud.fishingHud.phase === 'casting'
                      ? 'Casting Bamboo Line...'
                      : hud.fishingHud.phase === 'waiting'
                        ? 'Waiting for a Bite...'
                        : hud.fishingHud.phase === 'bite'
                          ? 'BITE! PRESS [E] / [SPACE] OR TAP HOOK!'
                          : `Reeling in ${hud.fishingHud.fishName || 'Filipino Fish'}!`}
                  </p>
                  <p className="font-mono text-[11px] text-[#BAE6FD]">
                    {hud.fishingHud.phase === 'reeling'
                      ? 'Hold [Space]/[E] or Hold REEL to keep marker inside the green bar!'
                      : 'Watch the bobber closely!'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => bridgeRef.current?.cancelFishing?.()}
                className="cursor-pointer border border-[#56748B] bg-[#16293B] px-2 py-1 font-mono text-[10px] font-bold text-[#C8DFEE] hover:border-[#FCA5A5]"
              >
                Cancel
              </button>
            </div>

            {hud.fishingHud.phase === 'reeling' && (
              <div className="mt-3 space-y-2.5">
                {/* Tension / Sweet-Spot Track */}
                <div className="relative h-7 w-full overflow-hidden border-2 border-[#09121B] bg-[#0B1724]">
                  {/* Green Sweet Spot */}
                  <div
                    className="absolute inset-y-0 border-x-2 border-[#86EFAC] bg-[#16A34A]/55"
                    style={{
                      left: `${Math.max(0, (hud.fishingHud.zoneCenter - hud.fishingHud.zoneWidth / 2) * 100)}%`,
                      width: `${Math.min(100, hud.fishingHud.zoneWidth * 100)}%`,
                    }}
                  />
                  {/* Player Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-3 -translate-x-1/2 border border-[#09121B] bg-[#F4C542] shadow-[0_0_8px_#FDE047]"
                    style={{ left: `${Math.max(2, Math.min(98, hud.fishingHud.cursorPos * 100))}%` }}
                  />
                </div>

                {/* Catch Progress Bar */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#7AE582]">CATCH</span>
                  <div className="h-3 flex-1 overflow-hidden border border-[#09121B] bg-[#0B1724]">
                    <div
                      className="h-full bg-gradient-to-r from-[#22C55E] to-[#86EFAC] transition-all duration-75"
                      style={{ width: `${Math.round(hud.fishingHud.reelProgress * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-[11px] font-bold text-[#FFFFFF] tabular-nums">
                    {Math.round(hud.fishingHud.reelProgress * 100)}%
                  </span>
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onPointerDown={() => {
                  bridgeRef.current?.triggerFishingAction?.();
                  bridgeRef.current?.setFishingHold?.(true);
                }}
                onPointerUp={() => bridgeRef.current?.setFishingHold?.(false)}
                onPointerLeave={() => bridgeRef.current?.setFishingHold?.(false)}
                onPointerCancel={() => bridgeRef.current?.setFishingHold?.(false)}
                className={`min-h-[48px] w-full touch-none select-none cursor-pointer border-2 px-6 py-2.5 font-display text-sm font-black tracking-wide ${
                  hud.fishingHud.phase === 'bite'
                    ? 'animate-pulse border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7DD3FC] bg-[#1E4B78] text-[#FFFFFF] active:bg-[#2B6CB0]'
                }`}
              >
                {hud.fishingHud.phase === 'bite'
                  ? 'HOOK FISH NOW!'
                  : hud.fishingHud.phase === 'reeling'
                    ? 'HOLD TO REEL IN'
                    : 'WAITING FOR BITE...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM CONTROLS: SKILL HOTBAR + DESKTOP / MOBILE TOUCH UI ==================== */}
      <div className="mt-auto flex flex-col gap-2">
        {/* Interact Prompt Plate (Always Easy to Reach Above Bottom Controls) */}
        {hud.nearestTarget && !hud.fishingHud && (
          <div className="mx-auto">
            <button
              type="button"
              onClick={() => bridgeRef.current?.triggerInteract()}
              className="arcade-gold-plate pointer-events-auto flex min-h-[44px] cursor-pointer items-center gap-2.5 px-4 py-2 text-left transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#09121B] bg-[#F4C542] font-mono text-xs font-bold text-[#102030]">
                E
              </span>
              <div>
                <p className="font-display text-xs font-bold text-[#F4C542]">{hud.nearestTarget.label}</p>
                <p className="font-mono text-[11px] text-[#FFFFFF]">{hud.nearestTarget.sublabel}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-[#F4C542]" />
            </button>
          </div>
        )}

        {/* Compact Level-Gated [1]-[8] Skill Hotbar */}
        <div className="mx-auto flex max-w-full items-center overflow-x-auto">
          <div className="arcade-panel pointer-events-auto flex items-center gap-1 px-1.5 py-1">
            {MAGIC_SKILLS.map((skill, idx) => {
              const unlocked = isSkillUnlockedForLevel(skill, progress.level);
              const cd = hud.magicCooldowns?.[skill.id] || 0;
              const isWhite = skill.school === 'white_magic';
              const notEnoughSp = hud.sp < skill.spCost;
              const canCast = unlocked && cd <= 0 && !notEnoughSp;
              return (
                <React.Fragment key={skill.id}>
                  {idx === 4 && <div className="mx-0.5 h-7 w-[2px] bg-[#3C5E77]" />}
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && onCastMagicSkill(skill.id)}
                    title={
                      unlocked
                        ? `${skill.name} (${skill.filipinoTitle}) · ${skill.spCost} SP · ${skill.cooldownSec}s CD — ${skill.description}`
                        : `Unlocks at Lv ${skill.requiredLevel}: ${skill.name}`
                    }
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center border-2 transition-transform ${
                      !unlocked
                        ? 'cursor-not-allowed border-[#34495A] bg-[#0D1721]/90 opacity-50 grayscale'
                        : isWhite
                          ? canCast
                            ? 'cursor-pointer border-[#F4C542] bg-[#1E3548] hover:-translate-y-0.5'
                            : 'cursor-pointer border-[#8D7A3B] bg-[#152432] opacity-80'
                          : canCast
                            ? 'cursor-pointer border-[#C084FC] bg-[#26193B] hover:-translate-y-0.5'
                            : 'cursor-pointer border-[#6A4C8B] bg-[#181226] opacity-80'
                    }`}
                  >
                    <MagicIconCanvas iconKey={getMagicSkillIconKey(skill.id)} size={28} />
                    <span
                      className={`absolute -left-1 -top-1 border border-[#09121B] px-1 font-mono text-[8px] font-bold leading-none ${
                        !unlocked
                          ? 'bg-[#334155] text-[#CBD5E1]'
                          : isWhite
                            ? 'bg-[#F4C542] text-[#102030]'
                            : 'bg-[#C084FC] text-[#120A21]'
                      }`}
                    >
                      {skill.hotkey}
                    </span>
                    {!unlocked ? (
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-[#09121B]/90 py-0.5 font-mono text-[8px] font-bold text-[#94A3B8]">
                        <Lock className="h-2 w-2" />
                        Lv{skill.requiredLevel}
                      </div>
                    ) : cd > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#09121B]/80 font-mono text-[11px] font-bold text-[#FFFFFF] tabular-nums">
                        {Math.ceil(cd)}
                      </div>
                    ) : (
                      <span className="absolute bottom-0 right-0.5 font-mono text-[8px] font-bold text-[#7DD3FC]">
                        {skill.spCost}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* MOBILE / TABLET DEDICATED TOUCH LAYOUT */}
        {isMobileUi ? (
          <div className="flex items-end justify-between gap-2 pt-1">
            {/* Lower-Left: Quick Toggle Strip + Virtual Joystick */}
            <div className="pointer-events-auto flex flex-col items-start gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={onEatEquippedFood}
                  disabled={!equippedFood || equippedFoodQty <= 0}
                  className="flex min-h-[36px] cursor-pointer items-center gap-1 border border-[#7FA4BE] bg-[#16293B]/90 px-2 py-1 font-mono text-[10px] font-bold text-[#FFFFFF] disabled:opacity-45"
                >
                  <AtlasMiniIcon spriteId="bataan_cashew" size={16} />
                  {equippedFoodQty > 0 ? `×${equippedFoodQty}` : 'Food'}
                </button>
                {progress.hasUmbrella && (
                  <button
                    type="button"
                    onClick={onToggleUmbrella}
                    className={`flex min-h-[36px] cursor-pointer items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold ${
                      progress.umbrellaOpen
                        ? 'border-[#F4C542] bg-[#2463B5] text-[#FFFFFF]'
                        : 'border-[#7FA4BE] bg-[#16293B]/90 text-[#C8DFEE]'
                    }`}
                  >
                    <AtlasMiniIcon spriteId="ang_payong" size={16} />
                    Payong
                  </button>
                )}
                {progress.hasBike && (
                  <button
                    type="button"
                    onClick={onToggleBike}
                    className={`flex min-h-[36px] cursor-pointer items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold ${
                      progress.ridingBike
                        ? 'border-[#F4C542] bg-[#2E7D47] text-[#FFFFFF]'
                        : 'border-[#7FA4BE] bg-[#16293B]/90 text-[#C8DFEE]'
                    }`}
                  >
                    <AtlasMiniIcon spriteId="bisikleta" size={16} />
                    Bike
                  </button>
                )}
              </div>
              <VirtualJoystick onMoveDir={(dir) => bridgeRef.current?.setTouchMove(dir)} />
            </div>

            {/* Lower-Right: Ergonomic >=48px Touch Action Cluster (with Shield & Dodge Cooldowns) */}
            <div className="pointer-events-auto flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => bridgeRef.current?.cycleTiradorAmmo?.()}
                  className="flex h-11 min-w-[54px] touch-none select-none cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-[#7FA4BE] bg-[#1B3347]/90 px-2 font-mono text-[10px] font-bold text-[#E4EFF7] active:scale-95"
                >
                  <span>AMMO</span>
                  <span className="text-[9px] text-[#F4C542]">
                    {hud.activeTiradorAmmo === 'sili_bomb'
                      ? 'SILI'
                      : hud.activeTiradorAmmo === 'agimat_stone'
                        ? 'AGIMAT'
                        : 'STONE'}
                  </span>
                </button>
                <button
                  type="button"
                  onPointerDown={() => bridgeRef.current?.triggerSkill()}
                  className="flex h-12 min-w-[56px] touch-none select-none cursor-pointer items-center justify-center rounded-lg border-2 border-[#FFF0B3] bg-[#F4C542] px-2.5 font-display text-xs font-black text-[#102030] shadow-md active:scale-95"
                >
                  SHOT
                </button>
                <button
                  type="button"
                  onPointerDown={() => bridgeRef.current?.triggerJump()}
                  className="flex h-12 min-w-[56px] touch-none select-none cursor-pointer items-center justify-center rounded-lg border-2 border-[#7FA4BE] bg-[#21415C]/95 px-2.5 font-display text-xs font-black text-[#FFFFFF] shadow-md active:scale-95"
                >
                  JUMP
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={dodgeCd > 0}
                  onPointerDown={() => bridgeRef.current?.triggerDash()}
                  className={`relative flex h-13 w-14 touch-none select-none flex-col items-center justify-center rounded-xl border-2 font-mono text-[10px] font-black shadow-md active:scale-95 ${
                    dodgeCd > 0
                      ? 'border-[#475569] bg-[#1E293B]/85 text-[#94A3B8]'
                      : 'cursor-pointer border-[#5EEAD4] bg-[#115E59]/95 text-[#CCFBF1]'
                  }`}
                >
                  <Wind className="h-4 w-4" />
                  <span>{dodgeCd > 0 ? `${dodgeCd.toFixed(1)}s` : 'DODGE'}</span>
                </button>

                <button
                  type="button"
                  disabled={shieldCd > 0}
                  onPointerDown={() => bridgeRef.current?.triggerShield()}
                  className={`relative flex h-13 w-14 touch-none select-none flex-col items-center justify-center rounded-xl border-2 font-mono text-[10px] font-black shadow-md active:scale-95 ${
                    shieldCd > 0
                      ? 'border-[#475569] bg-[#1E293B]/85 text-[#94A3B8]'
                      : 'cursor-pointer border-[#7DD3FC] bg-[#1E4B78]/95 text-[#E0F2FE]'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>{shieldCd > 0 ? `${shieldCd.toFixed(1)}s` : 'SHIELD'}</span>
                </button>

                <button
                  type="button"
                  onPointerDown={() => bridgeRef.current?.triggerAttack()}
                  className="flex h-15 w-16 touch-none select-none cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[#FDE047] bg-gradient-to-b from-[#EF4444] to-[#B91C1C] font-display text-sm font-black text-[#FFFFFF] shadow-[0_6px_18px_rgba(220,38,38,0.55)] active:scale-95"
                >
                  ATK
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* DESKTOP BOTTOM QUICK-SLOTS + COOLDOWNS + KEYBOARD LEGEND */
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="arcade-panel pointer-events-auto flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
              <button
                type="button"
                onClick={onEatEquippedFood}
                disabled={!equippedFood || equippedFoodQty <= 0}
                className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-2 border-[#7FA4BE] bg-[#1F374D] px-2 py-1 font-mono text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="border border-[#09121B] bg-[#F4C542] px-1 text-[10px] font-bold text-[#102030]">F</span>
                <AtlasMiniIcon spriteId="bataan_cashew" size={18} />
                {equippedFood && equippedFoodQty > 0 ? `${equippedFood.name} ×${equippedFoodQty}` : 'No Food'}
              </button>

              {progress.hasUmbrella && (
                <button
                  type="button"
                  onClick={onToggleUmbrella}
                  className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-2 px-2 py-1 font-mono text-xs font-bold ${
                    progress.umbrellaOpen
                      ? 'border-[#F4C542] bg-[#2463B5] text-[#FFFFFF]'
                      : 'border-[#7FA4BE] bg-[#1F374D] text-[#C8DFEE]'
                  }`}
                >
                  <span className="border border-[#09121B] bg-[#F4C542] px-1 text-[10px] font-bold text-[#102030]">U</span>
                  <AtlasMiniIcon spriteId="ang_payong" size={18} />
                  Payong: {progress.umbrellaOpen ? 'Open' : 'Closed'}
                </button>
              )}

              {progress.hasBike && (
                <button
                  type="button"
                  onClick={onToggleBike}
                  className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-2 px-2 py-1 font-mono text-xs font-bold ${
                    progress.ridingBike
                      ? 'border-[#F4C542] bg-[#2E7D47] text-[#FFFFFF]'
                      : 'border-[#7FA4BE] bg-[#1F374D] text-[#C8DFEE]'
                  }`}
                >
                  <span className="border border-[#09121B] bg-[#F4C542] px-1 text-[10px] font-bold text-[#102030]">R</span>
                  <AtlasMiniIcon spriteId="bisikleta" size={18} />
                  Bike: {progress.ridingBike ? 'Riding' : 'Parked'}
                </button>
              )}

              <button
                type="button"
                onClick={() => bridgeRef.current?.cycleTiradorAmmo?.()}
                className="flex cursor-pointer items-center gap-1 whitespace-nowrap border-2 border-[#F4C542] bg-[#1F374D] px-2 py-1 font-mono text-xs font-bold text-[#FFFFFF] hover:bg-[#294964]"
                title="Press [C] to switch Tirador ammo · Press [L] to shoot"
              >
                <span className="border border-[#09121B] bg-[#F4C542] px-1 text-[10px] font-bold text-[#102030]">L/C</span>
                {hud.activeTiradorAmmo === 'sili_bomb'
                  ? 'Sili Bomb'
                  : hud.activeTiradorAmmo === 'agimat_stone'
                    ? 'Agimat'
                    : 'Pebble'}
              </button>

              {/* Shield & Dodge Cooldown Readouts */}
              <span
                className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[11px] font-bold tabular-nums ${
                  shieldCd > 0
                    ? 'border-[#F87171] bg-[#451A1A] text-[#FCA5A5]'
                    : 'border-[#7DD3FC] bg-[#14304B] text-[#BAE6FD]'
                }`}
              >
                <Shield className="h-3 w-3" />
                {shieldCd > 0 ? `Shield ${shieldCd.toFixed(1)}s` : 'Shield Ready [K]'}
              </span>
              <span
                className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[11px] font-bold tabular-nums ${
                  dodgeCd > 0
                    ? 'border-[#F87171] bg-[#451A1A] text-[#FCA5A5]'
                    : 'border-[#5EEAD4] bg-[#0F3D3E] text-[#99F6E4]'
                }`}
              >
                <Wind className="h-3 w-3" />
                {dodgeCd > 0 ? `Dodge ${dodgeCd.toFixed(1)}s` : 'Dodge Ready [Shift]'}
              </span>

              {hud.companionStatus && (
                <div className="flex items-center gap-1.5 border-l-2 border-[#3C5E77] pl-2 font-mono text-xs font-bold text-[#F4C542] whitespace-nowrap">
                  <span>Ally: {hud.companionStatus.name}</span>
                  <span className="text-[#9BC0D9]">· {hud.companionStatus.action}</span>
                </div>
              )}
            </div>

            <div className="arcade-panel pointer-events-auto hidden items-center px-3 py-2 xl:flex">
              <span className="font-mono text-[11px] font-semibold text-[#D6E6F2]">
                A/D Move · Space Jump · J/Click Attack · K Shield · Shift Dodge · L Tirador · E Interact/Fish
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
