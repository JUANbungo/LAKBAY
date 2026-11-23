// ============================================================================
// STRICT ASSET PRELOADER, CELL-CORNER #000000 FLOOD-FILL,
// 14x16 BOSS ATLAS, 16x17 ENEMY ATLAS, & 4-LAYER ILLUSTRATED PARALLAX ENGINE
// Ensures 100% of current HD illustrated sprites & backdrops finish loading
// via Promise.all BEFORE the game loop starts or the canvas renders Frame 1.
// ============================================================================

import { BossProfile } from './bataanData';
import { MobKind, ZoneDef } from './types';
import {
  getHeroSpriteTotalCount,
  HeroSpriteBank,
  preloadHeroSpriteBank,
} from './heroCompositeRenderer';
import { preloadSpriteAtlases } from './spriteAtlas';
import { preloadV2Sprites } from './v2Sprites';
import { preloadVisualPolishAssets } from './visualPolishAndAssets';

// ============================================================================
// 1. CELL-CORNER #000000 BFS FLOOD-FILL (Strips solid black corners without
//    erasing dark hair, outlines, or black suits inside characters!)
// ============================================================================

export function stripCornerBlackFromGridAtlas(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  blackThreshold = 22
): HTMLCanvasElement {
  const w = Math.max(1, img.naturalWidth || img.width);
  const h = Math.max(1, img.naturalHeight || img.height);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0);

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Fast-path check: if top-left & sample cell corners are already transparent, skip BFS!
    const topLeftAlpha = data[3];
    const sampleCellX = Math.min(w - 1, Math.floor(w / Math.max(1, cols)));
    const sampleAlpha = data[sampleCellX * 4 + 3];
    if (topLeftAlpha < 12 && sampleAlpha < 12) {
      return canvas;
    }

    const cellW = w / Math.max(1, cols);
    const cellH = h / Math.max(1, rows);

    const isBlackBg = (idx4: number): boolean => {
      if (data[idx4 + 3] < 14) return true;
      return (
        data[idx4] <= blackThreshold &&
        data[idx4 + 1] <= blackThreshold &&
        data[idx4 + 2] <= blackThreshold
      );
    };

    for (let r = 0; r < rows; r++) {
      const y0 = Math.floor(r * cellH);
      const y1 = Math.min(h - 1, Math.floor((r + 1) * cellH) - 1);
      const ch = y1 - y0 + 1;
      if (ch <= 0) continue;

      for (let c = 0; c < cols; c++) {
        const x0 = Math.floor(c * cellW);
        const x1 = Math.min(w - 1, Math.floor((c + 1) * cellW) - 1);
        const cw = x1 - x0 + 1;
        if (cw <= 0) continue;

        const visited = new Uint8Array(cw * ch);
        const queue = new Int32Array(cw * ch);
        let qHead = 0;
        let qTail = 0;

        const enqueue = (lx: number, ly: number) => {
          const p = ly * cw + lx;
          if (visited[p]) return;
          const gx = x0 + lx;
          const gy = y0 + ly;
          const idx4 = (gy * w + gx) * 4;
          if (isBlackBg(idx4)) {
            visited[p] = 1;
            queue[qTail++] = p;
          }
        };

        // Seed BFS strictly from the 4 cell corners + cell border black pixels
        enqueue(0, 0);
        enqueue(cw - 1, 0);
        enqueue(0, ch - 1);
        enqueue(cw - 1, ch - 1);

        for (let lx = 0; lx < cw; lx++) {
          enqueue(lx, 0);
          enqueue(lx, ch - 1);
        }
        for (let ly = 1; ly < ch - 1; ly++) {
          enqueue(0, ly);
          enqueue(cw - 1, ly);
        }

        while (qHead < qTail) {
          const p = queue[qHead++];
          const lx = p % cw;
          const ly = (p - lx) / cw;
          const gx = x0 + lx;
          const gy = y0 + ly;
          data[(gy * w + gx) * 4 + 3] = 0;

          if (lx > 0) enqueue(lx - 1, ly);
          if (lx + 1 < cw) enqueue(lx + 1, ly);
          if (ly > 0) enqueue(lx, ly - 1);
          if (ly + 1 < ch) enqueue(lx, ly + 1);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Keep drawn canvas if pixel inspection is blocked
  }

  return canvas;
}

// ============================================================================
// 2. PRELOADED ASSET SINGLETONS
// ============================================================================

export interface ParallaxLayers {
  skyMountains: HTMLImageElement | null;
  townSkyline: HTMLImageElement | null;
  roadsideFoliage: HTMLImageElement | null;
  asphaltRoadCurb: HTMLImageElement | null;
}

export interface PreloadedAssetBundle {
  heroBank: HeroSpriteBank;
  bossAtlas14x16: HTMLCanvasElement | null;
  enemyAtlas16x17: HTMLCanvasElement | null;
  parallax: ParallaxLayers;
}

export interface AssetPreloadProgress {
  loaded: number;
  total: number;
  percent: number;
  stage: string;
  done: boolean;
}

let preloadedBundle: PreloadedAssetBundle | null = null;
let masterPreloadPromise: Promise<PreloadedAssetBundle> | null = null;

export function areAllAssetsReady(): boolean {
  return preloadedBundle !== null;
}

export function getPreloadedAssets(): PreloadedAssetBundle | null {
  return preloadedBundle;
}

function loadImageWithFallback(urls: string[]): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    let idx = 0;
    const tryNext = () => {
      if (idx >= urls.length) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        idx++;
        tryNext();
      };
      img.src = urls[idx];
    };
    tryNext();
  });
}

