// Complete 67-Sprite 8-Frame Atlas Loader & Manifest Engine for Bataan: Laban sa Korapsyon
// Powered by attached bataan_atlas_manifest.json, 3 sprite atlases, and bataan_cover_art.png

import { BossProfile } from './bataanData';
import { MobKind } from './types';
import { initV2Sprites, subscribeV2Loaded } from './v2Sprites';
import { removeStrayFloatingArtifacts } from './worldPolishAndWeather';

export const COVER_ART_URL = '/assets/aistudio/bataan_cover_art_4a08b526.png';
export const MANIFEST_URL = '/assets/aistudio/bataan_atlas_manifest_fbc6c4b0.json';

export const ATLAS_URLS: Record<string, string> = {
  'bataan_atlas_1_hero_world.png': '/assets/aistudio/bataan_atlas_1_hero_world_cb6f6672.png',
  'bataan_atlas_2_enemies.png': '/assets/aistudio/bataan_atlas_2_enemies_9873624a.png',
  'bataan_atlas_3_bosses.png': '/assets/aistudio/bataan_atlas_3_bosses_d083f842.png',
};

export type AtlasAnimationType =
  | 'vehicle_roll'
  | 'idle_bob'
  | 'aggressive_lunge'
  | 'hover_float'
  | 'pulse_glow'
  | 'scenery_sway'
  | 'wing_flap';

export interface ManifestSpriteEntry {
  id: string;
  category: string;
  animation_type: AtlasAnimationType;
  atlas_file: string;
  x: number;
  y: number;
  strip_width: number;
  strip_height: number;
  frames: number;
  frame_width: number;
  frame_height: number;
}

export interface AtlasSpriteEntry {
  id: string;
  category: string;
  animationType: AtlasAnimationType;
  atlas: string;
  x: number;
  y: number;
  stripWidth: number;
  stripHeight: number;
  frames: number;
  fw: number;
  fh: number;
  fps: number;
  /** Native facing direction in the raw atlas image: 1 = faces right/front, -1 = faces left */
  nativeFacing: 1 | -1;
}

const ANIMATION_FPS: Record<AtlasAnimationType, number> = {
  vehicle_roll: 11,
  aggressive_lunge: 13,
  wing_flap: 13,
  idle_bob: 8,
  hover_float: 8,
  pulse_glow: 8,
  scenery_sway: 5,
};

// Sprites whose raw artwork faces LEFT natively (flip when moving right)
const LEFT_FACING_SPRITES = new Set<string>(['asong_ulol', 'kalabaw_carabao', 'jeepney_and_driver']);

function makeEntry(m: ManifestSpriteEntry): AtlasSpriteEntry {
  return {
    id: m.id,
    category: m.category,
    animationType: m.animation_type,
    atlas: m.atlas_file,
    x: m.x,
    y: m.y,
    stripWidth: m.strip_width,
    stripHeight: m.strip_height,
    frames: m.frames,
    fw: m.frame_width,
    fh: m.frame_height,
    fps: ANIMATION_FPS[m.animation_type] ?? 8,
    nativeFacing: LEFT_FACING_SPRITES.has(m.id) ? -1 : 1,
  };
}

