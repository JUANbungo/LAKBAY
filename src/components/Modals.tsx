import React, { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  Car,
  CheckCircle2,
  Fish,
  Lock,
  MapPin,
  Mountain,
  Newspaper,
  ShieldAlert,
  Sparkles,
  Sprout,
  Trophy,
  UtensilsCrossed,
  Volume2,
  X,
} from 'lucide-react';
import { englishVoice } from '../game/audio';
import {
  BATAAN_HIGHWAYS,
  BATAAN_WORLD_MAP,
  BossProfile,
  getFinalBossProgress,
  getTownBossConfig,
} from '../game/bataanData';
import { ACHIEVEMENTS, BIKE_SKINS, NATIONAL_HERO_GHOSTS } from '../game/expansionData';
import { COOKING_RECIPES, GAME_CONFIG, getZoneLabel, NEWS_FEED, NewsArticle } from '../game/gameConfig';
import { getMagicSkillIconKey, MAGIC_SKILLS } from '../game/magicSkillsData';
import { drawBossPortrait, drawSanctuaryRoom, drawSpectralHeroGhost } from '../game/noirRenderer';
import {
  ActiveModal,
  ActiveSideJobState,
  DerivedStats,
  PlayerProgress,
  RpgStatAllocation,
  ZoneId,
} from '../game/types';
import { drawV2Icon, initV2Sprites, subscribeV2Loaded } from '../game/v2Sprites';
import {
  ALLY_SUMMON_REQUIRED_RANK,
  DECOR_UPGRADES,
  FOODS,
  FRIENDS,
  getAllySummonCost,
  getBondRank,
  getGearById,
  HANGOUT_ENERGY_COST,
  HOUSES,
  RPG_GEAR,
  STORY_CHAPTERS,
  ZONES,
} from '../game/worldData';
import { CharacterInventoryModal } from './CharacterInventoryModal';

interface ModalsProps {
  modal: ActiveModal;
  progress: PlayerProgress;
  derivedStats: DerivedStats;
  activeSideJob: ActiveSideJobState | null;
  onClose: () => void;
  onReplayPrologue: () => void;
  onTravel: (zoneId: ZoneId) => void;
  onOpenMap: () => void;
  onOpenCooking: () => void;
  onBuyHouse: (houseId: string) => void;
  onRestInHouse: (houseId: string) => void;
  onBuyDecor: (decorId: string) => void;
  onGiftFood: (friendId: string, foodId: string) => void;
  onHangOut: (friendId: string) => void;
  onToggleCompanion: (friendId: string) => void;
  onBuyFood: (foodId: string) => void;
  onEatFood: (foodId: string) => void;
  onEquipFood: (foodId: string) => void;
  onSellFood: (foodId: string) => void;
  onSellLoot: (lootId: string) => void;
  onSellMaterial: (materialId: string) => void;
  onConsumeMaterial: (materialId: string) => void;
  onSellFish: (fishId: string) => void;
  onBuyFishingRod: () => void;
  onCookRecipe: (recipeId: string) => void;
  onStartSideJob: (job: ActiveSideJobState) => void;
  onCancelSideJob: () => void;
  onBuyGear: (itemId: string) => void;
  onEquipGear: (itemId: string) => void;
  onUnequipSlot: (slot: 'headgear' | 'back' | 'weapon' | 'accessory') => void;
  onSellGear: (itemId: string) => void;
  onEquipBikeSkin: (skinId: string) => void;
  onToggleBike: () => void;
  onToggleUmbrella: () => void;
  onAllocateStat: (stat: keyof RpgStatAllocation) => void;
  onResetStats: () => void;
  onLearnMagicSkill: (skillId: string) => void;
}

const MagicSkillIconCanvas: React.FC<{ iconKey: string; size?: number }> = ({ iconKey, size = 44 }) => {
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
  return <canvas ref={ref} width={size} height={size} className="block shrink-0 border-2 border-[#09121B] bg-[#0F1E2C]" />;
};

const BossPortraitCanvas: React.FC<{ boss: BossProfile; size?: number }> = ({ boss, size = 60 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawBossPortrait(ctx, boss, size);
  }, [boss, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="pixel-canvas shrink-0 border border-[#7FA4BE]"
    />
  );
};

