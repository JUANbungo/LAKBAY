import { BossGender, BossProfile, BossProgressionState, BossRole } from './bataanData';
import { RpgStatAllocation } from './magicSkillsData';
import { WeatherMode } from './worldPolishAndWeather';
export type { RpgStatAllocation, WeatherMode };

export type GameScreen =
  | 'TITLE_MENU'
  | 'STORY_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'DEFEATED'
  | 'CREDITS'
  | 'DREAM_WAKEUP';

export type ActiveModal =
  | null
  | { type: 'story' }
  | { type: 'houses'; focusHouseId?: string }
  | { type: 'tropa'; focusFriendId?: string }
  | { type: 'inventory'; initialTab?: 'gear' | 'food' | 'loot' | 'bike' | 'materials' | 'fish' }
  | { type: 'map' }
  | { type: 'achievements' }
  | { type: 'hero_ghost'; heroId: string; isNewGift: boolean }
  | { type: 'npc'; npcId: string; tab?: 'talk' | 'shop' | 'social' }
  | { type: 'news' }
  | { type: 'cooking' }
  | { type: 'side_jobs' };

export type ZoneId =
  | 'defender_home'
  | 'dinalupihan'
  | 'hermosa'
  | 'orani'
  | 'samal'
  | 'abucay'
  | 'balanga'
  | 'pilar'
  | 'orion'
  | 'limay'
  | 'mariveles'
  | 'bagac'
  | 'morong'
  | 'farming_fields'
  | 'natib_cave';

export type BgmTrackId =
  | 'title_march'
  | 'bahay_kubo'
  | 'leron_leron'
  | 'sitsiritsit'
  | 'haunted_kundiman'
  | 'boss_battle';

export type VoiceCharacterStyle =
  | 'kapitan'
  | 'payong_seller'
  | 'sorbetero'
  | 'street_vendor'
  | 'driver'
  | 'teacher'
  | 'girl_npc'
  | 'police_female'
  | 'soldier_male'
  | 'hero_ghost_male'
  | 'hero_ghost_female'
  | 'aspin'
  | 'albularyo'
  | 'mangkukulam'
  | 'boss_male'
  | 'boss_female'
  | 'mastermind';

export interface VoiceProfile {
  pitch: number;
  rate: number;
  style: VoiceCharacterStyle;
}

export type CompanionStyle = 'duelist' | 'healer' | 'bard' | 'aspin' | 'gunner';
export type VehicleKind =
  | 'jeepney'
  | 'bus'
  | 'tricycle'
  | 'delivery_tricycle'
  | 'patrol_car'
  | 'rescue_van'
  | 'motorcycle';
export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Relic';
export type GearSlot = 'outfit' | 'headgear' | 'back' | 'weapon' | 'accessory' | 'hair' | 'umbrella' | 'bike';

export type OutfitVisualStyle = 'tshirt' | 'defender_vest' | 'barong' | 'trenchcoat' | 'armor_coat' | 'mantle';
export type HeadgearVisualStyle = 'none' | 'defender_headband' | 'salakot' | 'cap' | 'circlet' | 'mask';
export type BackVisualStyle = 'none' | 'satchel' | 'scarf' | 'shawl' | 'sun_mantle';
export type WeaponVisualStyle =
  | 'unarmed'
  | 'ang_payong'
  | 'megaphone'
  | 'itak'
  | 'balisong'
  | 'dambana_staff'
  | 'guitar_blade'
  | 'la_pluma'
  | 'bolo_katipunan'
  | 'kampilan'
  | 'sable_luna'
  | 'tirador';

export type NpcVisualKind =
  | 'kap_ben'
  | 'aling_nena'
  | 'sorbetero'
  | 'street_vendor'
  | 'jeepney_driver'
  | 'teacher'
  | 'mechanic'
  | 'aspin'
  | 'honest_police'
  | 'honest_soldier'
  | 'journalist_girl'
  | 'albularyo'
  | 'mangkukulam'
  | 'el_mastermind'
  | 'dispatch_officer';

export type MobKind =
  | 'thief'
  | 'robber'
  | 'bad_guy'
  | 'bad_woman'
  | 'bully_kid'
  | 'fat_guy'
  | 'asong_ulol'
  | 'insekto'
  | 'cobra'
  | 'balete_tree'
  | 'tiyanak'
  | 'white_lady'
  | 'aswang'
  | 'corrupt_politician'
  | 'evil_pastor'
  | 'corrupted_priest'
  | 'corrupt_police'
  | 'corrupt_soldier'
  | 'rodent_daga'
  | 'bukid_pest'
  | 'cave_bat'
  | 'cave_spider'
  | 'cave_centipede';

