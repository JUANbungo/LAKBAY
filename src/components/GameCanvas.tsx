import React, { useEffect, useRef } from 'react';
import { AmbientWildlifeAndFlora } from '../game/ambientWildlifeAndFlora';
import { BGM_TRACK_LABELS, englishVoice, noirAudio } from '../game/audio';
import {
  BossProfile,
  BossRole,
  getBossQuote,
  getFinalBossProgress,
  getMunicipalityById,
  getScaledBossHp,
  getTownBossConfig,
  handleAttackElMastermind,
} from '../game/bataanData';
import {
  DyingEntityState,
  renderDyingEntity,
  spawnDeathSequence,
  updateDyingEntity,
} from '../game/deathAnimationSystem';
import {
  AWAKENED_BOSSES,
  AwakenedBossDef,
  getBikeSkinById,
  HeroGhostDef,
  NATIONAL_HERO_GHOSTS,
} from '../game/expansionData';
import {
  GAME_CONFIG,
  getFishById,
  getMaterialById,
  rollRandomFilipinoFish,
} from '../game/gameConfig';
import {
  ActiveLevelUpAnimation,
  ENTITY_WORLD_SCALES,
  renderLevelUpOverlay,
  triggerLevelUpAnimation,
  updateLevelUpAnimation,
} from '../game/levelUpAndScaleSystem';
import {
  computeMagicDamage,
  getAvailableStatPoints,
  getMagicSkillById,
  isSkillUnlockedForLevel,
  MAGIC_SKILLS,
  MagicSchool,
  MagicSkillDef,
} from '../game/magicSkillsData';
import { NightLightSource, renderNightLightingPass } from '../game/nightLightingSystem';
import {
  checkProjectileShieldDeflection,
  drawActiveMagicEffect,
  drawAlly,
  drawAmbientAnimal,
  drawAwakenedBoss,
  drawBossArenaCrest,
  drawDambanaShrine,
  drawDyingEntitySprite,
  drawElMastermind,
  drawEnemySkillEffect,
  drawEnemySprite,
  drawEntityNameplate,
  drawFilipinoVehicle,
  drawFishingSpot,
  drawGatherNode,
  drawGraciasNomar,
  drawHearthAndDummy,
  drawHeroFishingOverlay,
  drawLevelUpSunPillar,
  drawMinimap,
  drawNoirBackdrop,
  drawNoirFigure,
  drawOreNode,
  drawPlayerDebuffFeedback,
  drawPortalArch,
  drawRallyBuffAura,
  drawSideJobBeacon,
  drawSpectralHeroGhost,
  drawStreetLanterns,
  drawTownHouseFacade,
  drawUniqueTownBoss,
  drawWorldBuildings,
  drawWorldNpc,
  isTimeNight,
} from '../game/noirRenderer';
import {
  AnimatedProjectile,
  BulletTracer,
  createPoliceAllyState,
  drawAnimatedProjectile,
  drawBulletTracers,
  drawImpactBursts,
  ImpactBurst,
  ProjectileVfxKind,
  runGameHealthCheck,
  spawnImpactBurst,
  TrailParticle,
  updateImpactBursts,
  updatePoliceShooting,
  updateProjectile,
} from '../game/projectileVfx';
import { SkillVfxManager } from '../game/skillVfxEngine';
import { initSpriteAtlases } from '../game/spriteAtlas';
import {
  ActiveBuffState,
  ActiveSideJobState,
  BossHudState,
  DerivedStats,
  FishingHudState,
  FoodDef,
  HudSnapshot,
  InteractTarget,
  MobKind,
  PlayerProgress,
  TiradorAmmoKind,
  VehicleKind,
  WorldBridge,
  ZoneId,
} from '../game/types';
import { getEnemySkillKit, UniqueEnemySkill } from '../game/uniqueEnemySkillsAndMechanics';
import {
  createHeroMotionState,
  extractZoneStaticBuildings,
  getTiradorAmmoSprite,
  getTownBackdropImage,
  initTiradorSheet,
  updateSmoothHeroMotion,
  WorldBuilding,
} from '../game/visualPolishAndAssets';
import {
  FRIENDS,
  getBondRank,
  getGearById,
  getXpForNextLevel,
  HOUSES,
  LOOT_ITEMS,
  RPG_GEAR,
  ZONES,
} from '../game/worldData';
import {
  BataanAtmosphereSystem,
  nextWeatherMode,
  resolveSafeAllyStandX,
  WEATHER_LABELS,
  weatherFromRainIntensity,
} from '../game/worldPolishAndWeather';

interface GameCanvasProps {
  progress: PlayerProgress;
  derivedStats: DerivedStats;
  paused: boolean;
  bridgeRef: React.MutableRefObject<WorldBridge | null>;
  onHudUpdate: (hud: HudSnapshot) => void;
  onSyncVitals: (vitals: {
    hp: number;
    sp: number;
    energy: number;
    mood: number;
    sanctuaryBuffSec: number;
    timeOfDay: number;
  }) => void;
  onPortalTravel: (targetZone: ZoneId, spawnX: number) => void;
  onInteractNpc: (npcId: string) => void;
  onInteractHouse: (houseId: string) => void;
  onHearthRest: () => void;
  onDummyHit: () => void;
  onClaimDambanaBadge: () => void;
  onMeetElMastermind: () => void;
  onMeetHeroGhost: (heroId: string) => void;
  onMobDefeated: (pesos: number, xp: number, lootDropId?: string) => void;
  onPesosDelta: (delta: number) => void;
  onGainMaterial: (materialId: string, qty: number, bonusXp?: number) => void;
  onCatchFish: (fishId: string, bonusXp?: number) => void;
  onCompleteSideJob: (pesos: number, xp: number, title: string) => void;
  onTownBossDefeated: (
    townId: ZoneId,
    role: BossRole,
    bossProfile: BossProfile,
    pesos: number,
    xp: number,
    dropGearId?: string
  ) => void;
  onAwakenedBossDefeated: (bossId: string, pesos: number, xp: number, rewardGearId: string) => void;
  onElMastermindDefeated: (pesos: number, xp: number) => void;
  onMastermindInstantDeath: (dialogue: string) => void;
  onBulletDeflected: () => void;
  onShieldBroken: () => void;
  onPlayerDefeated: () => void;
}

interface SkillRuntimeFields {
  skillCooldowns: Record<string, number>;
  skillRotationTimer: number;
  activeSkill: UniqueEnemySkill | null;
  skillPhase: 'none' | 'windup' | 'active';
  skillTimer: number;
  skillTargetX: number;
  skillDidHit: boolean;
}

interface MobEntity extends SkillRuntimeFields {
  id: string;
  name: string;
  kind: MobKind;
  x: number;
  homeX: number;
  y: number;
  isFlying: boolean;
  hoverBaseY: number;
  swoopTimer: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  atk: number;
  level: number;
  walkPhase: number;
  atkCooldown: number;
  hurtFlash: number;
  slashTimer: number;
  stunTimer: number;
  dead: boolean;
  respawnTimer: number;
  shieldHp: number;
  shieldMax: number;
  usesGun: boolean;
  aimTimer: number;
  guardTimer: number;
  telegraphTimer: number;
  bleedTimer: number;
  bleedTick: number;
  defShredTimer: number;
  rallyBuffTimer: number;
  weakSpotTimer: number;
  stolenPesos: number;
}

interface TownBossEntity extends SkillRuntimeFields {
  role: BossRole;
  profile: BossProfile;
  x: number;
  homeX: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  atk: number;
  pesoReward: number;
  xpReward: number;
  walkPhase: number;
  atkCooldown: number;
  slashTimer: number;
  hurtFlash: number;
  stunTimer: number;
  defeated: boolean;
  quoteShown: boolean;
  quote: string;
  dropGearId?: string;
  shieldHp: number;
  shieldMax: number;
  weakSpotTimer: number;
  telegraphTimer: number;
  telegraphLabel: string;
  recoveryTimer: number;
  bleedTimer: number;
  bleedTick: number;
  defShredTimer: number;
}

interface AwakenedBossEntity extends SkillRuntimeFields {
  def: AwakenedBossDef;
  x: number;
  homeX: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  atk: number;
  shieldHp: number;
  shieldMax: number;
  shieldRegenTimer: number;
  aimTimer: number;
  walkPhase: number;
  atkCooldown: number;
  slashTimer: number;
  hurtFlash: number;
  stunTimer: number;
  defeated: boolean;
  quoteShown: boolean;
  weakSpotTimer: number;
  telegraphTimer: number;
  telegraphLabel: string;
  recoveryTimer: number;
  bleedTimer: number;
  bleedTick: number;
  defShredTimer: number;
}

interface ElMastermindEntity extends SkillRuntimeFields {
  x: number;
  homeX: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  atk: number;
  walkPhase: number;
  atkCooldown: number;
  slashTimer: number;
  hurtFlash: number;
  phase: 1 | 2;
  fightActive: boolean;
  defeated: boolean;
  eyeFlashTimer: number;
  summonTimer: number;
  weakSpotTimer: number;
  telegraphTimer: number;
  telegraphLabel: string;
  recoveryTimer: number;
  bleedTimer: number;
  bleedTick: number;
  defShredTimer: number;
}

