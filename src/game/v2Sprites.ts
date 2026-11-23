// High-Resolution 16-Bit Sprite Sheet Engine v2
// Powered by all 17 uploaded 1344x756 HD sprite sheets + exact bounding boxes in v2Manifest.json
// Includes fast edge-BFS white-paper removal & offscreen canvas caching for crisp transparency on day/dusk/night skies.

import rawManifest from './v2Manifest.json';
import { getTightSpriteBounds } from './spriteSizeNormalizer';
import { getOutfitTintedFrame, OutfitPalette } from './modularHeroRenderer';
import { removeStrayFloatingArtifacts } from './worldPolishAndWeather';

export interface V2SpriteEntry {
  sheet: string;
  frames: [number, number, number, number][]; // [x, y, w, h]
  interior: boolean;
}

const V2_MANIFEST: Record<string, V2SpriteEntry> = rawManifest as unknown as Record<string, V2SpriteEntry>;

const sheetImages: Record<string, HTMLImageElement> = {};
const sheetReady: Record<string, boolean> = {};
const spriteFrameCache = new Map<string, HTMLCanvasElement>();
const loadListeners = new Set<() => void>();
let initialized = false;

function notifyV2Loaded() {
  loadListeners.forEach((cb) => cb());
}

export function subscribeV2Loaded(cb: () => void): () => void {
  loadListeners.add(cb);
  return () => {
    loadListeners.delete(cb);
  };
}

let v2PreloadPromise: Promise<void> | null = null;

export function preloadV2Sprites(): Promise<void> {
  if (v2PreloadPromise) return v2PreloadPromise;
  if (typeof window === 'undefined') return Promise.resolve();
  initialized = true;

  const uniqueSheets = new Set<string>();
  for (const entry of Object.values(V2_MANIFEST)) {
    uniqueSheets.add(entry.sheet);
  }

  const tasks = Array.from(uniqueSheets).map((sheetFile) => {
    return new Promise<void>((resolve) => {
      if (sheetReady[sheetFile] && sheetImages[sheetFile]) {
        resolve();
        return;
      }
      const img = sheetImages[sheetFile] || new Image();
      img.onload = () => {
        sheetReady[sheetFile] = true;
        notifyV2Loaded();
        resolve();
      };
      img.onerror = () => {
        sheetReady[sheetFile] = false;
        resolve();
      };
      if (!sheetImages[sheetFile]) {
        img.src = `/assets/aistudio/${sheetFile}`;
        sheetImages[sheetFile] = img;
      } else if (img.complete) {
        sheetReady[sheetFile] = img.naturalWidth > 0;
        resolve();
      }
    });
  });

  v2PreloadPromise = Promise.all(tasks).then(() => undefined);
  return v2PreloadPromise;
}

export function initV2Sprites(): void {
  if (initialized || typeof window === 'undefined') return;
  void preloadV2Sprites();
}

export function isV2SpriteReady(id: string): boolean {
  initV2Sprites();
  const entry = V2_MANIFEST[id];
  if (!entry) return false;
  return Boolean(sheetReady[entry.sheet] && sheetImages[entry.sheet]);
}

export const hasV2Sprite = isV2SpriteReady;

export function getV2FrameCount(id: string): number {
  return V2_MANIFEST[id]?.frames.length || 0;
}

export interface SmoothAnimTransform {
  frameIndex: number; // 0 .. (totalFrames - 1)
  offsetY: number;    // Smooth breathing / stride / hover
  scaleX: number;     // Squash & stretch
  scaleY: number;
  tiltRad: number;    // Forward lean on run/attack
}

/**
 * Provides smooth 8–16 frame animation timing + 16-step procedural sub-frame secondary motion
 * for Hero, Allies, 24 Town Bosses, Awakened Bosses, and Folklore Mobs.
 */