export type ZoneLighting = 'day' | 'golden' | 'dusk' | 'haunted_night' | 'cave_dark';

export type ArchitectureStyle =
  | 'homestead'
  | 'plaza_gazebo'
  | 'mt_samat'
  | 'beach_bangka'
  | 'old_church'
  | 'balete_grove'
  | 'school_bataan'
  | 'highway_gas'
  | 'capitol_plaza'
  | 'industrial_port'
  | 'heritage_coast'
  | 'farming_palayan'
  | 'mining_cave';

export type CommercialBuildingKind = '7_elevate' | 'osulit' | 'patrol_gas';
export type AmbientAnimalKind = 'kalabaw' | 'aspin' | 'manok';

export interface ZoneBuildingSpawn {
  kind: CommercialBuildingKind;
  x: number;
}

export interface ZoneAnimalSpawn {
  kind: AmbientAnimalKind;
  x: number;
}

export interface ZoneLandmarkSpawn {
  spriteId: string;
  x: number;
  height?: number;
}

export interface RpgGearItem {
  id: string;
  slot: GearSlot;
  name: string;
  rarity: ItemRarity;
  price: number;
  sellValue: number;
  primaryColor: string;
  accentColor: string;
  description: string;
  statNote: string;
  shopSource: 'payong_shop' | 'armory' | 'talyer' | 'starter' | 'drop';
  outfitStyle?: OutfitVisualStyle;
  headgearStyle?: HeadgearVisualStyle;
  backStyle?: BackVisualStyle;
  weaponStyle?: WeaponVisualStyle;
  bonusAtk?: number;
  bonusDef?: number;
  bonusHp?: number;
  bonusSp?: number;
  bonusCrit?: number;
  bonusSpeed?: number;
  bonusSpRegen?: number;
  bonusPesoMult?: number;
}

export interface LootItemDef {
  id: string;
  name: string;
  rarity: ItemRarity;
  sellValue: number;
  description: string;
  iconKind: 'ebidensya' | 'corrupt_ledger' | 'cash_bundle' | 'balete_charm';
}

export interface ZonePortal {
  x: number;
  targetZone: ZoneId;
  targetSpawnX: number;
  label: string;
  direction: 'left' | 'right';
}

export interface ZoneNpcSpawn {
  id: string;
  name: string;
  title: string;
  x: number;
  npcVisual: NpcVisualKind;
  shopType?: 'carinderia' | 'payong_shop' | 'armory' | 'talyer' | 'jeepney' | 'white_magic' | 'black_magic' | 'news_desk' | 'side_jobs';
  friendId?: string;
  coatColor: string;
  accentColor: string;
  hairColor: string;
  isAspin?: boolean;
  isMastermindNpc?: boolean;
  greeting: string;
  englishHint: string;
  voiceProfile: VoiceProfile;
}

export interface ZoneMobSpawn {
  x: number;
  kind: MobKind;
  level: number;
}

export interface GatherNodeSpawn {
  id: string;
  x: number;
  itemId: string;
  label?: string;
}

export interface OreNodeSpawn {
  id: string;
  x: number;
  oreId: 'ore_tanso' | 'ore_bakal' | 'ore_pilak' | 'ore_ginto';
  label?: string;
}

export interface FishingSpotSpawn {
  id: string;
  x: number;
  label: string;
}

export interface ZoneDef {
  id: ZoneId;
  order: number;
  name: string;
  subtitle: string;
  lighting: ZoneLighting;
  bgmTrack: BgmTrackId;
  width: number;
  skyTop: string;
  skyBottom: string;
  horizonColor: string;
  fogColor: string;
  rainIntensity: number;
  hasTraffic: boolean;
  hasPracticeDummy?: boolean;
  dummyX?: number;
  hasHearth?: boolean;
  hearthX?: number;
  hasElMastermind?: boolean;
  elMastermindX?: number;
  hasDambanaShrine?: boolean;
  dambanaShrineX?: number;
  houseId?: string;
  houseX?: number;
  safeSpawnX: number;
  portals: ZonePortal[];
  npcs: ZoneNpcSpawn[];
  mobs: ZoneMobSpawn[];
  gatherNodes?: GatherNodeSpawn[];
  oreNodes?: OreNodeSpawn[];
  fishingSpots?: FishingSpotSpawn[];
  architectureStyle: ArchitectureStyle;
  landmark?: ZoneLandmarkSpawn;
  buildings?: ZoneBuildingSpawn[];
  animals?: ZoneAnimalSpawn[];
  viceMayorX?: number;
  mayorX?: number;
  bossDropGearId?: string;
}

