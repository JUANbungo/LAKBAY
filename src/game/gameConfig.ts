// =========================================================================
// CENTRAL GAME CONFIGURATION & BALANCE TABLE (BATAAN: LABAN SA KORAPSYON)
// Edit any tunable number, spawn table, drop rate, price, cooldown, or news
// headline right here without hunting through rendering or UI code.
// =========================================================================

import { ItemRarity, MobKind, ZoneId } from './types';

export interface NewsArticle {
  id: string;
  date: string;
  category: 'PATCH' | 'WEATHER' | 'NEW AREA' | 'ECONOMY' | 'COMBAT';
  headline: string;
  body: string;
}

export interface FishDef {
  id: string;
  name: string;
  filipinoNote: string;
  rarity: ItemRarity;
  sellValue: number;
  difficulty: number; // 0.35 (easy) .. 0.92 (hard)
  catchWeight: number; // Relative weight in fishing roll
  color: string;
  accentColor: string;
  cookingTag: 'sinigang' | 'inihaw' | 'paksiw' | 'kinilaw' | 'adobo';
}

export interface GatherItemDef {
  id: string;
  name: string;
  category: 'herb' | 'vegetable' | 'fruit' | 'ore' | 'monster_material';
  rarity: ItemRarity;
  sellValue: number;
  hpRestore?: number;
  spRestore?: number;
  color: string;
  accentColor: string;
  description: string;
}

export interface CookingRecipeDef {
  id: string;
  foodId: string;
  name: string;
  description: string;
  ingredients: { itemId: string; label: string; qty: number }[];
  hpRestore: number;
  spRestore: number;
  energyRestore: number;
  buff?: {
    stat: 'atk_up' | 'def_up' | 'speed_up' | 'lucky_drop';
    label: string;
    multiplier: number;
    durationSec: number;
  };
  sellValue: number;
}

export interface DebuffSpec {
  durationSec: number;
  tickDmgPct?: number;
  tickIntervalSec?: number;
  speedMult?: number;
  statPenaltyPct?: number;
}