export function computeSmooth16FrameAnim(
  state: 'idle' | 'walk' | 'telegraph' | 'attack' | 'recoil',
  timeSec: number,
  sheetFrameCount: number, // 4, 8, or 16
  isFlying = false
): SmoothAnimTransform {
  const safeTime = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  const safeCount = Math.max(1, sheetFrameCount);
  const step16 = Math.floor(safeTime * 12) % 16;
  const phase = safeTime * Math.PI * 2;

  let frameIndex = 0;
  if (safeCount >= 8) {
    // Exact 8-frame mapping (0-1 idle, 2-4 walk, 5 telegraph, 6 attack, 7 recoil)
    if (isFlying) {
      if (state === 'telegraph') frameIndex = 4;
      else if (state === 'attack') frameIndex = step16 % 2 === 0 ? 5 : 6;
      else if (state === 'recoil') frameIndex = 7;
      else frameIndex = Math.floor(safeTime * 10) % 4;
    } else {
      if (state === 'idle') frameIndex = Math.floor(safeTime * 4) % 2;
      else if (state === 'walk') frameIndex = 2 + (Math.floor(safeTime * 10) % 3);
      else if (state === 'telegraph') frameIndex = 5;
      else if (state === 'attack') frameIndex = 6;
      else frameIndex = 7;
    }
    frameIndex = Math.min(safeCount - 1, frameIndex);
  } else {
    frameIndex = Math.floor((step16 / 16) * safeCount) % safeCount;
  }

  let offsetY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let tiltRad = 0;

  if (isFlying) {
    offsetY = Math.sin(phase * 1.6) * 9;
    tiltRad = state === 'attack' ? 0.22 : state === 'recoil' ? -0.14 : Math.sin(phase * 0.8) * 0.06;
  } else if (state === 'walk') {
    offsetY = -Math.abs(Math.sin(phase * 2.2)) * 4.5;
    scaleY = 1 + Math.sin(phase * 4.4) * 0.035;
    scaleX = 2 - scaleY;
    tiltRad = 0.07;
  } else if (state === 'telegraph') {
    scaleX = 1.08;
    scaleY = 0.92;
    tiltRad = -0.1;
  } else if (state === 'attack') {
    scaleX = 1.12;
    scaleY = 0.9;
    tiltRad = 0.14;
  } else if (state === 'recoil') {
    scaleX = 0.94;
    scaleY = 1.06;
    tiltRad = -0.09;
  } else {
    // Smooth living idle breathing
    offsetY = Math.sin(phase * 0.9) * 1.4;
    scaleY = 1 + Math.sin(phase * 0.9) * 0.018;
    scaleX = 2 - scaleY;
  }

  return { frameIndex, offsetY, scaleX, scaleY, tiltRad };
}

/**
 * Probes below a manifest crop box and expands `sh` downward if dark ink pixels touch the bottom edge,
 * ensuring no character or enemy sprite is ever cut in half at the legs/feet.
 */
function autoExpandCropBox(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  maxExpandPx = 110
): [number, number, number, number] {
  const sheetH = img.naturalHeight || img.height;
  const padBottom = Math.max(0, Math.min(maxExpandPx, sheetH - (sy + sh)));
  if (padBottom <= 2) return [sx, sy, sw, sh];

  const probe = document.createElement('canvas');
  probe.width = Math.max(1, Math.round(sw));
  probe.height = Math.max(1, Math.round(sh + padBottom));
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  if (!pctx) return [sx, sy, sw, sh];

  try {
    pctx.drawImage(img, sx, sy, sw, sh + padBottom, 0, 0, probe.width, probe.height);
    const data = pctx.getImageData(0, 0, probe.width, probe.height).data;

    const rowHasInk = (y: number): boolean => {
      if (y < 0 || y >= probe.height) return false;
      let inkCount = 0;
      for (let x = 2; x < probe.width - 2; x++) {
        const i = (y * probe.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 30 && !(r > 234 && g > 234 && b > 234)) {
          inkCount++;
          if (inkCount >= 4) return true;
        }
      }
      return false;
    };

    let newH = Math.round(sh);
    if (rowHasInk(Math.max(0, newH - 2))) {
      while (newH < probe.height - 1 && rowHasInk(newH)) {
        newH++;
      }
    }
    return [sx, sy, sw, newH];
  } catch {
    return [sx, sy, sw, sh];
  }
}

/**
 * Extracts and caches a single tightly cropped frame with strict edge-only BFS white background removal
 * and 2-pass anti-halo defringing. Never deletes interior white shirts, Barongs, eyes, or police cars.
 */