export interface HouseDef {
  id: string;
  zoneId: ZoneId;
  name: string;
  townName: string;
  price: number;
  style: string;
  description: string;
  buffSummary: string;
  wallTint: string;
  windowTint: string;
}

export interface DecorDef {
  id: string;
  name: string;
  price: number;
  slot: 'ceiling' | 'wall_left' | 'altar' | 'window' | 'corner';
  statSummary: string;
  description: string;
  bonusHp?: number;
  bonusSp?: number;
  bonusAtk?: number;
  bonusDef?: number;
  bonusCrit?: number;
  bonusSpRegen?: number;
  bonusBondMult?: number;
  bonusPesoMult?: number;
}

export interface FriendDef {
  id: string;
  name: string;
  role: string;
  homeZoneId: ZoneId;
  homeTownName: string;
  npcVisual: NpcVisualKind;
  combatStyle: CompanionStyle;
  styleLabel: string;
  favoriteFoodIds: string[];
  coatColor: string;
  accentColor: string;
  hairColor: string;
  isAspin?: boolean;
  bio: string;
  passiveLabel: string;
  voiceProfile: VoiceProfile;
  rankDialogues: [string, string, string, string, string];
}

export interface FoodDef {
  id: string;
  name: string;
  price: number;
  sellValue: number;
  hpRestore: number;
  spRestore: number;
  energyRestore: number;
  description: string;
  buff?: {
    stat: 'atk_up' | 'def_up' | 'speed_up' | 'lucky_drop';
    label: string;
    multiplier: number;
    durationSec: number;
  };
}

export interface StoryBeat {
  id: string;
  chapterLabel: string;
  title: string;
  body: string;
  caption: string;
  voiceLine: string;
  sceneKind: 'plaza' | 'corrupt' | 'folklore' | 'mastermind';
}

export interface StoryChapter {
  id: string;
  actNumber: number;
  title: string;
  subtitle: string;
  summary: string;
  objectiveText: string;
  rewardPesos: number;
  rewardXp: number;
  targetZoneId: ZoneId;
  targetBossId?: string;
  isPrologue?: boolean;
}

export interface PlayerProgress {
  storyIntroSeen: boolean;
  zoneId: ZoneId;
  spawnX: number;
  level: number;
  xp: number;
  pesos: number;
  hp: number;
  sp: number;
  energy: number;
  mood: number;
  sanctuaryBuffSec: number;
  timeOfDay: number; // 0..24 hour clock
  visitedZones: ZoneId[];
  defeatedBossIds: string[];
  bossProgression: BossProgressionState;
  completedChapterIds: string[];
  prologueTalkedKapBen: boolean;
  prologueDummyHits: number;
  prologueRested: boolean;
  ownedHouseIds: string[];
  homeDecorIds: string[];
  friendBonds: Record<string, number>;
  metFriendIds: string[];
  activeCompanionId: string | null;
  foodPouch: Record<string, number>;
  lootBag: Record<string, number>;
  equippedFoodId: string | null;
  ownedGearIds: string[];
  equippedOutfitId: string;
  equippedHairId: string;
  equippedHeadgearId: string | null;
  equippedBackId: string | null;
  equippedWeaponId: string | null;
  equippedAccessoryId: string | null;
  hasUmbrella: boolean;
  umbrellaOpen: boolean;
  hasBike: boolean;
  ridingBike: boolean;
  hasDambanaBadge: boolean;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  voiceEnabled: boolean;
  // Awakened Dream Expansion persistence
  awakenedCount: number;
  unlockedAchievementIds: string[];
  unlockedBikeSkinIds: string[];
  equippedBikeSkinId: string;
  metHeroGhostIds: string[];
  awakenedBossesDefeated: string[];
  deflectedBulletsCount: number;
  shieldsBrokenCount: number;
  // RPG Stat Allocation & White/Black Magic Systems
  statAllocation: RpgStatAllocation;
  learnedMagicSkillIds: string[];
  metAlbularyo: boolean;
  metMangkukulam: boolean;
  // Life-Skills, Materials, Fishing, Audio & HUD Settings
  materialsBag: Record<string, number>;
  fishBag: Record<string, number>;
  hasFishingRod: boolean;
  sfxVolume: number;
  bgmVolume: number;
  hudLayoutMode: 'auto' | 'desktop' | 'mobile';
}