// Exact 67 sprite entries from bataan_atlas_manifest_fbc6c4b0.json (preloaded synchronously + hydrated via fetch)
const RAW_MANIFEST_SPRITES: ManifestSpriteEntry[] = [
  // Atlas 1: Hero, NPCs, Objects, Animals, Buildings, Locations (30 sprites)
  { id: 'hero_biking_payong', category: 'hero', animation_type: 'vehicle_roll', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 4, strip_width: 1128, strip_height: 184, frames: 8, frame_width: 141, frame_height: 184 },
  { id: 'hero_standing_bike', category: 'hero', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1136, y: 4, strip_width: 1328, strip_height: 184, frames: 8, frame_width: 166, frame_height: 184 },
  { id: 'hero_payong_attack', category: 'hero', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 192, strip_width: 1200, strip_height: 184, frames: 8, frame_width: 150, frame_height: 184 },
  { id: 'ang_payong', category: 'objects', animation_type: 'hover_float', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1208, y: 192, strip_width: 1336, strip_height: 169, frames: 8, frame_width: 167, frame_height: 169 },
  { id: 'street_food_vendor', category: 'npcs', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 380, strip_width: 1392, strip_height: 160, frames: 8, frame_width: 174, frame_height: 160 },
  { id: 'hero_bike_dash_attack', category: 'hero', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1400, y: 380, strip_width: 1472, strip_height: 157, frames: 8, frame_width: 184, frame_height: 157 },
  { id: 'kap_ben_job_giver', category: 'npcs', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 544, strip_width: 1432, strip_height: 154, frames: 8, frame_width: 179, frame_height: 154 },
  { id: 'aling_nena_payong_seller', category: 'npcs', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1440, y: 544, strip_width: 1472, strip_height: 153, frames: 8, frame_width: 184, frame_height: 153 },
  { id: 'mamang_sorbetero', category: 'npcs', animation_type: 'vehicle_roll', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 702, strip_width: 1240, strip_height: 153, frames: 8, frame_width: 155, frame_height: 153 },
  { id: 'arid_bottle', category: 'objects', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1248, y: 702, strip_width: 704, strip_height: 146, frames: 8, frame_width: 88, frame_height: 146 },
  { id: 'corrupt_ledger', category: 'objects', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 859, strip_width: 1144, strip_height: 145, frames: 8, frame_width: 143, frame_height: 145 },
  { id: 'ebidensya', category: 'objects', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1152, y: 859, strip_width: 1312, strip_height: 143, frames: 8, frame_width: 164, frame_height: 143 },
  { id: 'san_jose_stone_church', category: 'locations', animation_type: 'scenery_sway', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1008, strip_width: 1280, strip_height: 143, frames: 8, frame_width: 160, frame_height: 143 },
  { id: 'megaphone', category: 'objects', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1288, y: 1008, strip_width: 1352, strip_height: 140, frames: 8, frame_width: 169, frame_height: 140 },
  { id: 'barangay_barrier', category: 'objects', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1155, strip_width: 1288, strip_height: 135, frames: 8, frame_width: 161, frame_height: 135 },
  { id: 'pito_whistle', category: 'objects', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1296, y: 1155, strip_width: 1240, strip_height: 132, frames: 8, frame_width: 155, frame_height: 132 },
  { id: 'bisikleta', category: 'objects', animation_type: 'vehicle_roll', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1294, strip_width: 1472, strip_height: 124, frames: 8, frame_width: 184, frame_height: 124 },
  { id: 'manok_rooster', category: 'animals', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1480, y: 1294, strip_width: 824, strip_height: 122, frames: 8, frame_width: 103, frame_height: 122 },
  { id: 'kalabaw_carabao', category: 'animals', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1422, strip_width: 1312, strip_height: 120, frames: 8, frame_width: 164, frame_height: 120 },
  { id: 'bataan_beach_bangka', category: 'locations', animation_type: 'scenery_sway', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1320, y: 1422, strip_width: 1280, strip_height: 116, frames: 8, frame_width: 160, frame_height: 116 },
  { id: 'station_patrol_gas', category: 'buildings', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1546, strip_width: 1472, strip_height: 115, frames: 8, frame_width: 184, frame_height: 115 },
  { id: 'paaralang_bataan', category: 'locations', animation_type: 'scenery_sway', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1480, y: 1546, strip_width: 1280, strip_height: 114, frames: 8, frame_width: 160, frame_height: 114 },
  { id: 'shop_o_sulit', category: 'buildings', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1665, strip_width: 1472, strip_height: 113, frames: 8, frame_width: 184, frame_height: 113 },
  { id: 'shop_7_elevate', category: 'buildings', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1782, strip_width: 1472, strip_height: 111, frames: 8, frame_width: 184, frame_height: 111 },
  { id: 'aspin_askal', category: 'animals', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1480, y: 1782, strip_width: 784, strip_height: 105, frames: 8, frame_width: 98, frame_height: 105 },
  { id: 'dambana_mt_samat', category: 'locations', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 1897, strip_width: 1280, strip_height: 105, frames: 8, frame_width: 160, frame_height: 105 },
  { id: 'jeepney_and_driver', category: 'npcs', animation_type: 'vehicle_roll', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1288, y: 1897, strip_width: 1472, strip_height: 99, frames: 8, frame_width: 184, frame_height: 99 },
  { id: 'bataan_cashew', category: 'objects', animation_type: 'hover_float', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 2006, strip_width: 1104, strip_height: 95, frames: 8, frame_width: 138, frame_height: 95 },
  { id: 'dambana_badge', category: 'objects', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_1_hero_world.png', x: 1112, y: 2006, strip_width: 1064, strip_height: 93, frames: 8, frame_width: 133, frame_height: 93 },
  { id: 'plaza_garden_gazebo', category: 'locations', animation_type: 'scenery_sway', atlas_file: 'bataan_atlas_1_hero_world.png', x: 4, y: 2105, strip_width: 1280, strip_height: 54, frames: 8, frame_width: 160, frame_height: 54 },

  // Atlas 2: Enemies & Folklore Horror (25 sprites)
  { id: 'evil_pastor', category: 'enemies_horror', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 4, strip_width: 1464, strip_height: 184, frames: 8, frame_width: 183, frame_height: 184 },
  { id: 'tiyanak_1', category: 'enemies_horror', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 1472, y: 4, strip_width: 1400, strip_height: 184, frames: 8, frame_width: 175, frame_height: 184 },
  { id: 'tiyanak_2', category: 'enemies_horror', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 192, strip_width: 1336, strip_height: 184, frames: 8, frame_width: 167, frame_height: 184 },
  { id: 'white_lady', category: 'enemies_horror', animation_type: 'hover_float', atlas_file: 'bataan_atlas_2_enemies.png', x: 1344, y: 192, strip_width: 1120, strip_height: 184, frames: 8, frame_width: 140, frame_height: 184 },
  { id: 'insekto_wasp', category: 'enemies_horror', animation_type: 'wing_flap', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 380, strip_width: 1472, strip_height: 177, frames: 8, frame_width: 184, frame_height: 177 },
  { id: 'insekto_cockroach', category: 'enemies_horror', animation_type: 'wing_flap', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 561, strip_width: 1472, strip_height: 171, frames: 8, frame_width: 184, frame_height: 171 },
  { id: 'vice_mayor_corrupt_default', category: 'enemies', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_2_enemies.png', x: 1480, y: 561, strip_width: 1320, strip_height: 161, frames: 8, frame_width: 165, frame_height: 161 },
  { id: 'corrupted_priest', category: 'enemies', animation_type: 'hover_float', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 736, strip_width: 1376, strip_height: 161, frames: 8, frame_width: 172, frame_height: 161 },
  { id: 'final_boss_el_mastermind_portrait', category: 'enemies', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_2_enemies.png', x: 1384, y: 736, strip_width: 1240, strip_height: 160, frames: 8, frame_width: 155, frame_height: 160 },
  { id: 'asong_ulol', category: 'enemies_horror', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 901, strip_width: 1472, strip_height: 159, frames: 8, frame_width: 184, frame_height: 159 },
  { id: 'fat_guy', category: 'enemies', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_2_enemies.png', x: 1480, y: 901, strip_width: 1376, strip_height: 158, frames: 8, frame_width: 172, frame_height: 158 },
  { id: 'thief', category: 'enemies', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1064, strip_width: 1472, strip_height: 157, frames: 8, frame_width: 184, frame_height: 157 },
  { id: 'robber', category: 'enemies', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 1480, y: 1064, strip_width: 1328, strip_height: 157, frames: 8, frame_width: 166, frame_height: 157 },
  { id: 'cobra', category: 'enemies', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1225, strip_width: 1376, strip_height: 156, frames: 8, frame_width: 172, frame_height: 156 },
  { id: 'bad_woman', category: 'enemies', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 1384, y: 1225, strip_width: 1240, strip_height: 155, frames: 8, frame_width: 155, frame_height: 155 },
  { id: 'mayor_corrupt_default', category: 'enemies', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1385, strip_width: 1472, strip_height: 148, frames: 8, frame_width: 184, frame_height: 148 },
  { id: 'aswang', category: 'enemies', animation_type: 'wing_flap', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1537, strip_width: 1472, strip_height: 148, frames: 8, frame_width: 184, frame_height: 148 },
  { id: 'corrupt_politicians', category: 'enemies', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1689, strip_width: 1472, strip_height: 142, frames: 8, frame_width: 184, frame_height: 142 },
  { id: 'bad_guys', category: 'enemies', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1835, strip_width: 1472, strip_height: 140, frames: 8, frame_width: 184, frame_height: 140 },
  { id: 'bully_kids', category: 'enemies', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 1979, strip_width: 1472, strip_height: 136, frames: 8, frame_width: 184, frame_height: 136 },
  { id: 'balete_tree', category: 'enemies_horror', animation_type: 'scenery_sway', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 2119, strip_width: 1472, strip_height: 130, frames: 8, frame_width: 184, frame_height: 130 },
  { id: 'mga_tiyanak_pair', category: 'enemies_horror', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 2253, strip_width: 1472, strip_height: 125, frames: 8, frame_width: 184, frame_height: 125 },
  { id: 'insekto_swarm', category: 'enemies_horror', animation_type: 'wing_flap', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 2382, strip_width: 1472, strip_height: 124, frames: 8, frame_width: 184, frame_height: 124 },
  { id: 'insekto_centipede', category: 'enemies_horror', animation_type: 'aggressive_lunge', atlas_file: 'bataan_atlas_2_enemies.png', x: 4, y: 2510, strip_width: 1472, strip_height: 108, frames: 8, frame_width: 184, frame_height: 108 },
  { id: 'final_boss_el_mastermind_scene', category: 'enemies', animation_type: 'pulse_glow', atlas_file: 'bataan_atlas_2_enemies.png', x: 1480, y: 2510, strip_width: 1280, strip_height: 88, frames: 8, frame_width: 160, frame_height: 88 },

  // Atlas 3: 12 Named Town Bosses (12 sprites)
  { id: 'mayor_01_dona_remedios', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 4, y: 4, strip_width: 1216, strip_height: 184, frames: 8, frame_width: 152, frame_height: 184 },
  { id: 'mayor_02_arturo_balboa', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 1224, y: 4, strip_width: 1256, strip_height: 184, frames: 8, frame_width: 157, frame_height: 184 },
  { id: 'mayor_03_veronica_delos_santos', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 4, y: 192, strip_width: 1288, strip_height: 184, frames: 8, frame_width: 161, frame_height: 184 },
  { id: 'mayor_04_gregorio_cruz', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 1296, y: 192, strip_width: 1312, strip_height: 184, frames: 8, frame_width: 164, frame_height: 184 },
  { id: 'mayor_05_bianca_alcantara', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 4, y: 380, strip_width: 1160, strip_height: 184, frames: 8, frame_width: 145, frame_height: 184 },
  { id: 'mayor_06_don_esteban_salcedo', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 1168, y: 380, strip_width: 1120, strip_height: 184, frames: 8, frame_width: 140, frame_height: 184 },
  { id: 'vice_mayor_01_carla_mendoza', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 4, y: 568, strip_width: 1056, strip_height: 184, frames: 8, frame_width: 132, frame_height: 184 },
  { id: 'vice_mayor_02_dante_soriano', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 1064, y: 568, strip_width: 960, strip_height: 184, frames: 8, frame_width: 120, frame_height: 184 },
  { id: 'vice_mayor_03_evelyn_ramos', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 4, y: 756, strip_width: 1216, strip_height: 184, frames: 8, frame_width: 152, frame_height: 184 },
  { id: 'vice_mayor_04_marco_villanueva', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 1224, y: 756, strip_width: 1288, strip_height: 184, frames: 8, frame_width: 161, frame_height: 184 },
  { id: 'vice_mayor_05_teresita_pangilinan', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 4, y: 944, strip_width: 1168, strip_height: 184, frames: 8, frame_width: 146, frame_height: 184 },
  { id: 'vice_mayor_06_hector_valderama', category: 'bosses_towns', animation_type: 'idle_bob', atlas_file: 'bataan_atlas_3_bosses.png', x: 1176, y: 944, strip_width: 1248, strip_height: 184, frames: 8, frame_width: 156, frame_height: 184 },
];

export const ATLAS_SPRITES: Record<string, AtlasSpriteEntry> = Object.fromEntries(
  RAW_MANIFEST_SPRITES.map((s) => [s.id, makeEntry(s)])
);

const loadedImages: Record<string, HTMLImageElement | null> = {};
const readyFlags: Record<string, boolean> = {};
const cleanedAtlasFrameCache = new Map<string, HTMLCanvasElement>();
const loadListeners = new Set<() => void>();
let initialized = false;

function getCleanedAtlasFrame(
  img: HTMLImageElement,
  spriteId: string,
  category: string,
  frameIdx: number,
  sx: number,
  sy: number,
  fw: number,
  fh: number
): HTMLCanvasElement | null {
  const key = `${spriteId}_${frameIdx}`;
  const cached = cleanedAtlasFrameCache.get(key);
  if (cached) return cached;
  const cw = Math.max(1, Math.round(fw));
  const ch = Math.max(1, Math.round(fh));
  const off = document.createElement('canvas');
  off.width = cw;
  off.height = ch;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return null;
  octx.drawImage(img, sx, sy, fw, fh, 0, 0, cw, ch);
  try {
    // Edge-only white-halo cleanup so no atlas strip has white paper fringes ("puti-puti")
    const imgData = octx.getImageData(0, 0, cw, ch);
    const d = imgData.data;
    const total = cw * ch;
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    let qHead = 0;
    let qTail = 0;

    const isOuterPaper = (idx4: number): boolean => {
      if (d[idx4 + 3] < 20) return true;
      const r = d[idx4], g = d[idx4 + 1], b = d[idx4 + 2];
      if (r > 236 && g > 236 && b > 236) return true;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      return minC > 214 && maxC - minC < 28;
    };
    const enqueue = (p: number) => {
      if (visited[p]) return;
      if (isOuterPaper(p * 4)) {
        visited[p] = 1;
        queue[qTail++] = p;
      }
    };
    for (let x = 0; x < cw; x++) {
      enqueue(x);
      enqueue((ch - 1) * cw + x);
    }
    for (let y = 1; y < ch - 1; y++) {
      enqueue(y * cw);
      enqueue(y * cw + (cw - 1));
    }
    while (qHead < qTail) {
      const p = queue[qHead++];
      const x = p % cw;
      const y = (p - x) / cw;
      if (x > 0) enqueue(p - 1);
      if (x + 1 < cw) enqueue(p + 1);
      if (y > 0) enqueue(p - cw);
      if (y + 1 < ch) enqueue(p + cw);
    }
    for (let p = 0; p < total; p++) {
      if (visited[p]) d[p * 4 + 3] = 0;
    }
    // 1px outer-edge defringe
    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const p = y * cw + x;
        const idx4 = p * 4;
        if (d[idx4 + 3] === 0) continue;
        const touchesBg =
          d[(p - 1) * 4 + 3] < 24 ||
          d[(p + 1) * 4 + 3] < 24 ||
          d[(p - cw) * 4 + 3] < 24 ||
          d[(p + cw) * 4 + 3] < 24;
        if (!touchesBg) continue;
        const r = d[idx4], g = d[idx4 + 1], b = d[idx4 + 2];
        const lum = (r + g + b) / 3;
        if (lum > 206 && Math.max(r, g, b) - Math.min(r, g, b) < 34) {
          d[idx4 + 3] = lum > 226 ? 0 : Math.round(d[idx4 + 3] * Math.max(0, (232 - lum) / 30));
        }
      }
    }
    octx.putImageData(imgData, 0, 0);

    // Never run stray artifact scrub on enemies, bosses, or winged creatures
    const skipScrub =
      category === 'enemies' ||
      category === 'enemies_horror' ||
      category === 'bosses_towns' ||
      category === 'npcs' ||
      spriteId.includes('aswang') ||
      spriteId.includes('white_lady') ||
      spriteId.includes('insekto');
    if (!skipScrub) {
      removeStrayFloatingArtifacts(off, 28);
    }
  } catch {
    // Fallback cleanly
  }
  cleanedAtlasFrameCache.set(key, off);
  return off;
}

function notifyLoaded() {
  loadListeners.forEach((fn) => fn());
}

export function subscribeAtlasLoaded(cb: () => void): () => void {
  loadListeners.add(cb);
  return () => {
    loadListeners.delete(cb);
  };
}

let atlasPreloadPromise: Promise<void> | null = null;

export function preloadSpriteAtlases(): Promise<void> {
  if (atlasPreloadPromise) return atlasPreloadPromise;
  if (typeof window === 'undefined') return Promise.resolve();
  initialized = true;

  initV2Sprites();
  subscribeV2Loaded(notifyLoaded);

  const imgTasks = Object.entries(ATLAS_URLS).map(([key, url]) => {
    return new Promise<void>((resolve) => {
      const existing = loadedImages[key];
      if (existing && readyFlags[key]) {
        resolve();
        return;
      }
      const img = existing || new Image();
      img.onload = () => {
        readyFlags[key] = true;
        notifyLoaded();
        resolve();
      };
      img.onerror = () => {
        readyFlags[key] = false;
        resolve();
      };
      if (!existing) {
        img.src = url;
        loadedImages[key] = img;
      } else if (existing.complete) {
        readyFlags[key] = existing.naturalWidth > 0;
        resolve();
      }
    });
  });

  const manifestTask = fetch(MANIFEST_URL)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { sprites?: ManifestSpriteEntry[] } | null) => {
      if (data?.sprites && Array.isArray(data.sprites)) {
        for (const s of data.sprites) {
          ATLAS_SPRITES[s.id] = makeEntry(s);
        }
        notifyLoaded();
      }
    })
    .catch(() => {
      // Preloaded coordinates remain active if fetch is unavailable
    });

  atlasPreloadPromise = Promise.all([...imgTasks, manifestTask]).then(() => undefined);
  return atlasPreloadPromise;
}