interface Projectile extends AnimatedProjectile {
  fromPlayer: boolean;
  color: string;
  isMegaphone?: boolean;
  isLaser?: boolean;
  isBullet?: boolean;
  isInkWave?: boolean;
  isTiradorAmmo?: 'pebble' | 'agimat' | 'sili';
  reflectable?: boolean;
  deflected?: boolean;
  piercing?: boolean;
  appliesStatus?: 'slow' | 'bleed' | 'blind' | 'sp_drain';
  gravityY?: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

interface TrafficVehicle {
  x: number;
  dir: 1 | -1;
  speed: number;
  kind: VehicleKind;
  laneOffset: number;
}

interface DashGhost {
  x: number;
  y: number;
  facing: 1 | -1;
  life: number;
}

const MOB_NAMES: Record<MobKind, string> = {
  thief: 'Street Thief',
  robber: 'Armed Robber',
  bad_guy: 'Street Thug',
  bad_woman: 'Street Rogue',
  bully_kid: 'School Bully',
  fat_guy: 'Heavy Bruiser',
  asong_ulol: 'Rabid Hound',
  insekto: 'Giant Wasp',
  cobra: 'King Cobra',
  balete_tree: 'Haunted Balete Tree',
  tiyanak: 'Tiyanak Imp',
  white_lady: 'White Lady Ghost',
  aswang: 'Shadow Aswang',
  corrupt_politician: 'Corrupt Politician',
  evil_pastor: 'Evil Pastor',
  corrupted_priest: 'Corrupted Priest',
  corrupt_police: 'Corrupted Police',
  corrupt_soldier: 'Corrupted Soldier',
  rodent_daga: 'Palayan Daga',
  bukid_pest: 'Bukid Pest',
  cave_bat: 'Paniki Cave Bat',
  cave_spider: 'Natib Cave Spider',
  cave_centipede: 'Giant Alupihan',
};

const FOLKLORE_KINDS: MobKind[] = ['balete_tree', 'tiyanak', 'white_lady', 'aswang'];
const ARMED_MOB_KINDS: MobKind[] = ['corrupt_police', 'corrupt_soldier'];

export const GameCanvas: React.FC<GameCanvasProps> = ({
  progress,
  derivedStats,
  paused,
  bridgeRef,
  onHudUpdate,
  onSyncVitals,
  onPortalTravel,
  onInteractNpc,
  onInteractHouse,
  onHearthRest,
  onDummyHit,
  onClaimDambanaBadge,
  onMeetElMastermind,
  onMeetHeroGhost,
  onMobDefeated,
  onPesosDelta,
  onGainMaterial,
  onCatchFish,
  onCompleteSideJob,
  onTownBossDefeated,
  onAwakenedBossDefeated,
  onElMastermindDefeated,
  onMastermindInstantDeath,
  onBulletDeflected,
  onShieldBroken,
  onPlayerDefeated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);
  const statsRef = useRef(derivedStats);
  const pausedRef = useRef(paused);
  // Persist timed stat buffs & active side jobs seamlessly across zone transitions!
  const activeBuffsRef = useRef<ActiveBuffState[]>([]);
  const activeSideJobRef = useRef<ActiveSideJobState | null>(null);

  const callbacksRef = useRef({
    onHudUpdate,
    onSyncVitals,
    onPortalTravel,
    onInteractNpc,
    onInteractHouse,
    onHearthRest,
    onDummyHit,
    onClaimDambanaBadge,
    onMeetElMastermind,
    onMeetHeroGhost,
    onMobDefeated,
    onPesosDelta,
    onGainMaterial,
    onCatchFish,
    onCompleteSideJob,
    onTownBossDefeated,
    onAwakenedBossDefeated,
    onElMastermindDefeated,
    onMastermindInstantDeath,
    onBulletDeflected,
    onShieldBroken,
    onPlayerDefeated,
  });

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    statsRef.current = derivedStats;
  }, [derivedStats]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    callbacksRef.current = {
      onHudUpdate,
      onSyncVitals,
      onPortalTravel,
      onInteractNpc,
      onInteractHouse,
      onHearthRest,
      onDummyHit,
      onClaimDambanaBadge,
      onMeetElMastermind,
      onMeetHeroGhost,
      onMobDefeated,
      onPesosDelta,
      onGainMaterial,
      onCatchFish,
      onCompleteSideJob,
      onTownBossDefeated,
      onAwakenedBossDefeated,
      onElMastermindDefeated,
      onMastermindInstantDeath,
      onBulletDeflected,
      onShieldBroken,
      onPlayerDefeated,
    };
  }, [
    onHudUpdate,
    onSyncVitals,
    onPortalTravel,
    onInteractNpc,
    onInteractHouse,
    onHearthRest,
    onDummyHit,
    onClaimDambanaBadge,
    onMeetElMastermind,
    onMeetHeroGhost,
    onMobDefeated,
    onPesosDelta,
    onGainMaterial,
    onCatchFish,
    onCompleteSideJob,
    onTownBossDefeated,
    onAwakenedBossDefeated,
    onElMastermindDefeated,
    onMastermindInstantDeath,
    onBulletDeflected,
    onShieldBroken,
    onPlayerDefeated,
  ]);

  useEffect(() => {
    initSpriteAtlases();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const zone = ZONES[progressRef.current.zoneId];
    const muniData = getMunicipalityById(zone.id);
    const awLevel = progressRef.current.awakenedCount || 0;
    // Balanced Awakened Mode scaling: challenging & tactical without unfair one-shots or bullet sponges
    const awHpMult = 1 + awLevel * 0.45;
    const awAtkMult = 1 + awLevel * 0.28;
    const awSpdMult = 1 + Math.min(0.45, awLevel * 0.12);

    // Dynamic Tropical Weather + Living Parallax + Roadside Wildlife & Flora + Clean Skill VFX Engine
    const atmosphere = new BataanAtmosphereSystem();
    atmosphere.weather = zone.lighting === 'cave_dark' ? 'clear' : weatherFromRainIntensity(zone.rainIntensity);
    const ambientLife = new AmbientWildlifeAndFlora();
    const skillVfx = new SkillVfxManager();

    // Respawn tracking for Mining Ore Nodes & Gatherable Plant Nodes
    const oreRespawns: Record<string, number> = {};
    const gatherRespawns: Record<string, number> = {};

    // Interactive Fishing Mini-Game State Machine
    let fishingState: {
      spotId: string;
      spotX: number;
      phase: 'casting' | 'waiting' | 'bite' | 'reeling';
      timer: number;
      fishId: string;
      fishName: string;
      fishDifficulty: number;
      reelProgress: number;
      cursorPos: number;
      cursorVel: number;
      zoneCenter: number;
      zoneTarget: number;
      zoneWidth: number;
      holdingReel: boolean;
    } | null = null;

    // Resolve safe sidewalk coordinates for every NPC so allies never stand inside buildings/outposts
    const buildingFootprints: Array<{ x: number; width: number }> = [];
    if (zone.buildings) {
      for (const b of zone.buildings) {
        buildingFootprints.push({ x: b.x, width: b.kind === 'patrol_gas' ? 230 : 210 });
      }
    }
    if (zone.houseX) {
      buildingFootprints.push({ x: zone.houseX, width: 190 });
    }
    if (zone.landmark) {
      buildingFootprints.push({ x: zone.landmark.x, width: 220 });
    }
    const resolvedNpcX = new Map<string, number>();
    for (const npc of zone.npcs) {
      const safeX = resolveSafeAllyStandX(npc.x, buildingFootprints);
      resolvedNpcX.set(npc.id, Math.max(110, Math.min(zone.width - 110, safeX)));
    }
    const getNpcX = (npc: { id: string; x: number }) => resolvedNpcX.get(npc.id) ?? npc.x;

    // Static world buildings/bunkers/outposts extracted ONCE so recruited allies NEVER drag buildings!
    const staticWorldBuildings: WorldBuilding[] = extractZoneStaticBuildings(zone.npcs, getNpcX);

    const createSkillState = (): SkillRuntimeFields => ({
      skillCooldowns: {},
      skillRotationTimer: 0.9 + Math.random() * 1.1,
      activeSkill: null,
      skillPhase: 'none',
      skillTimer: 0,
      skillTargetX: 0,
      skillDidHit: false,
    });

    const heroMotion = createHeroMotionState();
    initTiradorSheet();
    let tiradorShotCount = 0;

    const playerDebuffs = {
      soaked: false,
      burn: false,
      burnTick: GAME_CONFIG.weather.burnTickIntervalSec,
      poison: 0,
      poisonTick: 1.0,
      stun: 0,
      freeze: 0,
      confusion: 0,
      confusionAtkCd: 0.9,
      shadow: 0,
      slow: 0,
      bleed: 0,
      bleedTick: 0,
      blind: 0,
    };

    const getBuffMult = (stat: ActiveBuffState['stat']): number => {
      const found = activeBuffsRef.current.find((b) => b.stat === stat && b.remainingSec > 0);
      return found ? found.multiplier : 1;
    };

    const applyTimedBuff = (buff: {
      stat: ActiveBuffState['stat'];
      label: string;
      multiplier: number;
      durationSec: number;
    }) => {
      const existing = activeBuffsRef.current.find((b) => b.stat === buff.stat);
      if (existing) {
        // Refresh duration & upgrade multiplier if stronger — never stack infinitely
        existing.remainingSec = Math.max(existing.remainingSec, buff.durationSec);
        existing.maxSec = Math.max(existing.maxSec, buff.durationSec);
        if (buff.multiplier >= existing.multiplier) {
          existing.multiplier = buff.multiplier;
          existing.label = buff.label;
        }
      } else {
        activeBuffsRef.current.push({
          stat: buff.stat,
          label: buff.label,
          multiplier: buff.multiplier,
          remainingSec: buff.durationSec,
          maxSec: buff.durationSec,
        });
      }
      noirAudio.playBuffChime();
      const themeMap: Record<ActiveBuffState['stat'], 'buff_atk' | 'buff_def' | 'buff_speed' | 'buff_luck'> = {
        atk_up: 'buff_atk',
        def_up: 'buff_def',
        speed_up: 'buff_speed',
        lucky_drop: 'buff_luck',
      };
      skillVfx.spawn(themeMap[buff.stat], player.x, Math.floor(viewH * 0.8) + player.y - 8, player.facing);
    };

    if (progressRef.current.bgmEnabled) {
      noirAudio.playBgm(zone.bgmTrack);
    }

    let timeOfDay = progressRef.current.timeOfDay ?? 9.5;
    let freezeFrameTimer = 0;
    let redEyepatchOverlay = 0;
    let pendingInstantDeathDialogue: string | null = null;
    let whistlePulseTimer = 0;
    let dustTimer = 0;

    const player = {
      x: progressRef.current.spawnX || zone.safeSpawnX,
      y: 0,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      jumpsLeft: 2,
      walkPhase: 0,
      hp: Math.min(progressRef.current.hp, statsRef.current.maxHp),
      sp: Math.min(progressRef.current.sp, statsRef.current.maxSp),
      energy: progressRef.current.energy,
      mood: progressRef.current.mood,
      sanctuaryBuffSec: progressRef.current.sanctuaryBuffSec,
      slashTimer: 0,
      slashDuration: 0.35,
      slashCooldown: 0,
      tiradorTimer: 0,
      tiradorDuration: 0.28,
      tiradorCooldown: 0,
      currentAmmo: 'river_pebble' as TiradorAmmoKind,
      attackElapsed: 0,
      attackLocked: false,
      attackFacing: 1 as 1 | -1,
      attackRiding: false,
      attackReach: 98,
      attackBaseDmg: 10,
      attackHitIds: new Set<string>(),
      shieldTimer: 0,
      shieldCooldown: 0,
      shieldHold: false,
      comboStep: 0,
      comboResetTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      hurtFlash: 0,
      comboCount: 0,
      comboDecay: 0,
      wasAirborne: false,
    };

    const companion = {
      x: player.x - 56,
      y: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      walkPhase: 0,
      actionCooldown: 1.0,
      slashTimer: 0,
      statusText: 'Following',
    };
    const policeAllyState = createPoliceAllyState();

    let dummyRecoil = 0;
    let screenShake = 0;
    let speechBanner: { speaker: string; text: string; timer: number } | null = null;
    let bossMusicActive = false;
    const keys: Record<string, boolean> = {};
    let touchMoveDir: -1 | 0 | 1 = 0;

    // Spawn Zone Mobs using central GAME_CONFIG.enemyScaling!
    const es = GAME_CONFIG.enemyScaling;
    const townHpScale = 1 + Math.max(0, (zone.order || 1) - 1) * es.zoneHpStep;
    const townAtkScale = 1 + Math.max(0, (zone.order || 1) - 1) * es.zoneAtkStep;
    const mobs: MobEntity[] = zone.mobs.map((m, idx) => {
      const isStarterPest = m.kind === 'rodent_daga' || m.kind === 'bukid_pest';
      const baseHp = isStarterPest ? 36 + m.level * 14 : es.hpBase + m.level * es.hpPerLevel;
      const baseAtk = isStarterPest ? 5 + m.level * 1.8 : es.atkBase + m.level * es.atkPerLevel;
      const maxHp = Math.round(baseHp * townHpScale * awHpMult);
      const usesGun = ARMED_MOB_KINDS.includes(m.kind);
      const isFlying =
        m.kind === 'aswang' || m.kind === 'insekto' || m.kind === 'white_lady' || m.kind === 'cave_bat';
      const hoverBaseY =
        m.kind === 'aswang'
          ? -56
          : m.kind === 'insekto' || m.kind === 'cave_bat'
            ? -48
            : m.kind === 'white_lady'
              ? -24
              : 0;
      const hasShield =
        m.kind === 'corrupt_soldier' ||
        (awLevel >= 1 && (usesGun || m.kind === 'fat_guy' || m.kind === 'corrupt_politician'));
      const shieldMax = hasShield ? Math.round((46 + m.level * 12) * (1 + awLevel * 0.28)) : 0;
      return {
        ...createSkillState(),
        id: `${zone.id}_mob_${idx}`,
        name: MOB_NAMES[m.kind],
        kind: m.kind,
        x: Math.max(120, Math.min(zone.width - 120, m.x)),
        homeX: Math.max(120, Math.min(zone.width - 120, m.x)),
        y: hoverBaseY,
        isFlying,
        hoverBaseY,
        swoopTimer: 0,
        facing: -1,
        hp: maxHp,
        maxHp,
        atk: Math.round(baseAtk * townAtkScale * awAtkMult),
        level: m.level,
        walkPhase: idx * 1.4,
        atkCooldown: 1.0,
        hurtFlash: 0,
        slashTimer: 0,
        stunTimer: 0,
        dead: false,
        respawnTimer: 0,
        shieldHp: shieldMax,
        shieldMax,
        usesGun,
        aimTimer: 0,
        guardTimer: 0,
        telegraphTimer: 0,
        bleedTimer: 0,
        bleedTick: 0,
        defShredTimer: 0,
        rallyBuffTimer: 0,
        weakSpotTimer: 0,
        stolenPesos: 0,
      };
    });

    runGameHealthCheck({
      hero: player,
      enemies: mobs,
      npcs: zone.npcs,
      sprites: { backdrop: getTownBackdropImage(zone.id) ?? undefined },
    });

    // Spawn BOTH Unique Town Bosses (Vice Mayor + Mayor) from BATAAN_TOWN_BOSSES!
    const townBosses: TownBossEntity[] = [];
    const bossConfig = getTownBossConfig(zone.id);
    if (bossConfig && zone.viceMayorX && zone.mayorX) {
      const defeatedIds = progressRef.current.bossProgression?.defeatedBossIds || [];
      const vmDefeated = defeatedIds.includes(bossConfig.viceMayor.id);
      const mayorDefeated = defeatedIds.includes(bossConfig.mayor.id);
      const vmMaxHp = Math.round(
        getScaledBossHp(bossConfig.viceMayor.hp, progressRef.current.level, zone.order) * awHpMult
      );
      const mayorMaxHp = Math.round(
        getScaledBossHp(bossConfig.mayor.hp, progressRef.current.level, zone.order) * awHpMult
      );
      const vmShield = awLevel >= 1 ? Math.round(85 * (1 + awLevel * 0.25)) : 0;
      const mayorShield = awLevel >= 1 ? Math.round(125 * (1 + awLevel * 0.25)) : 0;

      townBosses.push({
        ...createSkillState(),
        role: 'VICE_MAYOR',
        profile: bossConfig.viceMayor,
        x: zone.viceMayorX,
        homeX: zone.viceMayorX,
        facing: -1,
        hp: vmDefeated ? 0 : vmMaxHp,
        maxHp: vmMaxHp,
        atk: Math.round((12 + zone.order * 1.7) * awAtkMult),
        pesoReward: 250 + zone.order * 48,
        xpReward: 130 + zone.order * 26,
        walkPhase: 0,
        atkCooldown: 1.4,
        slashTimer: 0,
        hurtFlash: 0,
        stunTimer: 0,
        defeated: vmDefeated,
        quoteShown: vmDefeated,
        quote: getBossQuote(bossConfig.viceMayor, bossConfig.townName),
        shieldHp: vmDefeated ? 0 : vmShield,
        shieldMax: vmShield,
        weakSpotTimer: 0,
        telegraphTimer: 0,
        telegraphLabel: '',
        recoveryTimer: 0,
        bleedTimer: 0,
        bleedTick: 0,
        defShredTimer: 0,
      });

      townBosses.push({
        ...createSkillState(),
        role: 'MAYOR',
        profile: bossConfig.mayor,
        x: zone.mayorX,
        homeX: zone.mayorX,
        facing: -1,
        hp: mayorDefeated ? 0 : mayorMaxHp,
        maxHp: mayorMaxHp,
        atk: Math.round((15 + zone.order * 2.2) * awAtkMult),
        pesoReward: 440 + zone.order * 68,
        xpReward: 225 + zone.order * 38,
        walkPhase: 0,
        atkCooldown: 1.35,
        slashTimer: 0,
        hurtFlash: 0,
        stunTimer: 0,
        defeated: mayorDefeated,
        quoteShown: mayorDefeated,
        quote: getBossQuote(bossConfig.mayor, bossConfig.townName),
        dropGearId: zone.bossDropGearId,
        shieldHp: mayorDefeated ? 0 : mayorShield,
        shieldMax: mayorShield,
        weakSpotTimer: 0,
        telegraphTimer: 0,
        telegraphLabel: '',
        recoveryTimer: 0,
        bleedTimer: 0,
        bleedTick: 0,
        defShredTimer: 0,
      });
    }

    // Spawn AWAKENED-MODE EXCLUSIVE BOSSES (Corrupt Barangay Captain & Corrupt Congressman!)
    const awakenedBosses: AwakenedBossEntity[] = [];
    if (awLevel >= 1) {
      for (const def of AWAKENED_BOSSES) {
        if (def.zoneId !== zone.id) continue;
        const alreadyDown = progressRef.current.awakenedBossesDefeated.includes(def.id);
        if (alreadyDown) continue;
        const maxHp = Math.round(def.hp * (1 + (awLevel - 1) * 0.35));
        const shieldMax = Math.round(def.shieldMax * (1 + (awLevel - 1) * 0.24));
        awakenedBosses.push({
          ...createSkillState(),
          def,
          x: def.spawnX,
          homeX: def.spawnX,
          facing: -1,
          hp: maxHp,
          maxHp,
          atk: Math.round(def.atk * (1 + (awLevel - 1) * 0.22)),
          shieldHp: shieldMax,
          shieldMax,
          shieldRegenTimer: 15,
          aimTimer: 0,
          walkPhase: 0,
          atkCooldown: 1.45,
          slashTimer: 0,
          hurtFlash: 0,
          stunTimer: 0,
          defeated: false,
          quoteShown: false,
          weakSpotTimer: 0,
          telegraphTimer: 0,
          telegraphLabel: '',
          recoveryTimer: 0,
          bleedTimer: 0,
          bleedTick: 0,
          defShredTimer: 0,
        });
      }
    }

    // Spawn RARE / HISTORIC SHRINE SPECTRAL NATIONAL HERO GHOST!
    let activeGhost: { def: HeroGhostDef; x: number } | null = null;
    if (zone.id !== 'defender_home') {
      const shrineHero = NATIONAL_HERO_GHOSTS.find((g) => g.shrineZoneId === zone.id);
      if (shrineHero) {
        const ghostX =
          zone.hasDambanaShrine && zone.dambanaShrineX
            ? zone.dambanaShrineX + 165
            : zone.landmark
              ? Math.min(zone.width - 420, zone.landmark.x + 165)
              : Math.min(zone.width - 420, Math.max(520, zone.safeSpawnX + 560));
        activeGhost = { def: shrineHero, x: ghostX };
      } else if (Math.random() < 0.18) {
        const unmet = NATIONAL_HERO_GHOSTS.filter(
          (g) => !progressRef.current.metHeroGhostIds.includes(g.id)
        );
        const pool = unmet.length > 0 ? unmet : NATIONAL_HERO_GHOSTS;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        const ghostX = zone.landmark
          ? Math.min(zone.width - 440, zone.landmark.x + 175)
          : Math.min(zone.width - 440, Math.max(580, zone.safeSpawnX + 640));
        activeGhost = { def: picked, x: ghostX };
      }
    }

    // Spawn El Mastermind physically outside Bataan Provincial Capitol in Balanga City!
    let elMastermind: ElMastermindEntity | null = null;
    if (zone.hasElMastermind && zone.elMastermindX) {
      const mmDefeated = progressRef.current.bossProgression?.elMastermindDefeated || false;
      const mmMaxHp = Math.round(1350 * awHpMult);
      elMastermind = {
        ...createSkillState(),
        x: zone.elMastermindX,
        homeX: zone.elMastermindX,
        facing: -1,
        hp: mmDefeated ? 0 : mmMaxHp,
        maxHp: mmMaxHp,
        atk: Math.round(28 * awAtkMult),
        walkPhase: 0,
        atkCooldown: 1.5,
        slashTimer: 0,
        hurtFlash: 0,
        phase: 1,
        fightActive: false,
        defeated: mmDefeated,
        eyeFlashTimer: 0,
        summonTimer: 8,
        weakSpotTimer: 0,
        telegraphTimer: 0,
        telegraphLabel: '',
        recoveryTimer: 0,
        bleedTimer: 0,
        bleedTick: 0,
        defShredTimer: 0,
      };
    }

    // Spawn Proper-Scale Bataan Foreground Highway Vehicles (Atmospheric Non-Damaging Props!)
    const vehicles: TrafficVehicle[] = [];
    if (zone.hasTraffic) {
      const kinds: VehicleKind[] = [
        'jeepney',
        'tricycle',
        'patrol_car',
        'rescue_van',
        'delivery_tricycle',
        'motorcycle',
      ];
      for (let i = 0; i < 2; i++) {
        vehicles.push({
          x: 940 + i * 860,
          dir: i % 2 === 0 ? -1 : 1,
          speed: i === 0 ? 155 : 196,
          kind: kinds[(zone.order + i) % kinds.length],
          laneOffset: i === 0 ? 52 : 66,
        });
      }
    }

    const projectiles: Projectile[] = [];
    const impactBursts: ImpactBurst[] = [];
    const bulletTracers: BulletTracer[] = [];
    let projectileSeq = 0;
    const spawnProj = (
      opts: Omit<Projectile, 'id' | 'vy' | 'kind' | 'rotation' | 'spinSpeed' | 'maxLife' | 'trail'> & {
        vy?: number;
        kind?: ProjectileVfxKind;
        spinSpeed?: number;
        sprite?: HTMLImageElement | HTMLCanvasElement | null;
      }
    ) => {
      const vy = opts.vy ?? 0;
      const inferredKind: ProjectileVfxKind =
        opts.kind ??
        (opts.isTiradorAmmo
          ? opts.isTiradorAmmo
          : opts.isLaser
            ? 'laser'
            : opts.isBullet
              ? 'bullet'
              : opts.isInkWave
                ? 'ink'
                : opts.color === '#A855F7'
                  ? 'curse'
                  : opts.color === '#22C55E'
                    ? 'bribe'
                    : opts.color === '#7CF7DC'
                      ? 'salt'
                      : 'energy');
      const dir = Math.sign(opts.vx) || 1;
      const defaultSpin =
        inferredKind === 'pebble'
          ? 14 * dir
          : inferredKind === 'agimat'
            ? 10 * dir
            : inferredKind === 'sili'
              ? 12 * dir
              : inferredKind === 'bribe'
                ? 9 * dir
                : inferredKind === 'curse'
                  ? 7 * dir
                  : 0;
      const ammoSprite =
        opts.sprite !== undefined
          ? opts.sprite
          : opts.isTiradorAmmo
            ? getTiradorAmmoSprite(
                opts.isTiradorAmmo === 'sili'
                  ? 'sili_bomb'
                  : opts.isTiradorAmmo === 'agimat'
                    ? 'agimat_stone'
                    : 'river_pebble'
              )
            : null;
      projectiles.push({
        ...opts,
        id: `proj_${++projectileSeq}`,
        vy,
        kind: inferredKind,
        sprite: ammoSprite,
        rotation: Math.atan2(vy, opts.vx),
        spinSpeed: opts.spinSpeed ?? defaultSpin,
        maxLife: opts.life,
        trail: [] as TrailParticle[],
      });
    };
    const floatingTexts: FloatingText[] = [];
    const dustParticles: DustParticle[] = [];
    const dashGhosts: DashGhost[] = [];

    // Multi-Frame Death Animation Queue + Hero Down State + Level-Up Celebration + The Gracias Nomar Summon
    const dyingEntities: Array<{ state: DyingEntityState; onLoot?: () => void }> = [];
    let heroDying: DyingEntityState | null = null;
    let levelUpAnim: ActiveLevelUpAnimation | null = null;
    let lastKnownLevel = progressRef.current.level;

    let graciasNomar: (SkillRuntimeFields & {
      x: number;
      facing: 1 | -1;
      hp: number;
      maxHp: number;
      atk: number;
      state: 'portal' | 'idle' | 'blitz' | 'counter';
      stateTimer: number;
      stateDuration: number;
      atkCooldown: number;
      hurtFlash: number;
      defeated: boolean;
      didStrikeThisBlitz: boolean;
      weakSpotTimer: number;
    }) | null = null;

    const spawnGraciasNomarAt = (summonX: number) => {
      const clampedX = Math.max(140, Math.min(zone.width - 140, summonX));
      graciasNomar = {
        ...createSkillState(),
        x: clampedX,
        facing: player.x >= clampedX ? 1 : -1,
        hp: Math.round(440 * awHpMult),
        maxHp: Math.round(440 * awHpMult),
        atk: Math.round(22 * awAtkMult),
        state: 'portal',
        stateTimer: 1.0,
        stateDuration: 1.0,
        atkCooldown: 1.4,
        hurtFlash: 0,
        defeated: false,
        didStrikeThisBlitz: false,
        weakSpotTimer: 0,
      };
    };

    // White Magic (Albularyo) & Black Magic (Mangkukulam) live combat state
    const magicCooldowns: Record<string, number> = {};
    let tawasShieldTimer = 0;
    let herbalSanctuary: { x: number; timer: number; tickTimer: number } | null = null;
    let heroMagicCast: { school: MagicSchool; timer: number; duration: number } | null = null;
    const activeMagicEffects: Array<{
      effectKind: MagicSkillDef['effectKind'];
      x: number;
      facing: 1 | -1;
      timer: number;
      duration: number;
    }> = [];

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTexts.push({ x, y, vy: -44, text, color, life: 1.0, maxLife: 1.0 });
    };

    const spawnDust = (x: number, y: number, count: number, color = '#D6E3EC') => {
      for (let i = 0; i < count; i++) {
        dustParticles.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y - Math.random() * 6,
          vx: (Math.random() - 0.5) * 65,
          vy: -18 - Math.random() * 38,
          size: 3 + Math.floor(Math.random() * 4),
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          color,
        });
      }
    };

    const spawnHitSparks = (x: number, y: number, accent = '#FDE047') => {
      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 * i) / 9 + (Math.random() - 0.5) * 0.45;
        const speed = 90 + Math.random() * 145;
        dustParticles.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 14,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 22,
          size: i % 2 === 0 ? 5 : 3,
          life: 0.16 + Math.random() * 0.14,
          maxLife: 0.3,
          color: i % 3 === 0 ? '#FFFFFF' : accent,
        });
      }
    };

    const showBanner = (speaker: string, text: string, duration = 4.0) => {
      speechBanner = { speaker, text, timer: duration };
    };

    const getPlayerAccuracyMult = (): number => {
      const prog = progressRef.current;
      const nightActive = zone.lighting === 'haunted_night' || isTimeNight(timeOfDay);
      const caveDarkPenalty =
        zone.lighting === 'cave_dark' && prog.equippedHeadgearId !== 'head_miners_lamp';
      let mult = 1.0;
      if (nightActive || caveDarkPenalty) {
        mult *= 1 - GAME_CONFIG.combat.nightAccuracyPenalty;
      }
      if (atmosphere.weather === 'fog') {
        mult *= 1 - GAME_CONFIG.combat.fogAccuracyPenalty;
      }
      if (playerDebuffs.blind > 0) {
        mult *= 0.72;
      }
      return mult;
    };

    const damageMob = (
      m: MobEntity,
      rawDamage: number,
      sourceX: number,
      labelColor?: string,
      shieldBreakPower = 1,
      skipAccuracyCheck = false
    ) => {
      if (m.dead) return;
      if (!skipAccuracyCheck && Math.random() > getPlayerAccuracyMult()) {
        noirAudio.playMissWhoosh();
        addFloatingText(m.x, m.y - 76, 'MISS!', '#94A3B8');
        return;
      }
      const hasBolo = progressRef.current.equippedWeaponId === 'wpn_bolo_katipunan';
      const isCrit = Math.random() < statsRef.current.critChance;
      const critMult = statsRef.current.critDamageMult || 1.55;
      const shredMult = m.defShredTimer > 0 ? 1.35 : 1;
      const weakMult = m.weakSpotTimer > 0 ? 2.4 : 1;
      const atkBuffMult = getBuffMult('atk_up') * (playerDebuffs.shadow > 0 ? 1 - (GAME_CONFIG.debuffs.shadow.statPenaltyPct || 0.22) : 1);
      // Tactical frontal guard mitigation for bruisers (flank behind or break with [L]/magic!)
      const hittingFront = Math.sign(sourceX - m.x) === m.facing;
      const guarded = m.guardTimer > 0 && hittingFront && shieldBreakPower < 2;
      const mobDefMit = GAME_CONFIG.enemyScaling.defBase + m.level * GAME_CONFIG.enemyScaling.defPerLevel;
      const effectiveRaw = Math.max(2, rawDamage * atkBuffMult - mobDefMit * 0.4);
      let dmg = Math.max(
        1,
        Math.round(effectiveRaw * (isCrit ? critMult : 1) * shredMult * weakMult * (guarded ? 0.35 : 1))
      );

      if (guarded) {
        noirAudio.playUmbrellaBlock();
        addFloatingText(m.x, -94, 'GUARDED! FLANK OR [L]', '#94A3B8');
      } else if (m.guardTimer > 0 && !hittingFront) {
        // Flank backstab punishes guard!
        m.guardTimer = 0;
        m.stunTimer = Math.max(m.stunTimer, 0.9);
        dmg = Math.round(dmg * 1.45);
        addFloatingText(m.x, -96, 'FLANK CRIT!', '#F4C542');
      }

      if (m.shieldHp > 0 && shieldBreakPower > 0) {
        const shieldDmg = Math.round(dmg * shieldBreakPower * (hasBolo ? 1.9 : 1));
        m.shieldHp = Math.max(0, m.shieldHp - shieldDmg);
        m.hurtFlash = 0.14;
        if (m.shieldHp <= 0) {
          m.stunTimer = Math.max(m.stunTimer, 1.4);
          noirAudio.playShieldBreak();
          screenShake = Math.max(screenShake, 6);
          addFloatingText(m.x, -104, 'SHIELD SHATTERED!', '#38BDF8');
          callbacksRef.current.onShieldBroken();
        } else {
          dmg = Math.max(2, Math.round(dmg * 0.35));
          noirAudio.playUmbrellaBlock();
          addFloatingText(m.x, -86, `SHIELDED -${dmg}`, '#7DD3FC');
        }
      }

      m.hp -= dmg;
      m.hurtFlash = 0.22;
      spawnHitSparks(m.x, -48, isCrit ? '#F4C542' : '#FFFFFF');
      if (m.kind !== 'balete_tree') {
        m.x += Math.sign(m.x - sourceX || 1) * 14;
      }
      // Bruisers raise brief tactical guard after taking a frontal hit
      if (
        (m.kind === 'fat_guy' || m.kind === 'bad_guy' || m.kind === 'robber') &&
        m.guardTimer <= 0 &&
        m.stunTimer <= 0 &&
        hittingFront &&
        Math.random() < 0.26
      ) {
        m.guardTimer = 1.15;
      }
      player.comboCount += 1;
      player.comboDecay = 2.6;
      if (m.shieldHp <= 0) {
        noirAudio.playHit(isCrit);
        addFloatingText(m.x, -68, isCrit ? `${dmg}!` : `${dmg}`, labelColor || (isCrit ? '#F4C542' : '#FFFFFF'));
      }
      if (m.hp <= 0) {
        m.dead = true;
        m.respawnTimer =
          zone.id === 'farming_fields'
            ? GAME_CONFIG.farmingRespawnSec
            : zone.id === 'natib_cave'
              ? GAME_CONFIG.caveRespawnSec
              : 14;
        const luckyMult = getBuffMult('lucky_drop');
        const recoveredPesos = m.stolenPesos || 0;
        m.stolenPesos = 0;
        const pesos = Math.round((52 + m.level * 20) * statsRef.current.pesoMult * (1 + awLevel * 0.35));
        const xp = Math.round((28 + m.level * 14) * (1 + awLevel * 0.35));
        let lootDropId: string | undefined;
        let lootLabel: string | undefined;
        const dr = GAME_CONFIG.dropRates;
        const roll = Math.random();
        if (roll < Math.min(0.95, dr.common * luckyMult)) {
          const isFolklore = FOLKLORE_KINDS.includes(m.kind) || m.kind === 'insekto' || m.kind === 'cobra';
          const isElite =
            m.kind === 'corrupt_politician' ||
            m.kind === 'evil_pastor' ||
            m.kind === 'corrupted_priest' ||
            m.kind === 'corrupt_police' ||
            m.kind === 'corrupt_soldier';
          const tierIdx = isElite
            ? 3
            : isFolklore || roll < dr.rare * luckyMult
              ? 2
              : roll < dr.uncommon * luckyMult
                ? 1
                : 0;
          lootDropId = LOOT_ITEMS[tierIdx].id;
          lootLabel = LOOT_ITEMS[tierIdx].name;
        }
        // Farming & Cave Monster Material Drops
        let matDropId: string | undefined;
        if (Math.random() < Math.min(0.95, dr.materialDropChance * luckyMult)) {
          if (m.kind === 'rodent_daga' || m.kind === 'bukid_pest') matDropId = 'mat_daga_pelt';
          else if (m.kind === 'cave_spider') matDropId = 'mat_spider_silk';
          else if (m.kind === 'cave_centipede' || m.kind === 'cobra') matDropId = 'mat_venom_gland';
          else if (m.kind === 'cave_bat') matDropId = 'mat_bat_wing';
        }
        const deathSeq = spawnDeathSequence({
          id: `${m.id}_${Date.now()}`,
          kind: m.kind,
          name: m.name,
          x: m.x,
          y: Math.floor(viewH * 0.8),
          facing: m.facing,
          knockbackDir: (Math.sign(m.x - sourceX || 1) as 1 | -1),
        });
        noirAudio.playDeathCollapse(deathSeq.style);
        dyingEntities.push({
          state: deathSeq,
          onLoot: () => {
            if (recoveredPesos > 0) {
              addFloatingText(deathSeq.x, -126, `RECOVERED STOLEN ₱${recoveredPesos}!`, '#FDE047');
            }
            if (matDropId) {
              const matDef = getMaterialById(matDropId);
              callbacksRef.current.onGainMaterial(matDropId, 1, 0);
              if (matDef) {
                addFloatingText(deathSeq.x, -112, `+1 ${matDef.name}`, '#38BDF8');
              }
            } else if (lootLabel) {
              addFloatingText(deathSeq.x, -106, `Drop: ${lootLabel}`, '#7AE582');
            }
            addFloatingText(deathSeq.x, -86, `+₱${pesos + recoveredPesos} · +${xp} XP`, '#F4C542');
            callbacksRef.current.onMobDefeated(pesos + recoveredPesos, xp, lootDropId);
          },
        });
      }
    };

    const damageTownBoss = (
      b: TownBossEntity,
      rawDamage: number,
      sourceX: number,
      isMegaphone = false,
      labelColor?: string
    ) => {
      if (b.defeated) return;
      if (Math.random() > getPlayerAccuracyMult()) {
        noirAudio.playMissWhoosh();
        addFloatingText(b.x, -96, 'MISS!', '#94A3B8');
        return;
      }
      const hasBolo = progressRef.current.equippedWeaponId === 'wpn_bolo_katipunan';
      const isCrit = Math.random() < statsRef.current.critChance;
      const critMult = statsRef.current.critDamageMult || 1.55;
      const shredMult = b.defShredTimer > 0 ? 1.35 : 1;
      const atkBuffMult = getBuffMult('atk_up') * (playerDebuffs.shadow > 0 ? 1 - (GAME_CONFIG.debuffs.shadow.statPenaltyPct || 0.22) : 1);
      // Flank behind boss during recovery -> EXPOSE WEAK SPOT (2.4x DMG)!
      const isFlank = Math.sign(sourceX - b.x) === -b.facing;
      if (isFlank && b.recoveryTimer > 0 && b.weakSpotTimer <= 0) {
        b.weakSpotTimer = 3.0;
        b.stunTimer = Math.max(b.stunTimer, 0.8);
        noirAudio.playShieldBreak();
        addFloatingText(b.x, -138, 'WEAK SPOT EXPOSED! 2.4× DMG!', '#FDE047');
      }
      const weakMult = b.weakSpotTimer > 0 ? 2.4 : 1;
      const mult = (isCrit ? critMult : 1) * (isMegaphone ? 1.35 : 1) * weakMult * shredMult * atkBuffMult;
      let dmg = Math.max(1, Math.round(rawDamage * mult));

      if (b.shieldHp > 0) {
        const sDmg = Math.round(dmg * (isMegaphone ? 2.6 : hasBolo ? 1.85 : 0.75));
        b.shieldHp = Math.max(0, b.shieldHp - sDmg);
        if (b.shieldHp <= 0) {
          b.stunTimer = 1.6;
          b.weakSpotTimer = 2.8;
          noirAudio.playShieldBreak();
          screenShake = Math.max(screenShake, 8);
          addFloatingText(b.x, -124, 'SHIELD SHATTERED · WEAK SPOT 2×!', '#FDE047');
          callbacksRef.current.onShieldBroken();
        } else {
          dmg = Math.max(3, Math.round(dmg * 0.35));
          noirAudio.playUmbrellaBlock();
          addFloatingText(b.x, -104, `SHIELDED (${b.shieldHp}) · PRESS [L]`, '#7DD3FC');
        }
      }

      b.hp -= dmg;
      b.hurtFlash = 0.22;
      spawnHitSparks(b.x, -64, weakMult > 1 ? '#FDE047' : isCrit ? '#F4C542' : '#7DD3FC');
      b.x += Math.sign(b.x - sourceX || 1) * 8;
      player.comboCount += 1;
      player.comboDecay = 2.8;
      screenShake = Math.max(screenShake, weakMult > 1 ? 8 : isCrit ? 6 : 3.5);
      noirAudio.playHit(isCrit || weakMult > 1);
      addFloatingText(
        b.x,
        -88,
        weakMult > 1 ? `WEAK SPOT! ${dmg}` : isMegaphone ? `EXPOSED! ${dmg}` : isCrit ? `${dmg}!` : `${dmg}`,
        weakMult > 1 ? '#FDE047' : labelColor || (isCrit ? '#F4C542' : '#FFFFFF')
      );
      if (b.hp <= 0) {
        b.hp = 0;
        b.defeated = true;
        const anyBossAlive =
          townBosses.some((tb) => !tb.defeated) ||
          awakenedBosses.some((ab) => !ab.defeated) ||
          (elMastermind?.fightActive && !elMastermind.defeated);
        if (!anyBossAlive) {
          bossMusicActive = false;
          if (progressRef.current.bgmEnabled) noirAudio.playBgm(zone.bgmTrack);
        }
        const deathSeq = spawnDeathSequence({
          id: `tb_${zone.id}_${b.role}_${Date.now()}`,
          kind: b.role === 'MAYOR' ? 'mayor' : 'vice_mayor',
          bossId: b.profile.id,
          name: b.profile.name,
          x: b.x,
          y: Math.floor(viewH * 0.8),
          facing: b.facing,
          knockbackDir: (Math.sign(b.x - sourceX || 1) as 1 | -1),
        });
        noirAudio.playDeathCollapse(deathSeq.style);
        noirAudio.playVictory();
        const finalPesos = Math.round(b.pesoReward * statsRef.current.pesoMult);
        dyingEntities.push({ state: deathSeq });
        addFloatingText(b.x, -124, `VICTORY! · +₱${finalPesos}`, '#F4C542');
        addFloatingText(b.x, -146, `EVIDENCE: ${b.profile.dropName}`, '#7AE582');
        showBanner('Bataan Hero Defender', `${b.profile.name} defeated! Secured ${b.profile.dropName}!`, 4.8);
        if (progressRef.current.voiceEnabled) {
          englishVoice.speak(`Well done! You defeated ${b.profile.name} and secured the ${b.profile.dropName}!`, {
            pitch: 1.0,
            rate: 1.0,
            style: 'kapitan',
          });
        }
        callbacksRef.current.onTownBossDefeated(
          zone.id,
          b.role,
          b.profile,
          finalPesos,
          b.xpReward,
          b.dropGearId
        );
      }
    };

    const damageAwakenedBoss = (
      ab: AwakenedBossEntity,
      rawDamage: number,
      sourceX: number,
      isMegaphone = false,
      labelColor?: string
    ) => {
      if (ab.defeated) return;
      const hasBolo = progressRef.current.equippedWeaponId === 'wpn_bolo_katipunan';
      const isCrit = Math.random() < statsRef.current.critChance;
      const critMult = statsRef.current.critDamageMult || 1.55;
      const shredMult = ab.defShredTimer > 0 ? 1.35 : 1;
      const isFlank = Math.sign(sourceX - ab.x) === -ab.facing;
      if (isFlank && ab.recoveryTimer > 0 && ab.weakSpotTimer <= 0) {
        ab.weakSpotTimer = 3.0;
        ab.stunTimer = Math.max(ab.stunTimer, 0.85);
        noirAudio.playShieldBreak();
        addFloatingText(ab.x, -156, 'WEAK SPOT EXPOSED! 2.4× DMG!', '#FDE047');
      }
      const weakMult = ab.weakSpotTimer > 0 ? 2.4 : 1;
      const mult = (isCrit ? critMult : 1) * (isMegaphone ? 1.4 : 1) * weakMult * shredMult;
      let dmg = Math.max(1, Math.round(rawDamage * mult));

      if (ab.shieldHp > 0) {
        const sDmg = Math.round(dmg * (isMegaphone ? 2.8 : hasBolo ? 1.9 : 0.65));
        ab.shieldHp = Math.max(0, ab.shieldHp - sDmg);
        if (ab.shieldHp <= 0) {
          ab.stunTimer = 2.0;
          ab.weakSpotTimer = 3.0;
          ab.shieldRegenTimer = 15;
          noirAudio.playShieldBreak();
          screenShake = Math.max(screenShake, 10);
          addFloatingText(ab.x, -144, 'IMMUNITY SHATTERED · WEAK SPOT 2×!', '#FDE047');
          callbacksRef.current.onShieldBroken();
        } else {
          dmg = Math.max(3, Math.round(dmg * 0.3));
          noirAudio.playUmbrellaBlock();
          addFloatingText(ab.x, -124, `SHIELDED (${ab.shieldHp}) · PRESS [L]!`, '#7DD3FC');
        }
      }

      ab.hp -= dmg;
      ab.hurtFlash = 0.22;
      spawnHitSparks(ab.x, -72, weakMult > 1 ? '#FDE047' : isCrit ? '#F4C542' : '#7DD3FC');
      ab.x += Math.sign(ab.x - sourceX || 1) * 7;
      player.comboCount += 1;
      player.comboDecay = 2.8;
      screenShake = Math.max(screenShake, weakMult > 1 ? 9 : isCrit ? 7 : 4);
      noirAudio.playHit(isCrit || weakMult > 1);
      addFloatingText(
        ab.x,
        -104,
        weakMult > 1 ? `WEAK SPOT! ${dmg}` : isMegaphone ? `EXPOSED! ${dmg}` : isCrit ? `${dmg}!` : `${dmg}`,
        weakMult > 1 ? '#FDE047' : labelColor || (isCrit ? '#F4C542' : '#FFFFFF')
      );

      if (ab.hp <= 0) {
        ab.hp = 0;
        ab.defeated = true;
        const anyBossAlive =
          townBosses.some((tb) => !tb.defeated) ||
          awakenedBosses.some((other) => !other.defeated) ||
          (elMastermind?.fightActive && !elMastermind.defeated);
        if (!anyBossAlive) {
          bossMusicActive = false;
          if (progressRef.current.bgmEnabled) noirAudio.playBgm(zone.bgmTrack);
        }
        const deathSeq = spawnDeathSequence({
          id: ab.def.id,
          kind: 'awakened_boss',
          bossId: ab.def.id,
          name: ab.def.name,
          x: ab.x,
          y: Math.floor(viewH * 0.8),
          facing: ab.facing,
          knockbackDir: (Math.sign(ab.x - sourceX || 1) as 1 | -1),
        });
        noirAudio.playDeathCollapse(deathSeq.style);
        noirAudio.playVictory();
        dyingEntities.push({ state: deathSeq });
        const finalPesos = Math.round(ab.def.rewardPesos * statsRef.current.pesoMult);
        addFloatingText(ab.x, -138, `AWAKENED BOSS DEFEATED! +₱${finalPesos}`, '#F4C542');
        showBanner(ab.def.name, ab.def.defeatQuote, 5.2);
        if (progressRef.current.voiceEnabled) {
          englishVoice.speak(ab.def.defeatQuote, { pitch: 0.82, rate: 0.96, style: 'boss_male' });
        }
        callbacksRef.current.onAwakenedBossDefeated(ab.def.id, finalPesos, ab.def.rewardXp, ab.def.rewardGearId);
      }
    };

    const damageGraciasNomar = (
      rawDamage: number,
      sourceX: number,
      labelColor?: string,
      isMegaphone = false
    ) => {
      if (!graciasNomar || graciasNomar.defeated || graciasNomar.state === 'portal') return;
      if (graciasNomar.state === 'counter') {
        if (isMegaphone) {
          // Megaphone [L] shatters Nomar's Crimson Barrier & exposes 2.4x Weak Spot!
          graciasNomar.state = 'idle';
          graciasNomar.activeSkill = null;
          graciasNomar.skillPhase = 'none';
          graciasNomar.weakSpotTimer = 3.2;
          noirAudio.playShieldBreak();
          screenShake = Math.max(screenShake, 9);
          addFloatingText(graciasNomar.x, -124, 'COUNTER SHATTERED! WEAK SPOT 2.4×!', '#FDE047');
          callbacksRef.current.onShieldBroken();
        } else {
          // Crimson Barrier Counter-Shockwave punishes reckless melee strikes!
          noirAudio.playShieldBreak();
          screenShake = Math.max(screenShake, 8);
          addFloatingText(graciasNomar.x, -118, 'CRIMSON BARRIER COUNTER! USE [L]!', '#EF4444');
          hurtPlayer(Math.round(graciasNomar.atk * 1.15), graciasNomar.x, 'Crimson Shockwave', false, {
            unblockable: true,
          });
          return;
        }
      }
      const isCrit = Math.random() < statsRef.current.critChance;
      const weakMult = graciasNomar.weakSpotTimer > 0 ? 2.4 : 1;
      const dmg = Math.max(
        1,
        Math.round(rawDamage * weakMult * (isCrit ? statsRef.current.critDamageMult || 1.55 : 1))
      );
      graciasNomar.hp -= dmg;
      graciasNomar.hurtFlash = 0.2;
      spawnHitSparks(graciasNomar.x, -66, weakMult > 1 ? '#FDE047' : isCrit ? '#FDE047' : '#F87171');
      graciasNomar.x += Math.sign(graciasNomar.x - sourceX || 1) * 10;
      player.comboCount += 1;
      player.comboDecay = 2.6;
      noirAudio.playHit(isCrit || weakMult > 1);
      addFloatingText(
        graciasNomar.x,
        -96,
        weakMult > 1 ? `WEAK SPOT! ${dmg}` : isCrit ? `${dmg}!` : `${dmg}`,
        weakMult > 1 ? '#FDE047' : labelColor || (isCrit ? '#FDE047' : '#FCA5A5')
      );
      if (graciasNomar.hp <= 0) {
        graciasNomar.hp = 0;
        graciasNomar.defeated = true;
        const deathSeq = spawnDeathSequence({
          id: `gracias_nomar_${Date.now()}`,
          kind: 'the_gracias_nomar',
          name: 'The Gracias Nomar',
          x: graciasNomar.x,
          y: Math.floor(viewH * 0.8),
          facing: graciasNomar.facing,
          knockbackDir: (Math.sign(graciasNomar.x - sourceX || 1) as 1 | -1),
        });
        noirAudio.playDeathCollapse('sprite_collapse');
        dyingEntities.push({
          state: deathSeq,
          onLoot: () => {
            addFloatingText(deathSeq.x, -110, 'GRACIAS NOMAR BANISHED! +₱650', '#FACC15');
            callbacksRef.current.onMobDefeated(650, 320, LOOT_ITEMS[3]?.id);
          },
        });
      }
    };

    // EL MASTERMIND ATTACK HANDLER — ENFORCES 24/24 INSTANT-DEATH COUNTERATTACK RULE!
    const attackElMastermind = (rawDamage: number, sourceX: number, isMegaphone = false) => {
      if (!elMastermind || elMastermind.defeated || freezeFrameTimer > 0) return;

      const prog = progressRef.current;
      const result = handleAttackElMastermind(prog.bossProgression, rawDamage);

      if (result.triggeredInstantDeath) {
        elMastermind.eyeFlashTimer = 0.9;
        freezeFrameTimer = 0.55;
        redEyepatchOverlay = 0.95;
        screenShake = 18;
        pendingInstantDeathDialogue = result.dialogue;
        noirAudio.playMastermindFlash();
        addFloatingText(elMastermind.x, -144, 'IMMUNE! (0 DMG)', '#F4C542');
        addFloatingText(player.x, -108, '-999,999', '#FF2A2A');
        showBanner('EL MASTERMIND', result.dialogue, 6.0);
        if (prog.voiceEnabled) {
          englishVoice.speak(result.dialogue.replace('EL MASTERMIND: ', ''), {
            pitch: 0.72,
            rate: 0.94,
            style: 'mastermind',
          });
        }
        return;
      }

      // ALL 24/24 DROPS COLLECTED -> SHIELD SHATTER & TRUE 2-PHASE FINAL BOSS FIGHT!
      if (!elMastermind.fightActive) {
        elMastermind.fightActive = true;
        screenShake = 14;
        spawnDust(elMastermind.x, -45, 16, '#F4C542');
        addFloatingText(elMastermind.x, -152, 'POLITICAL IMMUNITY SHATTERED!', '#F4C542');
        showBanner('EL MASTERMIND', result.dialogue, 5.2);
        if (prog.bgmEnabled) {
          bossMusicActive = true;
          noirAudio.playBgm('boss_battle');
        }
        if (prog.voiceEnabled) {
          englishVoice.speak(result.dialogue.replace('EL MASTERMIND: ', ''), {
            pitch: 0.72,
            rate: 0.94,
            style: 'mastermind',
          });
        }
      }

      const isCrit = Math.random() < statsRef.current.critChance;
      const critMult = statsRef.current.critDamageMult || 1.55;
      const shredMult = elMastermind.defShredTimer > 0 ? 1.35 : 1;
      const isFlank = Math.sign(sourceX - elMastermind.x) === -elMastermind.facing;
      if (isFlank && elMastermind.recoveryTimer > 0 && elMastermind.weakSpotTimer <= 0) {
        elMastermind.weakSpotTimer = 2.8;
        noirAudio.playShieldBreak();
        addFloatingText(elMastermind.x, -162, 'EYEPATCH WEAK SPOT 2.4×!', '#FDE047');
      }
      const weakMult = elMastermind.weakSpotTimer > 0 ? 2.4 : 1;
      const mult = (isCrit ? critMult : 1) * (isMegaphone ? 1.45 : 1) * weakMult * shredMult;
      const dmg = Math.max(1, Math.round(rawDamage * mult));
      elMastermind.hp -= dmg;
      elMastermind.hurtFlash = 0.22;
      spawnHitSparks(elMastermind.x, -82, weakMult > 1 ? '#FDE047' : isCrit ? '#F4C542' : '#FF5A5F');
      elMastermind.x += Math.sign(elMastermind.x - sourceX || 1) * 6;
      player.comboCount += 1;
      player.comboDecay = 2.8;
      screenShake = Math.max(screenShake, weakMult > 1 ? 9 : isCrit ? 7 : 4);
      noirAudio.playHit(isCrit || weakMult > 1);
      addFloatingText(
        elMastermind.x,
        -118,
        weakMult > 1 ? `WEAK SPOT! ${dmg}` : isMegaphone ? `EXPOSED! ${dmg}` : `${dmg}`,
        weakMult > 1 ? '#FDE047' : isCrit ? '#F4C542' : '#FFFFFF'
      );

      // Trigger Phase 2 at <= 50% HP — Summon THE GRACIAS NOMAR via Crimson Portal!
      if (elMastermind.phase === 1 && elMastermind.hp <= elMastermind.maxHp * 0.5 && elMastermind.hp > 0) {
        elMastermind.phase = 2;
        elMastermind.eyeFlashTimer = 0.8;
        screenShake = 12;
        noirAudio.playMastermindFlash();
        addFloatingText(elMastermind.x, -154, 'PHASE 2: THE GRACIAS NOMAR SUMMONED!', '#FF3B3B');
        showBanner(
          'EL MASTERMIND (PHASE 2)',
          'Come forth, The Gracias Nomar! Tear this Bataan defender apart!',
          5.0
        );
        spawnGraciasNomarAt(elMastermind.x - elMastermind.facing * 118);
      }

      if (elMastermind.hp <= 0) {
        elMastermind.hp = 0;
        elMastermind.defeated = true;
        elMastermind.fightActive = false;
        bossMusicActive = false;
        if (prog.bgmEnabled) noirAudio.playBgm(zone.bgmTrack);
        const mmDeath = spawnDeathSequence({
          id: `el_mastermind_${Date.now()}`,
          kind: 'el_mastermind',
          name: 'El Mastermind',
          x: elMastermind.x,
          y: Math.floor(viewH * 0.8),
          facing: elMastermind.facing,
          knockbackDir: (Math.sign(elMastermind.x - sourceX || 1) as 1 | -1),
        });
        dyingEntities.push({ state: mmDeath });
        if (graciasNomar && !graciasNomar.defeated) {
          graciasNomar.defeated = true;
          dyingEntities.push({
            state: spawnDeathSequence({
              id: `gracias_banish_${Date.now()}`,
              kind: 'the_gracias_nomar',
              name: 'The Gracias Nomar',
              x: graciasNomar.x,
              y: Math.floor(viewH * 0.8),
              facing: graciasNomar.facing,
              knockbackDir: -graciasNomar.facing as 1 | -1,
            }),
          });
        }
        noirAudio.playDeathCollapse('sprite_collapse');
        noirAudio.playVictory();
        addFloatingText(elMastermind.x, -142, 'BATAAN IS FREE!', '#F4C542');
        showBanner(
          'VICTORY FOR BATAAN!',
          'El Mastermind has fallen outside the Provincial Capitol! All 12 towns and 237 barangays of Bataan are free!',
          7.0
        );
        if (prog.voiceEnabled) {
          englishVoice.speak(
            'Long live the Bataan Hero Defender! El Mastermind has fallen and the province of Bataan is finally free from corruption!',
            { pitch: 1.0, rate: 0.98, style: 'kapitan' }
          );
        }
        callbacksRef.current.onElMastermindDefeated(5000, 2000);
      }
    };

    const sweepActiveAttackHitbox = () => {
      if (!player.attackLocked || player.attackReach <= 0) return;
      const facing = player.attackFacing;
      const reach = player.attackReach;
      const baseDmg = player.attackBaseDmg;

      if (zone.hasPracticeDummy && zone.dummyX && !player.attackHitIds.has('dummy')) {
        const dx = zone.dummyX - player.x;
        if (Math.sign(dx || facing) === facing && Math.abs(dx) <= reach + 24) {
          player.attackHitIds.add('dummy');
          dummyRecoil = 1;
          const dmg = Math.round(baseDmg);
          player.comboCount += 1;
          player.comboDecay = 2.6;
          spawnHitSparks(zone.dummyX, -52, '#F4C542');
          noirAudio.playHit(player.comboStep === 2);
          addFloatingText(zone.dummyX, -92, `${dmg}`, '#F4C542');
          callbacksRef.current.onDummyHit();
        }
      }

      for (const m of mobs) {
        if (m.dead || player.attackHitIds.has(m.id)) continue;
        const dx = m.x - player.x;
        if (Math.abs(dx) <= reach && (Math.sign(dx) === facing || Math.abs(dx) < 34)) {
          player.attackHitIds.add(m.id);
          damageMob(m, baseDmg, player.x);
        }
      }

      for (const b of townBosses) {
        const key = `boss_${b.profile.id}`;
        if (b.defeated || player.attackHitIds.has(key)) continue;
        const dx = b.x - player.x;
        if (Math.abs(dx) <= reach + 24 && (Math.sign(dx) === facing || Math.abs(dx) < 42)) {
          player.attackHitIds.add(key);
          damageTownBoss(b, baseDmg, player.x);
        }
      }

      for (const ab of awakenedBosses) {
        const key = `aw_${ab.def.id}`;
        if (ab.defeated || player.attackHitIds.has(key)) continue;
        const dx = ab.x - player.x;
        if (Math.abs(dx) <= reach + 28 && (Math.sign(dx) === facing || Math.abs(dx) < 46)) {
          player.attackHitIds.add(key);
          damageAwakenedBoss(ab, baseDmg, player.x);
        }
      }

      if (elMastermind && !elMastermind.defeated && !player.attackHitIds.has('el_mastermind')) {
        const dx = elMastermind.x - player.x;
        if (Math.abs(dx) <= reach + 30 && (Math.sign(dx) === facing || Math.abs(dx) < 48)) {
          player.attackHitIds.add('el_mastermind');
          attackElMastermind(baseDmg, player.x);
        }
      }

      if (graciasNomar && !graciasNomar.defeated && !player.attackHitIds.has('gracias_nomar')) {
        const dx = graciasNomar.x - player.x;
        if (Math.abs(dx) <= reach + 28 && (Math.sign(dx) === facing || Math.abs(dx) < 46)) {
          player.attackHitIds.add('gracias_nomar');
          damageGraciasNomar(baseDmg, player.x);
        }
      }
    };

    const performSlash = () => {
      if (
        pausedRef.current ||
        freezeFrameTimer > 0 ||
        playerDebuffs.stun > 0 ||
        fishingState !== null ||
        player.attackLocked ||
        player.slashTimer > 0 ||
        player.slashCooldown > 0
      ) {
        return;
      }
      noirAudio.unlock();
      const riding = progressRef.current.hasBike && progressRef.current.ridingBike;
      const equippedWpn = progressRef.current.equippedWeaponId;
      player.comboStep = player.comboResetTimer > 0 ? (player.comboStep + 1) % 3 : 0;
      player.comboResetTimer = 0.85;
      player.slashDuration = 0.35;
      player.slashTimer = 0.35;
      player.attackElapsed = 0;
      player.attackLocked = true;
      player.attackFacing = player.facing;
      player.attackRiding = riding;
      player.attackHitIds.clear();
      player.slashCooldown = equippedWpn === 'wpn_sable_luna' ? 0.35 : 0.37;
      noirAudio.playSlash(player.comboStep);

      const culturalReach = equippedWpn === 'wpn_kampilan' ? 36 : equippedWpn === 'wpn_bolo_katipunan' ? 18 : 0;
      player.attackReach = (player.comboStep === 2 ? 122 : 104) + (riding ? 24 : 0) + culturalReach;
      player.attackBaseDmg = statsRef.current.atk * (player.comboStep === 2 ? 1.35 : 1) * (riding ? 1.15 : 1);

      if (riding) {
        // Charged Umbrella Bike Lunge!
        player.vx = player.attackFacing * 430;
        spawnDust(player.x - player.attackFacing * 10, 0, 6);
      } else {
        // Subtle forward step/lunge into the umbrella strike
        player.vx = player.attackFacing * (player.comboStep === 2 ? 275 : 225);
        spawnDust(player.x - player.attackFacing * 8, 0, 3);
      }

      // La Pluma (Rizal's Golden Quill) fires a piercing spectral truth-ink wave on every strike!
      if (equippedWpn === 'wpn_la_pluma') {
        spawnProj({
          x: player.x + player.attackFacing * 26,
          y: player.y - 38,
          vx: player.attackFacing * 560,
          fromPlayer: true,
          damage: Math.round(statsRef.current.atk * 0.92),
          color: '#5EEAD4',
          life: 0.78,
          radius: 13,
          isInkWave: true,
          kind: 'ink',
        });
      }

      // Wooden Tirador Slingshot equipped on [J] fires the active ammo with full animated trail VFX!
      if (equippedWpn === 'wpn_tirador') {
        tiradorShotCount += 1;
        fireTirador();
      }
    };

    // [K] / Right-Click: OPEN UMBRELLA SHIELD (4s Cooldown — Blocks & Deflects Projectiles & Gunfire!)
    const performPayongShield = () => {
      if (pausedRef.current || freezeFrameTimer > 0 || playerDebuffs.stun > 0 || fishingState !== null) return;
      noirAudio.unlock();
      if (player.shieldCooldown > 0 && player.shieldTimer <= 0) {
        player.shieldHold = false;
        addFloatingText(player.x, player.y - 102, `SHIELD CD ${player.shieldCooldown.toFixed(1)}s`, '#94A3B8');
        return;
      }
      player.shieldTimer = 1.15;
      player.shieldCooldown = GAME_CONFIG.combat.shieldCooldownSec;
      noirAudio.playUmbrellaBlock();
      addFloatingText(player.x, player.y - 102, 'UMBRELLA SHIELD!', '#7DD3FC');
    };

    // [C]: CYCLE TIRADOR AMMO (River Pebble -> Agimat Stone -> Sili Bomb)
    const cycleTiradorAmmo = () => {
      if (pausedRef.current || freezeFrameTimer > 0) return;
      noirAudio.unlock();
      const order: TiradorAmmoKind[] = ['river_pebble', 'agimat_stone', 'sili_bomb'];
      const nextIdx = (order.indexOf(player.currentAmmo) + 1) % order.length;
      player.currentAmmo = order[nextIdx];
      const labels: Record<TiradorAmmoKind, { text: string; color: string }> = {
        river_pebble: { text: 'AMMO: RIVER PEBBLE (0 SP)', color: '#CBD5E1' },
        agimat_stone: { text: 'AMMO: AGIMAT STONE · STUN (6 SP)', color: '#FDE047' },
        sili_bomb: { text: 'AMMO: SILI BOMB · SHIELD BREAK (10 SP)', color: '#FB923C' },
      };
      addFloatingText(player.x, player.y - 106, labels[player.currentAmmo].text, labels[player.currentAmmo].color);
    };

    // [L]: TIRADOR (FILIPINO SLINGSHOT) — Works smoothly on foot AND while riding the bike!
    const fireTirador = (ammoOverride?: TiradorAmmoKind) => {
      if (pausedRef.current || freezeFrameTimer > 0 || player.tiradorCooldown > 0) return;
      noirAudio.unlock();
      let ammo = ammoOverride ?? player.currentAmmo;
      const spCost = ammo === 'sili_bomb' ? 10 : ammo === 'agimat_stone' ? 6 : 0;
      if (player.sp < spCost) {
        // Gracefully fall back to free River Pebble if SP is low so Tirador always feels responsive!
        ammo = 'river_pebble';
        addFloatingText(player.x, player.y - 98, 'LOW SP · RIVER PEBBLE', '#CBD5E1');
      } else if (spCost > 0) {
        player.sp = Math.max(0, player.sp - spCost);
      }

      const vfxKind: 'pebble' | 'agimat' | 'sili' =
        ammo === 'sili_bomb' ? 'sili' : ammo === 'agimat_stone' ? 'agimat' : 'pebble';
      const speed = vfxKind === 'pebble' ? 640 : vfxKind === 'agimat' ? 590 : 540;
      const dmgMult = vfxKind === 'sili' ? 1.55 : vfxKind === 'agimat' ? 1.25 : 0.92;
      const riding = progressRef.current.hasBike && progressRef.current.ridingBike;

      player.tiradorDuration = 0.28;
      player.tiradorTimer = 0.28;
      player.tiradorCooldown = vfxKind === 'pebble' ? 0.22 : 0.3;
      heroMotion.recoilX = -4.5;
      noirAudio.playSlash(vfxKind === 'sili' ? 2 : 1);

      spawnProj({
        x: player.x + player.facing * (riding ? 34 : 28),
        y: player.y - (riding ? 52 : 44),
        vx: player.facing * speed,
        vy: vfxKind === 'sili' ? -28 : vfxKind === 'pebble' ? -14 : 0,
        gravityY: vfxKind === 'sili' ? 62 : vfxKind === 'pebble' ? 32 : 0,
        fromPlayer: true,
        damage: Math.round(statsRef.current.atk * dmgMult),
        color: vfxKind === 'sili' ? '#EF4444' : vfxKind === 'agimat' ? '#FACC15' : '#CBD5E1',
        life: 1.05,
        radius: vfxKind === 'pebble' ? 7 : vfxKind === 'agimat' ? 9.5 : 10.5,
        isTiradorAmmo: vfxKind,
        kind: vfxKind,
        isMegaphone: vfxKind === 'sili', // Sili Bomb shatters Boss & Riot Shields!
      });

      if (vfxKind !== 'pebble') {
        addFloatingText(
          player.x + player.facing * 20,
          player.y - 84,
          vfxKind === 'sili' ? 'SILI BOMB!' : 'AGIMAT SHOT!',
          vfxKind === 'sili' ? '#FB923C' : '#FDE047'
        );
      }
    };

    // [1]-[8]: WHITE MAGIC (ALBULARYO) & BLACK MAGIC (MANGKUKULAM) — Level-Gated + 1–5 Min Stat Buffs + Clean VFX!
    const castMagicSkill = (skillId: string) => {
      if (pausedRef.current || freezeFrameTimer > 0 || playerDebuffs.stun > 0 || fishingState !== null) return;
      const skill = getMagicSkillById(skillId);
      if (!skill) return;
      const prog = progressRef.current;
      if (!isSkillUnlockedForLevel(skill, prog.level)) {
        addFloatingText(
          player.x,
          player.y - 104,
          `Unlocks at Lv.${skill.requiredLevel}`,
          '#94A3B8'
        );
        return;
      }
      const remCd = magicCooldowns[skill.id] || 0;
      if (remCd > 0) {
        addFloatingText(player.x, player.y - 96, `${skill.name} ${remCd.toFixed(1)}s`, '#94A3B8');
        return;
      }
      if (player.sp < skill.spCost) {
        addFloatingText(player.x, player.y - 96, `Need ${skill.spCost} SP`, '#F87171');
        return;
      }

      noirAudio.unlock();
      noirAudio.playMagicCast(skill.school);
      player.sp = Math.max(0, player.sp - skill.spCost);
      magicCooldowns[skill.id] = skill.cooldownSec;
      heroMagicCast = { school: skill.school, timer: 0.62, duration: 0.62 };

      const intPoints = prog.statAllocation?.int || 0;
      const spellDmg = computeMagicDamage(statsRef.current.atk, intPoints, skill);
      const isWhite = skill.school === 'white_magic';
      const castColor = isWhite ? '#FDE047' : '#C084FC';
      addFloatingText(player.x, player.y - 118, `${skill.filipinoTitle.toUpperCase()}!`, castColor);

      const effectX =
        skill.effectKind === 'tawas_shield' || skill.effectKind === 'herbal_banig'
          ? player.x
          : player.x + player.facing * 145;

      // Spawn clean, centered particle/glow/ring Skill VFX (zero flat white boxes!)
      skillVfx.spawn(skill.effectKind, effectX, Math.floor(viewH * 0.8) - 10, player.facing);

      // Apply 1–5 minute timed stat buff if this skill grants one (refreshes timer, no infinite stack)
      if (skill.buff) {
        applyTimedBuff(skill.buff);
        addFloatingText(
          player.x,
          player.y - 134,
          `${skill.buff.label} (${Math.round(skill.buff.durationSec / 60)}m)`,
          '#7AE582'
        );
      }

      activeMagicEffects.push({
        effectKind: skill.effectKind,
        x: effectX,
        facing: player.facing,
        timer: skill.effectKind === 'bathala_dawn' || skill.effectKind === 'abyssal_eclipse' ? 1.2 : 0.85,
        duration: skill.effectKind === 'bathala_dawn' || skill.effectKind === 'abyssal_eclipse' ? 1.2 : 0.85,
      });

      const applySpellAoE = (
        centerX: number,
        radius: number,
        dmg: number,
        opts?: {
          shatterShield?: boolean;
          exposeWeakSpot?: boolean;
          applyBleed?: boolean;
          applyDefShred?: boolean;
          drainLife?: boolean;
          ignoreShield?: boolean;
        }
      ) => {
        let hitCount = 0;
        for (const m of mobs) {
          if (m.dead || Math.abs(m.x - centerX) > radius) continue;
          hitCount += 1;
          if (opts?.applyBleed) {
            m.bleedTimer = 5.0;
            m.bleedTick = 0.5;
          }
          if (opts?.applyDefShred) m.defShredTimer = 7.0;
          if (opts?.shatterShield && m.shieldHp > 0) {
            m.shieldHp = 0;
            m.stunTimer = Math.max(m.stunTimer, 1.8);
            callbacksRef.current.onShieldBroken();
          }
          damageMob(m, dmg, player.x, castColor, opts?.ignoreShield ? 0 : opts?.shatterShield ? 3.2 : 1.4, true);
        }
        for (const b of townBosses) {
          if (b.defeated || Math.abs(b.x - centerX) > radius + 30) continue;
          hitCount += 1;
          if (opts?.applyBleed) {
            b.bleedTimer = 5.0;
            b.bleedTick = 0.5;
          }
          if (opts?.applyDefShred) b.defShredTimer = 7.0;
          if (opts?.exposeWeakSpot) {
            b.weakSpotTimer = Math.max(b.weakSpotTimer, 3.0);
            b.stunTimer = Math.max(b.stunTimer, 1.2);
          }
          damageTownBoss(b, dmg, player.x, Boolean(opts?.shatterShield), castColor);
        }
        for (const ab of awakenedBosses) {
          if (ab.defeated || Math.abs(ab.x - centerX) > radius + 35) continue;
          hitCount += 1;
          if (opts?.applyBleed) {
            ab.bleedTimer = 5.0;
            ab.bleedTick = 0.5;
          }
          if (opts?.applyDefShred) ab.defShredTimer = 7.0;
          if (opts?.exposeWeakSpot) {
            ab.weakSpotTimer = Math.max(ab.weakSpotTimer, 3.2);
            ab.stunTimer = Math.max(ab.stunTimer, 1.4);
          }
          damageAwakenedBoss(ab, dmg, player.x, Boolean(opts?.shatterShield), castColor);
        }
        if (elMastermind && !elMastermind.defeated && Math.abs(elMastermind.x - centerX) <= radius + 40) {
          hitCount += 1;
          if (opts?.applyBleed) {
            elMastermind.bleedTimer = 5.0;
            elMastermind.bleedTick = 0.5;
          }
          if (opts?.applyDefShred) elMastermind.defShredTimer = 7.0;
          if (opts?.exposeWeakSpot) elMastermind.weakSpotTimer = Math.max(elMastermind.weakSpotTimer, 2.8);
          attackElMastermind(dmg, player.x, Boolean(opts?.shatterShield));
        }
        if (graciasNomar && !graciasNomar.defeated && Math.abs(graciasNomar.x - centerX) <= radius + 36) {
          hitCount += 1;
          damageGraciasNomar(dmg, player.x, castColor);
        }
        if (opts?.drainLife && hitCount > 0) {
          const heal = Math.round(spellDmg * 0.42 * Math.min(3, hitCount));
          const spGain = 14 * Math.min(2, hitCount);
          player.hp = Math.min(statsRef.current.maxHp, player.hp + heal);
          player.sp = Math.min(statsRef.current.maxSp, player.sp + spGain);
          addFloatingText(player.x, player.y - 86, `DRAIN +${heal} HP · +${spGain} SP`, '#5EEAD4');
        }
      };

      switch (skill.effectKind) {
        case 'tawas_shield': {
          tawasShieldTimer = skill.durationSec || 6.5;
          const heal = Math.round((skill.healAmount || 42) * (1 + intPoints * 0.03));
          player.hp = Math.min(statsRef.current.maxHp, player.hp + heal);
          addFloatingText(player.x, player.y - 86, `TAWAS BARRIER · +${heal} HP`, '#7AE582');
          break;
        }
        case 'herbal_banig': {
          herbalSanctuary = { x: player.x, timer: skill.durationSec || 7.0, tickTimer: 0.1 };
          addFloatingText(player.x, player.y - 86, 'HERBAL SANCTUARY ACTIVE', '#7AE582');
          break;
        }
        case 'agimat_nova': {
          screenShake = Math.max(screenShake, 9);
          applySpellAoE(player.x + player.facing * 175, 210, spellDmg, {
            shatterShield: true,
            exposeWeakSpot: true,
          });
          break;
        }
        case 'bathala_dawn': {
          screenShake = Math.max(screenShake, 15);
          const heal = Math.round((skill.healAmount || 180) * (1 + intPoints * 0.04));
          player.hp = Math.min(statsRef.current.maxHp, player.hp + heal);
          addFloatingText(player.x, player.y - 88, `BATHALA BLESSING +${heal} HP`, '#FDE047');
          applySpellAoE(player.x + player.facing * 140, 340, spellDmg, {
            shatterShield: true,
            exposeWeakSpot: true,
          });
          break;
        }
        case 'kulam_hex': {
          screenShake = Math.max(screenShake, 7);
          applySpellAoE(player.x + player.facing * 145, 195, spellDmg, {
            applyBleed: true,
            ignoreShield: true,
          });
          break;
        }
        case 'usog_drain': {
          screenShake = Math.max(screenShake, 8);
          applySpellAoE(player.x + player.facing * 155, 225, spellDmg, {
            drainLife: true,
          });
          break;
        }
        case 'barang_swarm': {
          screenShake = Math.max(screenShake, 10);
          applySpellAoE(player.x + player.facing * 165, 250, spellDmg, {
            applyDefShred: true,
            applyBleed: true,
          });
          break;
        }
        case 'abyssal_eclipse': {
          screenShake = Math.max(screenShake, 16);
          applySpellAoE(player.x + player.facing * 145, 360, spellDmg, {
            applyDefShred: true,
            applyBleed: true,
            shatterShield: true,
            exposeWeakSpot: true,
          });
          break;
        }
      }
    };

    const performDash = () => {
      if (pausedRef.current || freezeFrameTimer > 0 || playerDebuffs.stun > 0 || fishingState !== null) return;
      noirAudio.unlock();
      if (player.dashCooldown > 0) {
        addFloatingText(player.x, player.y - 98, `DODGE CD ${player.dashCooldown.toFixed(1)}s`, '#94A3B8');
        return;
      }
      const riding = progressRef.current.hasBike && progressRef.current.ridingBike;
      player.dashTimer = riding ? 0.24 : 0.2;
      player.dashCooldown = GAME_CONFIG.combat.dodgeCooldownSec;
      player.invulnTimer = 0.42;
      player.vx = player.facing * (riding ? 660 : 570);
      spawnDust(player.x, 0, 7);
      if (riding) {
        noirAudio.playBikeBell();
      } else {
        noirAudio.playDash();
      }
    };

    const performJump = () => {
      if (pausedRef.current || freezeFrameTimer > 0 || playerDebuffs.stun > 0) return;
      if (fishingState) {
        triggerFishingAction();
        return;
      }
      noirAudio.unlock();
      if (player.jumpsLeft > 0) {
        player.vy = -525;
        player.jumpsLeft -= 1;
        spawnDust(player.x, 0, 5);
        noirAudio.playJump();
      }
    };

    const triggerFishingAction = () => {
      if (!fishingState) return;
      if (fishingState.phase === 'bite') {
        // Hooked the fish -> Enter interactive timing/tension reeling mini-game!
        fishingState.phase = 'reeling';
        fishingState.timer = GAME_CONFIG.fishing.reelDurationSec;
        fishingState.reelProgress = 0.28;
        fishingState.cursorPos = 0.45;
        fishingState.cursorVel = 0;
        fishingState.zoneCenter = 0.5;
        fishingState.zoneTarget = 0.5;
        fishingState.holdingReel = true;
        noirAudio.playFishingCast();
        addFloatingText(player.x, player.y - 108, 'HOOKED! KEEP BAR IN GREEN!', '#38BDF8');
      } else if (fishingState.phase === 'reeling') {
        fishingState.cursorVel = Math.min(1.6, fishingState.cursorVel + 0.58);
      } else if (fishingState.phase === 'waiting') {
        // Pulled too early
        fishingState = null;
        addFloatingText(player.x, player.y - 98, 'PULLED TOO EARLY!', '#94A3B8');
      }
    };

    const findNearestTarget = (): InteractTarget | null => {
      let best: { target: InteractTarget; dist: number } | null = null;
      const consider = (target: InteractTarget, dist: number, maxRange: number) => {
        if (dist <= maxRange && (!best || dist < best.dist)) {
          best = { target, dist };
        }
      };

      for (const p of zone.portals) {
        consider(
          { kind: 'portal', id: p.targetZone, label: p.label, sublabel: 'Press [E] to Travel', x: p.x },
          Math.abs(player.x - p.x),
          78
        );
      }

      if (zone.houseId && zone.houseX) {
        const house = HOUSES.find((h) => h.id === zone.houseId);
        if (house) {
          const owned = progressRef.current.ownedHouseIds.includes(house.id);
          consider(
            {
              kind: 'house',
              id: house.id,
              label: house.name,
              sublabel: owned
                ? 'Press [E] to Enter Safe House'
                : `Press [E] to Buy Safe House · ₱${house.price.toLocaleString()}`,
              x: zone.houseX,
            },
            Math.abs(player.x - zone.houseX),
            86
          );
        }
      }

      if (zone.hasHearth && zone.hearthX) {
        consider(
          {
            kind: 'hearth',
            id: 'defender_hearth',
            label: 'Home Rest Hearth',
            sublabel: 'Press [E] to Rest & Gain Sanctuary Buff',
            x: zone.hearthX,
          },
          Math.abs(player.x - zone.hearthX),
          74
        );
      }

      if (zone.hasDambanaShrine && zone.dambanaShrineX) {
        consider(
          {
            kind: 'dambana',
            id: 'dambana_shrine',
            label: 'Dambana ng Kagitingan Shrine',
            sublabel: progressRef.current.hasDambanaBadge
              ? 'Dambana Badge Equipped (+Folklore Resistance)'
              : 'Press [E] to Claim Dambana Badge!',
            x: zone.dambanaShrineX,
          },
          Math.abs(player.x - zone.dambanaShrineX),
          88
        );
      }

      if (elMastermind && !elMastermind.defeated && !elMastermind.fightActive) {
        const { collected, total, isUnlocked } = getFinalBossProgress(progressRef.current.bossProgression);
        consider(
          {
            kind: 'mastermind',
            id: 'el_mastermind_npc',
            label: 'El Mastermind · Bataan Provincial Capitol',
            sublabel: isUnlocked
              ? 'IMMUNITY BROKEN (24/24) · Attack to Start Final Boss Fight!'
              : `Press [E] to Talk · WARNING: Attacking at ${collected}/${total} = Instant Death!`,
            x: elMastermind.x,
          },
          Math.abs(player.x - elMastermind.x),
          115
        );
      }

      if (activeGhost) {
        const met = progressRef.current.metHeroGhostIds.includes(activeGhost.def.id);
        consider(
          {
            kind: 'hero_ghost',
            id: activeGhost.def.id,
            label: `${activeGhost.def.name} (Spectral Hero)`,
            sublabel: met
              ? 'Press [E] to Receive Spirit Blessing'
              : `Press [E] to Claim Cultural Relic: ${activeGhost.def.rewardName}`,
            x: activeGhost.x,
          },
          Math.abs(player.x - activeGhost.x),
          105
        );
      }

      for (const npc of zone.npcs) {
        const nx = getNpcX(npc);
        consider(
          {
            kind: 'npc',
            id: npc.id,
            label: `${npc.name} · ${npc.title}`,
            sublabel:
              npc.shopType === 'jeepney'
                ? 'Press [E] for Jeepney Fast Travel'
                : npc.shopType === 'news_desk'
                  ? 'Press [E] to Read Bataan News Desk'
                  : npc.shopType === 'side_jobs'
                    ? 'Press [E] for Food Delivery & Taxi Jobs'
                    : 'Press [E] to Talk (PH-EN Voice)',
            x: nx,
          },
          Math.abs(player.x - nx),
          88
        );
      }

      // Active Side-Job Dropoff Beacon
      const sideJob = activeSideJobRef.current;
      if (sideJob && sideJob.targetZoneId === zone.id) {
        consider(
          {
            kind: 'side_job_dropoff',
            id: sideJob.kind,
            label: sideJob.targetLabel,
            sublabel: `Press [E] to Complete ${sideJob.title} (+₱${sideJob.basePay})`,
            x: sideJob.targetX,
          },
          Math.abs(player.x - sideJob.targetX),
          104
        );
      }

      // Fishing Spots (Orani, Orion, Bagac, Morong)
      if (zone.fishingSpots) {
        for (const spot of zone.fishingSpots) {
          consider(
            {
              kind: 'fishing_spot',
              id: spot.id,
              label: spot.label,
              sublabel: progressRef.current.hasFishingRod
                ? 'Press [E] to Cast Bamboo Fishing Rod'
                : `Need Bamboo Fishing Rod (₱${GAME_CONFIG.fishing.rodPrice} at shops)`,
              x: spot.x,
            },
            Math.abs(player.x - spot.x),
            92
          );
        }
      }

      // Gatherable Filipino Herbs, Vegetables & Fruits
      if (zone.gatherNodes) {
        for (const node of zone.gatherNodes) {
          if ((gatherRespawns[node.id] || 0) > 0) continue;
          const mat = getMaterialById(node.itemId);
          consider(
            {
              kind: 'gather_node',
              id: node.id,
              label: node.label || mat?.name || 'Wild Plant',
              sublabel: 'Press [E] to Gather',
              x: node.x,
            },
            Math.abs(player.x - node.x),
            72
          );
        }
      }

      // Mineable Ore Veins in Mt. Natib Mining Cave
      if (zone.oreNodes) {
        for (const ore of zone.oreNodes) {
          if ((oreRespawns[ore.id] || 0) > 0) continue;
          const mat = getMaterialById(ore.oreId);
          consider(
            {
              kind: 'ore_node',
              id: ore.id,
              label: ore.label || mat?.name || 'Ore Vein',
              sublabel: 'Press [E] to Mine Ore',
              x: ore.x,
            },
            Math.abs(player.x - ore.x),
            78
          );
        }
      }

      return best ? (best as { target: InteractTarget; dist: number }).target : null;
    };

    const performInteract = () => {
      if (pausedRef.current || freezeFrameTimer > 0) return;
      noirAudio.unlock();
      if (fishingState) {
        triggerFishingAction();
        return;
      }
      const target = findNearestTarget();
      if (!target) return;

      if (target.kind === 'side_job_dropoff') {
        const job = activeSideJobRef.current;
        if (job && job.targetZoneId === zone.id) {
          const speedRatio = job.remainingSec / Math.max(1, job.maxSec);
          const tip = speedRatio >= 0.35 ? job.bonusPay : Math.round(job.bonusPay * 0.4);
          const totalPay = job.basePay + tip;
          activeSideJobRef.current = null;
          noirAudio.playJobComplete();
          skillVfx.spawn('buff_luck', player.x, Math.floor(viewH * 0.8) - 10, player.facing);
          addFloatingText(player.x, player.y - 112, `JOB COMPLETE! +₱${totalPay} (+₱${tip} TIP)`, '#FDE047');
          showBanner(job.title, `Delivered on time! Earned ₱${totalPay} and +${job.xpReward} XP!`, 4.2);
          callbacksRef.current.onCompleteSideJob(totalPay, job.xpReward, job.title);
        }
        return;
      } else if (target.kind === 'fishing_spot') {
        const spot = zone.fishingSpots?.find((s) => s.id === target.id);
        if (!spot) return;
        if (!progressRef.current.hasFishingRod) {
          showBanner(
            'Bamboo Fishing Rod Needed',
            `Buy a Bamboo Fishing Rod (₱${GAME_CONFIG.fishing.rodPrice}) at Aling Nena's Carinderia or any town shop first!`,
            4.2
          );
          addFloatingText(player.x, player.y - 98, `NEED ROD (₱${GAME_CONFIG.fishing.rodPrice})`, '#FDE047');
          return;
        }
        const rolled = rollRandomFilipinoFish(getBuffMult('lucky_drop'));
        const cfg = GAME_CONFIG.fishing;
        fishingState = {
          spotId: spot.id,
          spotX: spot.x,
          phase: 'casting',
          timer: 0.42,
          fishId: rolled.id,
          fishName: rolled.name,
          fishDifficulty: rolled.difficulty,
          reelProgress: 0,
          cursorPos: 0.5,
          cursorVel: 0,
          zoneCenter: 0.5,
          zoneTarget: 0.5,
          zoneWidth: Math.max(0.18, cfg.sweetSpotWidth - rolled.difficulty * 0.08),
          holdingReel: false,
        };
        player.vx = 0;
        player.facing = 1;
        noirAudio.playFishingCast();
        addFloatingText(player.x, player.y - 104, 'CASTING LINE...', '#38BDF8');
        return;
      } else if (target.kind === 'gather_node') {
        const node = zone.gatherNodes?.find((n) => n.id === target.id);
        if (!node || (gatherRespawns[node.id] || 0) > 0) return;
        gatherRespawns[node.id] = GAME_CONFIG.gatherNodeRespawnSec;
        noirAudio.playGatherChime();
        spawnDust(node.x, -14, 7, '#86EFAC');
        const qty = Math.random() < 0.25 * getBuffMult('lucky_drop') ? 2 : 1;
        addFloatingText(node.x, -74, `+${qty} ${node.label} (+10 XP)`, '#7AE582');
        callbacksRef.current.onGainMaterial(node.itemId, qty, 10);
        return;
      } else if (target.kind === 'ore_node') {
        const ore = zone.oreNodes?.find((o) => o.id === target.id);
        if (!ore || (oreRespawns[ore.id] || 0) > 0) return;
        oreRespawns[ore.id] = GAME_CONFIG.oreNodeRespawnSec;
        noirAudio.playMineHit();
        screenShake = Math.max(screenShake, 4.5);
        spawnHitSparks(ore.x, -26, ore.oreId === 'ore_ginto' ? '#FDE047' : '#38BDF8');
        const qty = Math.random() < 0.22 * getBuffMult('lucky_drop') ? 2 : 1;
        addFloatingText(ore.x, -80, `MINED +${qty} ${ore.label} (+16 XP)`, '#FDE047');
        callbacksRef.current.onGainMaterial(ore.oreId, qty, 16);
        return;
      } else if (target.kind === 'portal') {
        const portal = zone.portals.find((p) => p.targetZone === target.id);
        if (portal) {
          callbacksRef.current.onSyncVitals({
            hp: Math.round(player.hp),
            sp: Math.round(player.sp),
            energy: Math.round(player.energy),
            mood: Math.round(player.mood),
            sanctuaryBuffSec: Math.round(player.sanctuaryBuffSec),
            timeOfDay,
          });
          callbacksRef.current.onPortalTravel(portal.targetZone, portal.targetSpawnX);
        }
      } else if (target.kind === 'house') {
        callbacksRef.current.onInteractHouse(target.id);
      } else if (target.kind === 'npc') {
        callbacksRef.current.onInteractNpc(target.id);
      } else if (target.kind === 'hero_ghost' && activeGhost) {
        noirAudio.playGhostChime();
        addFloatingText(activeGhost.x, -132, 'NATIONAL HERO BLESSING!', '#5EEAD4');
        callbacksRef.current.onMeetHeroGhost(activeGhost.def.id);
      } else if (target.kind === 'dambana') {
        if (!progressRef.current.hasDambanaBadge) {
          noirAudio.playVictory();
          addFloatingText(player.x, -112, 'DAMBANA BADGE EARNED!', '#F4C542');
          showBanner(
            'Dambana ng Kagitingan',
            'You claimed the Dambana Badge! +18 ATK and strong ward resistance against haunted night folklore!',
            4.6
          );
          callbacksRef.current.onClaimDambanaBadge();
        } else {
          showBanner('Dambana ng Kagitingan', 'You already bear the Dambana Badge. Defend all of Bataan!', 3.2);
        }
      } else if (target.kind === 'mastermind') {
        const { collected, total, isUnlocked } = getFinalBossProgress(progressRef.current.bossProgression);
        const line = isUnlocked
          ? `Impossible... you secured all ${total} of ${total} evidence files from every Mayor and Vice Mayor?! Fine—strike me if you dare!`
          : `Hahaha! Welcome to the Provincial Capitol, Bataan Defender. You only hold ${collected} of ${total} evidence files. Lay a finger on me right now and I will end you in a single strike!`;
        showBanner('EL MASTERMIND', line, 5.5);
        if (progressRef.current.voiceEnabled) {
          englishVoice.speak(line, { pitch: 0.72, rate: 0.94, style: 'mastermind' });
        }
        callbacksRef.current.onMeetElMastermind();
      } else if (target.kind === 'hearth') {
        player.hp = statsRef.current.maxHp;
        player.sp = statsRef.current.maxSp;
        player.energy = 100;
        player.mood = 100;
        player.sanctuaryBuffSec = 120;
        noirAudio.playRestChime();
        addFloatingText(player.x, -104, 'WELL-RESTED · +10% MAX HP', '#F4C542');
        showBanner('Defender Home', 'Fully rested! HP and SP restored. Open Cooking Hearth from your HUD to cook dishes!', 3.6);
        callbacksRef.current.onHearthRest();
      }
    };

    bridgeRef.current = {
      triggerAttack: performSlash,
      triggerShield: performPayongShield,
      triggerSkill: () => fireTirador(),
      cycleTiradorAmmo,
      triggerDash: performDash,
      triggerJump: performJump,
      triggerInteract: performInteract,
      setTouchMove: (dir) => {
        touchMoveDir = dir;
      },
      applyFullRest: () => {
        player.hp = statsRef.current.maxHp;
        player.sp = statsRef.current.maxSp;
        player.energy = 100;
        player.mood = 100;
        player.sanctuaryBuffSec = 120;
        noirAudio.playRestChime();
        addFloatingText(player.x, -104, 'SANCTUARY REST · 100%', '#F4C542');
      },
      applyFoodHeal: (hpGain, spGain, energyGain, foodName, buff?: FoodDef['buff']) => {
        player.hp = Math.min(statsRef.current.maxHp, player.hp + hpGain);
        player.sp = Math.min(statsRef.current.maxSp, player.sp + spGain);
        player.energy = Math.min(100, player.energy + energyGain);
        player.mood = Math.min(100, player.mood + 10);
        noirAudio.playPurchase();
        addFloatingText(player.x, -104, `${foodName} +${hpGain} HP`, '#7AE582');
        if (buff) {
          applyTimedBuff(buff);
          addFloatingText(player.x, -124, `${buff.label}!`, '#FDE047');
        }
      },
      spawnBanner: (speaker, text) => {
        showBanner(speaker, text, 4.4);
      },
      triggerDuetBurst: (friendName) => {
        noirAudio.playDuet();
        addFloatingText(player.x, -108, `Ally Bond with ${friendName}!`, '#F4C542');
        showBanner(friendName, 'Together we will build a clean and peaceful Bataan!', 3.4);
      },
      toggleDayNight: () => {
        timeOfDay = isTimeNight(timeOfDay) ? 10.0 : 21.5;
        addFloatingText(player.x, -112, isTimeNight(timeOfDay) ? 'HAUNTED NIGHT' : 'BATAAN DAY', '#F4C542');
      },
      cycleWeather: () => {
        atmosphere.weather = nextWeatherMode(atmosphere.weather);
        addFloatingText(player.x, -118, `WEATHER: ${WEATHER_LABELS[atmosphere.weather].toUpperCase()}`, '#7DD3FC');
      },
      castMagicSkill,
      triggerFishingAction,
      setFishingHold: (holding: boolean) => {
        if (fishingState) fishingState.holdingReel = holding;
      },
      cancelFishing: () => {
        fishingState = null;
      },
      startSideJob: (job: ActiveSideJobState) => {
        activeSideJobRef.current = { ...job };
        noirAudio.playPurchase();
        showBanner(job.title, `Head to ${job.targetZoneName} (${job.targetLabel}) before the timer runs out!`, 4.6);
      },
      cancelSideJob: () => {
        activeSideJobRef.current = null;
        showBanner('Side Job Cancelled', 'You can pick up another Food Delivery or Taxi run anytime at Dispatch.', 3.2);
      },
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      const code = e.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(code)) {
        e.preventDefault();
      }
      if (fishingState && (code === 'Space' || code === 'KeyE')) {
        fishingState.holdingReel = true;
      }
      if (!keys[code]) {
        if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') performJump();
        if (code === 'KeyJ' || code === 'KeyZ') performSlash();
        if (code === 'KeyK' || code === 'KeyX') {
          if (player.shieldCooldown <= 0 || player.shieldTimer > 0) {
            player.shieldHold = true;
          }
          performPayongShield();
        }
        if (code === 'KeyL') {
          e.preventDefault();
          fireTirador();
        }
        if (code === 'KeyC') {
          e.preventDefault();
          cycleTiradorAmmo();
        }
        if (code === 'ShiftLeft' || code === 'ShiftRight') performDash();
        if (code === 'KeyE') performInteract();
        if (code.startsWith('Digit')) {
          const idx = parseInt(code.slice(5), 10) - 1;
          if (idx >= 0 && idx < MAGIC_SKILLS.length) {
            castMagicSkill(MAGIC_SKILLS[idx].id);
          }
        }
      }
      keys[code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
      if (e.code === 'KeyK' || e.code === 'KeyX') {
        player.shieldHold = false;
      }
      if (fishingState && (e.code === 'Space' || e.code === 'KeyE')) {
        fishingState.holdingReel = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (pausedRef.current || e.target !== canvas) return;
      if (e.button === 0) {
        performSlash();
      } else if (e.button === 2) {
        player.shieldHold = true;
        performPayongShield();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) player.shieldHold = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    let viewW = window.innerWidth;
    let viewH = window.innerHeight;
    const handleResize = () => {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      canvas.style.width = `${viewW}px`;
      canvas.style.height = `${viewH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    showBanner(zone.name, zone.subtitle, 3.2);

    let cameraX = Math.max(0, Math.min(zone.width - viewW, player.x - viewW * 0.42));
    let lastTime = performance.now();
    let elapsed = 0;
    let hudTimer = 0;
    let syncTimer = 0;
    let rafId = 0;

    const hurtPlayer = (
      damage: number,
      knockFromX: number,
      label = '',
      isFolklore = false,
      opts?: {
        unblockable?: boolean;
        status?: 'slow' | 'bleed' | 'blind' | 'sp_drain' | 'poison' | 'stun' | 'freeze' | 'confusion' | 'shadow';
        attackerMob?: MobEntity;
      }
    ) => {
      if (player.invulnTimer > 0 || freezeFrameTimer > 0) return;
      const unblockable = Boolean(opts?.unblockable);
      const rawShieldUp = (player.shieldHold && player.shieldTimer > 0) || player.shieldTimer > 0;
      const shieldUp = rawShieldUp && !unblockable;
      const umbrellaGuard = shieldUp
        ? 0.28
        : !unblockable && progressRef.current.hasUmbrella && progressRef.current.umbrellaOpen
        ? 0.78
        : 1.0;
      const tawasGuard = tawasShieldTimer > 0 ? 0.52 : 1.0;
      const dambanaResist = isFolklore && progressRef.current.hasDambanaBadge ? 0.58 : 1.0;
      const defBuffMult =
        getBuffMult('def_up') *
        (playerDebuffs.shadow > 0 ? 1 - (GAME_CONFIG.debuffs.shadow.statPenaltyPct || 0.22) : 1);
      const rawMitigated = Math.max(
        2,
        (damage - statsRef.current.def * defBuffMult * 0.58) * umbrellaGuard * tawasGuard * dambanaResist
      );
      // Fair RPG balance: single non-instant-death hit never exceeds 38% of Max HP
      const dmg = Math.max(1, Math.min(Math.round(statsRef.current.maxHp * 0.38), Math.round(rawMitigated)));
      player.hp = Math.max(0, player.hp - dmg);
      player.invulnTimer = 0.74;
      player.hurtFlash = 0.22;
      player.vx = Math.sign(player.x - knockFromX || -1) * (shieldUp ? 90 : 185);
      screenShake = shieldUp ? 2.5 : unblockable ? 8.5 : 5.5;
      if (fishingState) fishingState = null;

      // Apply Enemy Debuffs & Thief Steal when hit is unblocked
      if (!shieldUp) {
        let appliedStatus = opts?.status;
        if (!appliedStatus && opts?.attackerMob) {
          const debuffRoll = GAME_CONFIG.debuffs.perEnemyChance[opts.attackerMob.kind];
          if (debuffRoll && Math.random() < debuffRoll.chance) {
            appliedStatus = debuffRoll.kind;
          }
        }
        if (appliedStatus === 'poison') {
          playerDebuffs.poison = Math.max(playerDebuffs.poison, GAME_CONFIG.debuffs.poison.durationSec);
          playerDebuffs.poisonTick = GAME_CONFIG.debuffs.poison.tickIntervalSec || 1.0;
          noirAudio.playDebuffAlert();
          skillVfx.spawn('debuff_poison', player.x, Math.floor(viewH * 0.8) + player.y - 20, player.facing);
          addFloatingText(player.x, player.y - 108, 'POISONED (5s)!', '#22C55E');
        } else if (appliedStatus === 'stun') {
          playerDebuffs.stun = Math.max(playerDebuffs.stun, GAME_CONFIG.debuffs.stun.durationSec);
          noirAudio.playDebuffAlert();
          addFloatingText(player.x, player.y - 108, 'STUNNED!', '#FACC15');
        } else if (appliedStatus === 'freeze') {
          playerDebuffs.freeze = Math.max(playerDebuffs.freeze, GAME_CONFIG.debuffs.freeze.durationSec);
          noirAudio.playDebuffAlert();
          skillVfx.spawn('debuff_freeze', player.x, Math.floor(viewH * 0.8) + player.y - 20, player.facing);
          addFloatingText(player.x, player.y - 108, 'FROZEN!', '#38BDF8');
        } else if (appliedStatus === 'confusion') {
          playerDebuffs.confusion = Math.max(playerDebuffs.confusion, GAME_CONFIG.debuffs.confusion.durationSec);
          playerDebuffs.confusionAtkCd = 0.85;
          noirAudio.playDebuffAlert();
          skillVfx.spawn('debuff_confusion', player.x, Math.floor(viewH * 0.8) + player.y - 20, player.facing);
          addFloatingText(player.x, player.y - 112, 'CONFUSED! ALLY TURNED HOSTILE!', '#F472B6');
        } else if (appliedStatus === 'shadow') {
          playerDebuffs.shadow = Math.max(playerDebuffs.shadow, GAME_CONFIG.debuffs.shadow.durationSec);
          noirAudio.playDebuffAlert();
          skillVfx.spawn('debuff_shadow', player.x, Math.floor(viewH * 0.8) + player.y - 20, player.facing);
          addFloatingText(player.x, player.y - 108, 'SHADOW CURSE (-22% ATK/DEF)!', '#A855F7');
        } else if (appliedStatus === 'slow') {
          playerDebuffs.slow = Math.max(playerDebuffs.slow, 3.2);
          addFloatingText(player.x, player.y - 104, 'SLOWED!', '#38BDF8');
        } else if (appliedStatus === 'bleed') {
          playerDebuffs.bleed = Math.max(playerDebuffs.bleed, 3.6);
          playerDebuffs.bleedTick = 0.9;
          addFloatingText(player.x, player.y - 104, 'BLEEDING!', '#F87171');
        } else if (appliedStatus === 'blind') {
          playerDebuffs.blind = Math.max(playerDebuffs.blind, 2.4);
          addFloatingText(player.x, player.y - 104, 'BLINDED!', '#FDE047');
        } else if (appliedStatus === 'sp_drain') {
          player.sp = Math.max(0, player.sp - 14);
          addFloatingText(player.x, player.y - 104, '-14 SP DRAINED!', '#C084FC');
        }

        // Street Thief Steal Skill: 10% chance on hit to steal 50% of current Pesos (dropped back on kill!)
        if (
          opts?.attackerMob &&
          opts.attackerMob.kind === 'thief' &&
          progressRef.current.pesos > 0 &&
          Math.random() < GAME_CONFIG.combat.thiefStealChance
        ) {
          const stolen = Math.max(1, Math.floor(progressRef.current.pesos * GAME_CONFIG.combat.thiefStealRatio));
          opts.attackerMob.stolenPesos = (opts.attackerMob.stolenPesos || 0) + stolen;
          callbacksRef.current.onPesosDelta(-stolen);
          noirAudio.playStealAlert();
          addFloatingText(player.x, player.y - 124, `THIEF STOLE ₱${stolen}! KILL TO RECOVER!`, '#FACC15');
          showBanner('PICKPOCKET ALERT!', `A Street Thief snatched ₱${stolen}! Defeat them to recover every Peso!`, 3.6);
        }
      }

      if (tawasShieldTimer > 0) {
        const reflectDmg = Math.max(8, Math.round(damage * 0.75));
        for (const m of mobs) {
          if (!m.dead && Math.abs(m.x - knockFromX) < 60) {
            damageMob(m, reflectDmg, player.x, '#FDE047');
            break;
          }
        }
        addFloatingText(player.x, player.y - 90, `TAWAS REFLECT! -${dmg}`, '#FDE047');
      } else if (rawShieldUp && unblockable) {
        noirAudio.playShieldBreak();
        addFloatingText(player.x, player.y - 84, `UNBLOCKABLE! -${dmg}`, '#EF4444');
      } else if (shieldUp) {
        noirAudio.playUmbrellaBlock();
        addFloatingText(player.x, player.y - 76, `BLOCKED -${dmg}`, '#7DD3FC');
      } else {
        noirAudio.playHurt();
        addFloatingText(player.x, player.y - 72, label ? `${label} -${dmg}` : `-${dmg}`, '#F87171');
      }
      if (player.hp <= 0 && !heroDying) {
        const gY = Math.floor(viewH * 0.8);
        heroDying = spawnDeathSequence({
          id: `hero_down_${Date.now()}`,
          kind: 'hero',
          name: 'Bataan Hero Defender',
          x: player.x,
          y: gY + player.y,
          facing: player.facing,
          knockbackDir: (Math.sign(player.x - knockFromX || -1) as 1 | -1),
        });
        screenShake = 10;
        noirAudio.playDeathCollapse('hero_down');
        addFloatingText(player.x, player.y - 86, 'DEFEATED...', '#EF4444');
      }
    };

    const stepUniqueSkill = (
      entity: SkillRuntimeFields & {
        x: number;
        facing: 1 | -1;
        slashTimer?: number;
        weakSpotTimer: number;
      },
      kitKind: string,
      bossRoleOrId: string | undefined,
      baseAtk: number,
      isFolklore: boolean,
      dt: number
    ): boolean => {
      // Tick all skill cooldowns + per-enemy skill-rotation timer
      for (const k of Object.keys(entity.skillCooldowns)) {
        if (entity.skillCooldowns[k] > 0) {
          entity.skillCooldowns[k] = Math.max(0, entity.skillCooldowns[k] - dt);
        }
      }
      if (entity.skillRotationTimer > 0) {
        entity.skillRotationTimer = Math.max(0, entity.skillRotationTimer - dt);
      }

      if (entity.activeSkill && entity.skillPhase !== 'none') {
        const sk = entity.activeSkill;
        entity.skillTimer -= dt;

        if (entity.skillPhase === 'windup') {
          entity.facing = player.x >= entity.x ? 1 : -1;
          if (entity.skillTimer <= 0) {
            entity.skillPhase = 'active';
            entity.skillTimer = sk.activeSec;
            entity.skillDidHit = false;
            if (entity.slashTimer !== undefined) {
              entity.slashTimer = Math.max(entity.slashTimer, Math.min(0.4, sk.activeSec));
            }
            if (sk.visualKind === 'shadow_blink_slash') {
              entity.x = Math.max(110, Math.min(zone.width - 110, player.x - player.facing * 56));
              entity.facing = player.x >= entity.x ? 1 : -1;
              spawnDust(entity.x, 0, 6, '#A855F7');
            } else if (sk.visualKind === 'nomar_counter_shield' && graciasNomar && entity === graciasNomar) {
              graciasNomar.state = 'counter';
              graciasNomar.stateDuration = sk.activeSec;
              graciasNomar.stateTimer = sk.activeSec;
            }
          }
          return true;
        }

        // Active execution phase
        if (!entity.skillDidHit) {
          entity.skillDidHit = true;
          const dmg = Math.max(6, Math.round(baseAtk * sk.damageMult));
          const statusEffect =
            sk.appliesStatus && sk.appliesStatus !== 'weak_spot_after' ? sk.appliesStatus : undefined;

          if (sk.buffsNearbyAllies) {
            let rallied = 0;
            for (const ally of mobs) {
              if (!ally.dead && Math.abs(ally.x - entity.x) <= 420) {
                ally.rallyBuffTimer = Math.max(ally.rallyBuffTimer, 7.0);
                rallied += 1;
              }
            }
            noirAudio.playHaranaWave();
            addFloatingText(
              entity.x,
              -126,
              rallied > 0 ? `RALLIED ${rallied} ALLIES! +ATK/SPD!` : 'WAR CRY RALLY!',
              '#FACC15'
            );
          } else if (sk.summonsNomar) {
            if (!graciasNomar || graciasNomar.defeated) {
              spawnGraciasNomarAt(entity.x + entity.facing * 125);
              screenShake = Math.max(screenShake, 8);
              addFloatingText(entity.x, -158, 'THE GRACIAS NOMAR SUMMONED!', '#EF4444');
            }
          } else if (sk.reflectable) {
            const count = sk.visualKind === 'cash_barrage' ? 3 : 1;
            if (sk.visualKind === 'laser_bullet') {
              noirAudio.playGunshot();
            }
            for (let idx = 0; idx < count; idx++) {
              const speed =
                sk.visualKind === 'laser_bullet'
                  ? 535
                  : sk.visualKind === 'decree_beam'
                    ? 460
                    : sk.visualKind === 'kulam_curse_orb'
                      ? 320
                      : 370 + idx * 35;
              spawnProj({
                x: entity.x + entity.facing * (28 + idx * 24),
                y: -44 + (idx - (count - 1) * 0.5) * 10,
                vx: entity.facing * speed,
                fromPlayer: false,
                damage: Math.round(dmg * (count > 1 ? 0.72 : 1)),
                color:
                  sk.visualKind === 'kulam_curse_orb'
                    ? '#A855F7'
                    : sk.visualKind === 'bribe_wad' || sk.visualKind === 'cash_barrage'
                      ? '#22C55E'
                      : sk.visualKind === 'decree_beam'
                        ? '#FACC15'
                        : '#FBBF24',
                life: 1.5,
                radius: sk.visualKind === 'decree_beam' ? 14 : sk.visualKind === 'laser_bullet' ? 6 : 11,
                isBullet: sk.visualKind === 'laser_bullet',
                isLaser: sk.visualKind === 'decree_beam',
                kind:
                  sk.visualKind === 'kulam_curse_orb'
                    ? 'curse'
                    : sk.visualKind === 'bribe_wad' || sk.visualKind === 'cash_barrage'
                      ? 'bribe'
                      : sk.visualKind === 'decree_beam'
                        ? 'laser'
                        : sk.visualKind === 'laser_bullet'
                          ? 'bullet'
                          : 'energy',
                reflectable: true,
                appliesStatus: statusEffect,
              });
            }
          } else {
            // Direct melee / AoE / ground shockwave / lightning strike
            const distPlayer = Math.abs(player.x - entity.x);
            const distTarget = Math.abs(player.x - entity.skillTargetX);
            const isGroundWave =
              sk.visualKind === 'seal_shockwave' ||
              sk.visualKind === 'gavel_slam' ||
              sk.visualKind === 'balete_roots';
            const jumpDodged = isGroundWave && player.y < -36;

            if (isGroundWave) {
              screenShake = Math.max(screenShake, 7.5);
              spawnDust(sk.visualKind === 'balete_roots' ? entity.skillTargetX : entity.x + entity.facing * 52, 0, 8, '#FACC15');
            }

            let inHitZone = false;
            if (sk.visualKind === 'mastermind_lightning') {
              inHitZone =
                Math.abs(player.x - (entity.skillTargetX - 110)) < 38 ||
                Math.abs(player.x - entity.skillTargetX) < 38 ||
                Math.abs(player.x - (entity.skillTargetX + 110)) < 38;
              screenShake = Math.max(screenShake, 8);
            } else if (sk.visualKind === 'balete_roots') {
              inHitZone = distTarget < 64 && !jumpDodged;
            } else if (sk.visualKind === 'seal_shockwave' || sk.visualKind === 'gavel_slam') {
              inHitZone = distPlayer <= sk.rangePx + 24 && !jumpDodged;
            } else if (sk.visualKind === 'nomar_blitz' || sk.visualKind === 'tiyanak_lunge') {
              entity.x = Math.max(100, Math.min(zone.width - 100, entity.x + entity.facing * 135));
              inHitZone = Math.abs(player.x - entity.x) < 88 && Math.abs(player.y) < 58;
            } else if (sk.visualKind === 'flashlight_cone' || sk.visualKind === 'ledger_chain') {
              const inFront = Math.sign(player.x - entity.x || entity.facing) === entity.facing;
              inHitZone = inFront && distPlayer <= sk.rangePx && Math.abs(player.y) < 62;
            } else if (sk.visualKind !== 'nomar_counter_shield') {
              inHitZone = distPlayer <= Math.max(96, sk.rangePx * 0.72) && Math.abs(player.y) < 62;
            }

            if (inHitZone) {
              hurtPlayer(dmg, entity.x, sk.name, isFolklore, {
                unblockable: sk.unblockable,
                status: statusEffect,
              });
            } else if (jumpDodged && distPlayer <= sk.rangePx + 30) {
              addFloatingText(player.x, player.y - 84, 'JUMP DODGED!', '#7AE582');
            }
          }
        }

        if (entity.skillTimer <= 0) {
          if (sk.appliesStatus === 'weak_spot_after') {
            entity.weakSpotTimer = Math.max(entity.weakSpotTimer, 3.0);
            addFloatingText(entity.x, -138, 'WEAK SPOT EXPOSED! 2.4×!', '#FDE047');
          }
          entity.activeSkill = null;
          entity.skillPhase = 'none';
          entity.skillTimer = 0;
        }
        return true;
      }

      // Wait for per-enemy skill-rotation timer before triggering next telegraphed skill
      if (entity.skillRotationTimer > 0) return false;

      // Trigger a ready unique skill if player is in range
      const kit = getEnemySkillKit(kitKind, bossRoleOrId);
      const dist = Math.abs(player.x - entity.x);
      for (const sk of kit.skills) {
        if ((entity.skillCooldowns[sk.id] || 0) > 0) continue;
        if (sk.summonsNomar && graciasNomar && !graciasNomar.defeated) continue;
        if (dist <= sk.rangePx) {
          entity.activeSkill = sk;
          entity.skillPhase = 'windup';
          entity.skillTimer = sk.windupSec;
          entity.skillTargetX = player.x;
          entity.skillDidHit = false;
          entity.skillCooldowns[sk.id] = sk.cooldownSec;
          entity.skillRotationTimer = 2.0 + Math.random() * 1.4;
          entity.facing = player.x >= entity.x ? 1 : -1;
          return true;
        }
      }

      return false;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      const prog = progressRef.current;
      const st = statsRef.current;
      const groundY = Math.floor(viewH * 0.80);
      const nightNow = zone.lighting === 'haunted_night' || isTimeNight(timeOfDay);

      // Detect Level-Up in real time -> Trigger 4-frame Celebration Pose + Golden Sun Pillar + Full HP/SP Restore + Fanfare!
      if (prog.level > lastKnownLevel) {
        lastKnownLevel = prog.level;
        levelUpAnim = triggerLevelUpAnimation(player.x, groundY + player.y, prog.level);
        player.hp = st.maxHp;
        player.sp = st.maxSp;
        screenShake = Math.max(screenShake, 7);
        noirAudio.playLevelUpFanfare();
        showBanner(
          `LEVEL UP! LV. ${prog.level}`,
          'Full HP & SP restored! +3 Stat Points ready in your Character Panel!',
          4.2
        );
      }

      if (!pausedRef.current) {
        atmosphere.update(dt, viewW, viewH, groundY);
        ambientLife.update(dt, viewW, viewH, groundY, atmosphere.weather === 'monsoon_storm');
        skillVfx.update(dt);
        levelUpAnim = updateLevelUpAnimation(levelUpAnim, dt, player.x, groundY + player.y);

        // Tick Ore & Gatherable Plant Respawn Timers
        for (const k of Object.keys(oreRespawns)) {
          if (oreRespawns[k] > 0) oreRespawns[k] = Math.max(0, oreRespawns[k] - dt);
        }
        for (const k of Object.keys(gatherRespawns)) {
          if (gatherRespawns[k] > 0) gatherRespawns[k] = Math.max(0, gatherRespawns[k] - dt);
        }

        // Tick Timed Stat Buffs (1–5 min skill & cooked food buffs)
        for (let i = activeBuffsRef.current.length - 1; i >= 0; i--) {
          activeBuffsRef.current[i].remainingSec -= dt;
          if (activeBuffsRef.current[i].remainingSec <= 0) {
            activeBuffsRef.current.splice(i, 1);
          }
        }

        // Tick Active Side Job (Food Delivery / Taxi) Countdown Timer
        if (activeSideJobRef.current) {
          activeSideJobRef.current.remainingSec -= dt;
          if (activeSideJobRef.current.remainingSec <= 0) {
            const expiredTitle = activeSideJobRef.current.title;
            activeSideJobRef.current = null;
            noirAudio.playDebuffAlert();
            showBanner(`${expiredTitle} Expired`, 'Time ran out! Visit Civic Dispatch to take a new run.', 4.0);
          }
        }

        // Advance active Dying Entities queue (collapse, spirit-banish, knockout tumble, deferred loot drop)
        for (let i = dyingEntities.length - 1; i >= 0; i--) {
          const item = dyingEntities[i];
          const res = updateDyingEntity(item.state, dt, groundY);
          if (res.triggerLootDrop && item.onLoot) {
            item.onLoot();
            item.onLoot = undefined;
          }
          if (res.finished) {
            if (item.onLoot) {
              item.onLoot();
              item.onLoot = undefined;
            }
            dyingEntities.splice(i, 1);
          }
        }

        // Advance 1.8s Hero Collapse sequence before Safe House Respawn modal
        if (heroDying) {
          const hRes = updateDyingEntity(heroDying, dt, groundY);
          screenShake = Math.max(0, screenShake - dt * 16);
          if (hRes.finished) {
            heroDying = null;
            callbacksRef.current.onPlayerDefeated();
          }
        }

        // Handle El Mastermind 0.55s Freeze-Frame + Glowing Red Eyepatch Flash!
        if (heroDying) {
          // Freeze gameplay controls while Hero Down collapse plays out
        } else if (freezeFrameTimer > 0) {
          freezeFrameTimer -= dt;
          redEyepatchOverlay = Math.max(0, redEyepatchOverlay - dt * 1.1);
          screenShake = Math.max(4, screenShake - dt * 14);
          if (freezeFrameTimer <= 0 && pendingInstantDeathDialogue) {
            const dlg = pendingInstantDeathDialogue;
            pendingInstantDeathDialogue = null;
            player.hp = 0;
            callbacksRef.current.onMastermindInstantDeath(dlg);
          }
        } else {
          // Advance Day/Night Cycle smoothly (~1 in-game hour per 5.5s)
          timeOfDay = (timeOfDay + dt * 0.18) % 24;
          redEyepatchOverlay = Math.max(0, redEyepatchOverlay - dt * 2);
          whistlePulseTimer = Math.max(0, whistlePulseTimer - dt);

          player.slashCooldown = Math.max(0, player.slashCooldown - dt);
          player.tiradorTimer = Math.max(0, player.tiradorTimer - dt);
          player.tiradorCooldown = Math.max(0, player.tiradorCooldown - dt);
          if (player.slashTimer > 0) {
            player.attackElapsed = Math.min(player.slashDuration, player.attackElapsed + dt);
            player.slashTimer = Math.max(0, player.slashTimer - dt);
            if (player.attackLocked && player.attackElapsed >= 0.03 && player.attackElapsed <= 0.24) {
              sweepActiveAttackHitbox();
            }
            if (player.slashTimer <= 0) {
              player.attackLocked = false;
              player.attackElapsed = 0;
              player.attackHitIds.clear();
            }
          } else if (player.attackLocked) {
            // Fail-safe: guarantee hero can never remain stuck in attackLocked
            player.attackLocked = false;
            player.attackElapsed = 0;
          }
          player.shieldTimer = Math.max(0, player.shieldTimer - dt);
          player.shieldCooldown = Math.max(0, player.shieldCooldown - dt);
          if (player.shieldTimer <= 0) player.shieldHold = false;
          player.comboResetTimer = Math.max(0, player.comboResetTimer - dt);
          player.dashCooldown = Math.max(0, player.dashCooldown - dt);
          player.dashTimer = Math.max(0, player.dashTimer - dt);
          player.invulnTimer = Math.max(0, player.invulnTimer - dt);
          player.hurtFlash = Math.max(0, player.hurtFlash - dt);
          dummyRecoil = Math.max(0, dummyRecoil - dt * 4.5);
          screenShake = Math.max(0, screenShake - dt * 22);
          updateImpactBursts(impactBursts, dt);
          for (let i = bulletTracers.length - 1; i >= 0; i--) {
            bulletTracers[i].life -= dt;
            if (bulletTracers[i].life <= 0) bulletTracers.splice(i, 1);
          }

          // Tick Magic Cooldowns, Casting Pose, Tawas Shield, Herbal Sanctuary & Active VFX
          for (const k of Object.keys(magicCooldowns)) {
            if (magicCooldowns[k] > 0) magicCooldowns[k] = Math.max(0, magicCooldowns[k] - dt);
          }
          tawasShieldTimer = Math.max(0, tawasShieldTimer - dt);
          if (heroMagicCast) {
            heroMagicCast.timer -= dt;
            if (heroMagicCast.timer <= 0) heroMagicCast = null;
          }
          for (let i = activeMagicEffects.length - 1; i >= 0; i--) {
            activeMagicEffects[i].timer -= dt;
            if (activeMagicEffects[i].timer <= 0) activeMagicEffects.splice(i, 1);
          }
          if (herbalSanctuary) {
            herbalSanctuary.timer -= dt;
            herbalSanctuary.tickTimer -= dt;
            if (herbalSanctuary.tickTimer <= 0) {
              herbalSanctuary.tickTimer = 0.85;
              if (Math.abs(player.x - herbalSanctuary.x) < 165) {
                const healTick = Math.round(14 + (prog.statAllocation?.int || 0) * 1.4);
                player.hp = Math.min(st.maxHp, player.hp + healTick);
                addFloatingText(player.x, player.y - 82, `+${healTick} HP`, '#7AE582');
              }
              const burnDmg = Math.round(st.atk * 0.55 * (st.magicPowerMult || 1));
              for (const m of mobs) {
                if (!m.dead && Math.abs(m.x - herbalSanctuary.x) < 155) {
                  damageMob(m, burnDmg, herbalSanctuary.x, '#7AE582');
                }
              }
            }
            if (herbalSanctuary.timer <= 0) herbalSanctuary = null;
          }

          if (player.comboDecay > 0) {
            player.comboDecay -= dt;
            if (player.comboDecay <= 0) player.comboCount = 0;
          }
          if (player.sanctuaryBuffSec > 0) {
            player.sanctuaryBuffSec = Math.max(0, player.sanctuaryBuffSec - dt);
          }

          player.hp = Math.min(st.maxHp, player.hp);
          player.sp = Math.min(st.maxSp, player.sp + st.spRegen * dt);

          // Tick Player Status Debuffs (Payong Soaked/Burn, Poison, Stun, Freeze, Confusion, Shadow, Slow, Blind, Bleed)
          const hasOpenPayong = prog.hasUmbrella && prog.umbrellaOpen;
          const isRainyWeather =
            zone.lighting !== 'cave_dark' &&
            (atmosphere.weather === 'drizzle' ||
              atmosphere.weather === 'heavy_rain' ||
              atmosphere.weather === 'monsoon_storm');
          const isSunnyDay =
            zone.lighting !== 'cave_dark' &&
            atmosphere.weather === 'clear' &&
            !nightNow &&
            timeOfDay >= 6.5 &&
            timeOfDay <= 17.5;

          playerDebuffs.soaked = isRainyWeather && !hasOpenPayong;
          playerDebuffs.burn = isSunnyDay && !hasOpenPayong;

          if (playerDebuffs.burn) {
            playerDebuffs.burnTick -= dt;
            if (playerDebuffs.burnTick <= 0 && !heroDying && player.hp > 1) {
              playerDebuffs.burnTick = GAME_CONFIG.weather.burnTickIntervalSec;
              const burnDmg = Math.max(1, Math.round(st.maxHp * GAME_CONFIG.weather.burnHpPctPerTick));
              player.hp = Math.max(1, player.hp - burnDmg);
              player.hurtFlash = 0.08;
              addFloatingText(player.x, player.y - 84, `SUNBURN -${burnDmg} (OPEN PAYONG [U])`, '#FB923C');
            }
          } else {
            playerDebuffs.burnTick = GAME_CONFIG.weather.burnTickIntervalSec;
          }

          playerDebuffs.slow = Math.max(0, playerDebuffs.slow - dt);
          playerDebuffs.blind = Math.max(0, playerDebuffs.blind - dt);
          playerDebuffs.stun = Math.max(0, playerDebuffs.stun - dt);
          playerDebuffs.freeze = Math.max(0, playerDebuffs.freeze - dt);
          playerDebuffs.confusion = Math.max(0, playerDebuffs.confusion - dt);
          playerDebuffs.shadow = Math.max(0, playerDebuffs.shadow - dt);

          if (playerDebuffs.poison > 0) {
            playerDebuffs.poison = Math.max(0, playerDebuffs.poison - dt);
            playerDebuffs.poisonTick -= dt;
            if (playerDebuffs.poisonTick <= 0 && !heroDying && player.hp > 1) {
              playerDebuffs.poisonTick = GAME_CONFIG.debuffs.poison.tickIntervalSec || 1.0;
              const pDmg = Math.max(3, Math.round(st.maxHp * (GAME_CONFIG.debuffs.poison.tickDmgPct || 0.022)));
              player.hp = Math.max(1, player.hp - pDmg);
              player.hurtFlash = 0.1;
              addFloatingText(player.x, player.y - 78, `POISON -${pDmg}`, '#22C55E');
            }
          }

          if (playerDebuffs.bleed > 0) {
            playerDebuffs.bleed = Math.max(0, playerDebuffs.bleed - dt);
            playerDebuffs.bleedTick -= dt;
            if (playerDebuffs.bleedTick <= 0 && !heroDying && player.hp > 1) {
              playerDebuffs.bleedTick = 1.0;
              const bleedDmg = Math.max(4, Math.round(st.maxHp * 0.035));
              player.hp = Math.max(1, player.hp - bleedDmg);
              player.hurtFlash = 0.12;
              addFloatingText(player.x, player.y - 78, `BLEED -${bleedDmg}`, '#F87171');
            }
          }

          if (playerDebuffs.soaked) {
            player.mood = Math.max(40, player.mood - dt * 0.55);
          } else {
            player.mood = Math.min(100, player.mood + dt * 0.45);
          }

          if (speechBanner) {
            speechBanner.timer -= dt;
            if (speechBanner.timer <= 0) speechBanner = null;
          }

          let moveDir = touchMoveDir;
          if (keys['KeyA'] || keys['ArrowLeft']) moveDir = -1;
          if (keys['KeyD'] || keys['ArrowRight']) moveDir = 1;
          if (playerDebuffs.confusion > 0) moveDir = (moveDir * -1) as -1 | 0 | 1;
          if (playerDebuffs.stun > 0) moveDir = 0;

          // Interactive Fishing Mini-Game State Machine
          if (fishingState) {
            if (moveDir !== 0) {
              fishingState = null;
              addFloatingText(player.x, player.y - 96, 'FISHING CANCELLED', '#94A3B8');
            } else {
              player.vx = 0;
              if (fishingState.phase === 'casting') {
                fishingState.timer -= dt;
                if (fishingState.timer <= 0) {
                  fishingState.phase = 'waiting';
                  const cfg = GAME_CONFIG.fishing;
                  fishingState.timer = cfg.minWaitSec + Math.random() * (cfg.maxWaitSec - cfg.minWaitSec);
                }
              } else if (fishingState.phase === 'waiting') {
                fishingState.timer -= dt;
                if (fishingState.timer <= 0) {
                  fishingState.phase = 'bite';
                  fishingState.timer = GAME_CONFIG.fishing.biteWindowSec;
                  noirAudio.playFishingBite();
                  addFloatingText(player.x + 65, player.y - 92, 'BITE! PRESS [E] / [SPACE]!', '#FDE047');
                }
              } else if (fishingState.phase === 'bite') {
                fishingState.timer -= dt;
                if (fishingState.timer <= 0) {
                  fishingState = null;
                  addFloatingText(player.x, player.y - 96, 'THE FISH GOT AWAY!', '#F87171');
                }
              } else if (fishingState.phase === 'reeling') {
                const cfg = GAME_CONFIG.fishing;
                fishingState.timer -= dt;
                // Smooth moving sweet-spot zone based on fish difficulty
                if (Math.abs(fishingState.zoneTarget - fishingState.zoneCenter) < 0.04) {
                  fishingState.zoneTarget = 0.18 + Math.random() * 0.64;
                }
                const zoneSpd = 0.25 + fishingState.fishDifficulty * 0.48;
                fishingState.zoneCenter +=
                  Math.sign(fishingState.zoneTarget - fishingState.zoneCenter) * Math.min(Math.abs(fishingState.zoneTarget - fishingState.zoneCenter), zoneSpd * dt);
                // Cursor physics: holding Reel pushes up, releasing drops down
                const accel = fishingState.holdingReel ? 2.4 : -2.0;
                fishingState.cursorVel = Math.max(-1.6, Math.min(1.6, fishingState.cursorVel + accel * dt));
                fishingState.cursorPos = Math.max(0.03, Math.min(0.97, fishingState.cursorPos + fishingState.cursorVel * dt));
                if (fishingState.cursorPos <= 0.03 || fishingState.cursorPos >= 0.97) {
                  fishingState.cursorVel *= -0.25;
                }
                const inSweetSpot = Math.abs(fishingState.cursorPos - fishingState.zoneCenter) <= fishingState.zoneWidth * 0.52;
                if (inSweetSpot) {
                  fishingState.reelProgress = Math.min(1, fishingState.reelProgress + cfg.progressGainPerSec * dt);
                } else {
                  fishingState.reelProgress = Math.max(0, fishingState.reelProgress - cfg.progressDrainPerSec * dt);
                }
                if (fishingState.reelProgress >= 1) {
                  const caughtId = fishingState.fishId;
                  const caughtName = fishingState.fishName;
                  const caughtDef = getFishById(caughtId);
                  fishingState = null;
                  noirAudio.playFishingCatch();
                  skillVfx.spawn('buff_luck', player.x + 56, groundY - 12, 1);
                  const xpGain = caughtDef?.rarity === 'Epic' ? 45 : caughtDef?.rarity === 'Rare' ? 30 : 18;
                  addFloatingText(player.x, player.y - 114, `CAUGHT ${caughtName.toUpperCase()}! (+${xpGain} XP)`, '#FDE047');
                  callbacksRef.current.onCatchFish(caughtId, xpGain);
                } else if (fishingState.timer <= 0) {
                  fishingState = null;
                  addFloatingText(player.x, player.y - 98, 'LINE SNAPPED — TRY AGAIN!', '#F87171');
                }
              }
            }
          }

          if (fishingState) {
            // Keep hero stationary while fishing
            player.vx = 0;
          } else if (player.dashTimer > 0) {
            dashGhosts.push({ x: player.x, y: player.y, facing: player.facing, life: 0.22 });
            // Charged Bike Dash collides with enemies in path!
            if (prog.hasBike && prog.ridingBike) {
              for (const m of mobs) {
                if (!m.dead && Math.abs(m.x - player.x) < 42 && m.hurtFlash <= 0) {
                  damageMob(m, st.atk * 1.15, player.x, '#7AE582');
                }
              }
              if (elMastermind && !elMastermind.defeated && Math.abs(elMastermind.x - player.x) < 48) {
                attackElMastermind(st.atk * 1.2, player.x);
              }
            }
          } else if (player.attackLocked && player.slashTimer > 0) {
            // Lock facing & carry forward attack lunge through frames 0 -> 7 without walk/idle canceling
            player.facing = player.attackFacing;
            if (player.attackElapsed < 0.22) {
              player.vx *= Math.pow(0.06, dt);
            } else {
              const bikeBoost = prog.hasBike && prog.ridingBike ? 1.35 : 0.65;
              const targetVx = moveDir * st.moveSpeed * bikeBoost * getBuffMult('speed_up');
              player.vx += (targetVx - player.vx) * Math.min(1, dt * 10);
            }
          } else {
            const bikeBoost = prog.hasBike && prog.ridingBike ? 1.58 : 1;
            const shieldSlow = player.shieldHold && player.shieldTimer > 0 ? 0.55 : 1;
            const soakedSlow = playerDebuffs.soaked ? GAME_CONFIG.weather.soakedSpeedMult : 1;
            const freezeSlow = playerDebuffs.freeze > 0 ? GAME_CONFIG.debuffs.freeze.speedMult || 0.28 : 1;
            const debuffSlow = (playerDebuffs.slow > 0 ? 0.68 : 1) * soakedSlow * freezeSlow;
            const speedBuff = getBuffMult('speed_up');
            const targetVx = moveDir * st.moveSpeed * bikeBoost * shieldSlow * debuffSlow * speedBuff;
            const isBikeSkid =
              prog.hasBike &&
              prog.ridingBike &&
              moveDir !== 0 &&
              Math.sign(player.vx) !== 0 &&
              Math.sign(player.vx) !== moveDir &&
              Math.abs(player.vx) > 120;
            player.vx += (targetVx - player.vx) * Math.min(1, dt * (isBikeSkid ? 9 : 16));
            if (isBikeSkid && player.y === 0) {
              spawnDust(player.x + Math.sign(player.vx) * 18, 0, 2, '#E2E8F0');
            }
            if (moveDir !== 0) {
              player.facing = moveDir as 1 | -1;
              const speedFactor = Math.max(0.45, Math.abs(player.vx) / Math.max(1, st.moveSpeed));
              player.walkPhase += dt * (prog.ridingBike ? 12.5 * speedFactor : 11 * Math.min(1.3, speedFactor));
              dustTimer -= dt;
              if (player.y === 0 && dustTimer <= 0) {
                dustTimer = prog.ridingBike ? 0.08 : 0.16;
                spawnDust(player.x - player.facing * 14, 0, 2);
              }
            }
          }

          if (!Number.isFinite(player.vx)) player.vx = 0;
          if (!Number.isFinite(player.vy)) player.vy = 0;
          if (!Number.isFinite(player.x)) player.x = zone.safeSpawnX;
          if (!Number.isFinite(player.y)) player.y = 0;

          player.x = Math.max(36, Math.min(zone.width - 36, player.x + player.vx * dt));

          const glideGravity = prog.hasUmbrella && prog.umbrellaOpen && player.vy > 0 ? 580 : 1360;
          player.vy += glideGravity * dt;
          player.y += player.vy * dt;
          if (player.y >= 0) {
            if (player.wasAirborne) {
              spawnDust(player.x, 0, 6);
              player.wasAirborne = false;
            }
            player.y = 0;
            player.vy = 0;
            player.jumpsLeft = 2;
          } else {
            player.wasAirborne = true;
          }

          // Smooth delta-time Hero & Bicycle wheel/crank/lean + squash-stretch kinematics
          updateSmoothHeroMotion(heroMotion, player.vx, prog.hasBike && prog.ridingBike, player.y === 0, dt);

          for (let i = dashGhosts.length - 1; i >= 0; i--) {
            dashGhosts[i].life -= dt;
            if (dashGhosts[i].life <= 0) dashGhosts.splice(i, 1);
          }

          for (let i = dustParticles.length - 1; i >= 0; i--) {
            const dp = dustParticles[i];
            dp.x += dp.vx * dt;
            dp.y += dp.vy * dt;
            dp.life -= dt;
            if (dp.life <= 0) dustParticles.splice(i, 1);
          }

          // Active Summoned Tropa Companion AI
          const activeFriend = prog.activeCompanionId
            ? FRIENDS.find((f) => f.id === prog.activeCompanionId) || null
            : null;
          if (activeFriend) {
            const bondInfo = getBondRank(prog.friendBonds[activeFriend.id] || 0);
            const rankPower = 1 + (bondInfo.rank - 2) * 0.22;
            companion.actionCooldown = Math.max(0, companion.actionCooldown - dt);
            companion.slashTimer = Math.max(0, companion.slashTimer - dt);

            // Confusion Debuff (5s): Summoned ally turns temporarily hostile and attacks hero (hero cannot hurt ally!)
            if (playerDebuffs.confusion > 0) {
              const diffToHero = player.x - companion.x;
              companion.facing = diffToHero >= 0 ? 1 : -1;
              if (Math.abs(diffToHero) > 54) {
                companion.x += Math.sign(diffToHero) * Math.min(Math.abs(diffToHero), 235 * dt);
                companion.walkPhase += dt * 11;
              }
              companion.statusText = 'CONFUSED!';
              playerDebuffs.confusionAtkCd -= dt;
              if (playerDebuffs.confusionAtkCd <= 0 && Math.abs(diffToHero) < 110) {
                playerDebuffs.confusionAtkCd = 1.25;
                companion.slashTimer = 0.34;
                skillVfx.spawn('ally_slash', companion.x + companion.facing * 24, groundY + companion.y - 40, companion.facing);
                hurtPlayer(Math.max(8, Math.round(st.atk * 0.45)), companion.x, `${activeFriend.name} (Confused)`);
              }
            } else {

            let nearestHostileX: number | null = null;
            let hostileTarget:
              | { kind: 'mob'; mob: MobEntity }
              | { kind: 'town_boss'; boss: TownBossEntity }
              | { kind: 'awakened_boss'; boss: AwakenedBossEntity }
              | { kind: 'mastermind' }
              | null = null;
            let bestDist = 380;

            for (const m of mobs) {
              if (m.dead) continue;
              const d = Math.abs(m.x - player.x);
              if (d < bestDist) {
                bestDist = d;
                nearestHostileX = m.x;
                hostileTarget = { kind: 'mob', mob: m };
              }
            }
            for (const b of townBosses) {
              if (b.defeated) continue;
              const d = Math.abs(b.x - player.x);
              if (d < 440 && d < bestDist + 60) {
                bestDist = d;
                nearestHostileX = b.x;
                hostileTarget = { kind: 'town_boss', boss: b };
              }
            }
            for (const ab of awakenedBosses) {
              if (ab.defeated) continue;
              const d = Math.abs(ab.x - player.x);
              if (d < 460 && d < bestDist + 80) {
                bestDist = d;
                nearestHostileX = ab.x;
                hostileTarget = { kind: 'awakened_boss', boss: ab };
              }
            }
            if (elMastermind && elMastermind.fightActive && !elMastermind.defeated) {
              const d = Math.abs(elMastermind.x - player.x);
              if (d < 460) {
                nearestHostileX = elMastermind.x;
                hostileTarget = { kind: 'mastermind' };
              }
            }

            if (activeFriend.combatStyle === 'healer') {
              const desiredX = player.x - player.facing * 56;
              const diff = desiredX - companion.x;
              if (Math.abs(diff) > 10) {
                companion.facing = diff >= 0 ? 1 : -1;
                companion.x += Math.sign(diff) * Math.min(Math.abs(diff), 225 * dt);
                companion.walkPhase += dt * 9.5;
              }
              companion.statusText = 'Guarding';
              if (companion.actionCooldown <= 0) {
                if (player.hp < st.maxHp * 0.88) {
                  const healAmt = Math.round((18 + bondInfo.rank * 7) * rankPower);
                  player.hp = Math.min(st.maxHp, player.hp + healAmt);
                  companion.actionCooldown = 4.8;
                  companion.slashTimer = 0.35;
                  companion.statusText = 'Healing';
                  noirAudio.playRestChime();
                  addFloatingText(player.x, player.y - 84, `${activeFriend.name} +${healAmt} HP`, '#7AE582');
                } else if (hostileTarget && nearestHostileX !== null) {
                  companion.facing = nearestHostileX >= companion.x ? 1 : -1;
                  spawnProj({
                    x: companion.x + companion.facing * 18,
                    y: companion.y - 34,
                    vx: companion.facing * 380,
                    fromPlayer: true,
                    damage: Math.round(st.atk * 0.68 * rankPower),
                    color: '#7AE582',
                    life: 0.9,
                    radius: 10,
                    kind: 'energy',
                  });
                  companion.actionCooldown = 2.5;
                  companion.statusText = 'Assisting';
                }
              }
            } else if (activeFriend.combatStyle === 'gunner') {
              // Armed Honest Police (PO2 Clara Santos) & Honest Soldier (Sgt. Reyes) tactical covering fire!
              const desiredX =
                hostileTarget && nearestHostileX !== null
                  ? nearestHostileX - Math.sign(nearestHostileX - player.x || 1) * 155
                  : player.x - player.facing * 68;
              const diff = desiredX - companion.x;
              if (Math.abs(diff) > 14) {
                companion.facing = diff >= 0 ? 1 : -1;
                companion.x += Math.sign(diff) * Math.min(Math.abs(diff), 235 * dt);
                companion.walkPhase += dt * 10;
              }
              companion.statusText = hostileTarget ? 'Covering Fire' : 'On Patrol';

              if (activeFriend.npcVisual === 'honest_police') {
                // Full aiming arm + rotated service pistol + recoil + starburst muzzle flash + glowing tracer!
                policeAllyState.x = companion.x;
                policeAllyState.y = companion.y;
                if (!hostileTarget) {
                  policeAllyState.facing = companion.facing;
                }
                type ShootTarget = {
                  x: number;
                  y: number;
                  hp: number;
                  ref:
                    | { kind: 'mob'; mob: MobEntity }
                    | { kind: 'town_boss'; boss: TownBossEntity }
                    | { kind: 'awakened_boss'; boss: AwakenedBossEntity }
                    | { kind: 'mastermind' }
                    | { kind: 'nomar' };
                };
                const shootTargets: ShootTarget[] = [];
                for (const m of mobs) {
                  if (!m.dead && m.hp > 0) shootTargets.push({ x: m.x, y: m.y, hp: m.hp, ref: { kind: 'mob', mob: m } });
                }
                for (const b of townBosses) {
                  if (!b.defeated && b.hp > 0) shootTargets.push({ x: b.x, y: 0, hp: b.hp, ref: { kind: 'town_boss', boss: b } });
                }
                for (const ab of awakenedBosses) {
                  if (!ab.defeated && ab.hp > 0) shootTargets.push({ x: ab.x, y: 0, hp: ab.hp, ref: { kind: 'awakened_boss', boss: ab } });
                }
                if (elMastermind && elMastermind.fightActive && !elMastermind.defeated && elMastermind.hp > 0) {
                  shootTargets.push({ x: elMastermind.x, y: 0, hp: elMastermind.hp, ref: { kind: 'mastermind' } });
                }
                if (graciasNomar && !graciasNomar.defeated && graciasNomar.hp > 0) {
                  shootTargets.push({ x: graciasNomar.x, y: 0, hp: graciasNomar.hp, ref: { kind: 'nomar' } });
                }

                const fired = updatePoliceShooting(policeAllyState, shootTargets, dt, (x1, y1, x2, y2, hitTarget) => {
                  companion.facing = policeAllyState.facing;
                  companion.slashTimer = 0.24;
                  noirAudio.playGunshot();
                  bulletTracers.push({ x1, y1, x2, y2, color: '#7DD3FC', life: 0.14, maxLife: 0.14 });
                  spawnImpactBurst(impactBursts, x2, y2, 'bullet');
                  const shotDmg = Math.round(st.atk * 0.92 * rankPower);
                  if (hitTarget.ref.kind === 'mob') {
                    damageMob(hitTarget.ref.mob, shotDmg, companion.x, '#7DD3FC');
                  } else if (hitTarget.ref.kind === 'town_boss') {
                    damageTownBoss(hitTarget.ref.boss, shotDmg, companion.x, false, '#7DD3FC');
                  } else if (hitTarget.ref.kind === 'awakened_boss') {
                    damageAwakenedBoss(hitTarget.ref.boss, shotDmg, companion.x, false, '#7DD3FC');
                  } else if (hitTarget.ref.kind === 'mastermind') {
                    attackElMastermind(shotDmg, companion.x);
                  } else if (hitTarget.ref.kind === 'nomar') {
                    damageGraciasNomar(shotDmg, companion.x, '#7DD3FC');
                  }
                });
                if (fired) {
                  companion.statusText = 'Firing Sidearm';
                }
              } else if (hostileTarget && nearestHostileX !== null && companion.actionCooldown <= 0) {
                companion.facing = nearestHostileX >= companion.x ? 1 : -1;
                companion.slashTimer = 0.34;
                companion.actionCooldown = 1.15;
                noirAudio.playGunshot();
                skillVfx.spawn('ally_muzzle', companion.x + companion.facing * 32, groundY + companion.y - 44, companion.facing);
                spawnProj({
                  x: companion.x + companion.facing * 26,
                  y: companion.y - 44,
                  vx: companion.facing * 640,
                  fromPlayer: true,
                  damage: Math.round(st.atk * 0.88 * rankPower),
                  color: '#38BDF8',
                  life: 0.9,
                  radius: 6,
                  isBullet: true,
                  kind: 'bullet',
                });
              }
            } else if (activeFriend.combatStyle === 'bard') {
              const desiredX = player.x - player.facing * 64;
              const diff = desiredX - companion.x;
              if (Math.abs(diff) > 12) {
                companion.facing = diff >= 0 ? 1 : -1;
                companion.x += Math.sign(diff) * Math.min(Math.abs(diff), 215 * dt);
                companion.walkPhase += dt * 9.5;
              }
              companion.statusText = hostileTarget ? 'Rallying' : 'Following';
              if (hostileTarget && nearestHostileX !== null && companion.actionCooldown <= 0) {
                companion.facing = nearestHostileX >= companion.x ? 1 : -1;
                companion.slashTimer = 0.36;
                companion.actionCooldown = 2.1;
                player.sp = Math.min(st.maxSp, player.sp + 7);
                noirAudio.playHaranaWave();
                skillVfx.spawn('ally_slash', companion.x + companion.facing * 22, groundY + companion.y - 38, companion.facing);
                spawnProj({
                  x: companion.x + companion.facing * 20,
                  y: companion.y - 36,
                  vx: companion.facing * 430,
                  fromPlayer: true,
                  damage: Math.round(st.atk * 0.95 * rankPower),
                  color: '#F4C542',
                  life: 1.0,
                  radius: 13,
                  kind: 'agimat',
                });
              }
            } else {
              const targetX =
                hostileTarget && nearestHostileX !== null
                  ? nearestHostileX - Math.sign(nearestHostileX - companion.x || 1) * 44
                  : player.x - player.facing * 56;
              const diff = targetX - companion.x;
              const moveSpd = activeFriend.combatStyle === 'aspin' ? 290 : 250;
              if (Math.abs(diff) > 12) {
                companion.facing = diff >= 0 ? 1 : -1;
                companion.x += Math.sign(diff) * Math.min(Math.abs(diff), moveSpd * dt);
                companion.walkPhase += dt * (activeFriend.combatStyle === 'aspin' ? 13 : 10.5);
              }
              companion.statusText = hostileTarget ? 'Fighting' : 'Following';
              if (
                hostileTarget &&
                nearestHostileX !== null &&
                Math.abs(nearestHostileX - companion.x) < 76 &&
                companion.actionCooldown <= 0
              ) {
                companion.facing = nearestHostileX >= companion.x ? 1 : -1;
                companion.slashTimer = 0.34;
                companion.actionCooldown = activeFriend.combatStyle === 'aspin' ? 1.1 : 1.3;
                skillVfx.spawn('ally_slash', companion.x + companion.facing * 26, groundY + companion.y - 36, companion.facing);
                const allyDmg = Math.round(st.atk * (activeFriend.combatStyle === 'aspin' ? 0.85 : 0.95) * rankPower);
                if (hostileTarget.kind === 'mob') {
                  damageMob(hostileTarget.mob, allyDmg, companion.x, '#F4C542');
                } else if (hostileTarget.kind === 'town_boss') {
                  damageTownBoss(hostileTarget.boss, allyDmg, companion.x, false, '#F4C542');
                } else if (hostileTarget.kind === 'awakened_boss') {
                  damageAwakenedBoss(hostileTarget.boss, allyDmg, companion.x, false, '#F4C542');
                } else {
                  attackElMastermind(allyDmg, companion.x);
                }
              }
            }
            }

            if (!Number.isFinite(companion.x)) companion.x = player.x - 56;
            if (!Number.isFinite(companion.y)) companion.y = 0;
            if (player.y < -25 && companion.y === 0 && Math.abs(companion.x - player.x) < 120) {
              companion.vy = -440;
            }
            companion.vy += 1300 * dt;
            companion.y = Math.min(0, companion.y + companion.vy * dt);
            if (companion.y === 0) companion.vy = 0;
          }

          // Update Mobs (Night strengthens folklore + Flying Swoop AI + Tactical Gunfire!)
          for (const m of mobs) {
            if (m.dead) {
              m.respawnTimer -= dt;
              if (m.respawnTimer <= 0) {
                m.dead = false;
                m.hp = m.maxHp;
                m.shieldHp = m.shieldMax;
                m.aimTimer = 0;
                m.x = m.homeX;
                m.y = m.hoverBaseY;
                m.swoopTimer = 0;
              }
              continue;
            }
            if (!Number.isFinite(m.x)) m.x = m.homeX;
            if (!Number.isFinite(m.y)) m.y = m.hoverBaseY;
            m.hurtFlash = Math.max(0, m.hurtFlash - dt);
            m.atkCooldown = Math.max(0, m.atkCooldown - dt);
            m.slashTimer = Math.max(0, m.slashTimer - dt);
            m.swoopTimer = Math.max(0, m.swoopTimer - dt);
            m.guardTimer = Math.max(0, m.guardTimer - dt);
            m.telegraphTimer = Math.max(0, m.telegraphTimer - dt);
            m.defShredTimer = Math.max(0, m.defShredTimer - dt);
            m.rallyBuffTimer = Math.max(0, m.rallyBuffTimer - dt);
            m.weakSpotTimer = Math.max(0, m.weakSpotTimer - dt);

            // Winged enemies ignore ground gravity: smoothly hover at altitude & swoop down on attacks!
            if (m.isFlying) {
              const swooping = m.swoopTimer > 0 || m.slashTimer > 0 || m.skillPhase === 'active';
              const targetAltY = swooping
                ? Math.min(-10, player.y - 16)
                : m.hoverBaseY + Math.sin(elapsed * 4.4 + m.walkPhase) * 11;
              m.y += (targetAltY - m.y) * Math.min(1, dt * (swooping ? 9.5 : 4.2));
            } else {
              m.y = 0;
            }

            if (m.bleedTimer > 0) {
              m.bleedTimer -= dt;
              m.bleedTick -= dt;
              if (m.bleedTick <= 0) {
                m.bleedTick = 0.75;
                damageMob(m, Math.max(4, Math.round(st.atk * 0.35 * (st.magicPowerMult || 1))), m.x, '#C084FC', 0);
                if (m.dead) continue;
              }
            }
            if (m.stunTimer > 0) {
              m.stunTimer = Math.max(0, m.stunTimer - dt);
              m.aimTimer = 0;
              m.guardTimer = 0;
              m.activeSkill = null;
              m.skillPhase = 'none';
              continue;
            }

            const isFolklore = FOLKLORE_KINDS.includes(m.kind);
            const nightBoost = isFolklore && nightNow ? 1.25 : 1;
            const rallyMult = m.rallyBuffTimer > 0 ? 1.22 : 1;
            const distToPlayer = player.x - m.x;
            const speed =
              (m.kind === 'balete_tree'
                ? 0
                : m.kind === 'asong_ulol' || m.kind === 'tiyanak' || m.kind === 'aswang'
                  ? 124
                  : m.kind === 'fat_guy'
                    ? 72
                    : 94) *
              nightBoost *
              rallyMult *
              awSpdMult *
              (m.bleedTimer > 0 ? 0.72 : 1);

            if (stepUniqueSkill(m, m.kind, undefined, Math.round(m.atk * nightBoost * rallyMult), isFolklore, dt)) {
              m.x = Math.max(84, Math.min(zone.width - 84, m.x));
              continue;
            }

            // Armed Corrupted Police / Soldier tactical kiting + laser aim telegraph!
            if (m.usesGun && Math.abs(distToPlayer) < 420) {
              m.facing = distToPlayer >= 0 ? 1 : -1;
              if (m.aimTimer > 0) {
                m.aimTimer -= dt;
                if (m.aimTimer <= 0) {
                  m.slashTimer = 0.24;
                  m.atkCooldown = m.kind === 'corrupt_soldier' ? 1.9 : 2.3;
                  noirAudio.playGunshot();
                  spawnProj({
                    x: m.x + m.facing * 26,
                    y: -44,
                    vx: m.facing * (m.kind === 'corrupt_soldier' ? 560 : 490),
                    fromPlayer: false,
                    damage: Math.round(m.atk * 1.15),
                    color: '#FBBF24',
                    life: 1.3,
                    radius: 6,
                    isBullet: true,
                    kind: 'bullet',
                  });
                }
                continue;
              }
              if (Math.abs(distToPlayer) < 110) {
                m.x = Math.max(48, Math.min(zone.width - 48, m.x - m.facing * speed * 0.85 * dt));
                m.walkPhase += dt * 7;
              } else if (Math.abs(distToPlayer) > 235) {
                m.x += m.facing * speed * dt;
                m.walkPhase += dt * 8 * awSpdMult;
              } else if (m.atkCooldown <= 0) {
                m.aimTimer = 0.82;
              }
              continue;
            }

            if (Math.abs(distToPlayer) < 320) {
              m.facing = distToPlayer >= 0 ? 1 : -1;
              if (Math.abs(distToPlayer) > 52 && speed > 0) {
                m.x += m.facing * speed * dt;
                m.walkPhase += dt * 8 * nightBoost * awSpdMult;
              } else if (m.atkCooldown <= 0 && (m.isFlying || Math.abs(player.y) < 48)) {
                m.slashTimer = 0.28;
                m.swoopTimer = m.isFlying ? 0.42 : 0;
                m.atkCooldown = 1.4;
                if (
                  m.kind === 'balete_tree' ||
                  m.kind === 'bully_kid' ||
                  m.kind === 'white_lady' ||
                  m.kind === 'evil_pastor' ||
                  m.kind === 'corrupted_priest'
                ) {
                  spawnProj({
                    x: m.x + m.facing * 20,
                    y: m.y - 34,
                    vx: m.facing * 285,
                    fromPlayer: false,
                    damage: Math.round(m.atk * nightBoost),
                    color: m.kind === 'bully_kid' || m.kind === 'evil_pastor' ? '#F4C542' : '#7CF7DC',
                    life: 1.25,
                    radius: 8,
                    kind: m.kind === 'white_lady' ? 'salt' : m.kind === 'corrupted_priest' ? 'curse' : 'energy',
                  });
                } else {
                  hurtPlayer(Math.round(m.atk * nightBoost), m.x, m.isFlying ? 'Swoop Strike' : '', isFolklore, {
                    attackerMob: m,
                  });
                }
              }
            } else if (speed > 0) {
              const patrolTarget = m.homeX + Math.sin(elapsed * 0.9 + m.homeX * 0.01) * 58;
              const pd = patrolTarget - m.x;
              if (Math.abs(pd) > 4) {
                m.facing = pd >= 0 ? 1 : -1;
                m.x += Math.sign(pd) * 44 * dt;
                m.walkPhase += dt * 4.5;
              }
            }
            m.x = Math.max(84, Math.min(zone.width - 84, m.x));
          }

          // Update BOTH Unique Town Bosses (Vice Mayor & Mayor) — Tactical Telegraph + Weak-Spot Recovery!
          for (const b of townBosses) {
            if (b.defeated) continue;
            b.hurtFlash = Math.max(0, b.hurtFlash - dt);
            b.atkCooldown = Math.max(0, b.atkCooldown - dt);
            b.slashTimer = Math.max(0, b.slashTimer - dt);
            b.weakSpotTimer = Math.max(0, b.weakSpotTimer - dt);
            b.recoveryTimer = Math.max(0, b.recoveryTimer - dt);
            b.defShredTimer = Math.max(0, b.defShredTimer - dt);
            if (b.bleedTimer > 0) {
              b.bleedTimer -= dt;
              b.bleedTick -= dt;
              if (b.bleedTick <= 0) {
                b.bleedTick = 0.8;
                damageTownBoss(b, Math.max(6, Math.round(st.atk * 0.36 * (st.magicPowerMult || 1))), b.x, false, '#C084FC');
                if (b.defeated) continue;
              }
            }
            if (b.stunTimer > 0) {
              b.stunTimer = Math.max(0, b.stunTimer - dt);
              b.telegraphTimer = 0;
              b.telegraphLabel = '';
              b.activeSkill = null;
              b.skillPhase = 'none';
              continue;
            }

            const dist = player.x - b.x;
            if (Math.abs(dist) < 440) {
              if (!bossMusicActive && prog.bgmEnabled) {
                bossMusicActive = true;
                noirAudio.playBgm('boss_battle');
              }
              if (!b.quoteShown) {
                b.quoteShown = true;
                showBanner(b.profile.name, b.quote, 4.4);
                if (prog.voiceEnabled) {
                  englishVoice.speak(b.quote, {
                    pitch: b.profile.gender === 'female' ? 1.22 : 0.84,
                    rate: 0.98,
                    style: b.profile.gender === 'female' ? 'boss_female' : 'boss_male',
                  });
                }
              }

              // Signature unique Town Boss skill kit (Vice Mayor Ledger Chain / Seal Shockwave, Mayor Decree Beam / Cash Barrage)
              if (
                b.telegraphTimer <= 0 &&
                b.recoveryTimer <= 0 &&
                stepUniqueSkill(b, b.role.toLowerCase(), b.role.toLowerCase(), b.atk, false, dt)
              ) {
                continue;
              }

              // Execute telegraphed heavy strike!
              if (b.telegraphTimer > 0) {
                b.telegraphTimer -= dt;
                if (b.telegraphTimer <= 0) {
                  const label = b.telegraphLabel;
                  b.telegraphLabel = '';
                  b.slashTimer = 0.36;
                  b.recoveryTimer = 1.25; // Flank behind during recovery to expose Weak Spot!
                  b.atkCooldown = b.role === 'MAYOR' ? 1.85 : 2.1;
                  if (label === 'HEAVY SLAM') {
                    screenShake = Math.max(screenShake, 7);
                    spawnDust(b.x + b.facing * 26, 0, 8, '#F4C542');
                    if (Math.abs(player.x - b.x) <= 108 && Math.abs(player.y) < 56) {
                      hurtPlayer(Math.round(b.atk * 1.28), b.x, 'Heavy Slam');
                    }
                  } else {
                    spawnProj({
                      x: b.x + b.facing * 26,
                      y: -36,
                      vx: b.facing * 355,
                      fromPlayer: false,
                      damage: Math.round(b.atk * 0.92),
                      color: b.role === 'MAYOR' ? '#D63A3A' : '#F4C542',
                      life: 1.5,
                      radius: 12,
                      kind: 'bribe',
                    });
                  }
                }
                continue;
              }

              if (b.recoveryTimer <= 0) {
                b.facing = dist >= 0 ? 1 : -1;
                if (Math.abs(dist) > 76) {
                  b.x += b.facing * (b.role === 'MAYOR' ? 114 : 104) * awSpdMult * dt;
                  b.walkPhase += dt * 8 * awSpdMult;
                }
              }
              if (b.atkCooldown <= 0 && b.recoveryTimer <= 0) {
                if (Math.abs(dist) <= 92 && Math.abs(player.y) < 54) {
                  b.telegraphTimer = 0.56;
                  b.telegraphLabel = 'HEAVY SLAM';
                } else if (Math.abs(dist) < 380) {
                  b.telegraphTimer = 0.52;
                  b.telegraphLabel = 'BRIBE BARRAGE';
                }
              }
            }
          }

          // Update AWAKENED-MODE EXCLUSIVE BOSSES (Corrupt Barangay Captain & Corrupt Congressman!)
          for (const ab of awakenedBosses) {
            if (ab.defeated) continue;
            ab.hurtFlash = Math.max(0, ab.hurtFlash - dt);
            ab.atkCooldown = Math.max(0, ab.atkCooldown - dt);
            ab.slashTimer = Math.max(0, ab.slashTimer - dt);
            ab.weakSpotTimer = Math.max(0, ab.weakSpotTimer - dt);
            ab.recoveryTimer = Math.max(0, ab.recoveryTimer - dt);
            ab.defShredTimer = Math.max(0, ab.defShredTimer - dt);
            if (ab.bleedTimer > 0) {
              ab.bleedTimer -= dt;
              ab.bleedTick -= dt;
              if (ab.bleedTick <= 0) {
                ab.bleedTick = 0.8;
                damageAwakenedBoss(ab, Math.max(8, Math.round(st.atk * 0.4 * (st.magicPowerMult || 1))), ab.x, false, '#C084FC');
                if (ab.defeated) continue;
              }
            }
            if (ab.stunTimer > 0) {
              ab.stunTimer = Math.max(0, ab.stunTimer - dt);
              ab.aimTimer = 0;
              ab.telegraphLabel = '';
              ab.activeSkill = null;
              ab.skillPhase = 'none';
              continue;
            }
            if (ab.shieldHp <= 0) {
              ab.shieldRegenTimer -= dt;
              if (ab.shieldRegenTimer <= 0) {
                ab.shieldHp = Math.round(ab.shieldMax * 0.65);
                addFloatingText(ab.x, -144, 'SHIELD RECHARGED! PRESS [L]!', '#38BDF8');
              }
            }

            const dist = player.x - ab.x;
            if (Math.abs(dist) < 520) {
              if (!bossMusicActive && prog.bgmEnabled) {
                bossMusicActive = true;
                noirAudio.playBgm('boss_battle');
              }
              if (!ab.quoteShown) {
                ab.quoteShown = true;
                showBanner(ab.def.name, ab.def.introQuote, 5.2);
                if (prog.voiceEnabled) {
                  englishVoice.speak(ab.def.introQuote, { pitch: 0.8, rate: 0.96, style: 'boss_male' });
                }
              }
              if (ab.recoveryTimer <= 0) {
                ab.facing = dist >= 0 ? 1 : -1;
              }

              // Signature Awakened Boss skills (Barangay Captain Rally/Laser, Congressman Gavel Slam/Pork Barrel Barrage)
              if (
                ab.aimTimer <= 0 &&
                ab.recoveryTimer <= 0 &&
                stepUniqueSkill(ab, ab.def.id, ab.def.id, ab.atk, false, dt)
              ) {
                continue;
              }

              // Laser-Aimed Rifle / Pistol Telegraph!
              if (ab.aimTimer > 0) {
                ab.aimTimer -= dt;
                ab.telegraphLabel = 'GUNFIRE · DEFLECT [K]';
                if (ab.aimTimer <= 0) {
                  ab.telegraphLabel = '';
                  ab.slashTimer = 0.28;
                  ab.recoveryTimer = 1.15;
                  ab.atkCooldown = ab.def.id === 'awakened_congressman' ? 1.85 : 2.15;
                  noirAudio.playGunshot();
                  const burstCount = ab.def.id === 'awakened_congressman' ? 2 : 1;
                  for (let k = 0; k < burstCount; k++) {
                    spawnProj({
                      x: ab.x + ab.facing * (30 + k * 24),
                      y: -48 + k * 8,
                      vx: ab.facing * (560 + k * 55),
                      fromPlayer: false,
                      damage: Math.round(ab.atk * 0.95),
                      color: '#FBBF24',
                      life: 1.4,
                      radius: 7,
                      isBullet: true,
                      kind: 'bullet',
                    });
                  }
                }
                continue;
              }

              if (ab.recoveryTimer <= 0 && Math.abs(dist) > 130) {
                ab.x += ab.facing * 124 * dt;
                ab.walkPhase += dt * 8.5;
              }
              if (ab.atkCooldown <= 0 && ab.recoveryTimer <= 0) {
                if (Math.abs(dist) <= 95 && Math.abs(player.y) < 58) {
                  ab.slashTimer = 0.34;
                  ab.recoveryTimer = 1.15;
                  ab.atkCooldown = 1.4;
                  hurtPlayer(ab.atk, ab.x, 'Riot Bash');
                } else {
                  ab.aimTimer = 0.85;
                  ab.telegraphLabel = 'GUNFIRE · DEFLECT [K]';
                }
              }
            }
          }

          // Update El Mastermind Overworld Presence & 2-Phase True Boss Fight
          if (elMastermind && !elMastermind.defeated) {
            elMastermind.hurtFlash = Math.max(0, elMastermind.hurtFlash - dt);
            elMastermind.atkCooldown = Math.max(0, elMastermind.atkCooldown - dt);
            elMastermind.slashTimer = Math.max(0, elMastermind.slashTimer - dt);
            elMastermind.eyeFlashTimer = Math.max(0, elMastermind.eyeFlashTimer - dt);
            elMastermind.weakSpotTimer = Math.max(0, elMastermind.weakSpotTimer - dt);
            elMastermind.recoveryTimer = Math.max(0, elMastermind.recoveryTimer - dt);
            elMastermind.defShredTimer = Math.max(0, elMastermind.defShredTimer - dt);
            if (elMastermind.bleedTimer > 0 && elMastermind.fightActive) {
              elMastermind.bleedTimer -= dt;
              elMastermind.bleedTick -= dt;
              if (elMastermind.bleedTick <= 0) {
                elMastermind.bleedTick = 0.85;
                attackElMastermind(Math.max(8, Math.round(st.atk * 0.4 * (st.magicPowerMult || 1))), elMastermind.x);
              }
            }
            if (elMastermind.recoveryTimer <= 0) {
              elMastermind.facing = player.x >= elMastermind.x ? 1 : -1;
            }

            if (elMastermind.fightActive && !elMastermind.defeated) {
              const dist = player.x - elMastermind.x;
              const mmSkillBusy =
                elMastermind.telegraphTimer <= 0 &&
                elMastermind.recoveryTimer <= 0 &&
                stepUniqueSkill(
                  elMastermind,
                  'boss_el_mastermind',
                  'boss_el_mastermind',
                  elMastermind.atk,
                  false,
                  dt
                );

              if (mmSkillBusy) {
                // El Mastermind is channeling Sovereign Lightning or Summoning The Gracias Nomar!
              } else if (elMastermind.telegraphTimer > 0) {
                elMastermind.telegraphTimer -= dt;
                if (elMastermind.telegraphTimer <= 0) {
                  const lbl = elMastermind.telegraphLabel;
                  elMastermind.telegraphLabel = '';
                  elMastermind.slashTimer = 0.34;
                  elMastermind.recoveryTimer = 1.1;
                  elMastermind.atkCooldown = elMastermind.phase === 2 ? 1.35 : 1.85;
                  if (lbl === 'LASER VOLLEY') {
                    elMastermind.eyeFlashTimer = 0.4;
                    spawnProj({
                      x: elMastermind.x + elMastermind.facing * 26,
                      y: -52,
                      vx: elMastermind.facing * 455,
                      fromPlayer: false,
                      damage: Math.round(elMastermind.atk * 0.98),
                      color: '#FF2A2A',
                      life: 1.5,
                      radius: 15,
                      isLaser: true,
                      kind: 'laser',
                    });
                  } else if (lbl === 'SYNDICATE CANE') {
                    if (Math.abs(player.x - elMastermind.x) <= 108 && Math.abs(player.y) < 60) {
                      hurtPlayer(Math.round(elMastermind.atk * 1.15), elMastermind.x, 'Gold Cane');
                    }
                  } else {
                    spawnProj({
                      x: elMastermind.x + elMastermind.facing * 26,
                      y: -36,
                      vx: elMastermind.facing * 365,
                      fromPlayer: false,
                      damage: Math.round(elMastermind.atk * 0.85),
                      color: '#F4C542',
                      life: 1.5,
                      radius: 13,
                      kind: 'bribe',
                    });
                  }
                }
              } else {
                if (elMastermind.recoveryTimer <= 0 && Math.abs(dist) > 84) {
                  elMastermind.x += elMastermind.facing * (elMastermind.phase === 2 ? 146 : 118) * awSpdMult * dt;
                  elMastermind.walkPhase += dt * 8.5;
                }
                // Phase 1 & 2 Shadow Henchmen Summoning
                elMastermind.summonTimer -= dt;
                if (elMastermind.summonTimer <= 0 && mobs.filter((m) => !m.dead).length < 6) {
                  elMastermind.summonTimer = elMastermind.phase === 2 ? 6.5 : 9.0;
                  const sx = Math.max(120, Math.min(zone.width - 120, elMastermind.x + (Math.random() > 0.5 ? 110 : -110)));
                  const summonSoldier = elMastermind.phase === 2 || awLevel >= 1;
                  mobs.push({
                    id: `mm_hench_${Date.now()}`,
                    name: summonSoldier ? 'Corrupted Soldier' : 'Syndicate Enforcer',
                    kind: summonSoldier ? 'corrupt_soldier' : 'corrupt_politician',
                    x: sx,
                    homeX: sx,
                    y: 0,
                    isFlying: false,
                    hoverBaseY: 0,
                    swoopTimer: 0,
                    facing: -1,
                    hp: Math.round(110 * awHpMult),
                    maxHp: Math.round(110 * awHpMult),
                    atk: Math.round(15 * awAtkMult),
                    level: 6,
                    walkPhase: 0,
                    atkCooldown: 1.0,
                    hurtFlash: 0,
                    slashTimer: 0,
                    stunTimer: 0,
                    dead: false,
                    respawnTimer: 999,
                    stolenPesos: 0,
                    shieldHp: summonSoldier ? 55 : 0,
                    shieldMax: summonSoldier ? 55 : 0,
                    usesGun: summonSoldier,
                    aimTimer: 0,
                    guardTimer: 0,
                    telegraphTimer: 0,
                    bleedTimer: 0,
                    bleedTick: 0,
                    defShredTimer: 0,
                    rallyBuffTimer: 0,
                    weakSpotTimer: 0,
                    ...createSkillState(),
                  });
                  addFloatingText(sx, -88, summonSoldier ? 'CORRUPTED SOLDIER!' : 'SHADOW HENCHMAN!', '#FCA5A5');
                }

                if (elMastermind.atkCooldown <= 0 && elMastermind.recoveryTimer <= 0) {
                  if (Math.abs(dist) <= 92 && Math.abs(player.y) < 58) {
                    elMastermind.telegraphTimer = 0.5;
                    elMastermind.telegraphLabel = 'SYNDICATE CANE';
                  } else {
                    elMastermind.telegraphTimer = 0.55;
                    elMastermind.telegraphLabel = elMastermind.phase === 2 ? 'LASER VOLLEY' : 'BRIBE ORB';
                  }
                }
              }
            }
          }

          // Projectiles + Dynamic Trails + Impact Bursts + Micro Hit-Stop + Payong Shield Deflection!
          for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (p.gravityY) {
              p.vy += p.gravityY * dt;
            }
            updateProjectile(p, dt);
            let hit = false;

            if (p.fromPlayer) {
              if (zone.hasPracticeDummy && zone.dummyX && Math.abs(p.x - zone.dummyX) < 32) {
                dummyRecoil = 1;
                hit = true;
                spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                addFloatingText(zone.dummyX, -78, `${p.damage}`, '#F4C542');
                callbacksRef.current.onDummyHit();
              }
              for (const m of mobs) {
                const verticalHit = Math.abs(p.y - (m.y - 36)) < (m.isFlying ? 58 : 66);
                if (!m.dead && Math.abs(p.x - m.x) < 28 + p.radius * 0.5 && verticalHit) {
                  if (p.isTiradorAmmo === 'agimat') {
                    m.stunTimer = Math.max(m.stunTimer, 1.55);
                    if (m.skillPhase === 'windup') {
                      m.activeSkill = null;
                      m.skillPhase = 'none';
                      m.weakSpotTimer = 2.6;
                      addFloatingText(m.x, m.y - 126, 'AGIMAT INTERRUPT! 2.4×!', '#FDE047');
                    }
                  } else if (p.isTiradorAmmo === 'sili') {
                    m.bleedTimer = Math.max(m.bleedTimer, 2.8);
                    if (m.shieldHp > 0) {
                      m.shieldHp = 0;
                      noirAudio.playShieldBreak();
                      addFloatingText(m.x, m.y - 118, 'SILI SHIELD SHATTER!', '#FB923C');
                      callbacksRef.current.onShieldBroken();
                    }
                    // Fiery Sili Bomb splash damage to adjacent enemies
                    for (const near of mobs) {
                      if (!near.dead && near.id !== m.id && Math.abs(near.x - p.x) < 88) {
                        damageMob(near, Math.round(p.damage * 0.55), p.x, '#FB923C', 1.4);
                      }
                    }
                  }
                  damageMob(
                    m,
                    p.damage,
                    p.x,
                    p.isInkWave ? '#5EEAD4' : p.isTiradorAmmo === 'sili' ? '#FB923C' : undefined,
                    p.isMegaphone ? 2.6 : 1
                  );
                  spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                  screenShake = Math.max(screenShake, p.kind === 'sili' ? 6.5 : 2.6);
                  if (!pendingInstantDeathDialogue) {
                    freezeFrameTimer = Math.max(freezeFrameTimer, p.kind === 'sili' ? 0.032 : 0.018);
                  }
                  if (!p.isInkWave) {
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit) {
                for (const b of townBosses) {
                  if (!b.defeated && Math.abs(p.x - b.x) < 38) {
                    if (p.deflected) {
                      b.weakSpotTimer = 3.0;
                      b.stunTimer = Math.max(b.stunTimer, 1.3);
                      addFloatingText(b.x, -138, 'DEFLECT STUN · WEAK SPOT 2×!', '#FDE047');
                    } else if (p.isTiradorAmmo === 'agimat' && b.skillPhase === 'windup') {
                      b.activeSkill = null;
                      b.skillPhase = 'none';
                      b.weakSpotTimer = 2.6;
                      addFloatingText(b.x, -142, 'AGIMAT INTERRUPT! 2.4×!', '#FDE047');
                    }
                    damageTownBoss(b, p.damage, p.x, Boolean(p.isMegaphone));
                    spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                    screenShake = Math.max(screenShake, p.kind === 'sili' ? 6.5 : 3.0);
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit) {
                for (const ab of awakenedBosses) {
                  if (!ab.defeated && Math.abs(p.x - ab.x) < 42) {
                    if (p.deflected) {
                      ab.weakSpotTimer = 3.2;
                      ab.stunTimer = Math.max(ab.stunTimer, 1.5);
                      addFloatingText(ab.x, -156, 'DEFLECT STUN · WEAK SPOT 2×!', '#FDE047');
                    } else if (p.isTiradorAmmo === 'agimat' && ab.skillPhase === 'windup') {
                      ab.activeSkill = null;
                      ab.skillPhase = 'none';
                      ab.weakSpotTimer = 2.6;
                      addFloatingText(ab.x, -156, 'AGIMAT INTERRUPT! 2.4×!', '#FDE047');
                    }
                    damageAwakenedBoss(ab, p.damage, p.x, Boolean(p.isMegaphone));
                    spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                    screenShake = Math.max(screenShake, p.kind === 'sili' ? 6.5 : 3.2);
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit && elMastermind && !elMastermind.defeated && Math.abs(p.x - elMastermind.x) < 42) {
                if (p.deflected && elMastermind.fightActive) {
                  elMastermind.weakSpotTimer = 2.8;
                  addFloatingText(elMastermind.x, -162, 'DEFLECT COUNTER · WEAK SPOT 2×!', '#FDE047');
                }
                attackElMastermind(p.damage, p.x, Boolean(p.isMegaphone));
                spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                screenShake = Math.max(screenShake, 3.2);
                hit = true;
              }
              if (!hit && graciasNomar && !graciasNomar.defeated && Math.abs(p.x - graciasNomar.x) < 38) {
                damageGraciasNomar(p.damage, p.x, undefined, Boolean(p.isMegaphone));
                spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                screenShake = Math.max(screenShake, 3.0);
                hit = true;
              }
            } else {
              const shieldUp = player.shieldHold || player.shieldTimer > 0;
              if (
                checkProjectileShieldDeflection(p, {
                  x: player.x,
                  y: player.y,
                  shieldActive: shieldUp,
                })
              ) {
                // SHIELD-DEFLECTION EVENT FOR reflectable: true PROJECTILES!
                const hasSable = progressRef.current.equippedWeaponId === 'wpn_sable_luna';
                const deflectMult = p.isBullet ? (hasSable ? 2.5 : 2.0) : 1.75;
                p.fromPlayer = true;
                p.deflected = true;
                p.vx = -p.vx * 1.32;
                p.damage = Math.round(p.damage * deflectMult);
                p.color = '#7DD3FC';
                p.kind = 'energy';
                p.life = 1.25;
                spawnImpactBurst(impactBursts, p.x, p.y, 'energy');
                spawnDust(player.x + player.facing * 24, player.y - 38, 6, '#7DD3FC');
                if (p.isBullet) {
                  noirAudio.playRicochet();
                  addFloatingText(player.x, player.y - 92, 'BULLET DEFLECTED!', '#5EEAD4');
                  callbacksRef.current.onBulletDeflected();
                } else {
                  noirAudio.playUmbrellaBlock();
                  addFloatingText(player.x, player.y - 84, 'SHIELD DEFLECTED!', '#7DD3FC');
                }
              } else if (Math.abs(p.x - player.x) < 24 && Math.abs(p.y - (player.y - 38)) < 42) {
                hurtPlayer(
                  p.damage,
                  p.x,
                  p.isBullet ? 'Gunshot' : p.isLaser ? 'Eyepatch Laser' : 'Hit',
                  false,
                  { status: p.appliesStatus }
                );
                spawnImpactBurst(impactBursts, p.x, p.y, p.kind);
                hit = true;
              }
            }

            if (hit || p.life <= 0 || p.x < cameraX - 240 || p.x > cameraX + viewW + 240 || p.y > 16) {
              projectiles.splice(i, 1);
            }
          }

          // Update THE GRACIAS NOMAR (El Mastermind Phase 2 Summon AI: Portal -> Shadow Blitz -> Crimson Barrier Counter)
          if (graciasNomar && !graciasNomar.defeated) {
            graciasNomar.hurtFlash = Math.max(0, graciasNomar.hurtFlash - dt);
            graciasNomar.atkCooldown = Math.max(0, graciasNomar.atkCooldown - dt);
            graciasNomar.stateTimer = Math.max(0, graciasNomar.stateTimer - dt);
            graciasNomar.weakSpotTimer = Math.max(0, graciasNomar.weakSpotTimer - dt);

            const dxToPlayer = player.x - graciasNomar.x;
            if (graciasNomar.state === 'portal') {
              if (graciasNomar.stateTimer <= 0) {
                graciasNomar.state = 'idle';
                graciasNomar.stateDuration = 1;
              }
            } else if (graciasNomar.state === 'blitz') {
              graciasNomar.x += graciasNomar.facing * 315 * awSpdMult * dt;
              graciasNomar.x = Math.max(90, Math.min(zone.width - 90, graciasNomar.x));
              if (!graciasNomar.didStrikeThisBlitz && Math.abs(player.x - graciasNomar.x) < 76 && Math.abs(player.y) < 58) {
                graciasNomar.didStrikeThisBlitz = true;
                hurtPlayer(graciasNomar.atk, graciasNomar.x, 'Crimson Slash', false, { status: 'bleed' });
              }
              if (graciasNomar.stateTimer <= 0) {
                graciasNomar.state = 'idle';
                graciasNomar.atkCooldown = 1.45;
              }
            } else if (graciasNomar.state === 'counter') {
              if (graciasNomar.stateTimer <= 0) {
                graciasNomar.state = 'idle';
                graciasNomar.atkCooldown = 1.3;
              }
            } else if (!stepUniqueSkill(graciasNomar, 'the_gracias_nomar', 'the_gracias_nomar', graciasNomar.atk, false, dt)) {
              graciasNomar.facing = dxToPlayer >= 0 ? 1 : -1;
              if (Math.abs(dxToPlayer) > 125) {
                graciasNomar.x += graciasNomar.facing * 155 * awSpdMult * dt;
              }
              if (graciasNomar.atkCooldown <= 0) {
                if (Math.abs(dxToPlayer) < 110 && Math.random() < 0.35) {
                  graciasNomar.state = 'counter';
                  graciasNomar.stateDuration = 0.95;
                  graciasNomar.stateTimer = 0.95;
                  addFloatingText(graciasNomar.x, -112, 'CRIMSON BARRIER!', '#F87171');
                } else {
                  graciasNomar.state = 'blitz';
                  graciasNomar.stateDuration = 0.65;
                  graciasNomar.stateTimer = 0.65;
                  graciasNomar.didStrikeThisBlitz = false;
                  addFloatingText(graciasNomar.x, -112, 'SHADOW BLITZ!', '#EF4444');
                }
              }
            }
          }

          // Foreground Highway Vehicles — Purely Atmospheric Props (Zero Collision Damage!)
          for (const v of vehicles) {
            v.x += v.dir * v.speed * dt;
            if (v.x < -320) v.x = zone.width + 300;
            if (v.x > zone.width + 320) v.x = -300;
          }

          for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
          }

          // Smooth Camera Look-Ahead!
          const lookAhead = player.facing * 62;
          const targetCam = Math.max(
            0,
            Math.min(Math.max(0, zone.width - viewW), player.x + lookAhead - viewW * 0.48)
          );
          cameraX += (targetCam - cameraX) * Math.min(1, dt * 7.5);
        }
      }

      // ================= RENDER PASS (SMOOTH ILLUSTRATED HD) =================
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (screenShake > 0.2) {
        ctx.translate(Math.floor((Math.random() - 0.5) * screenShake), Math.floor((Math.random() - 0.5) * screenShake));
      }

      drawNoirBackdrop(ctx, viewW, viewH, groundY, cameraX, zone, elapsed, timeOfDay);
      atmosphere.renderLivingBackdrop(ctx, viewW, viewH, cameraX, groundY, nightNow, elapsed);
      ambientLife.render(ctx, viewW, cameraX, groundY, nightNow, elapsed);
      drawStreetLanterns(ctx, viewW, groundY, cameraX, zone, elapsed, timeOfDay);

      if (zone.houseId && zone.houseX) {
        const house = HOUSES.find((h) => h.id === zone.houseId);
        if (house) {
          drawTownHouseFacade(
            ctx,
            zone.houseX - cameraX,
            groundY,
            house,
            prog.ownedHouseIds.includes(house.id),
            elapsed,
            Math.abs(player.x - zone.houseX)
          );
        }
      }

      if (zone.hasDambanaShrine && zone.dambanaShrineX) {
        drawDambanaShrine(
          ctx,
          zone.dambanaShrineX - cameraX,
          groundY,
          prog.hasDambanaBadge,
          elapsed,
          Math.abs(player.x - zone.dambanaShrineX)
        );
      }

      if (zone.animals) {
        for (const a of zone.animals) {
          const ax = a.x - cameraX;
          if (ax > -90 && ax < viewW + 90) {
            drawAmbientAnimal(ctx, ax, groundY, a.kind, elapsed);
          }
        }
      }

      drawHearthAndDummy(ctx, cameraX, groundY, zone, dummyRecoil, elapsed, player.x);

      for (const p of zone.portals) {
        drawPortalArch(ctx, p.x - cameraX, groundY, p.label, elapsed, Math.abs(player.x - p.x));
      }

      for (const b of townBosses) {
        drawBossArenaCrest(ctx, b.homeX - cameraX, groundY, b.defeated, elapsed);
      }

      // STATIC WORLD BUILDINGS LAYER (Bunkers, Guardhouses, Broadcast Rigs, Hubs & Stalls stay permanently anchored!)
      drawWorldBuildings(ctx, staticWorldBuildings, cameraX, viewW, groundY, elapsed);

      // FISHING SPOTS, GATHERABLE FILIPINO PLANTS, MINEABLE CAVE ORES & SIDE-JOB DROPOFF BEACON
      if (zone.fishingSpots) {
        for (const spot of zone.fishingSpots) {
          const sx = spot.x - cameraX;
          if (sx > -140 && sx < viewW + 140) {
            drawFishingSpot(ctx, sx, groundY, spot.label, elapsed, Math.abs(player.x - spot.x));
          }
        }
      }
      if (zone.gatherNodes) {
        for (const node of zone.gatherNodes) {
          const sx = node.x - cameraX;
          if (sx > -100 && sx < viewW + 100) {
            drawGatherNode(
              ctx,
              sx,
              groundY,
              node.itemId,
              (gatherRespawns[node.id] || 0) > 0,
              elapsed,
              Math.abs(player.x - node.x)
            );
          }
        }
      }
      if (zone.oreNodes) {
        for (const ore of zone.oreNodes) {
          const sx = ore.x - cameraX;
          if (sx > -120 && sx < viewW + 120) {
            drawOreNode(
              ctx,
              sx,
              groundY,
              ore.oreId,
              (oreRespawns[ore.id] || 0) > 0,
              elapsed,
              Math.abs(player.x - ore.x)
            );
          }
        }
      }
      if (activeSideJobRef.current && activeSideJobRef.current.targetZoneId === zone.id) {
        const bx = activeSideJobRef.current.targetX - cameraX;
        if (bx > -150 && bx < viewW + 150) {
          drawSideJobBeacon(ctx, bx, groundY, activeSideJobRef.current.targetLabel, activeSideJobRef.current.kind, elapsed);
        }
      }

      const nearest = findNearestTarget();
      for (const npc of zone.npcs) {
        const nx = getNpcX(npc);
        const sx = nx - cameraX;
        if (sx < -160 || sx > viewW + 160) continue;
        drawWorldNpc(
          ctx,
          sx,
          groundY,
          player.x >= nx ? 1 : -1,
          npc.npcVisual,
          npc.coatColor,
          npc.accentColor,
          npc.hairColor,
          elapsed
        );
        const npcDist = Math.abs(player.x - nx);
        const isNearestNpc = nearest?.kind === 'npc' && nearest.id === npc.id;
        if (isNearestNpc) {
          drawEntityNameplate(ctx, sx, groundY - (npc.isAspin ? 70 : 120), npc.name, npc.title, true);
        } else if (npcDist < 235) {
          const alpha = Math.max(0.18, Math.min(0.9, (235 - npcDist) / 115));
          drawEntityNameplate(ctx, sx, groundY - (npc.isAspin ? 66 : 114), npc.name, undefined, false, {
            compact: true,
            alpha,
          });
        }
      }

      // Dust Puffs & Hit Sparks
      for (const dp of dustParticles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, dp.life / dp.maxLife) * 0.85;
        ctx.fillStyle = dp.color;
        ctx.fillRect(Math.floor(dp.x - cameraX), Math.floor(groundY + dp.y), dp.size, dp.size);
        ctx.restore();
      }

      // Spectral National Hero Ghost Manifestation!
      if (activeGhost) {
        const gx = activeGhost.x - cameraX;
        if (gx > -180 && gx < viewW + 180) {
          drawSpectralHeroGhost(
            ctx,
            activeGhost.def,
            gx,
            groundY,
            elapsed,
            prog.metHeroGhostIds.includes(activeGhost.def.id),
            Math.abs(player.x - activeGhost.x)
          );
        }
      }

      // Enemies (HD v2 Sprites + Tactical Guard, Riot Shields & Laser Aim Telegraphs!)
      for (let mIdx = 0; mIdx < mobs.length; mIdx++) {
        const m = mobs[mIdx];
        if (m.dead) continue;
        const sx = m.x - cameraX;
        if (sx < -130 || sx > viewW + 130) continue;
        drawEnemySprite(ctx, sx, groundY, m.kind, m.facing, m.walkPhase, m.hurtFlash, elapsed, mIdx, {
          attacking: m.slashTimer > 0 || m.aimTimer > 0 || m.skillPhase === 'active',
          stunned: m.stunTimer > 0,
          guarding: m.guardTimer > 0,
          telegraphing: m.telegraphTimer > 0 || m.aimTimer > 0 || m.skillPhase === 'windup',
          altitudeY: m.isFlying ? m.y : undefined,
          stolenPesos: m.stolenPesos,
        });

        if (m.rallyBuffTimer > 0) {
          drawRallyBuffAura(ctx, sx, groundY, elapsed);
        }
        if (m.activeSkill && m.skillPhase !== 'none') {
          const dur = m.skillPhase === 'windup' ? m.activeSkill.windupSec : m.activeSkill.activeSec;
          drawEnemySkillEffect(ctx, {
            visualKind: m.activeSkill.visualKind,
            casterX: sx,
            targetX: m.skillTargetX - cameraX,
            groundY,
            facing: m.facing,
            phase: m.skillPhase,
            progress01: 1 - m.skillTimer / Math.max(0.01, dur),
            unblockable: m.activeSkill.unblockable,
            reflectable: m.activeSkill.reflectable,
            warningCue: m.activeSkill.warningCue,
            time: elapsed,
          });
        }

        // Tactical Riot Shield Aura
        if (m.shieldHp > 0) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(sx, groundY - 46, 36, 48, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Laser Aim Telegraph for Armed Corrupted Police / Soldiers!
        if (m.aimTimer > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 42, 42, ${0.55 + Math.sin(elapsed * 26) * 0.35})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(sx + m.facing * 24, groundY - 48);
          ctx.lineTo(sx + m.facing * 360, groundY - 48);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#FF2A2A';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('AIMING · BLOCK [K]', sx, groundY - 124);
          ctx.restore();
        }

        const ratio = Math.max(0, m.hp / m.maxHp);
        const barY =
          (m.kind === 'asong_ulol' || m.kind === 'cobra' ? groundY - 76 : groundY - 112) +
          (m.isFlying ? m.y : 0);
        ctx.fillStyle = '#0B1520';
        ctx.fillRect(Math.floor(sx - 26), barY, 52, 7);
        ctx.fillStyle = m.stunTimer > 0 ? '#38BDF8' : m.weakSpotTimer > 0 ? '#FDE047' : '#D63A3A';
        ctx.fillRect(Math.floor(sx - 25), barY + 1, Math.floor(50 * ratio), 5);
        if (m.shieldMax > 0 && m.shieldHp > 0) {
          ctx.fillStyle = '#0B1520';
          ctx.fillRect(Math.floor(sx - 26), barY - 6, 52, 5);
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(Math.floor(sx - 25), barY - 5, Math.floor(50 * (m.shieldHp / m.shieldMax)), 3);
        }
      }

      // BOTH Unique Procedural Town Bosses (Vice Mayor + Mayor — Oversized Neo Geo Scale)
      for (const b of townBosses) {
        if (b.defeated) continue;
        const bx = b.x - cameraX;
        if (bx < -150 || bx > viewW + 150) continue;
        drawUniqueTownBoss(
          ctx,
          b.profile,
          bx,
          groundY,
          b.facing,
          b.walkPhase,
          b.hurtFlash,
          b.slashTimer > 0 ? 1 - b.slashTimer / 0.34 : 0,
          elapsed,
          {
            weakSpotActive: b.weakSpotTimer > 0,
            telegraphLabel: b.telegraphLabel || undefined,
            stunned: b.stunTimer > 0,
          }
        );
        if (b.activeSkill && b.skillPhase !== 'none') {
          const dur = b.skillPhase === 'windup' ? b.activeSkill.windupSec : b.activeSkill.activeSec;
          drawEnemySkillEffect(ctx, {
            visualKind: b.activeSkill.visualKind,
            casterX: bx,
            targetX: b.skillTargetX - cameraX,
            groundY,
            facing: b.facing,
            phase: b.skillPhase,
            progress01: 1 - b.skillTimer / Math.max(0.01, dur),
            unblockable: b.activeSkill.unblockable,
            reflectable: b.activeSkill.reflectable,
            warningCue: b.activeSkill.warningCue,
            time: elapsed,
          });
        }
        if (b.shieldHp > 0) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.ellipse(bx, groundY - 60, 50, 68, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        const bossDist = Math.abs(player.x - b.x);
        if (bossDist < 480) {
          drawEntityNameplate(
            ctx,
            bx,
            groundY - 144,
            b.profile.name,
            b.weakSpotTimer > 0
              ? 'WEAK SPOT EXPOSED · 2.4× DMG!'
              : b.shieldHp > 0
                ? 'SHIELDED · PRESS [L] TO SHATTER'
                : `Drops: ${b.profile.dropName}`,
            true,
            { compact: bossDist > 340, alpha: Math.min(1, (480 - bossDist) / 110) }
          );
        }
      }

      // AWAKENED-MODE EXCLUSIVE BOSSES (Corrupt Barangay Captain & Corrupt Congressman!)
      for (const ab of awakenedBosses) {
        if (ab.defeated) continue;
        const ax = ab.x - cameraX;
        if (ax < -180 || ax > viewW + 180) continue;
        drawAwakenedBoss(
          ctx,
          ab.def,
          ax,
          groundY,
          ab.facing,
          ab.walkPhase,
          ab.hurtFlash,
          ab.slashTimer > 0 ? 1 - ab.slashTimer / 0.34 : 0,
          elapsed,
          {
            shieldHp: ab.shieldHp,
            shieldMax: ab.shieldMax,
            aiming: ab.aimTimer > 0,
            weakSpotActive: ab.weakSpotTimer > 0,
            telegraphLabel: ab.telegraphLabel || undefined,
            stunned: ab.stunTimer > 0,
          }
        );
        if (ab.activeSkill && ab.skillPhase !== 'none') {
          const dur = ab.skillPhase === 'windup' ? ab.activeSkill.windupSec : ab.activeSkill.activeSec;
          drawEnemySkillEffect(ctx, {
            visualKind: ab.activeSkill.visualKind,
            casterX: ax,
            targetX: ab.skillTargetX - cameraX,
            groundY,
            facing: ab.facing,
            phase: ab.skillPhase,
            progress01: 1 - ab.skillTimer / Math.max(0.01, dur),
            unblockable: ab.activeSkill.unblockable,
            reflectable: ab.activeSkill.reflectable,
            warningCue: ab.activeSkill.warningCue,
            time: elapsed,
          });
        }
        const abDist = Math.abs(player.x - ab.x);
        if (abDist < 500) {
          drawEntityNameplate(
            ctx,
            ax,
            groundY - 166,
            ab.def.name,
            ab.weakSpotTimer > 0
              ? 'WEAK SPOT EXPOSED · 2.4× DMG!'
              : ab.aimTimer > 0
                ? 'AIMING GUNFIRE · BLOCK [K] TO DEFLECT!'
                : ab.shieldHp > 0
                  ? 'IMMUNITY SHIELD · PRESS [L] TO SHATTER'
                  : ab.def.title,
            true,
            { compact: abDist > 360, alpha: Math.min(1, (500 - abDist) / 110) }
          );
        }
      }

      // EL MASTERMIND outside Bataan Provincial Capitol! (Towering Final Boss)
      if (elMastermind && !elMastermind.defeated) {
        const mx = elMastermind.x - cameraX;
        if (mx > -180 && mx < viewW + 180) {
          const mmUnlocked = getFinalBossProgress(prog.bossProgression).isUnlocked;
          drawElMastermind(
            ctx,
            mx,
            groundY,
            elMastermind.facing,
            elMastermind.walkPhase,
            elMastermind.hurtFlash,
            elMastermind.slashTimer > 0 ? 1 - elMastermind.slashTimer / 0.34 : 0,
            elapsed,
            {
              immune: !mmUnlocked,
              phase: elMastermind.phase,
              eyeFlash: elMastermind.eyeFlashTimer,
              weakSpotActive: elMastermind.weakSpotTimer > 0,
              telegraphLabel: elMastermind.telegraphLabel || undefined,
            }
          );
          if (elMastermind.activeSkill && elMastermind.skillPhase !== 'none') {
            const dur =
              elMastermind.skillPhase === 'windup'
                ? elMastermind.activeSkill.windupSec
                : elMastermind.activeSkill.activeSec;
            drawEnemySkillEffect(ctx, {
              visualKind: elMastermind.activeSkill.visualKind,
              casterX: mx,
              targetX: elMastermind.skillTargetX - cameraX,
              groundY,
              facing: elMastermind.facing,
              phase: elMastermind.skillPhase,
              progress01: 1 - elMastermind.skillTimer / Math.max(0.01, dur),
              unblockable: elMastermind.activeSkill.unblockable,
              reflectable: elMastermind.activeSkill.reflectable,
              warningCue: elMastermind.activeSkill.warningCue,
              time: elapsed,
            });
          }
          const mmDist = Math.abs(player.x - elMastermind.x);
          if (mmDist < 520) {
            drawEntityNameplate(
              ctx,
              mx,
              groundY - 140,
              'EL MASTERMIND',
              mmUnlocked ? 'POLITICAL IMMUNITY BROKEN · FINAL BOSS' : 'POLITICAL IMMUNITY ACTIVE · DO NOT ATTACK',
              true,
              { compact: mmDist > 380, alpha: Math.min(1, (520 - mmDist) / 110) }
            );
          }
        }
      }

      // THE GRACIAS NOMAR — El Mastermind Phase 2 Summon (Sheet 20!)
      if (graciasNomar && !graciasNomar.defeated) {
        const gx = graciasNomar.x - cameraX;
        if (gx > -160 && gx < viewW + 160) {
          const gProg =
            graciasNomar.state === 'idle'
              ? 0
              : 1 - graciasNomar.stateTimer / Math.max(0.01, graciasNomar.stateDuration);
          drawGraciasNomar(
            ctx,
            gx,
            groundY,
            graciasNomar.facing,
            graciasNomar.state,
            gProg,
            graciasNomar.hurtFlash,
            elapsed
          );
          if (graciasNomar.activeSkill && graciasNomar.skillPhase !== 'none') {
            const dur =
              graciasNomar.skillPhase === 'windup'
                ? graciasNomar.activeSkill.windupSec
                : graciasNomar.activeSkill.activeSec;
            drawEnemySkillEffect(ctx, {
              visualKind: graciasNomar.activeSkill.visualKind,
              casterX: gx,
              targetX: graciasNomar.skillTargetX - cameraX,
              groundY,
              facing: graciasNomar.facing,
              phase: graciasNomar.skillPhase,
              progress01: 1 - graciasNomar.skillTimer / Math.max(0.01, dur),
              unblockable: graciasNomar.activeSkill.unblockable,
              reflectable: graciasNomar.activeSkill.reflectable,
              warningCue: graciasNomar.activeSkill.warningCue,
              time: elapsed,
            });
          }
          // Compact summon HP bar
          const barW = 74;
          const pct = Math.max(0, graciasNomar.hp / Math.max(1, graciasNomar.maxHp));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(Math.round(gx - barW / 2), Math.round(groundY - 114), barW, 6);
          ctx.fillStyle = graciasNomar.weakSpotTimer > 0 ? '#FDE047' : '#EF4444';
          ctx.fillRect(Math.round(gx - barW / 2 + 1), Math.round(groundY - 113), Math.round((barW - 2) * pct), 4);
          drawEntityNameplate(
            ctx,
            gx,
            groundY - 122,
            'THE GRACIAS NOMAR',
            graciasNomar.weakSpotTimer > 0 ? 'WEAK SPOT · 2.4× DMG!' : 'Syndicate Summon',
            true,
            {
              compact: graciasNomar.weakSpotTimer <= 0,
              alpha: 0.95,
            }
          );
        }
      }

      // Multi-Frame Dying Entities Queue (3-frame collapses, spirit-banish, knockout tumbles)
      for (const item of dyingEntities) {
        renderDyingEntity(ctx, item.state, cameraX, (c, entity, fi, useDefeatedRow) => {
          drawDyingEntitySprite(c, entity, fi, useDefeatedRow, elapsed);
        });
      }

      // Active Recruited Ally Companion (Decoupled from static buildings — draws ONLY character + nameplate!)
      const summonedFriend = prog.activeCompanionId
        ? FRIENDS.find((f) => f.id === prog.activeCompanionId) || null
        : null;
      if (summonedFriend) {
        const cx = companion.x - cameraX;
        const cy = groundY + companion.y;
        drawAlly(
          ctx,
          {
            id: summonedFriend.id,
            name: summonedFriend.name,
            x: cx,
            y: cy,
            facing: companion.facing,
            isRecruited: true,
          },
          summonedFriend.npcVisual,
          summonedFriend.coatColor,
          summonedFriend.accentColor,
          summonedFriend.hairColor,
          companion.walkPhase,
          companion.slashTimer,
          Boolean(summonedFriend.isAspin),
          elapsed,
          summonedFriend.npcVisual === 'honest_police' ? policeAllyState : undefined,
          playerDebuffs.confusion > 0
        );
      }

      // Resolve Defender's 6 Equipped RPG Cosmetic & Equipment Slots + Bike Skin
      const outfitItem = getGearById(prog.equippedOutfitId) || RPG_GEAR[0];
      const hairItem = getGearById(prog.equippedHairId) || RPG_GEAR.find((i) => i.slot === 'hair')!;
      const headgearItem = getGearById(prog.equippedHeadgearId);
      const backItem = getGearById(prog.equippedBackId);
      const weaponItem = getGearById(prog.equippedWeaponId);
      const accessoryItem = getGearById(prog.equippedAccessoryId);
      const activeBikeSkin = getBikeSkinById(prog.equippedBikeSkinId);

      // Whistle Radial Stun Ring FX
      if (whistlePulseTimer > 0) {
        const r = (1 - whistlePulseTimer / 0.45) * 250;
        ctx.save();
        ctx.strokeStyle = `rgba(125, 211, 252, ${whistlePulseTimer * 2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x - cameraX, groundY + player.y - 46, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const g of dashGhosts) {
        drawNoirFigure(ctx, {
          x: g.x - cameraX,
          y: groundY + g.y,
          facing: g.facing,
          walkPhase: player.walkPhase,
          scale: 1.05,
          coatColor: '#F4C542',
          accentColor: '#2463B5',
          hairColor: hairItem.primaryColor,
          outfitStyle: outfitItem.outfitStyle || 'tshirt',
          equippedOutfitId: prog.equippedOutfitId,
          ridingBike: prog.hasBike && prog.ridingBike,
          bikeSkin: activeBikeSkin,
          progress: prog,
          dashAlpha: g.life * 1.9,
          useAtlasHero: true,
          isDashing: true,
          time: elapsed,
        });
      }

      const moveDirNow =
        keys['KeyA'] || keys['ArrowLeft'] ? -1 : keys['KeyD'] || keys['ArrowRight'] ? 1 : touchMoveDir;
      const isBikeSkiddingNow =
        prog.hasBike &&
        prog.ridingBike &&
        moveDirNow !== 0 &&
        Math.sign(player.vx) !== 0 &&
        Math.sign(player.vx) !== moveDirNow &&
        Math.abs(player.vx) > 120;

      // Persistent Herbal Banig Sanctuary Aura on the Ground
      if (herbalSanctuary) {
        const hx = herbalSanctuary.x - cameraX;
        drawActiveMagicEffect(ctx, 'herbal_banig', hx, groundY, 1, (elapsed * 0.65) % 1, elapsed);
      }

      if (heroDying) {
        renderDyingEntity(ctx, heroDying, cameraX, (c, entity, fi, useDefeatedRow) => {
          drawDyingEntitySprite(c, entity, fi, useDefeatedRow, elapsed);
        });
      } else {
        drawNoirFigure(ctx, {
          x: player.x - cameraX,
          y: groundY + player.y,
          facing: player.attackLocked ? player.attackFacing : player.facing,
          walkPhase: player.walkPhase,
          scale: 1.05,
          coatColor: outfitItem.primaryColor,
          accentColor: outfitItem.accentColor,
          hairColor: hairItem.primaryColor,
          outfitStyle: outfitItem.outfitStyle || 'tshirt',
          equippedOutfitId: prog.equippedOutfitId,
          headgearStyle: headgearItem?.headgearStyle || 'none',
          headgearColor: headgearItem?.primaryColor,
          headgearAccent: headgearItem?.accentColor,
          backStyle: backItem?.backStyle || 'none',
          backColor: backItem?.primaryColor,
          backAccent: backItem?.accentColor,
          weaponStyle: weaponItem?.weaponStyle || 'unarmed',
          weaponColor: weaponItem?.primaryColor,
          weaponAccent: weaponItem?.accentColor,
          accessoryColor: accessoryItem?.primaryColor || null,
          slashProgress:
            player.slashTimer > 0 ? Math.min(0.999, Math.max(0.001, player.attackElapsed / player.slashDuration)) : 0,
          tiradorProgress:
            player.tiradorTimer > 0
              ? Math.min(0.999, Math.max(0.001, 1 - player.tiradorTimer / player.tiradorDuration))
              : 0,
          comboStep: player.comboStep,
          hurtFlash: player.hurtFlash,
          umbrellaOpen: prog.hasUmbrella && prog.umbrellaOpen,
          shieldActive: player.shieldHold || player.shieldTimer > 0,
          ridingBike: player.attackLocked ? player.attackRiding : prog.hasBike && prog.ridingBike,
          bikeSkin: activeBikeSkin,
          progress: prog,
          velocityX: player.vx,
          levelUpFrameIdx: levelUpAnim ? levelUpAnim.heroFrameIdx : null,
          useAtlasHero: true,
          isDashing: player.dashTimer > 0,
          speedRatio: Math.min(1.5, Math.abs(player.vx) / Math.max(1, st.moveSpeed)),
          airborne: player.y < -6,
          skidding: isBikeSkiddingNow,
          magicCastSchool: heroMagicCast?.school ?? null,
          magicCastProgress: heroMagicCast ? Math.min(0.999, 1 - heroMagicCast.timer / heroMagicCast.duration) : 0,
          motion: heroMotion,
          time: elapsed,
        });
      }

      // Level-Up Golden Sun Pillar + Rising Sparkles + Floating Banner Overlay!
      if (levelUpAnim) {
        renderLevelUpOverlay(ctx, levelUpAnim, cameraX, drawLevelUpSunPillar);
      }

      // Tawas Golden Reflective Barrier around Hero
      if (tawasShieldTimer > 0) {
        drawActiveMagicEffect(ctx, 'tawas_shield', player.x - cameraX, groundY + player.y, player.facing, (elapsed * 0.9) % 1, elapsed);
      }

      // Active White & Black Magic Spell VFX (Sheet 18 Multi-Frame)
      for (const fx of activeMagicEffects) {
        const fxProgress = Math.min(0.999, Math.max(0, 1 - fx.timer / fx.duration));
        drawActiveMagicEffect(ctx, fx.effectKind, fx.x - cameraX, groundY, fx.facing, fxProgress, elapsed);
      }

      // Animated Projectiles (Spin/Velocity Rotation, Particle Trails & Glow Bloom) + Bullet Tracers + Impact Bursts!
      for (const p of projectiles) {
        drawAnimatedProjectile(ctx, p, cameraX, groundY);
      }
      drawBulletTracers(ctx, bulletTracers, cameraX, groundY);
      drawImpactBursts(ctx, impactBursts, cameraX, groundY);

      // FOREGROUND HIGHWAY VEHICLES LAYER — Proper-Scale 2-Frame Vehicles (Zero Damage Prop!)
      for (const v of vehicles) {
        const vx = v.x - cameraX;
        if (vx < -320 || vx > viewW + 320) continue;
        drawFilipinoVehicle(ctx, vx, groundY + v.laneOffset, v.kind, v.dir, {
          scale: 1.0,
          time: elapsed,
          isNight: nightNow,
          foreground: true,
        });
      }

      // Animated Fishing Rod, Line & Bobber Overlay when Hero is fishing!
      if (fishingState) {
        drawHeroFishingOverlay(
          ctx,
          player.x - cameraX,
          groundY + player.y,
          player.facing,
          fishingState.phase,
          elapsed
        );
      }

      // Unified Clean Particle/Glow/Ring Skill VFX Engine
      skillVfx.render(ctx, cameraX, elapsed);

      atmosphere.renderRainForeground(ctx, viewW, viewH, groundY, elapsed);

      // BALANCED 16-BIT TWILIGHT / NIGHT LIGHTING PASS (Crisp Lamppost Pools, Hearth Glow, Vehicle Headlights & Magic Auras)
      if (nightNow || zone.lighting === 'dusk' || timeOfDay >= 17.5 || timeOfDay < 6.4) {
        const nightLights: NightLightSource[] = [];
        const lampSpacing = 580;
        const lampStart = Math.floor(cameraX / lampSpacing) * lampSpacing + 160;
        const lampBulbY = groundY - ENTITY_WORLD_SCALES.street_lamppost.height + 18;
        for (let wx = lampStart; wx < cameraX + viewW + lampSpacing; wx += lampSpacing) {
          const sx = wx - cameraX;
          if (sx < -160 || sx > viewW + 160) continue;
          nightLights.push({
            x: sx,
            y: lampBulbY,
            radius: 145,
            colorRgb: '255, 196, 92',
            intensity: 0.78,
            kind: 'lamppost',
          });
        }
        // Soft visibility aura around Hero so combat & cosmetics remain crisp at night
        nightLights.push({
          x: player.x - cameraX,
          y: groundY + player.y - 44,
          radius: levelUpAnim ? 210 : 128,
          colorRgb: levelUpAnim ? '253, 224, 71' : '255, 232, 185',
          intensity: levelUpAnim ? 0.92 : 0.48,
          kind: 'magic_aura',
        });
        if (zone.hasHearth && zone.hearthX) {
          nightLights.push({
            x: zone.hearthX - cameraX,
            y: groundY - 28,
            radius: 155,
            colorRgb: '255, 165, 76',
            intensity: 0.85,
            kind: 'hearth',
          });
        }
        for (const v of vehicles) {
          const vx = v.x - cameraX;
          if (vx < -240 || vx > viewW + 240) continue;
          nightLights.push({
            x: vx + v.dir * 95,
            y: groundY + v.laneOffset - 36,
            radius: 115,
            colorRgb: '255, 240, 175',
            intensity: 0.65,
            kind: 'headlight',
          });
        }
        for (const fx of activeMagicEffects) {
          nightLights.push({
            x: fx.x - cameraX,
            y: groundY - 60,
            radius: 170,
            colorRgb: fx.effectKind === 'kulam_hex' || fx.effectKind === 'abyssal_eclipse' ? '192, 132, 252' : '253, 224, 71',
            intensity: 0.82,
            kind: 'magic_aura',
          });
        }
        renderNightLightingPass(
          ctx,
          viewW,
          viewH,
          timeOfDay,
          nightLights,
          zone.lighting === 'haunted_night'
        );
      }

      if (
        playerDebuffs.soaked ||
        playerDebuffs.burn ||
        playerDebuffs.poison > 0 ||
        playerDebuffs.stun > 0 ||
        playerDebuffs.freeze > 0 ||
        playerDebuffs.confusion > 0 ||
        playerDebuffs.shadow > 0 ||
        playerDebuffs.slow > 0 ||
        playerDebuffs.bleed > 0 ||
        playerDebuffs.blind > 0
      ) {
        drawPlayerDebuffFeedback(
          ctx,
          viewW,
          viewH,
          player.x - cameraX,
          groundY + player.y,
          playerDebuffs,
          elapsed
        );
      }

      // Floating Combat Numbers
      ctx.textAlign = 'center';
      for (const ft of floatingTexts) {
        const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillStyle = '#0B1520';
        ctx.fillText(ft.text, Math.floor(ft.x - cameraX + 1.5), Math.floor(groundY + ft.y + 1.5));
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, Math.floor(ft.x - cameraX), Math.floor(groundY + ft.y));
        ctx.restore();
      }

      // On-Canvas Tactical Minimap
      drawMinimap(
        ctx,
        viewW,
        viewH,
        zone,
        player.x,
        [
          ...townBosses.map((b) => ({ x: b.x, defeated: b.defeated, isMayor: b.role === 'MAYOR' })),
          ...awakenedBosses.map((ab) => ({ x: ab.x, defeated: ab.defeated, isMayor: true })),
        ],
        elMastermind
          ? {
              x: elMastermind.x,
              defeated: elMastermind.defeated,
              immune: !getFinalBossProgress(prog.bossProgression).isUnlocked,
            }
          : null
      );

      // Full-Screen Crimson Red-Eyepatch Flash Overlay when El Mastermind Instant-Kills!
      if (redEyepatchOverlay > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(220, 20, 30, ${redEyepatchOverlay * 0.52})`;
        ctx.fillRect(0, 0, viewW, viewH);
        // Dramatic glowing red eye slash across screen
        ctx.strokeStyle = `rgba(255, 220, 120, ${redEyepatchOverlay})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(viewW * 0.15, viewH * 0.35);
        ctx.lineTo(viewW * 0.85, viewH * 0.65);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      // Throttle HUD updates & resolve dynamic Barangay + Active Boss HUD
      hudTimer += dt;
      if (hudTimer >= 0.08) {
        hudTimer = 0;

        let activeBossHud: BossHudState | null = null;
        for (const ab of awakenedBosses) {
          if (!ab.defeated && Math.abs(player.x - ab.x) < 540) {
            activeBossHud = {
              id: ab.def.id,
              name: ab.def.name,
              title: ab.def.title,
              hp: Math.ceil(ab.hp),
              maxHp: ab.maxHp,
              shieldHp: Math.ceil(ab.shieldHp),
              shieldMax: ab.shieldMax,
              role: 'AWAKENED_BOSS',
              gender: 'male',
              profile: ab.def.profile,
              weakSpotActive: ab.weakSpotTimer > 0,
              telegraphLabel: ab.telegraphLabel || undefined,
            };
            break;
          }
        }
        if (!activeBossHud && elMastermind && !elMastermind.defeated && Math.abs(player.x - elMastermind.x) < 540) {
          const mmUnlocked = getFinalBossProgress(prog.bossProgression).isUnlocked;
          activeBossHud = {
            id: 'el_mastermind',
            name: 'El Mastermind',
            title: mmUnlocked
              ? `Provincial Syndicate Overlord · Phase ${elMastermind.phase}`
              : 'Provincial Syndicate Overlord · POLITICAL IMMUNITY',
            hp: Math.ceil(elMastermind.hp),
            maxHp: elMastermind.maxHp,
            role: 'FINAL_BOSS',
            immune: !mmUnlocked,
            phase: elMastermind.phase,
            weakSpotActive: elMastermind.weakSpotTimer > 0,
            telegraphLabel: elMastermind.telegraphLabel || undefined,
          };
        } else if (!activeBossHud) {
          for (const b of townBosses) {
            if (!b.defeated && Math.abs(player.x - b.x) < 500) {
              activeBossHud = {
                id: b.profile.id,
                name: b.profile.name,
                title: `${b.profile.title} · Drops ${b.profile.dropName}`,
                hp: Math.ceil(b.hp),
                maxHp: b.maxHp,
                shieldHp: Math.ceil(b.shieldHp),
                shieldMax: b.shieldMax,
                role: b.role,
                gender: b.profile.gender,
                profile: b.profile,
                weakSpotActive: b.weakSpotTimer > 0,
                telegraphLabel: b.telegraphLabel || undefined,
              };
              break;
            }
          }
        }

        const currentBarangay = muniData
          ? `Brgy. ${
              muniData.barangays[
                Math.min(
                  muniData.barangays.length - 1,
                  Math.max(0, Math.floor((player.x / Math.max(1, zone.width)) * muniData.barangays.length))
                )
              ]
            }`
          : 'Defender Home';

        const fishingHud: FishingHudState | null = fishingState
          ? {
              phase: fishingState.phase,
              fishName: fishingState.phase === 'reeling' ? fishingState.fishName : undefined,
              reelProgress: fishingState.reelProgress,
              cursorPos: fishingState.cursorPos,
              zoneCenter: fishingState.zoneCenter,
              zoneWidth: fishingState.zoneWidth,
              timeLeft: Math.max(0, fishingState.timer),
            }
          : null;

        callbacksRef.current.onHudUpdate({
          hp: Math.ceil(player.hp),
          maxHp: st.maxHp,
          sp: Math.floor(player.sp),
          maxSp: st.maxSp,
          xp: prog.xp,
          xpNext: getXpForNextLevel(prog.level),
          energy: Math.round(player.energy),
          mood: Math.round(player.mood),
          sanctuaryBuffSec: Math.ceil(player.sanctuaryBuffSec),
          comboCount: player.comboCount,
          timeOfDay,
          isNight: nightNow,
          currentBarangay,
          nearestTarget: nearest,
          bossHud: activeBossHud,
          speechBanner: speechBanner ? { speaker: speechBanner.speaker, text: speechBanner.text } : null,
          companionStatus: summonedFriend ? { name: summonedFriend.name, action: companion.statusText } : null,
          activeBgmLabel: bossMusicActive ? BGM_TRACK_LABELS.boss_battle : BGM_TRACK_LABELS[zone.bgmTrack],
          magicCooldowns: { ...magicCooldowns },
          shieldCooldown: player.shieldCooldown,
          shieldCooldownMax: GAME_CONFIG.combat.shieldCooldownSec,
          dodgeCooldown: player.dashCooldown,
          dodgeCooldownMax: GAME_CONFIG.combat.dodgeCooldownSec,
          activeBuffs: activeBuffsRef.current.map((b) => ({ ...b })),
          accuracyPct: Math.round(getPlayerAccuracyMult() * 100),
          availableStatPoints: getAvailableStatPoints(prog.level, prog.statAllocation),
          weatherMode: atmosphere.weather,
          playerDebuffs: {
            soaked: playerDebuffs.soaked,
            burn: playerDebuffs.burn,
            poison: playerDebuffs.poison,
            stun: playerDebuffs.stun,
            freeze: playerDebuffs.freeze,
            confusion: playerDebuffs.confusion,
            shadow: playerDebuffs.shadow,
            slow: playerDebuffs.slow,
            bleed: playerDebuffs.bleed,
            blind: playerDebuffs.blind,
          },
          activeTiradorAmmo: player.currentAmmo,
          activeSideJob: activeSideJobRef.current ? { ...activeSideJobRef.current } : null,
          fishingHud,
        });
      }

      syncTimer += dt;
      if (syncTimer >= 2.2) {
        syncTimer = 0;
        callbacksRef.current.onSyncVitals({
          hp: Math.ceil(player.hp),
          sp: Math.floor(player.sp),
          energy: Math.round(player.energy),
          mood: Math.round(player.mood),
          sanctuaryBuffSec: Math.ceil(player.sanctuaryBuffSec),
          timeOfDay,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', handleResize);
    };
  }, [progress.zoneId, progress.awakenedCount, bridgeRef]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full cursor-crosshair select-none"
      aria-label="Bataan: Stand Against Corruption Game World"
    />
  );
};