export const GAME_CONFIG = {
  // ---------------- AUDIO PREFERENCES ----------------
  audio: {
    storageKey: 'bataan_audio_prefs_v1',
    defaultSfxVolume: 0.8,
    defaultBgmVolume: 0.7,
  },

  // ---------------- PLAYER BASE STATS & GROWTH ----------------
  playerBase: {
    baseHp: 140,
    hpPerLevel: 24,
    baseSp: 85,
    spPerLevel: 10,
    baseAtk: 17,
    atkPerLevel: 4.5,
    baseDef: 4,
    defPerLevel: 1.6,
    baseCritChance: 0.1,
    baseMoveSpeed: 248,
    baseSpRegen: 5.5,
    xpBase: 95,
    xpPerLevel: 70,
  },

  // ---------------- COMBAT COOLDOWNS & ACCURACY ----------------
  combat: {
    shieldCooldownSec: 4.0, // Configurable 3–5 seconds
    dodgeCooldownSec: 4.0, // Configurable 3–5 seconds
    nightAccuracyPenalty: 0.25, // -25% accuracy at night (0.75x)
    fogAccuracyPenalty: 0.5, // -50% accuracy in fog (0.50x), stacks multiplicatively
    thiefStealChance: 0.1, // 10% chance on hit
    thiefStealRatio: 0.5, // Steals 50% of current Pesos (dropped back on kill)
  },

  // ---------------- PAYONG (UMBRELLA) WEATHER SURVIVAL ----------------
  weather: {
    soakedSpeedMult: 0.75, // 25% slower during rainy weather without Payong
    burnHpPctPerTick: 0.01, // 1% max HP damage per 3 seconds during sunny daytime without Payong
    burnTickIntervalSec: 3.0,
  },

  // ---------------- ENEMY STAT SCALING ----------------
  enemyScaling: {
    hpBase: 62,
    hpPerLevel: 28,
    atkBase: 8,
    atkPerLevel: 3.1,
    defBase: 2,
    defPerLevel: 0.75,
    zoneHpStep: 0.11,
    zoneAtkStep: 0.08,
    speedMultiplier: 1.12,
  },

  // ---------------- DROP RATES (PERCENTAGES) ----------------
  dropRates: {
    common: 0.62,
    uncommon: 0.26,
    rare: 0.1,
    epic: 0.02,
    materialDropChance: 0.68,
    luckyDropBonusMult: 1.5,
  },

  // ---------------- ENEMY DEBUFFS ----------------
  debuffs: {
    poison: { durationSec: 5.0, tickDmgPct: 0.022, tickIntervalSec: 1.0 } as DebuffSpec,
    stun: { durationSec: 1.5 } as DebuffSpec,
    freeze: { durationSec: 3.2, speedMult: 0.28 } as DebuffSpec,
    confusion: { durationSec: 5.0 } as DebuffSpec, // Allies attack hero; hero cannot hit ally back
    shadow: { durationSec: 6.5, statPenaltyPct: 0.22 } as DebuffSpec,
    perEnemyChance: {
      cobra: { kind: 'poison', chance: 0.42 },
      cave_spider: { kind: 'poison', chance: 0.45 },
      cave_centipede: { kind: 'poison', chance: 0.55 },
      insekto: { kind: 'poison', chance: 0.28 },
      fat_guy: { kind: 'stun', chance: 0.28 },
      bad_guy: { kind: 'stun', chance: 0.16 },
      corrupt_police: { kind: 'stun', chance: 0.2 },
      white_lady: { kind: 'freeze', chance: 0.4 },
      cave_bat: { kind: 'confusion', chance: 0.24 },
      corrupted_priest: { kind: 'confusion', chance: 0.34 },
      evil_pastor: { kind: 'confusion', chance: 0.34 },
      aswang: { kind: 'shadow', chance: 0.45 },
      tiyanak: { kind: 'shadow', chance: 0.32 },
      balete_tree: { kind: 'shadow', chance: 0.48 },
      corrupt_politician: { kind: 'shadow', chance: 0.24 },
    } as Partial<Record<MobKind, { kind: 'poison' | 'stun' | 'freeze' | 'confusion' | 'shadow'; chance: number }>>,
  },

  // ---------------- SKILLS: LEVEL UNLOCKS & 1–5 MIN STAT BUFFS ----------------
  skills: {
    wm_lv30_tawas: {
      unlockLevel: 5,
      spCost: 24,
      cooldownSec: 12,
      buff: { stat: 'def_up' as const, label: 'DEF +35%', multiplier: 1.35, durationSec: 180 }, // 3 min
    },
    wm_lv50_banig: {
      unlockLevel: 10,
      spCost: 34,
      cooldownSec: 14,
      buff: { stat: 'speed_up' as const, label: 'SPD +28%', multiplier: 1.28, durationSec: 120 }, // 2 min
    },
    bm_lv30_kulam: {
      unlockLevel: 16,
      spCost: 32,
      cooldownSec: 12,
      buff: { stat: 'atk_up' as const, label: 'ATK +28%', multiplier: 1.28, durationSec: 120 }, // 2 min
    },
    wm_lv70_agimat: {
      unlockLevel: 22,
      spCost: 52,
      cooldownSec: 14,
      buff: null,
    },
    bm_lv50_usog: {
      unlockLevel: 28,
      spCost: 48,
      cooldownSec: 12,
      buff: null,
    },
    bm_lv70_barang: {
      unlockLevel: 35,
      spCost: 68,
      cooldownSec: 15,
      buff: null,
    },
    wm_lv100_bathala: {
      unlockLevel: 45,
      spCost: 85,
      cooldownSec: 22,
      buff: { stat: 'lucky_drop' as const, label: 'LUCK +50%', multiplier: 1.5, durationSec: 300 }, // 5 min
    },
    bm_lv100_eclipse: {
      unlockLevel: 60,
      spCost: 95,
      cooldownSec: 24,
      buff: null,
    },
  },

  // ---------------- CURATED BIKE SKINS & SAVE MIGRATION ----------------
  curatedBikeSkinIds: [
    'bike_classic_green',
    'bike_patrol_sidecar',
    'bike_jeepney_gold',
    'bike_patrol_blue',
    'bike_katipunan_crimson',
    'bike_dambana_sunburst',
  ] as const,

  removedAllyIds: ['friend_mang_jun', 'friend_sorbetero', 'friend_kuya_rico', 'friend_ate_maya'] as const,

  // ---------------- FARMING & CAVE SPAWN TABLES ----------------
  farmingSpawns: [
    { x: 640, kind: 'rodent_daga' as MobKind, level: 1 },
    { x: 960, kind: 'rodent_daga' as MobKind, level: 2 },
    { x: 1280, kind: 'bukid_pest' as MobKind, level: 2 },
    { x: 1620, kind: 'rodent_daga' as MobKind, level: 3 },
    { x: 1960, kind: 'bukid_pest' as MobKind, level: 3 },
    { x: 2290, kind: 'rodent_daga' as MobKind, level: 4 },
    { x: 2640, kind: 'bukid_pest' as MobKind, level: 4 },
    { x: 2980, kind: 'rodent_daga' as MobKind, level: 5 },
    { x: 3280, kind: 'insekto' as MobKind, level: 5 },
  ],
  farmingRespawnSec: 6.5,

  caveSpawns: [
    { x: 660, kind: 'cave_bat' as MobKind, level: 4 },
    { x: 1020, kind: 'cave_spider' as MobKind, level: 5 },
    { x: 1420, kind: 'cave_bat' as MobKind, level: 6 },
    { x: 1840, kind: 'cave_centipede' as MobKind, level: 6 },
    { x: 2240, kind: 'cave_spider' as MobKind, level: 7 },
    { x: 2660, kind: 'cave_bat' as MobKind, level: 8 },
    { x: 3060, kind: 'cave_centipede' as MobKind, level: 8 },
    { x: 3420, kind: 'cave_spider' as MobKind, level: 9 },
  ],
  caveRespawnSec: 11.0,
  oreNodeRespawnSec: 28.0,
  gatherNodeRespawnSec: 32.0,

  // ---------------- FISHING SYSTEM ----------------
  fishing: {
    rodPrice: 120,
    minWaitSec: 1.8,
    maxWaitSec: 4.0,
    biteWindowSec: 2.2,
    reelDurationSec: 5.5,
    sweetSpotWidth: 0.28,
    progressGainPerSec: 0.44,
    progressDrainPerSec: 0.24,
  },

  // ---------------- SIDE JOBS ----------------
  sideJobs: {
    foodDelivery: {
      timeLimitSec: 95,
      baseRewardPesos: 260,
      speedBonusPesos: 110,
      rewardXp: 95,
    },
    taxi: {
      timeLimitSec: 110,
      baseFarePesos: 320,
      speedTipPesos: 140,
      rewardXp: 115,
    },
  },
};