export function initSpriteAtlases(): void {
  if (initialized || typeof window === 'undefined') return;
  void preloadSpriteAtlases();
}

export function isAtlasSpriteReady(spriteId: string): boolean {
  initSpriteAtlases();
  const entry = ATLAS_SPRITES[spriteId];
  if (!entry) return false;
  return Boolean(readyFlags[entry.atlas] && loadedImages[entry.atlas]);
}

export function getAtlasImage(atlasFile: string): HTMLImageElement | null {
  initSpriteAtlases();
  if (!readyFlags[atlasFile]) return null;
  return loadedImages[atlasFile] || null;
}

export interface DrawAtlasOptions {
  hitFlash?: number;
  fixedFrame?: number;
  /** 0..1 progress mapped cleanly across frames 0..7 (ideal for attacks/dashes) */
  progress01?: number;
  alpha?: number;
  /** Optional override fps */
  fps?: number;
  /** Optional subtle rotation in radians */
  rotation?: number;
  /** Optional procedural forward lean / tilt in radians */
  tiltRad?: number;
  /** Optional squash-and-stretch scale */
  scaleX?: number;
  scaleY?: number;
  /** Optional vertical lift/bob offset in pixels */
  offsetY?: number;
  /** Clip sprite softly inside an oval (useful for framed scene portraits like El Mastermind) */
  clipOval?: boolean;
  /** Render scenic location plate with rounded top corners & crisp 16-bit architectural base border */
  scenicFrame?: boolean;
  /** Draw contact shadow on groundY beneath the sprite */
  shadowRadius?: number;
}