/**
 * Strictly preloads ALL V4 Hero composites, 4-layer parallax environments,
 * 14x16 Boss Atlas, 16x17 Enemy Atlas, V2 HD Sprite Sheets, Legacy Atlases,
 * Uploaded Vehicles, Small Pets, and Town Vistas via Promise.all.
 */
export function preloadAllGameAssets(
  onProgress?: (p: AssetPreloadProgress) => void
): Promise<PreloadedAssetBundle> {
  if (masterPreloadPromise) return masterPreloadPromise;

  const heroItems = getHeroSpriteTotalCount();
  const extraSteps = 9; // 4 parallax + 2 atlases + v2 + legacy + visualPolish
  const total = heroItems + extraSteps;
  let loaded = 0;
  let stage = 'Loading Hero Outfits & Gear...';

  const emit = (nextStage?: string) => {
    if (nextStage) stage = nextStage;
    const percent = Math.min(100, Math.round((loaded / Math.max(1, total)) * 100));
    if (onProgress) {
      onProgress({
        loaded: Math.min(total, loaded),
        total,
        percent,
        stage,
        done: loaded >= total,
      });
    }
  };

  emit('Preparing Bataan HD Sprites...');

  masterPreloadPromise = (async () => {
    const bump = (nextStage?: string) => {
      loaded++;
      emit(nextStage);
    };

    const [
      heroBank,
      skyMountains,
      townSkyline,
      roadsideFoliage,
      asphaltRoadCurb,
      rawBossAtlas,
      rawEnemyAtlas,
    ] = await Promise.all([
      preloadHeroSpriteBank('/assets/polished_v4', () => bump('Loading Hero Outfits, Hairstyles & Weapons...')),
      loadImageWithFallback(['/assets/polished_v4/environment_parallax/01_sky_mountains.png']).then((r) => {
        bump('Loading Mt. Samat Sky & Mountains...');
        return r;
      }),
      loadImageWithFallback(['/assets/polished_v4/environment_parallax/02_town_skyline_transparent.png']).then((r) => {
        bump('Loading Bataan Town Skyline...');
        return r;
      }),
      loadImageWithFallback(['/assets/polished_v4/environment_parallax/03_roadside_foliage_transparent.png']).then((r) => {
        bump('Loading Roadside Foliage & Bamboo...');
        return r;
      }),
      loadImageWithFallback(['/assets/polished_v4/environment_parallax/04_asphalt_road_curb.png']).then((r) => {
        bump('Loading Bataan Highway Asphalt...');
        return r;
      }),
      loadImageWithFallback([
        '/assets/polished_v4/atlases_transparent/bataan_bosses_atlas_14x16_transparent.png',
        '/assets/aistudio/bataan_atlas_3_bosses_d083f842.png',
      ]).then((r) => {
        bump('Processing 14x16 Town Bosses Atlas...');
        return r;
      }),
      loadImageWithFallback([
        '/assets/polished_v4/atlases_transparent/bataan_enemies_atlas_16x17_transparent.png',
        '/assets/aistudio/bataan_atlas_2_enemies_9873624a.png',
      ]).then((r) => {
        bump('Processing 16x17 Enemies & El Mastermind Atlas...');
        return r;
      }),
      preloadV2Sprites().then(() => bump('Loading Allies, Buildings & Combat VFX...')),
      preloadSpriteAtlases().then(() => bump('Loading World Props & Landmarks...')),
      preloadVisualPolishAssets().then(() => bump('Loading Philippine Vehicles & Companions...')),
    ]);

    const bossAtlas14x16 = rawBossAtlas ? stripCornerBlackFromGridAtlas(rawBossAtlas, 14, 16, 22) : null;
    const enemyAtlas16x17 = rawEnemyAtlas ? stripCornerBlackFromGridAtlas(rawEnemyAtlas, 16, 17, 22) : null;

    preloadedBundle = {
      heroBank,
      bossAtlas14x16,
      enemyAtlas16x17,
      parallax: {
        skyMountains,
        townSkyline,
        roadsideFoliage,
        asphaltRoadCurb,
      },
    };

    loaded = total;
    emit('Ready to defend Bataan!');
    return preloadedBundle;
  })();

  return masterPreloadPromise;
}