// =========================================================================
// ATE MAYA'S EDITABLE NEWS FEED (BATAAN CIVIC NEWS DESK)
// =========================================================================
export const NEWS_FEED: NewsArticle[] = [
  {
    id: 'news_weather_payong',
    date: 'Breaking Bulletin',
    category: 'WEATHER',
    headline: 'PAGASA Bataan Advisory: Bring Your Payong Rain or Shine!',
    body: 'Citizens walking without an open Payong during heavy rains suffer a -25% Soaked movement penalty. Under scorching clear skies, unprotected travelers take 1% Burn damage every 3 seconds!',
  },
  {
    id: 'news_farming_cave',
    date: 'Field Report',
    category: 'NEW AREA',
    headline: 'New Palayan Farming Grounds & Mt. Natib Mining Cave Open!',
    body: 'Clear out fast-spawning Daga rodents in the Palayan Farming Grounds for quick Pesos and EXP, or brave the dark Mt. Natib Cave for Tanso, Bakal, Pilak, and Ginto ores—watch out for venomous Spiders, Centipedes, and confusing Bats!',
  },
  {
    id: 'news_fishing_cooking',
    date: 'Culture & Food',
    category: 'ECONOMY',
    headline: 'Coastal Fishing Spots & Filipino Cooking Now Live!',
    body: 'Buy a Bamboo Fishing Rod from town shops and cast at marked docks in Orani, Orion, Bagac, or Morong to haul Bangus, Tilapia, Lapu-Lapu, and Pusit. Gather Malunggay, Kalamansi, and veggies to cook Sinigang, Adobo, and Kinilaw at any Hearth!',
  },
  {
    id: 'news_side_jobs',
    date: 'Civic Economy',
    category: 'ECONOMY',
    headline: 'Earn Extra Pesos: Food Delivery & Bataan Taxi Dispatch!',
    body: 'Check in at the Balanga or Orani Civic Dispatch post to run timed Food Deliveries to local houses or drive Taxi passengers across Bataan for generous fares and speed tips.',
  },
  {
    id: 'news_night_fog_thieves',
    date: 'Crime Watch',
    category: 'COMBAT',
    headline: 'Night & Fog Patrol Warning: Watch Out for Pickpockets!',
    body: 'Low visibility drops combat accuracy by 25% at night and 50% in thick fog. Street Thieves now have a 10% chance on hit to snatch half your Pesos—take them down immediately to recover every coin!',
  },
  {
    id: 'news_skill_balance',
    date: 'Patch Notes',
    category: 'PATCH',
    headline: 'Defender Skills Rebalanced with 1–5 Minute Stat Buffs!',
    body: 'Skills now unlock smoothly as you level up (Lv.5–60), featuring long-lasting ATK, DEF, Speed, and Lucky Drop buffs, clean particle VFX, and tactical 4-second Shield & Dodge cooldowns.',
  },
];