/**
 * Smoothly renders an 8-frame horizontal sprite strip from the attached Bataan atlases,
 * anchored at (x, bottomY) with exact manifest coordinates.
 */
export function drawAtlasSprite(
  ctx: CanvasRenderingContext2D,
  spriteId: string,
  x: number,
  bottomY: number,
  targetHeight: number,
  facing: 1 | -1,
  time: number,
  hitFlashOrOpts: number | DrawAtlasOptions = 0
): boolean {
  initSpriteAtlases();
  const entry = ATLAS_SPRITES[spriteId];
  if (!entry || !readyFlags[entry.atlas]) return false;
  const img = loadedImages[entry.atlas];
  if (!img) return false;

  const opts: DrawAtlasOptions =
    typeof hitFlashOrOpts === 'number' ? { hitFlash: hitFlashOrOpts } : hitFlashOrOpts;

  let frameIdx = 0;
  if (typeof opts.fixedFrame === 'number') {
    frameIdx = Math.max(0, Math.min(entry.frames - 1, Math.floor(opts.fixedFrame)));
  } else if (typeof opts.progress01 === 'number') {
    const clamped = Math.max(0, Math.min(0.999, opts.progress01));
    frameIdx = Math.floor(clamped * entry.frames);
  } else {
    const fps = opts.fps ?? entry.fps;
    frameIdx = Math.floor(Math.max(0, time) * fps) % entry.frames;
  }

  const sx = entry.x + frameIdx * entry.fw;
  const sy = entry.y;
  const aspect = entry.fw / entry.fh;
  const drawH = targetHeight;
  const drawW = targetHeight * aspect;
  const flipX = facing * entry.nativeFacing;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(bottomY + (opts.offsetY ?? 0)));

  if (opts.shadowRadius && opts.shadowRadius > 0) {
    const alt = Math.max(0, -(opts.offsetY ?? 0));
    const altScale = Math.max(0.35, 1 - alt / 190);
    ctx.fillStyle = `rgba(10, 18, 28, ${(0.42 * altScale).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(
      0,
      -(opts.offsetY ?? 0) + 1,
      opts.shadowRadius * altScale,
      Math.max(4, opts.shadowRadius * 0.24 * altScale),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  if (opts.alpha !== undefined) {
    ctx.globalAlpha = Math.max(0, Math.min(1, opts.alpha));
  }
  const totalRot = (opts.rotation ?? 0) + (opts.tiltRad ?? 0) * facing;
  if (totalRot !== 0) {
    ctx.rotate(totalRot);
  }
  const sxScale = (flipX === -1 ? -1 : 1) * (opts.scaleX ?? 1);
  const syScale = opts.scaleY ?? 1;
  if (sxScale !== 1 || syScale !== 1) {
    ctx.scale(sxScale, syScale);
  }
  if (opts.hitFlash && opts.hitFlash > 0) {
    ctx.filter = 'brightness(2.55) contrast(1.35) drop-shadow(0 0 8px rgba(255, 255, 255, 0.92))';
  }

  if (opts.clipOval) {
    ctx.beginPath();
    ctx.ellipse(0, -drawH * 0.5, drawW * 0.44, drawH * 0.48, 0, 0, Math.PI * 2);
    ctx.clip();
  } else if (opts.scenicFrame) {
    const r = 10;
    const left = -drawW / 2;
    const top = -drawH;
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(left, top + r);
    ctx.quadraticCurveTo(left, top, left + r, top);
    ctx.lineTo(left + drawW - r, top);
    ctx.quadraticCurveTo(left + drawW, top, left + drawW, top + r);
    ctx.lineTo(left + drawW, 0);
    ctx.closePath();
    ctx.clip();
  }

  // Smooth high-quality sampling for detailed 184px illustrated sprite strips
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const cleanedFrame =
    entry.category !== 'locations' && !opts.scenicFrame
      ? getCleanedAtlasFrame(img, spriteId, entry.category, frameIdx, sx, sy, entry.fw, entry.fh)
      : null;
  if (cleanedFrame) {
    ctx.drawImage(cleanedFrame, -drawW / 2, -drawH, drawW, drawH);
  } else {
    ctx.drawImage(img, sx, sy, entry.fw, entry.fh, -drawW / 2, -drawH, drawW, drawH);
  }

  if (opts.scenicFrame) {
    ctx.strokeStyle = 'rgba(17, 26, 38, 0.72)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-drawW / 2 + 1, -drawH + 1, drawW - 2, drawH - 1);
  }
  ctx.restore();
  return true;
}

/**
 * Draws a crisp portrait/icon crop of a sprite's 8-frame strip inside a square frame (e.g. HUD portrait or item badge).
 */
export function drawAtlasIconOrPortrait(
  ctx: CanvasRenderingContext2D,
  spriteId: string,
  size: number,
  time = 0,
  mode: 'bust' | 'contain' = 'contain'
): boolean {
  initSpriteAtlases();
  const entry = ATLAS_SPRITES[spriteId];
  if (!entry || !readyFlags[entry.atlas]) return false;
  const img = loadedImages[entry.atlas];
  if (!img) return false;

  const frameIdx = Math.floor(Math.max(0, time) * entry.fps) % entry.frames;
  const sx = entry.x + frameIdx * entry.fw;
  const sy = entry.y;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (mode === 'bust') {
    // Upper 68% crop centered on head & shoulders
    const cropH = Math.round(entry.fh * 0.68);
    const cropW = Math.min(entry.fw, Math.round(cropH * 1.0));
    const cropX = sx + Math.round((entry.fw - cropW) / 2);
    ctx.drawImage(img, cropX, sy + 2, cropW, cropH, 2, 2, size - 4, size - 4);
  } else {
    const pad = 3;
    const avail = size - pad * 2;
    const scale = Math.min(avail / entry.fw, avail / entry.fh);
    const dw = entry.fw * scale;
    const dh = entry.fh * scale;
    ctx.drawImage(img, sx, sy, entry.fw, entry.fh, (size - dw) / 2, (size - dh) / 2, dw, dh);
  }

  ctx.restore();
  return true;
}

// Exact Town Boss ID -> Atlas 3 / Atlas 2 Sprite Strip Mapping
const EXACT_BOSS_ATLAS_MAP: Record<string, string> = {
  // 6 Exact Named Mayors in Atlas 3
  mayor_hermosa: 'mayor_01_dona_remedios',
  mayor_dinalupihan: 'mayor_02_arturo_balboa',
  mayor_samal: 'mayor_03_veronica_delos_santos',
  mayor_orani: 'mayor_04_gregorio_cruz',
  mayor_abucay: 'mayor_05_bianca_alcantara',
  mayor_pilar: 'mayor_06_don_esteban_salcedo',

  // 6 Exact Named Vice Mayors in Atlas 3
  vm_dinalupihan: 'vice_mayor_01_carla_mendoza',
  vm_hermosa: 'vice_mayor_02_dante_soriano',
  vm_orani: 'vice_mayor_03_evelyn_ramos',
  vm_samal: 'vice_mayor_04_marco_villanueva',
  vm_abucay: 'vice_mayor_05_teresita_pangilinan',
  vm_balanga: 'vice_mayor_06_hector_valderama',

  // Remaining 12 Bataan Town Bosses mapped cleanly to matching gender/role Atlas 2 & Atlas 3 boss strips
  mayor_balanga: 'mayor_03_veronica_delos_santos',
  mayor_orion: 'mayor_corrupt_default',
  mayor_limay: 'mayor_05_bianca_alcantara',
  mayor_mariveles: 'mayor_02_arturo_balboa',
  mayor_bagac: 'mayor_01_dona_remedios',
  mayor_morong: 'mayor_04_gregorio_cruz',

  vm_pilar: 'vice_mayor_corrupt_default',
  vm_orion: 'vice_mayor_01_carla_mendoza',
  vm_limay: 'vice_mayor_06_hector_valderama',
  vm_mariveles: 'vice_mayor_03_evelyn_ramos',
  vm_bagac: 'vice_mayor_04_marco_villanueva',
  vm_morong: 'vice_mayor_05_teresita_pangilinan',

  // Awakened Exclusive Bosses
  awakened_brgy_captain: 'mayor_corrupt_default',
  awakened_barangay_captain: 'mayor_corrupt_default',
  awakened_congressman: 'corrupt_politicians',
};

export function getBossAtlasId(boss: BossProfile): string {
  const exact = EXACT_BOSS_ATLAS_MAP[boss.id];
  if (exact) return exact;
  if (boss.title.includes('Vice')) {
    return boss.gender === 'female' ? 'vice_mayor_01_carla_mendoza' : 'vice_mayor_corrupt_default';
  }
  return boss.gender === 'female' ? 'mayor_01_dona_remedios' : 'mayor_corrupt_default';
}

export function getEnemyAtlasId(kind: MobKind, variantSeed = 0): string | null {
  switch (kind) {
    case 'evil_pastor':
      return 'evil_pastor';
    case 'corrupted_priest':
      return 'corrupted_priest';
    case 'tiyanak': {
      const variants = ['tiyanak_1', 'tiyanak_2', 'mga_tiyanak_pair'];
      return variants[Math.abs(variantSeed) % variants.length];
    }
    case 'white_lady':
      return 'white_lady';
    case 'insekto': {
      const variants = ['insekto_wasp', 'insekto_cockroach', 'insekto_centipede', 'insekto_swarm'];
      return variants[Math.abs(variantSeed) % variants.length];
    }
    case 'asong_ulol':
      return 'asong_ulol';
    case 'fat_guy':
      return 'fat_guy';
    case 'thief':
      return 'thief';
    case 'robber':
      return 'robber';
    case 'cobra':
      return 'cobra';
    case 'bad_woman':
      return 'bad_woman';
    case 'aswang':
      return 'aswang';
    case 'corrupt_politician':
      return 'corrupt_politicians';
    case 'bad_guy':
      return 'bad_guys';
    case 'bully_kid':
      return 'bully_kids';
    case 'balete_tree':
      return 'balete_tree';
    default:
      // corrupt_police & corrupt_soldier use dedicated firearm sprites
      return null;
  }
}