// ============================================================================
// 3. 14x16 BOSS ATLAS RENDERER (Cols 0-7 Walk/Idle | 8 Hit | 9 Kneel | 10-13 Defeated + Spirit)
// ============================================================================

const BOSS_ROW_MAP: Record<string, number> = {
  // 12 Municipal Mayors
  mayor_hermosa: 0,
  mayor_bagac: 0,
  mayor_dinalupihan: 1,
  mayor_mariveles: 1,
  mayor_samal: 2,
  mayor_balanga: 2,
  mayor_orani: 3,
  mayor_morong: 3,
  mayor_abucay: 4,
  mayor_limay: 4,
  mayor_pilar: 5,
  mayor_orion: 5,

  // 12 Vice Mayors
  vm_dinalupihan: 6,
  vm_orion: 6,
  vm_hermosa: 7,
  vm_orani: 8,
  vm_mariveles: 8,
  vm_samal: 9,
  vm_bagac: 9,
  vm_abucay: 10,
  vm_morong: 10,
  vm_balanga: 11,
  vm_limay: 11,
  vm_pilar: 12,

  // Corrupt Police & Awakened Exclusive Bosses
  corrupt_police: 14,
  awakened_brgy_captain: 11,
  awakened_barangay_captain: 11,
  awakened_congressman: 15,
};

export function resolveBossAtlasRow(bossOrId: BossProfile | string): number {
  const id = typeof bossOrId === 'string' ? bossOrId : bossOrId.id;
  if (id in BOSS_ROW_MAP) return BOSS_ROW_MAP[id];
  if (typeof bossOrId !== 'string') {
    if (bossOrId.title.toLowerCase().includes('vice')) {
      return bossOrId.gender === 'female' ? 6 : 9;
    }
    return bossOrId.gender === 'female' ? 0 : 1;
  }
  if (id.includes('police')) return 14;
  if (id.includes('vice') || id.startsWith('vm_')) return 6;
  return 1;
}

export type Boss14x16State = 'idle' | 'walk' | 'hit' | 'kneel' | 'defeated';

export interface DrawGridAtlasOpts {
  hitFlash?: number;
  alpha?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
  tiltRad?: number;
  shadowRadius?: number;
  glowColor?: string;
  filterCss?: string;
  /** Optional 0..1 progress used for 'defeated' collapse + rising blue spirit (cols 8 -> 13) */
  progress01?: number;
}