// =========================================================================
// AUTHENTIC FILIPINO FISH CATALOG (11 LOCAL SPECIES)
// =========================================================================
export const FILIPINO_FISH: FishDef[] = [
  {
    id: 'fish_tilapia',
    name: 'Tilapia',
    filipinoNote: 'Freshwater staple from Bataan fishponds',
    rarity: 'Common',
    sellValue: 45,
    difficulty: 0.32,
    catchWeight: 22,
    color: '#94A3B8',
    accentColor: '#CBD5E1',
    cookingTag: 'inihaw',
  },
  {
    id: 'fish_galunggong',
    name: 'Galunggong (GG)',
    filipinoNote: 'Beloved coastal round scad',
    rarity: 'Common',
    sellValue: 50,
    difficulty: 0.36,
    catchWeight: 20,
    color: '#64748B',
    accentColor: '#93C5FD',
    cookingTag: 'paksiw',
  },
  {
    id: 'fish_tamban',
    name: 'Tamban',
    filipinoNote: 'Silver Bataan sardine school catch',
    rarity: 'Common',
    sellValue: 40,
    difficulty: 0.3,
    catchWeight: 20,
    color: '#CBD5E1',
    accentColor: '#60A5FA',
    cookingTag: 'paksiw',
  },
  {
    id: 'fish_alamang',
    name: 'Alamang (Krill Shrimp)',
    filipinoNote: 'Coastal shrimp prized for Bataan bagoong',
    rarity: 'Common',
    sellValue: 55,
    difficulty: 0.34,
    catchWeight: 16,
    color: '#FDA4AF',
    accentColor: '#FB7185',
    cookingTag: 'kinilaw',
  },
  {
    id: 'fish_bangus',
    name: 'Bangus (Milkfish)',
    filipinoNote: 'Silver national fish of the Philippines',
    rarity: 'Uncommon',
    sellValue: 95,
    difficulty: 0.5,
    catchWeight: 15,
    color: '#E2E8F0',
    accentColor: '#38BDF8',
    cookingTag: 'sinigang',
  },
  {
    id: 'fish_tulingan',
    name: 'Tulingan (Mackerel Tuna)',
    filipinoNote: 'Meaty coastal tuna great for sinaing & paksiw',
    rarity: 'Uncommon',
    sellValue: 110,
    difficulty: 0.55,
    catchWeight: 12,
    color: '#3B82F6',
    accentColor: '#1E3A8A',
    cookingTag: 'paksiw',
  },
  {
    id: 'fish_dalag',
    name: 'Dalag (Mudfish)',
    filipinoNote: 'River snakehead from Orani & Abucay marshes',
    rarity: 'Uncommon',
    sellValue: 105,
    difficulty: 0.54,
    catchWeight: 11,
    color: '#4D7C0F',
    accentColor: '#A3E635',
    cookingTag: 'sinigang',
  },
  {
    id: 'fish_hito',
    name: 'Hito (Catfish)',
    filipinoNote: 'Whiskered freshwater catfish for smoky inihaw',
    rarity: 'Uncommon',
    sellValue: 115,
    difficulty: 0.58,
    catchWeight: 11,
    color: '#57534E',
    accentColor: '#A8A29E',
    cookingTag: 'inihaw',
  },
  {
    id: 'fish_pusit',
    name: 'Pusit (Bataan Squid)',
    filipinoNote: 'Fresh night-coast squid for Adobong Pusit',
    rarity: 'Rare',
    sellValue: 165,
    difficulty: 0.68,
    catchWeight: 8,
    color: '#F472B6',
    accentColor: '#BE185D',
    cookingTag: 'adobo',
  },
  {
    id: 'fish_maya_maya',
    name: 'Maya-Maya (Red Snapper)',
    filipinoNote: 'Crimson reef snapper from Bagac & Morong bays',
    rarity: 'Rare',
    sellValue: 220,
    difficulty: 0.76,
    catchWeight: 6,
    color: '#EF4444',
    accentColor: '#FCA5A5',
    cookingTag: 'sinigang',
  },
  {
    id: 'fish_lapu_lapu',
    name: 'Lapu-Lapu (Grouper)',
    filipinoNote: 'Prized trophy reef fish of West Philippine Sea',
    rarity: 'Epic',
    sellValue: 340,
    difficulty: 0.85,
    catchWeight: 4,
    color: '#EA580C',
    accentColor: '#FDE047',
    cookingTag: 'kinilaw',
  },
];