export function getV2FrameCanvas(
  id: string,
  frameIdx: number,
  skipBgRemoval = false
): HTMLCanvasElement | null {
  const entry = V2_MANIFEST[id];
  if (!entry || !sheetReady[entry.sheet]) return null;
  const img = sheetImages[entry.sheet];
  if (!img) return null;

  const safeIdx = Math.max(0, Math.min(entry.frames.length - 1, frameIdx));
  const cacheKey = `${id}_${safeIdx}_${skipBgRemoval ? 'raw' : 'cut'}`;
  const cached = spriteFrameCache.get(cacheKey);
  if (cached) return cached;

  const [rawX, rawY, rawW, rawH] = entry.frames[safeIdx];
  const [sx, sy, sw, sh] = autoExpandCropBox(img, rawX, rawY, rawW, rawH);
  const cw = Math.max(1, Math.round(sw));
  const ch = Math.max(1, Math.round(sh));

  const off = document.createElement('canvas');
  off.width = cw;
  off.height = ch;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return null;

  octx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

  let finalCanvas = off;

  if (!skipBgRemoval) {
    try {
      const imgData = octx.getImageData(0, 0, cw, ch);
      const data = imgData.data;
      const total = cw * ch;
      const visited = new Uint8Array(total);
      const queue = new Int32Array(total);
      let qHead = 0;
      let qTail = 0;

      // Edge-only paper predicate (captures white & light off-white paper without touching enclosed white clothes)
      const isOuterPaper = (idx4: number): boolean => {
        const a = data[idx4 + 3];
        if (a < 18) return true;
        const r = data[idx4];
        const g = data[idx4 + 1];
        const b = data[idx4 + 2];
        if (r > 234 && g > 234 && b > 234) return true;
        const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
        const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
        return minC > 210 && maxC - minC < 30;
      };

      const enqueue = (p: number) => {
        if (visited[p]) return;
        const idx4 = p * 4;
        if (isOuterPaper(idx4)) {
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
        if (visited[p]) {
          data[p * 4 + 3] = 0;
        }
      }

      // 2-Pass Anti-Halo Boundary Defringe: peels 1-2px of white/gray paper anti-aliasing fringes
      // on the outer silhouette ONLY (never punches holes inside white clothing, eyes, or police cars!)
      for (let pass = 0; pass < 2; pass++) {
        const toFade: Array<{ idx4: number; nextA: number; p: number }> = [];
        for (let y = 1; y < ch - 1; y++) {
          for (let x = 1; x < cw - 1; x++) {
            const p = y * cw + x;
            const idx4 = p * 4;
            const a = data[idx4 + 3];
            if (a === 0) continue;
            const touchesBg =
              data[(p - 1) * 4 + 3] < 24 ||
              data[(p + 1) * 4 + 3] < 24 ||
              data[(p - cw) * 4 + 3] < 24 ||
              data[(p + cw) * 4 + 3] < 24;
            if (!touchesBg) continue;
            const r = data[idx4];
            const g = data[idx4 + 1];
            const b = data[idx4 + 2];
            const lum = (r + g + b) / 3;
            const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
            const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
            const spread = maxC - minC;
            if (pass === 0 && lum > 206 && spread < 36) {
              // Strip pure/near-white 1px fringe cleanly
              toFade.push({ idx4, nextA: lum > 224 ? 0 : Math.round(a * Math.max(0, (230 - lum) / 28)), p });
            } else if (pass === 1 && lum > 192 && spread < 32) {
              // Feather subtle 2nd-ring anti-aliased light grey edge
              const factor = Math.max(0, (228 - lum) / 40);
              toFade.push({ idx4, nextA: Math.round(a * factor), p });
            }
          }
        }
        for (const item of toFade) {
          data[item.idx4 + 3] = item.nextA;
        }
      }

      octx.putImageData(imgData, 0, 0);

      // Skip stray-artifact scrubbing on enemies, bosses, NPCs, winged sprites, and multi-part VFX
      // so thin shoes, limbs, and wings are NEVER erased!
      const skipArtifactScrub =
        id.startsWith('fx_') ||
        id.startsWith('vfx_') ||
        id.startsWith('hero_level_up_') ||
        id.startsWith('proj_') ||
        id.startsWith('mob_') ||
        id.startsWith('boss_') ||
        id.startsWith('enemy_') ||
        id.startsWith('npc_') ||
        id.startsWith('ally_') ||
        id.startsWith('police_') ||
        id.startsWith('tanod_') ||
        id.startsWith('mastermind_') ||
        id.startsWith('gracias_') ||
        id.includes('aswang') ||
        id.includes('white_lady') ||
        id.includes('insekto') ||
        id === 'nomar_portal';

      if (!skipArtifactScrub) {
        removeStrayFloatingArtifacts(off, 32);
      }

      // Auto-trim extra transparent margins so every frame normalizes to exact visual height
      if (id !== 'hero_level_up_pillar') {
        const cleanedData = octx.getImageData(0, 0, cw, ch);
        const tight = getTightSpriteBounds(cleanedData);
        if (
          tight.sw > 4 &&
          tight.sh > 4 &&
          (tight.sw < cw - 2 || tight.sh < ch - 2)
        ) {
          const trimmed = document.createElement('canvas');
          trimmed.width = tight.sw;
          trimmed.height = tight.sh;
          const tctx = trimmed.getContext('2d');
          if (tctx) {
            tctx.drawImage(off, tight.sx, tight.sy, tight.sw, tight.sh, 0, 0, tight.sw, tight.sh);
            finalCanvas = trimmed;
          }
        }
      }
    } catch {
      // Fallback safely if canvas is tainted
    }
  }

  spriteFrameCache.set(cacheKey, finalCanvas);
  return finalCanvas;
}

export interface DrawV2Options {
  hitFlash?: number;
  fixedFrame?: number;
  progress01?: number;
  fps?: number;
  alpha?: number;
  rotation?: number;
  tiltRad?: number;
  offsetY?: number;
  shadowRadius?: number;
  glowColor?: string;
  glowBlur?: number;
  filterCss?: string;
  anchorCenterY?: boolean;
  skipBgRemoval?: boolean;
  /** Optional width clamp or exact world-scale width */
  maxWidth?: number;
  exactWidth?: number;
  /** Optional equipped outfit palette tinting for modular hero cosmetics */
  outfitTintId?: string;
  outfitPaletteOverride?: OutfitPalette;
  /** Optional procedural squash-and-stretch scale */
  scaleX?: number;
  scaleY?: number;
}

/**
 * Draws a crisp transparent sprite/animation frame from the HD v2 sheets,
 * strictly bottom-center anchored at (x, bottomY) (-drawW/2, -drawH).
 */
export function drawV2Sprite(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  bottomY: number,
  targetHeight: number,
  facing: 1 | -1 = 1,
  time = 0,
  opts: DrawV2Options = {}
): boolean {
  initV2Sprites();
  const entry = V2_MANIFEST[id];
  if (!entry || !sheetReady[entry.sheet]) return false;

  const count = entry.frames.length;
  let frameIdx = 0;
  if (typeof opts.fixedFrame === 'number') {
    frameIdx = Math.max(0, Math.min(count - 1, Math.floor(opts.fixedFrame)));
  } else if (typeof opts.progress01 === 'number') {
    const clamped = Math.max(0, Math.min(0.999, opts.progress01));
    frameIdx = Math.floor(clamped * count);
  } else if (count > 1) {
    const fps = opts.fps ?? 7;
    frameIdx = Math.floor(Math.max(0, time) * fps) % count;
  }

  let frameCanvas = getV2FrameCanvas(id, frameIdx, Boolean(opts.skipBgRemoval));
  if (!frameCanvas) return false;

  if (opts.outfitTintId) {
    frameCanvas = getOutfitTintedFrame(
      frameCanvas,
      `${id}_${frameIdx}`,
      opts.outfitTintId,
      opts.outfitPaletteOverride
    );
  }

  const aspect = frameCanvas.width / Math.max(1, frameCanvas.height);
  let drawH = targetHeight;
  let drawW = opts.exactWidth ?? targetHeight * aspect;
  if (opts.maxWidth && drawW > opts.maxWidth) {
    drawW = opts.maxWidth;
    drawH = drawW / Math.max(0.1, aspect);
  }

  ctx.save();
  ctx.translate(Math.round(x), Math.round(bottomY + (opts.offsetY ?? 0)));

  if (opts.shadowRadius && opts.shadowRadius > 0) {
    const altitude = Math.max(0, -(opts.offsetY ?? 0));
    const altScale = Math.max(0.32, 1 - altitude / 190);
    ctx.fillStyle = `rgba(8, 16, 26, ${(0.44 * altScale).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(
      0,
      -(opts.offsetY ?? 0) + 1,
      opts.shadowRadius * altScale,
      Math.max(3.5, opts.shadowRadius * 0.24 * altScale),
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
  const sxScale = (facing === -1 ? -1 : 1) * (opts.scaleX ?? 1);
  const syScale = opts.scaleY ?? 1;
  if (sxScale !== 1 || syScale !== 1) {
    ctx.scale(sxScale, syScale);
  }

  const filters: string[] = [];
  if (opts.filterCss) filters.push(opts.filterCss);
  if (opts.hitFlash && opts.hitFlash > 0) {
    filters.push('brightness(2.55) contrast(1.35) drop-shadow(0 0 8px rgba(255,255,255,0.92))');
  } else if (opts.glowColor) {
    filters.push(`drop-shadow(0 0 ${opts.glowBlur ?? 7}px ${opts.glowColor})`);
  }
  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const yTop = opts.anchorCenterY ? -drawH / 2 : -drawH;
  ctx.drawImage(frameCanvas, -drawW / 2, yTop, drawW, drawH);
  ctx.restore();
  return true;
}

/**
 * Draws a crisp square icon from v2Manifest (e.g. the 8 RPG Magic Skill Hotbar icons from Sheet 18).
 */
export function drawV2Icon(
  ctx: CanvasRenderingContext2D,
  id: string,
  size: number,
  skipBgRemoval = true
): boolean {
  initV2Sprites();
  const frameCanvas = getV2FrameCanvas(id, 0, skipBgRemoval);
  if (!frameCanvas) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(frameCanvas, 0, 0, size, size);
  ctx.restore();
  return true;
}