export const Modals: React.FC<ModalsProps> = ({
  modal,
  progress,
  derivedStats,
  activeSideJob,
  onClose,
  onReplayPrologue,
  onTravel,
  onOpenMap,
  onOpenCooking,
  onBuyHouse,
  onRestInHouse,
  onBuyDecor,
  onGiftFood,
  onHangOut,
  onToggleCompanion,
  onBuyFood,
  onEatFood,
  onEquipFood,
  onSellFood,
  onSellLoot,
  onSellMaterial,
  onConsumeMaterial,
  onSellFish,
  onBuyFishingRod,
  onCookRecipe,
  onStartSideJob,
  onCancelSideJob,
  onBuyGear,
  onEquipGear,
  onUnequipSlot,
  onSellGear,
  onEquipBikeSkin,
  onToggleBike,
  onToggleUmbrella,
  onAllocateStat,
  onResetStats,
  onLearnMagicSkill,
}) => {
  const [npcTab, setNpcTab] = useState<'talk' | 'shop' | 'social'>('talk');
  const [newsFilter, setNewsFilter] = useState<'ALL' | NewsArticle['category']>('ALL');
  const [selectedHouseId, setSelectedHouseId] = useState<string>('house_defender_home');
  const [selectedMapLguId, setSelectedMapLguId] = useState<string>('balanga');
  const [barangaySearch, setBarangaySearch] = useState<string>('');
  const roomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (modal?.type === 'npc') {
      setNpcTab(modal.tab || 'talk');
      const zone = ZONES[progress.zoneId];
      const npc = zone.npcs.find((n) => n.id === modal.npcId);
      if (npc && progress.voiceEnabled) {
        englishVoice.speak(npc.greeting, npc.voiceProfile);
      }
    } else if (modal?.type === 'hero_ghost') {
      const ghost = NATIONAL_HERO_GHOSTS.find((g) => g.id === modal.heroId);
      if (ghost && progress.voiceEnabled) {
        englishVoice.speak(ghost.blessingQuote, ghost.voiceProfile);
      }
    } else if (modal?.type === 'houses') {
      setSelectedHouseId(modal.focusHouseId || progress.ownedHouseIds[0] || HOUSES[0].id);
    } else if (modal?.type === 'map') {
      const isTown = BATAAN_WORLD_MAP.some((m) => m.id === progress.zoneId);
      setSelectedMapLguId(isTown ? progress.zoneId : 'balanga');
      setBarangaySearch('');
    }
    return () => {
      if (modal?.type === 'npc' || modal?.type === 'hero_ghost' || modal?.type === 'news') {
        englishVoice.stop();
      }
    };
  }, [modal, progress.zoneId, progress.voiceEnabled, progress.ownedHouseIds]);

  useEffect(() => {
    if (modal?.type !== 'houses') return;
    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const house = HOUSES.find((h) => h.id === selectedHouseId) || HOUSES[0];
    let rafId = 0;
    const start = performance.now();
    const render = (now: number) => {
      drawSanctuaryRoom(ctx, canvas.width, canvas.height, house, progress.homeDecorIds, (now - start) / 1000);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [modal, selectedHouseId, progress.homeDecorIds]);

  useEffect(() => {
    if (modal?.type !== 'hero_ghost') return;
    const ghost = NATIONAL_HERO_GHOSTS.find((g) => g.id === modal.heroId);
    const canvas = ghostCanvasRef.current;
    if (!ghost || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();
    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.fillStyle = '#0A1C2B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawSpectralHeroGhost(ctx, ghost, canvas.width * 0.5, canvas.height * 0.92, t, true);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [modal]);

  if (!modal) return null;

  if (modal.type === 'inventory') {
    return (
      <CharacterInventoryModal
        progress={progress}
        derivedStats={derivedStats}
        initialTab={modal.initialTab}
        onClose={onClose}
        onEquipGear={onEquipGear}
        onUnequipSlot={onUnequipSlot}
        onSellGear={onSellGear}
        onEquipBikeSkin={onEquipBikeSkin}
        onEatFood={onEatFood}
        onEquipFood={onEquipFood}
        onSellFood={onSellFood}
        onSellLoot={onSellLoot}
        onSellMaterial={onSellMaterial}
        onConsumeMaterial={onConsumeMaterial}
        onSellFish={onSellFish}
        onToggleBike={onToggleBike}
        onToggleUmbrella={onToggleUmbrella}
        onAllocateStat={onAllocateStat}
        onResetStats={onResetStats}
      />
    );
  }

  // ================= ATE MAYA'S BATAAN CIVIC NEWS DESK =================
  if (modal.type === 'news') {
    const filteredNews =
      newsFilter === 'ALL' ? NEWS_FEED : NEWS_FEED.filter((article) => article.category === newsFilter);
    const categories: ('ALL' | NewsArticle['category'])[] = [
      'ALL',
      'PATCH',
      'WEATHER',
      'NEW AREA',
      'ECONOMY',
      'COMBAT',
    ];
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/84 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden border-[#38BDF8]">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#38BDF8]/60 bg-[#13293D] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#09121B] bg-[#38BDF8] text-[#0B1520]">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold text-[#7DD3FC]">
                  ATE MAYA · BATAAN CIVIC REPORTER &amp; LIVE FIELD BULLETINS
                </p>
                <h2 className="font-display text-xl font-bold text-[#F4C542]">Bataan News Desk</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-[#3C5E77] bg-[#162C40] px-5 py-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewsFilter(cat)}
                className={`cursor-pointer whitespace-nowrap border px-2.5 py-1 font-mono text-[11px] font-bold ${
                  newsFilter === cat
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#56748B] bg-[#1C3348] text-[#C8DFEE]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 bp-scroll">
            {filteredNews.map((article) => (
              <div key={article.id} className="bp-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="border border-[#09121B] bg-[#38BDF8] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0B1520]">
                      {article.category}
                    </span>
                    <span className="font-mono text-[11px] text-[#9BC0D9]">{article.date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      englishVoice.speak(`${article.headline}. ${article.body}`, {
                        pitch: 1.18,
                        rate: 1.0,
                        style: 'girl_npc',
                      })
                    }
                    className="inline-flex cursor-pointer items-center gap-1 border border-[#7FA4BE] bg-[#1A3147] px-2.5 py-1 font-mono text-[10px] font-bold text-[#BAE6FD] hover:border-[#F4C542]"
                  >
                    <Volume2 className="h-3 w-3" />
                    Listen to Ate Maya
                  </button>
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-[#F4C542]">{article.headline}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#E4EFF7]">{article.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= FILIPINO COOKING HEARTH MODAL =================
  if (modal.type === 'cooking') {
    const totalOwnedFish = Object.values(progress.fishBag || {}).reduce((sum, n) => sum + (n || 0), 0);
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/84 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden border-[#FB923C]">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#FB923C]/60 bg-[#241B14] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#09121B] bg-[#FB923C] text-[#1C120B]">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold text-[#FDBA74]">
                  BATAAN CARINDERIA &amp; HEARTH · COOK FRESH FISH &amp; HERBS FOR 2–5 MIN STAT BUFFS
                </p>
                <h2 className="font-display text-xl font-bold text-[#F4C542]">Filipino Cooking Station</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 bp-scroll sm:grid-cols-2">
            {COOKING_RECIPES.map((recipe) => {
              const ownedCooked = progress.foodPouch[recipe.foodId] || 0;
              const checks = recipe.ingredients.map((ing) => {
                const have = ing.itemId.startsWith('fish_')
                  ? totalOwnedFish
                  : progress.materialsBag?.[ing.itemId] || 0;
                return { ...ing, have, ok: have >= ing.qty };
              });
              const canCook = checks.every((c) => c.ok);
              return (
                <div key={recipe.id} className="bp-card flex flex-col justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-[#F4C542]">{recipe.name}</h3>
                      {ownedCooked > 0 && (
                        <span className="border border-[#7AE582] bg-[#14532D] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#DCFCE7]">
                          In Pouch ×{ownedCooked}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#E4EFF7]">{recipe.description}</p>
                    <p className="mt-1.5 font-mono text-[11px] font-bold text-[#7AE582]">
                      +{recipe.hpRestore} HP · +{recipe.spRestore} SP · +{recipe.energyRestore} EN
                      {recipe.buff
                        ? ` · ★ ${recipe.buff.label} (${Math.round(recipe.buff.durationSec / 60)}m)`
                        : ''}
                    </p>
                    <div className="mt-2.5 space-y-1 border-t border-[#3C5E77] pt-2">
                      {checks.map((c) => (
                        <div key={c.itemId} className="flex items-center justify-between font-mono text-[11px]">
                          <span className={c.ok ? 'text-[#DCFCE7]' : 'text-[#FCA5A5]'}>
                            {c.ok ? '✓' : '✗'} {c.label}
                          </span>
                          <span className={c.ok ? 'font-bold text-[#7AE582]' : 'font-bold text-[#FCA5A5]'}>
                            {c.have}/{c.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canCook}
                    onClick={() => onCookRecipe(recipe.id)}
                    className="w-full cursor-pointer border-2 border-[#FFF0B3] bg-[#F4C542] px-4 py-2 font-display text-xs font-bold text-[#102030] hover:bg-[#FFD45C] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {canCook ? `Cook ${recipe.name}` : 'Gather Missing Ingredients'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= BATAAN CIVIC DISPATCH — SIDE JOBS (FOOD DELIVERY & TAXI) =================
  if (modal.type === 'side_jobs') {
    const candidateZones: ZoneId[] = (
      ['balanga', 'orani', 'hermosa', 'dinalupihan', 'samal', 'abucay', 'pilar', 'orion', 'limay', 'bagac', 'morong'] as ZoneId[]
    ).filter((z) => z !== progress.zoneId);

    const foodJobs: ActiveSideJobState[] = candidateZones.slice(0, 3).map((zId, idx) => {
      const z = ZONES[zId];
      const cfg = GAME_CONFIG.sideJobs.foodDelivery;
      const meals = ['Hot Sinigang & Kanin', 'Bataan Halo-Halo & Kwek-Kwek', 'Fresh Inihaw na Bangus Platter'];
      const targetX = z.houseX || z.safeSpawnX + 420;
      return {
        kind: 'food_delivery',
        title: `Food Delivery: ${meals[idx % meals.length]}`,
        pickupLabel: getZoneLabel(progress.zoneId),
        targetZoneId: zId,
        targetZoneName: z.name,
        targetX,
        targetLabel: `${z.name} Safe House`,
        remainingSec: cfg.timeLimitSec,
        maxSec: cfg.timeLimitSec,
        basePay: cfg.baseRewardPesos,
        bonusPay: cfg.speedBonusPesos,
        xpReward: cfg.rewardXp,
      };
    });

    const taxiJobs: ActiveSideJobState[] = candidateZones.slice(3, 6).map((zId, idx) => {
      const z = ZONES[zId];
      const cfg = GAME_CONFIG.sideJobs.taxi;
      const riders = ['Nurse heading to shift', 'Market vendor with baskets', 'Student commuting to plaza'];
      const targetX = z.safeSpawnX + 260;
      return {
        kind: 'taxi',
        title: `Bataan Taxi: ${riders[idx % riders.length]}`,
        pickupLabel: getZoneLabel(progress.zoneId),
        targetZoneId: zId,
        targetZoneName: z.name,
        targetX,
        targetLabel: `${z.name} Plaza Drop-Off`,
        remainingSec: cfg.timeLimitSec,
        maxSec: cfg.timeLimitSec,
        basePay: cfg.baseFarePesos,
        bonusPay: cfg.speedTipPesos,
        xpReward: cfg.rewardXp,
      };
    });

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/84 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden border-[#7AE582]">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#7AE582]/60 bg-[#122B22] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#09121B] bg-[#7AE582] text-[#0B1F16]">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold text-[#86EFAC]">
                  BATAAN CIVIC DISPATCH · EARN HONEST PESOS &amp; EXP VIA TIMED RUNS
                </p>
                <h2 className="font-display text-xl font-bold text-[#F4C542]">Side Jobs: Food Delivery &amp; Taxi</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 bp-scroll">
            {activeSideJob && (
              <div className="bp-header-plate flex flex-wrap items-center justify-between gap-3 border-[#F4C542] p-3.5">
                <div>
                  <p className="font-mono text-[10px] font-bold text-[#7AE582]">CURRENT ACTIVE CONTRACT</p>
                  <p className="font-display text-sm font-bold text-[#F4C542]">
                    {activeSideJob.title} → {activeSideJob.targetZoneName}
                  </p>
                  <p className="font-mono text-xs text-[#E4EFF7]">
                    Travel via Map [M] or roads to {activeSideJob.targetLabel} and press [E] at the golden beacon!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancelSideJob}
                  className="cursor-pointer border border-[#FCA5A5] bg-[#7F1D1D] px-3 py-1.5 font-mono text-xs font-bold text-[#FEE2E2]"
                >
                  Cancel Job
                </button>
              </div>
            )}

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-[#F4C542]">
                <UtensilsCrossed className="h-4 w-4 text-[#FB923C]" />
                Food Delivery Runs (Deliver Hot Filipino Meals)
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {foodJobs.map((job) => (
                  <div key={job.targetZoneId} className="bp-card flex flex-col justify-between gap-2.5 p-3.5">
                    <div>
                      <p className="font-display text-sm font-bold text-[#FFFFFF]">{job.targetZoneName}</p>
                      <p className="mt-0.5 text-xs text-[#C8DFEE]">{job.title}</p>
                      <p className="mt-1.5 font-mono text-[11px] text-[#7AE582]">
                        ₱{job.basePay} (+₱{job.bonusPay} fast tip) · +{job.xpReward} EXP
                      </p>
                      <p className="font-mono text-[10px] text-[#F4C542]">Time Limit: {job.maxSec}s</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartSideJob(job)}
                      className="w-full cursor-pointer border-2 border-[#FFF0B3] bg-[#F4C542] px-3 py-1.5 font-display text-xs font-bold text-[#102030] hover:bg-[#FFD45C]"
                    >
                      Accept Delivery
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-[#7DD3FC]">
                <Car className="h-4 w-4 text-[#38BDF8]" />
                Bataan Taxi Dispatch (Drive Passengers Safely Across Towns)
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {taxiJobs.map((job) => (
                  <div key={job.targetZoneId} className="bp-card flex flex-col justify-between gap-2.5 p-3.5">
                    <div>
                      <p className="font-display text-sm font-bold text-[#FFFFFF]">{job.targetZoneName}</p>
                      <p className="mt-0.5 text-xs text-[#C8DFEE]">{job.title}</p>
                      <p className="mt-1.5 font-mono text-[11px] text-[#7AE582]">
                        ₱{job.basePay} (+₱{job.bonusPay} speed tip) · +{job.xpReward} EXP
                      </p>
                      <p className="font-mono text-[10px] text-[#7DD3FC]">Time Limit: {job.maxSec}s</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartSideJob(job)}
                      className="w-full cursor-pointer border-2 border-[#7DD3FC] bg-[#1E4B78] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:bg-[#256099]"
                    >
                      Accept Taxi Fare
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= SPECTRAL NATIONAL HERO GHOST BLESSING MODAL =================
  if (modal.type === 'hero_ghost') {
    const ghost = NATIONAL_HERO_GHOSTS.find((g) => g.id === modal.heroId);
    if (!ghost) return null;
    const relic = getGearById(ghost.rewardGearId);
    const isEquipped =
      progress.equippedWeaponId === ghost.rewardGearId || progress.equippedAccessoryId === ghost.rewardGearId;

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#06111B]/88 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border-[#5EEAD4]">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#2D6E73] bg-[#0D2633] px-5 py-3.5">
            <div>
              <p className="font-mono text-xs font-bold text-[#5EEAD4]">
                RARE SPECTRAL ENCOUNTER · PHILIPPINE NATIONAL HERO ({ghost.era})
              </p>
              <h2 className="font-display text-xl font-bold text-[#F4C542]">{ghost.name}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#5EEAD4] bg-[#163442] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 bp-scroll">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="bp-card overflow-hidden border-[#5EEAD4] sm:col-span-5">
                <canvas
                  ref={ghostCanvasRef}
                  width={260}
                  height={210}
                  className="pixel-canvas block h-48 w-full object-contain"
                />
              </div>
              <div className="flex flex-col justify-between gap-3 sm:col-span-7">
                <div className="bp-card border-[#5EEAD4]/60 bg-[#102638] p-4">
                  <p className="font-mono text-[11px] font-bold text-[#5EEAD4]">{ghost.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#FFFFFF]">“{ghost.blessingQuote}”</p>
                  <button
                    type="button"
                    onClick={() => englishVoice.speak(ghost.blessingQuote, ghost.voiceProfile)}
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 border border-[#5EEAD4] bg-[#0D3340] px-3 py-1 font-mono text-xs font-bold text-[#5EEAD4] hover:bg-[#144857]"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Replay PH-EN Spirit Voice
                  </button>
                </div>

                {relic && (
                  <div className="bp-header-plate border-[#F4C542] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-[10px] font-bold text-[#7AE582]">
                          CULTURAL RELIC BESTOWED · KEPT IN AWAKENED MODE
                        </p>
                        <p className="font-display text-base font-bold text-[#F4C542]">{relic.name}</p>
                        <p className="mt-0.5 text-xs text-[#E4EFF7]">{relic.description}</p>
                        <p className="mt-1 font-mono text-[11px] text-[#5EEAD4]">{relic.statNote}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isEquipped}
                        onClick={() => onEquipGear(relic.id)}
                        className={`cursor-pointer whitespace-nowrap border-2 px-4 py-1.5 font-display text-xs font-bold ${
                          isEquipped
                            ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                            : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] hover:bg-[#FFD45C]'
                        }`}
                      >
                        {isEquipped ? 'Relic Equipped' : 'Equip Relic Now'}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer whitespace-nowrap border-2 border-[#7FA4BE] bg-[#22384D] px-4 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
                      >
                        Thank Spirit & Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= ACHIEVEMENTS, SPECIAL COSMETICS & BIKE SKINS TROPHIES MODAL =================
  if (modal.type === 'achievements') {
    const unlockedCount = progress.unlockedAchievementIds.length;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/84 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
            <div>
              <p className="font-mono text-xs text-[#9BC0D9]">
                BATAAN ACHIEVEMENTS · SPECIAL COSMETICS · BICYCLE SKINS (CARRY OVER INTO AWAKENED MODE)
              </p>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-[#F4C542]">
                <Trophy className="h-5 w-5" />
                Trophies Unlocked: {unlockedCount}/{ACHIEVEMENTS.length} · Awakened Cycles: {progress.awakenedCount}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 bp-scroll sm:grid-cols-2">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = progress.unlockedAchievementIds.includes(ach.id);
              const bikeSkin = ach.rewardBikeSkinId
                ? BIKE_SKINS.find((s) => s.id === ach.rewardBikeSkinId)
                : null;
              const rewardGear = ach.rewardGearId ? getGearById(ach.rewardGearId) : null;
              const bikeEquipped = bikeSkin ? progress.equippedBikeSkinId === bikeSkin.id : false;

              return (
                <div
                  key={ach.id}
                  className={`bp-card flex flex-col justify-between gap-2.5 p-3.5 ${
                    unlocked ? 'border-[#F4C542] bg-[#1D3549]' : 'opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {unlocked ? (
                          <Sparkles className="h-4 w-4 shrink-0 text-[#F4C542]" />
                        ) : (
                          <Lock className="h-4 w-4 shrink-0 text-[#8CA8BE]" />
                        )}
                        <p className={`font-display text-sm font-bold ${unlocked ? 'text-[#F4C542]' : 'text-[#D6E6F2]'}`}>
                          {ach.title}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-bold whitespace-nowrap ${
                          unlocked ? 'text-[#7AE582]' : 'text-[#9BC0D9]'
                        }`}
                      >
                        {unlocked ? 'UNLOCKED' : ach.progressText(progress)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#E4EFF7]">{ach.description}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#5EEAD4]">Reward: {ach.rewardLabel}</p>
                  </div>

                  {unlocked && (rewardGear || bikeSkin) && (
                    <div className="flex flex-wrap gap-2 border-t border-[#3C5E77] pt-2">
                      {rewardGear && (
                        <button
                          type="button"
                          onClick={() => onEquipGear(rewardGear.id)}
                          className="cursor-pointer whitespace-nowrap border border-[#FFF0B3] bg-[#F4C542] px-2.5 py-1 font-mono text-[11px] font-bold text-[#102030]"
                        >
                          Equip {rewardGear.name}
                        </button>
                      )}
                      {bikeSkin && (
                        <button
                          type="button"
                          disabled={bikeEquipped}
                          onClick={() => onEquipBikeSkin(bikeSkin.id)}
                          className={`cursor-pointer whitespace-nowrap border px-2.5 py-1 font-mono text-[11px] font-bold ${
                            bikeEquipped
                              ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                              : 'border-[#5EEAD4] bg-[#133A47] text-[#5EEAD4]'
                          }`}
                        >
                          {bikeEquipped ? 'Bike Skin Active' : `Use ${bikeSkin.name}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= NPC DIALOGUE (ENGLISH VOICE-OVER) & SHOPS =================
  if (modal.type === 'npc') {
    const zone = ZONES[progress.zoneId];
    const npc = zone.npcs.find((n) => n.id === modal.npcId);
    if (!npc) return null;
    const friend = npc.friendId ? FRIENDS.find((f) => f.id === npc.friendId) : null;
    const bondXp = friend ? progress.friendBonds[friend.id] || 0 : 0;
    const bond = getBondRank(bondXp);
    const rankLine = friend ? friend.rankDialogues[Math.min(4, bond.rank - 1)] : npc.greeting;

    const shopGear =
      npc.shopType === 'payong_shop'
        ? RPG_GEAR.filter((g) => g.shopSource === 'payong_shop')
        : npc.shopType === 'talyer'
          ? RPG_GEAR.filter((g) => g.shopSource === 'talyer' || g.shopSource === 'armory')
          : npc.shopType === 'armory'
            ? RPG_GEAR.filter((g) => g.shopSource === 'armory')
            : [];

    const ownedFoodsForGift = FOODS.filter((f) => (progress.foodPouch[f.id] || 0) > 0);
    const hasActualShop = npc.shopType && npc.shopType !== 'jeepney';

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/80 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
            <div>
              <p className="font-mono text-xs text-[#9BC0D9]">
                {npc.title} · {zone.name}
              </p>
              <h2 className="font-display text-xl font-bold text-[#F4C542]">{npc.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#FFFFFF] tabular-nums">
                ₱{progress.pesos.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b-2 border-[#3C5E77] bg-[#192D40] px-5 py-2.5">
            <button
              type="button"
              onClick={() => {
                setNpcTab('talk');
                if (progress.voiceEnabled) englishVoice.speak(npc.greeting, npc.voiceProfile);
              }}
              className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-1 font-display text-xs font-bold ${
                npcTab === 'talk'
                  ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                  : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
              }`}
            >
              Talk
            </button>
            {hasActualShop && (
              <button
                type="button"
                onClick={() => setNpcTab('shop')}
                className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-1 font-display text-xs font-bold ${
                  npcTab === 'shop'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                {npc.shopType === 'white_magic'
                  ? 'White Magic Arts [1–4]'
                  : npc.shopType === 'black_magic'
                    ? 'Black Magic Arts [5–8]'
                    : 'Shop'}
              </button>
            )}
            {npc.shopType === 'jeepney' && (
              <button
                type="button"
                onClick={onOpenMap}
                className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-3.5 py-1 font-display text-xs font-bold text-[#102030]"
              >
                Jeepney Fast Travel (12 Towns)
              </button>
            )}
            {friend && (
              <button
                type="button"
                onClick={() => {
                  setNpcTab('social');
                  if (progress.voiceEnabled) englishVoice.speak(rankLine, friend.voiceProfile);
                }}
                className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-1 font-display text-xs font-bold ${
                  npcTab === 'social'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                Ally Bond · Rank {bond.rank}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 bp-scroll">
            {npcTab === 'talk' && (
              <div className="space-y-4">
                <div className="bp-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base leading-relaxed text-[#FFFFFF]">“{npc.greeting}”</p>
                    <button
                      type="button"
                      onClick={() => englishVoice.speak(npc.greeting, npc.voiceProfile)}
                      className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-3 py-1.5 font-mono text-xs font-bold text-[#102030]"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Replay Voice
                    </button>
                  </div>
                  <p className="mt-3 font-mono text-xs text-[#F4C542]">Tip: {npc.englishHint}</p>
                </div>

                {npc.id === 'npc_kap_ben_home' && (
                  <div className="bp-header-plate p-4">
                    <h3 className="font-display text-sm font-bold text-[#F4C542]">Prologue Checklist</h3>
                    <div className="mt-2 space-y-1 font-mono text-xs text-[#E4EFF7]">
                      <p>{progress.prologueTalkedKapBen ? '[✓]' : '[ ]'} Talk to Kap Ben</p>
                      <p>
                        {progress.prologueDummyHits >= 3 ? '[✓]' : '[ ]'} Strike Barangay Barrier (
                        {Math.min(3, progress.prologueDummyHits)}/3)
                      </p>
                      <p>{progress.prologueRested ? '[✓]' : '[ ]'} Rest at Home Hearth or Safe House</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {npcTab === 'shop' && hasActualShop && (
              <div className="space-y-3">
                {npc.shopType === 'white_magic' || npc.shopType === 'black_magic' ? (
                  <>
                    <div className="bp-header-plate p-3 text-xs text-[#C8DFEE]">
                      <p className="font-display text-sm font-bold text-[#F4C542]">
                        {npc.shopType === 'white_magic'
                          ? 'Albularyo Sacred White Magic (Hotkeys [1]–[4])'
                          : 'Mangkukulam Forbidden Black Magic (Hotkeys [5]–[8])'}
                      </p>
                      <p className="mt-1">
                        Skills unlock automatically once you reach their required level (Lv. 5–60). Buff skills grant
                        1–5 minute stat boosts! Train in the Palayan Farming Grounds or Mt. Natib Cave to level up fast.
                      </p>
                    </div>
                    {MAGIC_SKILLS.filter((s) => s.school === npc.shopType).map((skill) => {
                      const learned = progress.learnedMagicSkillIds?.includes(skill.id);
                      const meetsLevel = progress.level >= skill.requiredLevel;
                      const canLearn = !learned && meetsLevel;
                      return (
                        <div
                          key={skill.id}
                          className={`bp-card flex flex-wrap items-center justify-between gap-3 p-3.5 ${
                            meetsLevel ? 'border-[#7AE582]' : 'opacity-75'
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <MagicSkillIconCanvas iconKey={getMagicSkillIconKey(skill.id)} size={48} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`border border-[#09121B] px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                    skill.school === 'white_magic'
                                      ? 'bg-[#F4C542] text-[#102030]'
                                      : 'bg-[#C084FC] text-[#120A21]'
                                  }`}
                                >
                                  Key [{skill.hotkey}]
                                </span>
                                <p className="font-display text-sm font-bold text-[#F4C542]">{skill.name}</p>
                                <span className="font-mono text-[11px] text-[#9BC0D9]">({skill.filipinoTitle})</span>
                              </div>
                              <p className="mt-1 text-xs text-[#E4EFF7]">{skill.description}</p>
                              <p className="mt-1 font-mono text-[11px] text-[#5EEAD4]">
                                Unlocks Lv.{skill.requiredLevel} · Cost {skill.spCost} SP · Cooldown {skill.cooldownSec}s
                                {skill.buff
                                  ? ` · ★ ${skill.buff.label} (${Math.round(skill.buff.durationSec / 60)}m)`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!canLearn}
                            onClick={() => onLearnMagicSkill(skill.id)}
                            className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-2 font-mono text-xs font-bold ${
                              meetsLevel
                                ? learned
                                  ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                                  : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                                : 'border-[#56748B] bg-[#16293B] text-[#94A3B8] disabled:cursor-not-allowed'
                            }`}
                          >
                            {learned
                              ? 'Unlocked ✓'
                              : meetsLevel
                                ? 'Master Free!'
                                : `Unlocks at Lv ${skill.requiredLevel}`}
                          </button>
                        </div>
                      );
                    })}
                  </>
                ) : npc.shopType === 'carinderia' ? (
                  <>
                    <div className="bp-header-plate flex flex-wrap items-center justify-between gap-2 p-3">
                      <div>
                        <p className="font-display text-sm font-bold text-[#FB923C]">Carinderia Cooking Hearth</p>
                        <p className="text-xs text-[#C8DFEE]">
                          Cook caught Filipino fish &amp; gathered herbs into Sinigang, Tinola, Inihaw, Adobo &amp; Kinilaw!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenCooking}
                        className="inline-flex cursor-pointer items-center gap-1.5 border-2 border-[#FDBA74] bg-[#EA580C] px-3.5 py-2 font-display text-xs font-bold text-[#FFFFFF] hover:bg-[#F97316]"
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        Open Cooking Hearth
                      </button>
                    </div>

                    {/* Bamboo Fishing Rod Available at Carinderia / Town Shops */}
                    <div className="bp-card flex flex-wrap items-center justify-between gap-3 border-[#38BDF8]/70 p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-display text-sm font-bold text-[#7DD3FC]">
                          <Fish className="h-4 w-4" />
                          Bamboo Fishing Rod (Pamingwit)
                        </p>
                        <p className="mt-0.5 text-xs text-[#E4EFF7]">
                          Sturdy Bataan bamboo rod for catching Bangus, Tilapia, Galunggong, Pusit, Maya-Maya &amp; Lapu-Lapu at marked coastal docks!
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={progress.hasFishingRod || progress.pesos < GAME_CONFIG.fishing.rodPrice}
                        onClick={onBuyFishingRod}
                        className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-4 py-2 font-mono text-xs font-bold ${
                          progress.hasFishingRod
                            ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                            : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] disabled:cursor-not-allowed disabled:opacity-45'
                        }`}
                      >
                        {progress.hasFishingRod ? 'Owned ✓' : `Buy · ₱${GAME_CONFIG.fishing.rodPrice}`}
                      </button>
                    </div>

                    {FOODS.filter((f) => f.price > 0).map((food) => {
                      const qty = progress.foodPouch[food.id] || 0;
                      const canBuy = progress.pesos >= food.price;
                      return (
                        <div key={food.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-sm font-bold text-[#F4C542]">
                              {food.name} {qty > 0 ? `· Owned x${qty}` : ''}
                            </p>
                            <p className="mt-0.5 text-xs text-[#E4EFF7]">{food.description}</p>
                            <p className="mt-1 font-mono text-[11px] text-[#7AE582]">
                              +{food.hpRestore} HP · +{food.spRestore} SP · +{food.energyRestore} Energy
                              {food.buff
                                ? ` · ★ ${food.buff.label} (${Math.round(food.buff.durationSec / 60)}m)`
                                : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => onBuyFood(food.id)}
                            className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-4 py-2 font-mono text-xs font-bold text-[#102030] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Buy · ₱{food.price}
                          </button>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {npc.shopType === 'payong_shop' && (
                      <div className="bp-card flex flex-wrap items-center justify-between gap-3 border-[#38BDF8]/70 p-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-[#7DD3FC]">
                            <Fish className="h-4 w-4" />
                            Bamboo Fishing Rod (Pamingwit)
                          </p>
                          <p className="mt-0.5 text-xs text-[#E4EFF7]">
                            Cast at coastal docks in Orani, Orion, Bagac, or Morong to catch 11 authentic Filipino fish!
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={progress.hasFishingRod || progress.pesos < GAME_CONFIG.fishing.rodPrice}
                          onClick={onBuyFishingRod}
                          className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-4 py-2 font-mono text-xs font-bold ${
                            progress.hasFishingRod
                              ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                              : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] disabled:cursor-not-allowed disabled:opacity-45'
                          }`}
                        >
                          {progress.hasFishingRod ? 'Owned ✓' : `Buy · ₱${GAME_CONFIG.fishing.rodPrice}`}
                        </button>
                      </div>
                    )}
                    {shopGear.map((item) => {
                      const alreadyOwned =
                        (item.slot === 'umbrella' && progress.hasUmbrella) ||
                        (item.slot === 'bike' && progress.hasBike) ||
                        progress.ownedGearIds.includes(item.id);
                      const canBuy = !alreadyOwned && progress.pesos >= item.price;
                      return (
                        <div key={item.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-sm font-bold text-[#F4C542]">
                              {item.name} · <span className="font-mono text-xs text-[#C8DFEE]">{item.slot}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-[#E4EFF7]">{item.description}</p>
                            <p className="mt-1 font-mono text-[11px] text-[#7AE582]">{item.statNote}</p>
                          </div>
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => onBuyGear(item.id)}
                            className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-4 py-2 font-mono text-xs font-bold ${
                              alreadyOwned
                                ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                                : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] disabled:cursor-not-allowed disabled:opacity-45'
                            }`}
                          >
                            {alreadyOwned ? 'Owned' : `Buy · ₱${item.price}`}
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {npcTab === 'social' && friend && (
              <div className="space-y-4">
                <div className="bp-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-base font-bold text-[#F4C542]">
                        {friend.name} · Rank {bond.rank} ({bond.label})
                      </p>
                      <p className="font-mono text-xs text-[#C8DFEE]">
                        {friend.styleLabel} · {friend.passiveLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => englishVoice.speak(rankLine, friend.voiceProfile)}
                      className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border border-[#FFF0B3] bg-[#F4C542] px-3 py-1 font-mono text-xs font-bold text-[#102030]"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Hear Voice Line
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-[#FFFFFF]">“{rankLine}”</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={progress.energy < HANGOUT_ENERGY_COST}
                      onClick={() => {
                        onHangOut(friend.id);
                        if (progress.voiceEnabled) englishVoice.speak(rankLine, friend.voiceProfile);
                      }}
                      className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-4 py-2 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Hang Out (+14 XP · -{HANGOUT_ENERGY_COST} EN)
                    </button>
                    {(() => {
                      const stipend = getAllySummonCost(friend.id);
                      const isSummoned = progress.activeCompanionId === friend.id;
                      const canRecruit = bond.rank >= ALLY_SUMMON_REQUIRED_RANK && progress.pesos >= stipend;
                      return (
                        <button
                          type="button"
                          disabled={!isSummoned && !canRecruit}
                          onClick={() => onToggleCompanion(friend.id)}
                          className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-4 py-2 font-display text-xs font-bold text-[#102030] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {isSummoned
                            ? 'Dismiss Ally'
                            : bond.rank >= ALLY_SUMMON_REQUIRED_RANK
                              ? `Hire Ally · ₱${stipend}`
                              : `Reach Rank ${ALLY_SUMMON_REQUIRED_RANK} (150 XP)`}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                <div className="bp-header-plate p-4">
                  <p className="font-display text-sm font-bold text-[#F4C542]">
                    Gift Snacks (+20 / +42 Favorite Bond XP)
                  </p>
                  {ownedFoodsForGift.length === 0 ? (
                    <p className="mt-2 text-xs text-[#C8DFEE]">
                      Buy Bataan Cashew, Sorbetes, or Kwek-Kwek first to gift to {friend.name}.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ownedFoodsForGift.map((food) => {
                        const isFav = friend.favoriteFoodIds.includes(food.id);
                        return (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => onGiftFood(friend.id, food.id)}
                            className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-mono text-xs text-[#FFFFFF] hover:border-[#F4C542]"
                          >
                            Gift {food.name} ({progress.foodPouch[food.id]}) {isFav ? '★ Fav' : ''}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= SAFE HOUSES & DECOR UPGRADES =================
  if (modal.type === 'houses') {
    const activeHouse = HOUSES.find((h) => h.id === selectedHouseId) || HOUSES[0];
    const isOwned = progress.ownedHouseIds.includes(activeHouse.id);
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/80 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
            <div>
              <p className="font-mono text-xs text-[#9BC0D9]">BUYABLE TOWN SAFE HOUSES & DECOR UPGRADES</p>
              <h2 className="font-display text-xl font-bold text-[#F4C542]">
                Owned Safe Houses: {progress.ownedHouseIds.length}/{HOUSES.length} · ₱{progress.pesos.toLocaleString()}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 bp-scroll md:grid-cols-12">
            <div className="flex flex-col gap-2 md:col-span-5">
              {HOUSES.map((h) => {
                const owned = progress.ownedHouseIds.includes(h.id);
                const selected = h.id === activeHouse.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHouseId(h.id)}
                    className={`cursor-pointer border-2 p-3 text-left transition-colors ${
                      selected
                        ? 'border-[#F4C542] bg-[#36566E]'
                        : 'border-[#56748B] bg-[#192D40] hover:border-[#7FA4BE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[#FFFFFF]">{h.name}</span>
                      <span className={`font-mono text-xs font-bold ${owned ? 'text-[#7AE582]' : 'text-[#F4C542]'}`}>
                        {owned ? 'OWNED' : `₱${h.price}`}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-[#C8DFEE]">
                      {h.townName} · {h.style}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 md:col-span-7">
              <div className="bp-card overflow-hidden">
                <canvas
                  ref={roomCanvasRef}
                  width={520}
                  height={190}
                  className="pixel-canvas block h-44 w-full object-cover"
                />
              </div>

              <div className="bp-header-plate flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-[#F4C542]">{activeHouse.name}</h3>
                  <p className="text-xs text-[#E4EFF7]">{activeHouse.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-[#7AE582]">{activeHouse.buffSummary}</p>
                </div>
                {isOwned ? (
                  <button
                    type="button"
                    onClick={() => onRestInHouse(activeHouse.id)}
                    className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-4 py-2 font-display text-xs font-bold text-[#102030]"
                  >
                    Rest & Heal 100%
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={progress.pesos < activeHouse.price}
                    onClick={() => onBuyHouse(activeHouse.id)}
                    className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-4 py-2 font-mono text-xs font-bold text-[#102030] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Buy Deed · ₱{activeHouse.price}
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-display text-sm font-bold text-[#FFFFFF]">Global Safe House Decor Upgrades</h3>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DECOR_UPGRADES.map((d) => {
                    const installed = progress.homeDecorIds.includes(d.id);
                    return (
                      <div key={d.id} className="bp-card flex flex-col justify-between gap-2 p-3">
                        <div>
                          <p className="font-display text-xs font-bold text-[#F4C542]">{d.name}</p>
                          <p className="mt-0.5 text-[11px] text-[#E4EFF7]">{d.description}</p>
                          <p className="mt-1 font-mono text-[11px] text-[#7AE582]">{d.statSummary}</p>
                        </div>
                        <button
                          type="button"
                          disabled={installed || progress.pesos < d.price}
                          onClick={() => onBuyDecor(d.id)}
                          className={`cursor-pointer whitespace-nowrap border px-3 py-1.5 font-mono text-xs font-bold ${
                            installed
                              ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                              : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] disabled:cursor-not-allowed disabled:opacity-45'
                          }`}
                        >
                          {installed ? 'Installed' : `Install · ₱${d.price}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= ALLY BONDS & COMPANION SUMMONING =================
  if (modal.type === 'tropa') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/80 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
            <div>
              <p className="font-mono text-xs text-[#9BC0D9]">BATAAN ALLY BONDS & COMPANIONS</p>
              <h2 className="font-display text-xl font-bold text-[#F4C542]">
                Recruit Bonded Allies (Rank {ALLY_SUMMON_REQUIRED_RANK}+ & Rally Stipend)
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 bp-scroll sm:grid-cols-2">
            {FRIENDS.map((f) => {
              const xp = progress.friendBonds[f.id] || 0;
              const bond = getBondRank(xp);
              const summoned = progress.activeCompanionId === f.id;
              const stipend = getAllySummonCost(f.id);
              const canRecruit = bond.rank >= ALLY_SUMMON_REQUIRED_RANK && progress.pesos >= stipend;
              const line = f.rankDialogues[Math.min(4, bond.rank - 1)];
              return (
                <div key={f.id} className="bp-card flex flex-col justify-between gap-3 p-3.5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-sm font-bold text-[#F4C542]">{f.name}</p>
                        <p className="font-mono text-[11px] text-[#C8DFEE]">
                          {f.role} · {f.homeTownName}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#FFFFFF]">
                        Rank {bond.rank} · {xp}/{bond.nextThreshold} XP
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#FFFFFF]">“{line}”</p>
                    <p className="mt-1.5 font-mono text-[11px] text-[#7AE582]">
                      {f.styleLabel} · {f.passiveLabel}
                    </p>
                    <div className="mt-2 h-2 w-full border border-[#7FA4BE] bg-[#0F1E2C]">
                      <div className="h-full bg-[#F4C542]" style={{ width: `${bond.progressPct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => englishVoice.speak(line, f.voiceProfile)}
                      className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#16293B] px-2.5 py-1.5 font-mono text-xs text-[#FFFFFF] hover:border-[#F4C542]"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-[#F4C542]" />
                      Voice
                    </button>
                    <button
                      type="button"
                      disabled={progress.energy < HANGOUT_ENERGY_COST}
                      onClick={() => {
                        onHangOut(f.id);
                        if (progress.voiceEnabled) englishVoice.speak(line, f.voiceProfile);
                      }}
                      className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Hang Out (+14 XP · -{HANGOUT_ENERGY_COST} EN)
                    </button>
                    <button
                      type="button"
                      disabled={!summoned && !canRecruit}
                      onClick={() => onToggleCompanion(f.id)}
                      className={`ml-auto cursor-pointer whitespace-nowrap shrink-0 border-2 px-3 py-1.5 font-display text-xs font-bold ${
                        summoned
                          ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                          : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] disabled:cursor-not-allowed disabled:opacity-45'
                      }`}
                    >
                      {summoned
                        ? 'Dismiss Ally'
                        : bond.rank >= ALLY_SUMMON_REQUIRED_RANK
                          ? `Hire · ₱${stipend}`
                          : `Rank ${ALLY_SUMMON_REQUIRED_RANK} Req`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= QUEST BOARD / STORY CHRONICLE =================
  if (modal.type === 'story') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/80 p-3 sm:p-5">
        <div className="bp-panel flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
            <div>
              <p className="font-mono text-xs text-[#9BC0D9]">KAP BEN’S TOWN QUESTS · ANTI-CORRUPTION CAMPAIGN</p>
              <h2 className="font-display text-xl font-bold text-[#F4C542]">
                Campaign Progress: {progress.completedChapterIds.length}/{STORY_CHAPTERS.length} Acts Complete
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReplayPrologue}
                className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-mono text-xs text-[#FFFFFF]"
              >
                Replay Intro
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-4 bp-scroll">
            {STORY_CHAPTERS.map((ch) => {
              const done = progress.completedChapterIds.includes(ch.id);
              return (
                <div key={ch.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-[#F4C542]">{ch.title}</span>
                      <span className={`font-mono text-xs font-bold ${done ? 'text-[#7AE582]' : 'text-[#C8DFEE]'}`}>
                        {done ? 'COMPLETED' : 'ACTIVE'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#E4EFF7]">{ch.summary}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#F4C542]">
                      Objective: {ch.objectiveText} · Reward: ₱{ch.rewardPesos} · {ch.rewardXp} XP
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTravel(ch.targetZoneId);
                      onClose();
                    }}
                    className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#16293B] px-3.5 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
                  >
                    Travel to {ZONES[ch.targetZoneId].name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= INTERACTIVE BATAAN PROVINCIAL WORLD MAP (12 LGUs · 237 BARANGAYS · 24 UNIQUE BOSSES!) =================
  const caseProg = getFinalBossProgress(progress.bossProgression);
  const selectedMuni = BATAAN_WORLD_MAP.find((m) => m.id === selectedMapLguId) || BATAAN_WORLD_MAP[5];
  const selectedTownBosses = getTownBossConfig(selectedMuni.id);
  const defeatedIds = progress.bossProgression.defeatedBossIds;
  const vmDone = selectedTownBosses ? defeatedIds.includes(selectedTownBosses.viceMayor.id) : false;
  const mayorDone = selectedTownBosses ? defeatedIds.includes(selectedTownBosses.mayor.id) : false;
  const filteredBarangays = selectedMuni.barangays.filter((b) =>
    b.toLowerCase().includes(barangaySearch.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/82 p-3 sm:p-5">
      <div className="bp-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
          <div>
            <p className="font-mono text-xs text-[#9BC0D9]">
              BATAAN PROVINCIAL MAP · 12 LGUs · 237 OFFICIAL BARANGAYS · JEEPNEY FAST TRAVEL
            </p>
            <h2 className="font-display text-xl font-bold text-[#F4C542]">
              Evidence Case Against El Mastermind: {caseProg.collected}/{caseProg.total} Boss Drops
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTravel('farming_fields');
                onClose();
              }}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 border-2 border-[#7AE582] bg-[#18382A] px-3 py-1.5 font-display text-xs font-bold text-[#BBF7D0] hover:bg-[#224E3B]"
            >
              <Sprout className="h-3.5 w-3.5 text-[#7AE582]" />
              Palayan Farming Grounds
            </button>
            <button
              type="button"
              onClick={() => {
                onTravel('natib_cave');
                onClose();
              }}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 border-2 border-[#C084FC] bg-[#26193B] px-3 py-1.5 font-display text-xs font-bold text-[#E9D5FF] hover:bg-[#352352]"
            >
              <Mountain className="h-3.5 w-3.5 text-[#C084FC]" />
              Mt. Natib Mining Cave
            </button>
            <button
              type="button"
              onClick={() => {
                onTravel('defender_home');
                onClose();
              }}
              className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
            >
              Return Home
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        {/* El Mastermind Political Immunity Status Banner */}
        <div className="border-b-2 border-[#3C5E77] bg-[#182B3E] px-5 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className={caseProg.isUnlocked ? 'font-bold text-[#7AE582]' : 'font-bold text-[#FCA5A5]'}>
              {caseProg.isUnlocked ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  ALL 24 EVIDENCE FILES SECURED! El Mastermind’s Political Immunity is shattered at Balanga Provincial Capitol!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  EL MASTERMIND IMMUNITY ACTIVE ({caseProg.collected}/{caseProg.total}): Defeat every town’s Vice Mayor
                  & Mayor before attacking him in Balanga City!
                </span>
              )}
            </span>
            <span className="text-[#9BC0D9]">Highways: {BATAAN_HIGHWAYS[0]} · {BATAAN_HIGHWAYS[2]}</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full border border-[#7FA4BE] bg-[#0F1E2C]">
            <div
              className={`h-full transition-all ${caseProg.isUnlocked ? 'bg-[#7AE582]' : 'bg-[#F4C542]'}`}
              style={{ width: `${(caseProg.collected / caseProg.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Main 2-Column Interactive Provincial Explorer */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 bp-scroll lg:grid-cols-12">
          {/* Left: 12 Official Municipalities & Balanga City */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {BATAAN_WORLD_MAP.map((muni) => {
              const cfg = getTownBossConfig(muni.id);
              const defeatedCount =
                (cfg && defeatedIds.includes(cfg.viceMayor.id) ? 1 : 0) +
                (cfg && defeatedIds.includes(cfg.mayor.id) ? 1 : 0);
              const isSelected = muni.id === selectedMuni.id;
              const isHere = progress.zoneId === muni.id;
              return (
                <button
                  key={muni.id}
                  type="button"
                  onClick={() => {
                    setSelectedMapLguId(muni.id);
                    setBarangaySearch('');
                  }}
                  className={`cursor-pointer border-2 p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-[#F4C542] bg-[#2D4D68]'
                      : 'border-[#4D6E87] bg-[#192D40] hover:border-[#7FA4BE]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-[#FFFFFF]">
                      {muni.name} {isHere ? '★' : ''}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        defeatedCount === 2
                          ? 'text-[#7AE582]'
                          : defeatedCount === 1
                            ? 'text-[#F4C542]'
                            : 'text-[#FCA5A5]'
                      }`}
                    >
                      {defeatedCount === 2 ? 'LIBERATED (2/2)' : `BOSSES ${defeatedCount}/2`}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-[#BDD5E7]">
                    {muni.district} · {muni.barangayCount} Barangays · {muni.type}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Town Boss Portraits + Fast Travel + Full Official Barangay List */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="bp-header-plate flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-[#9BC0D9]">
                  {selectedMuni.type} · {selectedMuni.district} · {selectedMuni.barangayCount} Official Barangays
                </p>
                <h3 className="font-display text-2xl font-bold text-[#F4C542]">{selectedMuni.name}</h3>
                <p className="mt-1 text-xs text-[#E4EFF7]">{selectedMuni.biome}</p>
                <p className="mt-1 font-mono text-[11px] text-[#BDD5E7]">
                  Roads: {selectedMuni.mainRoads.slice(0, 3).join(' · ')}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-[#7AE582]">
                  Landmarks: {selectedMuni.landmarks.slice(0, 3).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                disabled={progress.zoneId === selectedMuni.id}
                onClick={() => {
                  onTravel(selectedMuni.id as ZoneId);
                  onClose();
                }}
                className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 border-2 px-4 py-2.5 font-display text-xs font-bold ${
                  progress.zoneId === selectedMuni.id
                    ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                    : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] hover:bg-[#FFD45C]'
                }`}
              >
                <MapPin className="h-4 w-4" />
                {progress.zoneId === selectedMuni.id ? 'Current Town' : `Jeepney Travel to ${selectedMuni.name}`}
              </button>
            </div>

            {/* Town's 2 Unique Corrupt Officials with Procedural Pixel Portraits */}
            {selectedTownBosses && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { boss: selectedTownBosses.viceMayor, done: vmDone, label: 'Town Mini-Boss' },
                  { boss: selectedTownBosses.mayor, done: mayorDone, label: 'Town Boss' },
                ].map(({ boss, done, label }) => (
                  <div key={boss.id} className="bp-card flex items-start gap-3 p-3">
                    <BossPortraitCanvas boss={boss} size={58} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] text-[#9BC0D9]">
                        {label} · {boss.gender.toUpperCase()} · {boss.hp} HP
                      </p>
                      <p className="font-display text-sm font-bold text-[#F4C542] leading-tight">{boss.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-[#E4EFF7]">Drop: {boss.dropName}</p>
                      <p className={`mt-1 font-mono text-[11px] font-bold ${done ? 'text-[#7AE582]' : 'text-[#FCA5A5]'}`}>
                        {done ? '✓ EVIDENCE SECURED' : '● ACTIVE IN TOWN'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Complete Official Barangay List for Selected Municipality */}
            <div className="bp-card flex flex-1 flex-col p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3C5E77] pb-2">
                <div>
                  <h4 className="font-display text-sm font-bold text-[#FFFFFF]">
                    Official Barangays of {selectedMuni.name} ({selectedMuni.barangayCount})
                  </h4>
                  <p className="font-mono text-[11px] text-[#9BC0D9]">
                    Status:{' '}
                    {vmDone && mayorDone
                      ? 'All Barangays Liberated!'
                      : vmDone || mayorDone
                        ? 'Partially Liberated (1 Official Remaining)'
                        : 'Corrupt Syndicate Control'}
                  </p>
                </div>
                <input
                  type="text"
                  value={barangaySearch}
                  onChange={(e) => setBarangaySearch(e.target.value)}
                  placeholder="Filter barangay..."
                  className="border border-[#7FA4BE] bg-[#0F1E2C] px-2.5 py-1 font-mono text-xs text-[#FFFFFF] placeholder-[#7FA4BE] focus:border-[#F4C542] focus:outline-none"
                />
              </div>

              <div className="mt-2.5 grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto pr-1 bp-scroll sm:grid-cols-3">
                {filteredBarangays.map((brgy) => (
                  <div
                    key={brgy}
                    className="flex items-center justify-between gap-1 border border-[#3B5970] bg-[#162839] px-2.5 py-1.5 font-mono text-[11px]"
                  >
                    <span className="truncate text-[#E4EFF7]">{brgy}</span>
                    <span className={vmDone && mayorDone ? 'text-[#7AE582]' : 'text-[#F4C542]'}>
                      {vmDone && mayorDone ? '✓' : '·'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