// =========================================================================
// GATHERABLE HERBS, VEGETABLES, FRUITS, CAVE ORES & FARMING MATERIALS
// =========================================================================
export const GATHER_AND_MATERIAL_ITEMS: GatherItemDef[] = [
  // Herbs
  {
    id: 'mat_malunggay',
    name: 'Malunggay Leaves',
    category: 'herb',
    rarity: 'Common',
    sellValue: 24,
    hpRestore: 18,
    color: '#22C55E',
    accentColor: '#86EFAC',
    description: 'Nutritious moringa leaves used in Tinola and herbal healing.',
  },
  {
    id: 'mat_sambong',
    name: 'Sambong Leaf',
    category: 'herb',
    rarity: 'Common',
    sellValue: 30,
    hpRestore: 22,
    spRestore: 12,
    color: '#16A34A',
    accentColor: '#BBF7D0',
    description: 'Aromatic Philippine medicinal herb that restores vigor.',
  },
  {
    id: 'mat_lagundi',
    name: 'Lagundi Herb',
    category: 'herb',
    rarity: 'Uncommon',
    sellValue: 42,
    hpRestore: 26,
    spRestore: 18,
    color: '#15803D',
    accentColor: '#A7F3D0',
    description: 'Five-leaved mountain herb valued by Bataan albularyos.',
  },
  {
    id: 'mat_oregano',
    name: 'Oregano (Kalabo)',
    category: 'herb',
    rarity: 'Common',
    sellValue: 26,
    hpRestore: 16,
    color: '#4ADE80',
    accentColor: '#DCFCE7',
    description: 'Fragrant backyard herb used for savory dishes and soothing coughs.',
  },
  // Vegetables
  {
    id: 'mat_kangkong',
    name: 'Kangkong Stalks',
    category: 'vegetable',
    rarity: 'Common',
    sellValue: 22,
    color: '#16A34A',
    accentColor: '#4ADE80',
    description: 'Crisp river spinach essential for hot Sinigang na Isda.',
  },
  {
    id: 'mat_talong',
    name: 'Talong (Eggplant)',
    category: 'vegetable',
    rarity: 'Common',
    sellValue: 28,
    color: '#7E22CE',
    accentColor: '#C084FC',
    description: 'Glossy violet eggplant harvested along Bataan backyard plots.',
  },
  {
    id: 'mat_ampalaya',
    name: 'Ampalaya (Bitter Gourd)',
    category: 'vegetable',
    rarity: 'Uncommon',
    sellValue: 36,
    hpRestore: 25,
    color: '#15803D',
    accentColor: '#86EFAC',
    description: 'Hardy green vegetable packed with iron for long patrols.',
  },
  {
    id: 'mat_sitaw',
    name: 'Sitaw (String Beans)',
    category: 'vegetable',
    rarity: 'Common',
    sellValue: 24,
    color: '#65A30D',
    accentColor: '#BEF264',
    description: 'Fresh green string beans bundled by local farmers.',
  },
  // Fruits
  {
    id: 'mat_kalamansi',
    name: 'Kalamansi Citrus',
    category: 'fruit',
    rarity: 'Common',
    sellValue: 25,
    spRestore: 15,
    color: '#84CC16',
    accentColor: '#FDE047',
    description: 'Zesty Philippine lime essential for Kinilaw, Sinigang, and dipping sauce.',
  },
  {
    id: 'mat_saging',
    name: 'Saging Saba',
    category: 'fruit',
    rarity: 'Common',
    sellValue: 26,
    hpRestore: 24,
    color: '#EAB308',
    accentColor: '#FEF08A',
    description: 'Sweet Bataan banana cluster that refills stamina on the road.',
  },
  {
    id: 'mat_mangga',
    name: 'Manggang Bataan',
    category: 'fruit',
    rarity: 'Uncommon',
    sellValue: 48,
    hpRestore: 38,
    spRestore: 16,
    color: '#F59E0B',
    accentColor: '#FDE047',
    description: 'Golden sweet mango famous across Hermosa and Orani orchards.',
  },
  {
    id: 'mat_bayabas',
    name: 'Bayabas (Guava)',
    category: 'fruit',
    rarity: 'Common',
    sellValue: 32,
    hpRestore: 30,
    color: '#84CC16',
    accentColor: '#FDA4AF',
    description: 'Aromatic guava fruit rich in vitamin C and traditional healing use.',
  },
  // Cave Ores
  {
    id: 'ore_tanso',
    name: 'Tanso (Copper Ore)',
    category: 'ore',
    rarity: 'Common',
    sellValue: 65,
    color: '#D97706',
    accentColor: '#FDBA74',
    description: 'Mined from Mt. Natib Cavern veins. Valuable to local talyers.',
  },
  {
    id: 'ore_bakal',
    name: 'Bakal (Iron Ore)',
    category: 'ore',
    rarity: 'Uncommon',
    sellValue: 115,
    color: '#94A3B8',
    accentColor: '#E2E8F0',
    description: 'Sturdy raw iron ore prized for forging Bataan blades and armor.',
  },
  {
    id: 'ore_pilak',
    name: 'Pilak (Silver Vein)',
    category: 'ore',
    rarity: 'Rare',
    sellValue: 210,
    color: '#CBD5E1',
    accentColor: '#FFFFFF',
    description: 'Gleaming silver crystal effective against night folklore creatures.',
  },
  {
    id: 'ore_ginto',
    name: 'Ginto (Bataan Gold Nugget)',
    category: 'ore',
    rarity: 'Epic',
    sellValue: 390,
    color: '#FACC15',
    accentColor: '#FEF9C3',
    description: 'Rare golden nugget deep inside Mt. Natib Cavern.',
  },
  // Monster Farming Materials
  {
    id: 'mat_daga_pelt',
    name: 'Bukid Rodent Hide',
    category: 'monster_material',
    rarity: 'Common',
    sellValue: 40,
    color: '#92400E',
    accentColor: '#D6D3D1',
    description: 'Dropped by Daga pests in the Palayan Farming Grounds.',
  },
  {
    id: 'mat_spider_silk',
    name: 'Cavern Spider Silk',
    category: 'monster_material',
    rarity: 'Uncommon',
    sellValue: 85,
    color: '#E2E8F0',
    accentColor: '#A855F7',
    description: 'Tough webbing harvested from Mt. Natib cave spiders.',
  },
  {
    id: 'mat_venom_gland',
    name: 'Alupihan Venom Sac',
    category: 'monster_material',
    rarity: 'Rare',
    sellValue: 140,
    color: '#10B981',
    accentColor: '#6EE7B7',
    description: 'Potent toxin sac dropped by giant cave centipedes and cobras.',
  },
  {
    id: 'mat_bat_wing',
    name: 'Paniki Shadow Wing',
    category: 'monster_material',
    rarity: 'Uncommon',
    sellValue: 78,
    color: '#475569',
    accentColor: '#818CF8',
    description: 'Leathery wing membrane from erratic Mt. Natib cave bats.',
  },
];