// Compute tight content bounds per boss cell on demand so bottom feet sit cleanly on groundY
const bossCellBoundsCache = new Map<string, { sx: number; sy: number; sw: number; sh: number }>();

function getTightCellCrop(
  canvas: HTMLCanvasElement,
  cacheKey: string,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number
): { sx: number; sy: number; sw: number; sh: number } {
  const cached = bossCellBoundsCache.get(cacheKey);
  if (cached) return cached;

  const fallback = {
    sx: Math.round(cellX),
    sy: Math.round(cellY),
    sw: Math.max(1, Math.round(cellW)),
    sh: Math.max(1, Math.round(cellH)),
  };

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallback;
    const x0 = Math.max(0, Math.floor(cellX));
    const y0 = Math.max(0, Math.floor(cellY));
    const cw = Math.min(canvas.width - x0, Math.max(1, Math.floor(cellW)));
    const ch = Math.min(canvas.height - y0, Math.max(1, Math.floor(cellH)));
    const d = ctx.getImageData(x0, y0, cw, ch).data;

    let minX = cw;
    let minY = ch;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (d[(y * cw + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX > minX + 4 && maxY > minY + 4) {
      const box = {
        sx: x0 + minX,
        sy: y0 + minY,
        sw: maxX - minX + 1,
        sh: maxY - minY + 1,
      };
      bossCellBoundsCache.set(cacheKey, box);
      return box;
    }
  } catch {
    // fallback
  }
  bossCellBoundsCache.set(cacheKey, fallback);
  return fallback;
}

export function drawBoss14x16Frame(
  ctx: CanvasRenderingContext2D,
  row: number,
  state: Boss14x16State,
  timeOrProgress: number,
  x: number,
  groundY: number,
  targetH: number,
  facing: 1 | -1,
  opts: DrawGridAtlasOpts = {}
): boolean {
  const atlas = preloadedBundle?.bossAtlas14x16;
  if (!atlas) return false;

  const cols = 14;
  const rows = 16;
  const safeRow = Math.max(0, Math.min(rows - 1, Math.floor(row)));
  const cellW = atlas.width / cols;
  const cellH = atlas.height / rows;

  let col = 0;
  if (state === 'hit') {
    col = 8;
  } else if (state === 'kneel') {
    col = 9;
  } else if (state === 'defeated') {
    // Full cinematic collapse sequence: col 8 (hit) -> col 9 (kneel) -> cols 10..13 (defeated + rising blue spirit!)
    const p = Math.max(0, Math.min(0.999, opts.progress01 ?? timeOrProgress));
    const seq = [8, 9, 10, 11, 12, 13];
    col = seq[Math.floor(p * seq.length)];
  } else if (state === 'walk') {
    col = Math.floor(Math.max(0, timeOrProgress) * 9) % 8;
  } else {
    col = Math.floor(Math.max(0, timeOrProgress) * 4.5) % 4;
  }

  const crop = getTightCellCrop(
    atlas,
    `boss_${safeRow}_${col}`,
    col * cellW,
    safeRow * cellH,
    cellW,
    cellH
  );

  // Preserve visual height proportion cleanly even when boss kneels or lies flat on cols 9-13
  const standCrop = getTightCellCrop(atlas, `boss_${safeRow}_0`, 0, safeRow * cellH, cellW, cellH);
  const pxPerSrc = targetH / Math.max(24, standCrop.sh);
  const drawW = crop.sw * pxPerSrc;
  const drawH = crop.sh * pxPerSrc;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundY + (opts.offsetY ?? 0)));

  if (opts.shadowRadius && opts.shadowRadius > 0) {
    ctx.fillStyle = 'rgba(8, 14, 24, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, -(opts.offsetY ?? 0) + 1, opts.shadowRadius, Math.max(4, opts.shadowRadius * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.alpha !== undefined) {
    ctx.globalAlpha = Math.max(0, Math.min(1, opts.alpha));
  }
  if (opts.tiltRad) {
    ctx.rotate(opts.tiltRad * facing);
  }
  const sxScale = (facing === -1 ? -1 : 1) * (opts.scaleX ?? 1);
  const syScale = opts.scaleY ?? 1;
  if (sxScale !== 1 || syScale !== 1) {
    ctx.scale(sxScale, syScale);
  }

  const filters: string[] = [];
  if (opts.filterCss) filters.push(opts.filterCss);
  if (opts.hitFlash && opts.hitFlash > 0) {
    filters.push('brightness(2.5) contrast(1.3) drop-shadow(0 0 8px rgba(255,255,255,0.9))');
  } else if (opts.glowColor) {
    filters.push(`drop-shadow(0 0 8px ${opts.glowColor})`);
  }
  if (filters.length > 0) ctx.filter = filters.join(' ');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(atlas, crop.sx, crop.sy, crop.sw, crop.sh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
  return true;
}