export interface ActiveBuffState {
  stat: 'atk_up' | 'def_up' | 'speed_up' | 'lucky_drop';
  label: string;
  multiplier: number;
  remainingSec: number;
  maxSec: number;
}

export interface PlayerDebuffHud {
  soaked: boolean;
  burn: boolean;
  poison: number;
  stun: number;
  freeze: number;
  confusion: number;
  shadow: number;
  slow: number;
  bleed: number;
  blind: number;
}

export interface ActiveSideJobState {
  kind: 'food_delivery' | 'taxi';
  title: string;
  pickupLabel: string;
  targetZoneId: ZoneId;
  targetZoneName: string;
  targetX: number;
  targetLabel: string;
  remainingSec: number;
  maxSec: number;
  basePay: number;
  bonusPay: number;
  xpReward: number;
}

export interface FishingHudState {
  phase: 'casting' | 'waiting' | 'bite' | 'reeling';
  fishName?: string;
  reelProgress: number; // 0..1
  cursorPos: number; // 0..1
  zoneCenter: number; // 0..1
  zoneWidth: number;
  timeLeft: number;
}

export interface DerivedStats {
  maxHp: number;
  maxSp: number;
  atk: number;
  def: number;
  critChance: number;
  critDamageMult: number;
  magicPowerMult: number;
  spRegen: number;
  moveSpeed: number;
  bondMult: number;
  pesoMult: number;
}

export interface InteractTarget {
  kind:
    | 'npc'
    | 'house'
    | 'portal'
    | 'hearth'
    | 'dummy'
    | 'dambana'
    | 'mastermind'
    | 'hero_ghost'
    | 'fishing_spot'
    | 'gather_node'
    | 'ore_node'
    | 'side_job_dropoff';
  id: string;
  label: string;
  sublabel: string;
  x: number;
}

export interface BossHudState {
  id: string;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  shieldHp?: number;
  shieldMax?: number;
  role?: BossRole | 'FINAL_BOSS' | 'AWAKENED_BOSS';
  gender?: BossGender;
  profile?: BossProfile;
  immune?: boolean;
  phase?: 1 | 2;
  weakSpotActive?: boolean;
  telegraphLabel?: string;
}

export type TiradorAmmoKind = 'river_pebble' | 'agimat_stone' | 'sili_bomb';

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  xp: number;
  xpNext: number;
  energy: number;
  mood: number;
  sanctuaryBuffSec: number;
  comboCount: number;
  timeOfDay: number;
  isNight: boolean;
  currentBarangay: string;
  nearestTarget: InteractTarget | null;
  bossHud: BossHudState | null;
  speechBanner: { speaker: string; text: string } | null;
  companionStatus: { name: string; action: string } | null;
  activeBgmLabel: string;
  magicCooldowns: Record<string, number>;
  shieldCooldown: number;
  shieldCooldownMax: number;
  dodgeCooldown: number;
  dodgeCooldownMax: number;
  activeBuffs: ActiveBuffState[];
  accuracyPct: number;
  availableStatPoints: number;
  weatherMode?: WeatherMode;
  playerDebuffs?: PlayerDebuffHud;
  activeTiradorAmmo?: TiradorAmmoKind;
  activeSideJob?: ActiveSideJobState | null;
  fishingHud?: FishingHudState | null;
}

export interface WorldBridge {
  triggerAttack: () => void;
  triggerShield: () => void;
  triggerSkill: () => void;
  cycleTiradorAmmo?: () => void;
  castMagicSkill: (skillId: string) => void;
  triggerDash: () => void;
  triggerJump: () => void;
  triggerInteract: () => void;
  setTouchMove: (dir: -1 | 0 | 1) => void;
  applyFullRest: () => void;
  applyFoodHeal: (
    hp: number,
    sp: number,
    energy: number,
    foodName: string,
    buff?: FoodDef['buff']
  ) => void;
  spawnBanner: (speaker: string, text: string) => void;
  triggerDuetBurst: (friendName: string) => void;
  toggleDayNight: () => void;
  cycleWeather: () => void;
  triggerFishingAction?: () => void;
  setFishingHold?: (holding: boolean) => void;
  cancelFishing?: () => void;
  startSideJob?: (job: ActiveSideJobState) => void;
  cancelSideJob?: () => void;
}