// =========================================================================
// FILIPINO COOKING RECIPES (HEALING + TIMED STAT BUFFS)
// =========================================================================
export const COOKING_RECIPES: CookingRecipeDef[] = [
  {
    id: 'recipe_sinigang',
    foodId: 'food_cooked_sinigang',
    name: 'Sinigang na Isda',
    description: 'Sour savory fish soup with Kangkong and Kalamansi. Restores 160 HP + DEF +25% (3 min).',
    ingredients: [
      { itemId: 'fish_bangus', label: 'Bangus (or any fish)', qty: 1 },
      { itemId: 'mat_kangkong', label: 'Kangkong Stalks', qty: 1 },
      { itemId: 'mat_kalamansi', label: 'Kalamansi Citrus', qty: 1 },
    ],
    hpRestore: 160,
    spRestore: 45,
    energyRestore: 55,
    buff: { stat: 'def_up', label: 'Sinigang DEF +25%', multiplier: 1.25, durationSec: 180 },
    sellValue: 160,
  },
  {
    id: 'recipe_tinola',
    foodId: 'food_cooked_tinola',
    name: 'Tinolang Malunggay',
    description: 'Warm ginger-malunggay broth with Sitaw. Restores 135 HP, 50 SP + Speed +22% (2 min).',
    ingredients: [
      { itemId: 'mat_malunggay', label: 'Malunggay Leaves', qty: 2 },
      { itemId: 'mat_sitaw', label: 'Sitaw (String Beans)', qty: 1 },
    ],
    hpRestore: 135,
    spRestore: 50,
    energyRestore: 50,
    buff: { stat: 'speed_up', label: 'Tinola SPD +22%', multiplier: 1.22, durationSec: 120 },
    sellValue: 125,
  },
  {
    id: 'recipe_inihaw',
    foodId: 'food_cooked_inihaw',
    name: 'Inihaw na Isda',
    description: 'Char-grilled tilapia/hito brushed with Kalamansi. Restores 150 HP + ATK +24% (3 min).',
    ingredients: [
      { itemId: 'fish_tilapia', label: 'Tilapia (or any fish)', qty: 1 },
      { itemId: 'mat_kalamansi', label: 'Kalamansi Citrus', qty: 1 },
    ],
    hpRestore: 150,
    spRestore: 30,
    energyRestore: 48,
    buff: { stat: 'atk_up', label: 'Inihaw ATK +24%', multiplier: 1.24, durationSec: 180 },
    sellValue: 140,
  },
  {
    id: 'recipe_paksiw',
    foodId: 'food_cooked_paksiw',
    name: 'Paksiw na Isda',
    description: 'Vinegar-simmered fish with Talong and Ampalaya. Restores 145 HP, 45 SP + DEF +22% (3 min).',
    ingredients: [
      { itemId: 'fish_galunggong', label: 'Galunggong (or any fish)', qty: 1 },
      { itemId: 'mat_talong', label: 'Talong (Eggplant)', qty: 1 },
    ],
    hpRestore: 145,
    spRestore: 45,
    energyRestore: 45,
    buff: { stat: 'def_up', label: 'Paksiw DEF +22%', multiplier: 1.22, durationSec: 180 },
    sellValue: 145,
  },
  {
    id: 'recipe_adobo',
    foodId: 'food_cooked_adobo',
    name: 'Adobong Pusit / Bataan',
    description: 'Rich soy-vinegar garlic adobo with Oregano. Restores 185 HP, 55 SP + ATK +30% (4 min).',
    ingredients: [
      { itemId: 'fish_pusit', label: 'Pusit (or any fish)', qty: 1 },
      { itemId: 'mat_oregano', label: 'Oregano (Kalabo)', qty: 1 },
    ],
    hpRestore: 185,
    spRestore: 55,
    energyRestore: 60,
    buff: { stat: 'atk_up', label: 'Adobo ATK +30%', multiplier: 1.3, durationSec: 240 },
    sellValue: 215,
  },
  {
    id: 'recipe_kinilaw',
    foodId: 'food_cooked_kinilaw',
    name: 'Kinilaw na Lapu-Lapu',
    description: 'Citrus-cured coastal delicacy with Kalamansi and Mango. Full vigor + Lucky Drop +40% (5 min).',
    ingredients: [
      { itemId: 'fish_lapu_lapu', label: 'Lapu-Lapu (or any fish)', qty: 1 },
      { itemId: 'mat_kalamansi', label: 'Kalamansi Citrus', qty: 1 },
      { itemId: 'mat_mangga', label: 'Manggang Bataan', qty: 1 },
    ],
    hpRestore: 210,
    spRestore: 70,
    energyRestore: 75,
    buff: { stat: 'lucky_drop', label: 'Kinilaw LUCK +40%', multiplier: 1.4, durationSec: 300 },
    sellValue: 295,
  },
];