export function drawBoss14x16Portrait(
  ctx: CanvasRenderingContext2D,
  bossOrRow: BossProfile | number,
  size: number,
  time = 0
): boolean {
  const atlas = preloadedBundle?.bossAtlas14x16;
  if (!atlas) return false;
  const row = typeof bossOrRow === 'number' ? bossOrRow : resolveBossAtlasRow(bossOrRow);
  const col = Math.floor(Math.max(0, time) * 4) % 4;
  const cellW = atlas.width / 14;
  const cellH = atlas.height / 16;
  const crop = getTightCellCrop(atlas, `boss_${row}_${col}`, col * cellW, row * cellH, cellW, cellH);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const bustH = Math.round(crop.sh * 0.65);
  const bustW = Math.min(crop.sw, Math.round(bustH * 1.05));
  const bx = crop.sx + Math.round((crop.sw - bustW) / 2);
  ctx.drawImage(atlas, bx, crop.sy, bustW, bustH, 2, 2, size - 4, size - 4);
  ctx.restore();
  return true;
}

// ============================================================================
// 4. 16x17 ENEMY & EL MASTERMIND ATLAS RENDERER
// ============================================================================

export interface EnemyStripSpec {
  row: number;
  colStart: number;
  frames: number;
  nativeFacing: 1 | -1;
  filterCss?: string;
}