export function getFishById(id: string): FishDef | undefined {
  return FILIPINO_FISH.find((f) => f.id === id);
}

export function getMaterialById(id: string): GatherItemDef | undefined {
  return GATHER_AND_MATERIAL_ITEMS.find((m) => m.id === id);
}

export function rollRandomFilipinoFish(luckyMult = 1): FishDef {
  const weights = FILIPINO_FISH.map((f) =>
    f.rarity === 'Rare' || f.rarity === 'Epic' ? f.catchWeight * luckyMult : f.catchWeight
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < FILIPINO_FISH.length; i++) {
    r -= weights[i];
    if (r <= 0) return FILIPINO_FISH[i];
  }
  return FILIPINO_FISH[0];
}

export function getZoneLabel(zoneId: ZoneId): string {
  const map: Record<ZoneId, string> = {
    defender_home: 'Defender Home',
    dinalupihan: 'Dinalupihan',
    hermosa: 'Hermosa',
    orani: 'Orani',
    samal: 'Samal',
    abucay: 'Abucay',
    balanga: 'Balanga City',
    pilar: 'Pilar',
    orion: 'Orion',
    limay: 'Limay',
    mariveles: 'Mariveles',
    bagac: 'Bagac',
    morong: 'Morong',
    farming_fields: 'Palayan Farming Grounds',
    natib_cave: 'Mt. Natib Mining Cave',
  };
  return map[zoneId] || zoneId;
}