export function resolveEnemyAtlasStrip(kind: MobKind | string, variantSeed = 0): EnemyStripSpec | null {
  switch (kind) {
    case 'evil_pastor':
      return { row: 0, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'tiyanak': {
      const variants: EnemyStripSpec[] = [
        { row: 0, colStart: 8, frames: 8, nativeFacing: 1 },
        { row: 1, colStart: 0, frames: 8, nativeFacing: 1 },
        { row: 14, colStart: 0, frames: 8, nativeFacing: 1 },
      ];
      return variants[Math.abs(variantSeed) % variants.length];
    }
    case 'white_lady':
      return { row: 1, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'insekto': {
      const variants: EnemyStripSpec[] = [
        { row: 2, colStart: 0, frames: 8, nativeFacing: 1 },
        { row: 3, colStart: 0, frames: 8, nativeFacing: 1 },
        { row: 15, colStart: 0, frames: 8, nativeFacing: 1 },
        { row: 16, colStart: 0, frames: 8, nativeFacing: 1 },
      ];
      return variants[Math.abs(variantSeed) % variants.length];
    }
    case 'bukid_pest':
      return { row: 2, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'corrupted_priest':
      return { row: 4, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'el_mastermind_portrait':
    case 'el_mastermind':
    case 'boss_el_mastermind':
      return { row: 4, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'el_mastermind_scene':
      return { row: 16, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'asong_ulol':
      return { row: 5, colStart: 0, frames: 8, nativeFacing: -1 };
    case 'rodent_daga':
      return { row: 5, colStart: 0, frames: 8, nativeFacing: -1, filterCss: 'saturate(0.45) brightness(0.86)' };
    case 'fat_guy':
      return { row: 5, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'thief':
      return { row: 6, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'robber':
      return { row: 6, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'cobra':
      return { row: 7, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'bad_woman':
      return { row: 7, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'mayor_corrupt_default':
      return { row: 8, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'vice_mayor_corrupt_default':
      return { row: 3, colStart: 8, frames: 8, nativeFacing: 1 };
    case 'aswang':
      return { row: 9, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'cave_bat':
      return { row: 9, colStart: 0, frames: 8, nativeFacing: 1, filterCss: 'hue-rotate(20deg) saturate(1.15)' };
    case 'corrupt_politician':
      return { row: 10, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'bad_guy':
      return { row: 11, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'bully_kid':
      return { row: 12, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'balete_tree':
      return { row: 13, colStart: 0, frames: 8, nativeFacing: 1 };
    case 'cave_spider':
      return { row: 15, colStart: 0, frames: 8, nativeFacing: 1, filterCss: 'hue-rotate(190deg) saturate(1.1)' };
    case 'cave_centipede':
      return { row: 16, colStart: 0, frames: 8, nativeFacing: 1 };
    default:
      return null;
  }
}

export function drawEnemy16x17Frame(
  ctx: CanvasRenderingContext2D,
  strip: EnemyStripSpec,
  frameIdx: number,
  x: number,
  groundY: number,
  targetH: number,
  facing: 1 | -1,
  opts: DrawGridAtlasOpts = {}
): boolean {
  const atlas = preloadedBundle?.enemyAtlas16x17;
  if (!atlas) return false;

  const cols = 16;
  const rows = 17;
  const safeRow = Math.max(0, Math.min(rows - 1, strip.row));
  const localFrame = Math.abs(Math.floor(frameIdx)) % Math.max(1, strip.frames);
  const col = Math.min(cols - 1, strip.colStart + localFrame);

  const cellW = atlas.width / cols;
  const cellH = atlas.height / rows;
  const crop = getTightCellCrop(
    atlas,
    `enemy_${safeRow}_${col}`,
    col * cellW,
    safeRow * cellH,
    cellW,
    cellH
  );

  const aspect = crop.sw / Math.max(1, crop.sh);
  const drawH = targetH;
  const drawW = targetH * aspect;
  const flipX = facing * strip.nativeFacing;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundY + (opts.offsetY ?? 0)));

  if (opts.shadowRadius && opts.shadowRadius > 0) {
    const alt = Math.max(0, -(opts.offsetY ?? 0));
    const altScale = Math.max(0.35, 1 - alt / 190);
    ctx.fillStyle = `rgba(10, 16, 26, ${(0.42 * altScale).toFixed(2)})`;
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
  if (opts.tiltRad) {
    ctx.rotate(opts.tiltRad * facing);
  }
  const sxScale = (flipX === -1 ? -1 : 1) * (opts.scaleX ?? 1);
  const syScale = opts.scaleY ?? 1;
  if (sxScale !== 1 || syScale !== 1) {
    ctx.scale(sxScale, syScale);
  }

  const filters: string[] = [];
  if (strip.filterCss) filters.push(strip.filterCss);
  if (opts.filterCss) filters.push(opts.filterCss);
  if (opts.hitFlash && opts.hitFlash > 0) {
    filters.push('brightness(2.5) contrast(1.3) drop-shadow(0 0 8px rgba(255,255,255,0.9))');
  } else if (opts.glowColor) {
    filters.push(`drop-shadow(0 0 8px ${opts.glowColor})`);
  }
  if (filters.length > 0) ctx.filter = filters.join(' ');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(atlas, crop.sx, crop.sy, crop.sw, crop.sh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
  return true;
}

// ============================================================================
// 5. SEAMLESS 4-LAYER ILLUSTRATED PARALLAX ENVIRONMENT RENDERER
//    01_sky_mountains (0.1x) -> 02_town_skyline (0.3x) ->
//    03_roadside_foliage (0.65x) -> 04_asphalt_road_curb (1.0x)
// ============================================================================

function drawTiledParallaxStrip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  viewW: number,
  scrollX: number,
  destY: number,
  destH: number
): void {
  const aspect = (img.naturalWidth || img.width) / Math.max(1, img.naturalHeight || img.height);
  const tileW = Math.max(240, Math.round(destH * aspect));
  const rawOffset = -((scrollX % tileW) + tileW) % tileW;

  for (let x = rawOffset - tileW; x < viewW + tileW; x += tileW) {
    // 1px overlap prevents sub-pixel vertical seams while scrolling
    ctx.drawImage(img, Math.floor(x), Math.floor(destY), tileW + 1, Math.ceil(destH));
  }
}

export function drawIllustratedParallaxBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  groundY: number,
  cameraX: number,
  zone: ZoneDef,
  time: number,
  timeOfDay: 'day' | 'golden' | 'night'
): boolean {
  const layers = preloadedBundle?.parallax;
  if (!layers) return false;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const isCave =
    zone.lighting === 'cave_dark' ||
    zone.architectureStyle === 'mining_cave';
  const isNight = timeOfDay === 'night' || zone.lighting === 'haunted_night';
  const isGolden = timeOfDay === 'golden' || zone.lighting === 'golden' || zone.lighting === 'dusk';

  if (isCave) {
    // Smooth atmospheric Mt. Natib cavern gradient + silhouetted stalactites + stone path (zero 8-bit blocks)
    const cavSky = ctx.createLinearGradient(0, 0, 0, groundY);
    cavSky.addColorStop(0, '#090d16');
    cavSky.addColorStop(0.55, '#171d2c');
    cavSky.addColorStop(1, '#262d3d');
    ctx.fillStyle = cavSky;
    ctx.fillRect(0, 0, viewW, groundY + 4);

    // Subtle bioluminescent cavern mist
    const glow = ctx.createRadialGradient(viewW * 0.5, groundY * 0.52, 20, viewW * 0.5, groundY * 0.52, viewW * 0.6);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.06)');
    glow.addColorStop(1, 'rgba(9, 13, 22, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, viewW, groundY);

    // Soft distant cavern rock arches (smooth bezier curves)
    ctx.fillStyle = '#121826';
    const archStep = 260;
    const archOff = -((cameraX * 0.25) % archStep);
    for (let ax = archOff - archStep; ax < viewW + archStep; ax += archStep) {
      ctx.beginPath();
      ctx.moveTo(ax, 0);
      ctx.lineTo(ax + archStep, 0);
      ctx.lineTo(ax + archStep, 78 + Math.sin(ax * 0.02) * 24);
      ctx.quadraticCurveTo(ax + archStep * 0.5, 130 + Math.cos(ax * 0.015) * 28, ax, 68);
      ctx.closePath();
      ctx.fill();
    }

    // Cavern ground anchored cleanly to groundY
    if (layers.asphaltRoadCurb) {
      ctx.save();
      ctx.filter = 'brightness(0.42) contrast(1.15) hue-rotate(190deg)';
      drawTiledParallaxStrip(ctx, layers.asphaltRoadCurb, viewW, cameraX, groundY - 22, Math.max(120, viewH - groundY + 26));
      ctx.restore();
    } else {
      const floorGrad = ctx.createLinearGradient(0, groundY - 10, 0, viewH);
      floorGrad.addColorStop(0, '#334155');
      floorGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, groundY - 10, viewW, viewH - groundY + 10);
    }

    ctx.restore();
    return true;
  }

  // 0. Smooth Sky Zenith Gradient (matches top edge of 01_sky_mountains.png seamlessly)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  if (isNight) {
    skyGrad.addColorStop(0, '#0a1628');
    skyGrad.addColorStop(0.55, '#162a47');
    skyGrad.addColorStop(1, '#263d5c');
  } else if (isGolden) {
    skyGrad.addColorStop(0, '#3b2d54');
    skyGrad.addColorStop(0.45, '#b45309');
    skyGrad.addColorStop(1, '#fbbf24');
  } else {
    skyGrad.addColorStop(0, '#3898e2');
    skyGrad.addColorStop(0.55, '#6fc3f4');
    skyGrad.addColorStop(1, '#b9e5fc');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, groundY + 4);

  // Subtle twinkling stars & soft crescent glow at night
  if (isNight) {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 197 + 41) % Math.max(1, viewW));
      const sy = ((i * 89 + 19) % Math.max(24, Math.floor(groundY * 0.44)));
      const tw = 0.45 + 0.55 * Math.sin(time * 2.4 + i * 1.3);
      ctx.globalAlpha = tw * 0.75;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 4 === 0 ? 1.6 : 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Layer 1 (0.1x parallax): Mt. Samat Cross + Bataan Mountains + Clouds
  if (layers.skyMountains) {
    const h1 = Math.max(200, Math.round(groundY * 0.58));
    const y1 = Math.max(0, groundY - h1 - 14);
    ctx.save();
    if (isNight) {
      ctx.filter = 'brightness(0.46) saturate(0.75) hue-rotate(10deg)';
    } else if (isGolden) {
      ctx.filter = 'sepia(0.28) saturate(1.25) brightness(0.92)';
    }
    drawTiledParallaxStrip(ctx, layers.skyMountains, viewW, cameraX * 0.1, y1, h1);
    ctx.restore();
  }

  // Soft horizon atmospheric depth haze
  const haze = ctx.createLinearGradient(0, groundY - 120, 0, groundY);
  if (isNight) {
    haze.addColorStop(0, 'rgba(15, 28, 48, 0)');
    haze.addColorStop(1, 'rgba(22, 42, 72, 0.34)');
  } else if (isGolden) {
    haze.addColorStop(0, 'rgba(251, 146, 60, 0)');
    haze.addColorStop(1, 'rgba(254, 215, 170, 0.24)');
  } else {
    haze.addColorStop(0, 'rgba(191, 219, 254, 0)');
    haze.addColorStop(1, 'rgba(224, 242, 254, 0.24)');
  }
  ctx.fillStyle = haze;
  ctx.fillRect(0, groundY - 120, viewW, 120);

  // Layer 2 (0.3x parallax): Heritage Bataan Town Skyline (Church, Municipal Hall, Houses, Palms)
  if (layers.townSkyline) {
    const h2 = Math.max(176, Math.round(groundY * 0.42));
    const y2 = groundY - h2 - 8;
    ctx.save();
    if (isNight) {
      ctx.filter = 'brightness(0.55) saturate(0.82)';
    } else if (isGolden) {
      ctx.filter = 'sepia(0.22) saturate(1.18) brightness(0.95)';
    }
    drawTiledParallaxStrip(ctx, layers.townSkyline, viewW, cameraX * 0.3, y2, h2);
    ctx.restore();
  }

  // Layer 3 (0.65x parallax): Roadside Foliage, Bamboo Fences, Electric Poles & Tropical Trees
  if (layers.roadsideFoliage) {
    const h3 = Math.max(148, Math.round(groundY * 0.34));
    const y3 = groundY - h3 - 2;
    ctx.save();
    if (isNight) {
      ctx.filter = 'brightness(0.60) saturate(0.85)';
    } else if (isGolden) {
      ctx.filter = 'sepia(0.16) saturate(1.15) brightness(0.96)';
    }
    drawTiledParallaxStrip(ctx, layers.roadsideFoliage, viewW, cameraX * 0.65, y3, h3);
    ctx.restore();
  }

  // Layer 4 (1.0x parallax): Concrete Sidewalk Curb & Cracked Asphalt Highway anchored squarely at groundY
  if (layers.asphaltRoadCurb) {
    const roadTop = groundY - 22;
    const roadH = Math.max(120, viewH - roadTop + 4);
    ctx.save();
    if (isNight) {
      ctx.filter = 'brightness(0.68) contrast(1.06)';
    } else if (isGolden) {
      ctx.filter = 'sepia(0.14) brightness(0.95)';
    }
    drawTiledParallaxStrip(ctx, layers.asphaltRoadCurb, viewW, cameraX, roadTop, roadH);
    ctx.restore();
  }

  // Subtle cohesive time-of-day atmospheric glaze over background (keeps characters crisp!)
  if (isNight) {
    ctx.fillStyle = 'rgba(10, 22, 42, 0.24)';
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (isGolden) {
    const warm = ctx.createLinearGradient(0, 0, 0, viewH);
    warm.addColorStop(0, 'rgba(234, 88, 12, 0.14)');
    warm.addColorStop(1, 'rgba(251, 191, 36, 0.06)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  ctx.restore();
  return true;
}
