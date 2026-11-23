// Visual Polish, 12 Bataan Town Panoramic Backdrops, White-BG Removal (threshold = 240),
// Smooth Hero/Bicycle Kinematics, HAND_SOCKETS Weapon Attachment, Static WorldBuilding Separation,
// Uploaded Vehicle Sprites, Tirador Slingshot & Small Filipino Pet Companions.

import { TiradorAmmoKind, VehicleKind, WeaponVisualStyle, ZoneId, ZoneNpcSpawn } from './types';
import { drawPolishedTownBackdrop } from './projectileVfx';
import { getV4TiradorAmmoImage } from './heroCompositeRenderer';

// =========================================================================
// 1. WHITE-BACKGROUND TRANSPARENCY FILTER (threshold = 238)
// =========================================================================

export function removeWhiteBackground(img: HTMLImageElement, threshold = 238): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, img.naturalWidth || img.width);
  c.height = Math.max(1, img.naturalHeight || img.height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return c;

  ctx.drawImage(img, 0, 0);

  try {
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;
    const w = c.width;
    const h = c.height;
    const total = w * h;

    // Edge Flood-Fill ONLY — preserves white T-shirts, Barongs, eyes, and Police/Rescue vehicles!
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    let qHead = 0;
    let qTail = 0;

    const isBorderPaper = (idx4: number): boolean => {
      if (d[idx4 + 3] < 14) return true;
      const r = d[idx4];
      const g = d[idx4 + 1];
      const b = d[idx4 + 2];
      if (r > threshold && g > threshold && b > threshold) return true;
      const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
      const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
      return minC > 214 && maxC - minC < 28;
    };

    const enqueue = (p: number) => {
      if (visited[p]) return;
      if (isBorderPaper(p * 4)) {
        visited[p] = 1;
        queue[qTail++] = p;
      }
    };

    for (let x = 0; x < w; x++) {
      enqueue(x);
      enqueue((h - 1) * w + x);
    }
    for (let y = 1; y < h - 1; y++) {
      enqueue(y * w);
      enqueue(y * w + (w - 1));
    }

    while (qHead < qTail) {
      const p = queue[qHead++];
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0) enqueue(p - 1);
      if (x + 1 < w) enqueue(p + 1);
      if (y > 0) enqueue(p - w);
      if (y + 1 < h) enqueue(p + w);
    }

    for (let p = 0; p < total; p++) {
      if (visited[p]) {
        d[p * 4 + 3] = 0;
      }
    }

    // 2-Pass Anti-Halo Boundary Defringe: removes stubborn 1-2px white paper fringes on outer silhouette
    for (let pass = 0; pass < 2; pass++) {
      const updates: Array<{ idx4: number; nextA: number }> = [];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          const idx4 = p * 4;
          const a = d[idx4 + 3];
          if (a === 0) continue;
          const touchesBg =
            d[(p - 1) * 4 + 3] < 24 ||
            d[(p + 1) * 4 + 3] < 24 ||
            d[(p - w) * 4 + 3] < 24 ||
            d[(p + w) * 4 + 3] < 24;
          if (!touchesBg) continue;
          const r = d[idx4];
          const g = d[idx4 + 1];
          const b = d[idx4 + 2];
          const lum = (r + g + b) / 3;
          const spread = Math.max(r, g, b) - Math.min(r, g, b);
          if (pass === 0 && lum > 205 && spread < 36) {
            updates.push({ idx4, nextA: lum > 224 ? 0 : Math.round(a * Math.max(0, (232 - lum) / 30)) });
          } else if (pass === 1 && lum > 194 && spread < 32) {
            updates.push({ idx4, nextA: Math.round(a * Math.max(0, (230 - lum) / 40)) });
          }
        }
      }
      for (const u of updates) {
        d[u.idx4 + 3] = u.nextA;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Keep original canvas safely if pixel read is restricted
  }

  return c;
}

// =========================================================================
// 2. 12 AUTHENTIC BATAAN TOWN PIXEL-ART PANORAMIC BACKDROPS
// =========================================================================

const TOWN_BG_FILES: Partial<Record<ZoneId, string>> = {
  defender_home: '/assets/aistudio/05_abucay_cd67243c.png',
  dinalupihan: '/assets/aistudio/01_dinalupihan_7212accf.png',
  hermosa: '/assets/aistudio/02_hermosa_0d9db9c8.png',
  orani: '/assets/aistudio/03_orani_2c075a46.png',
  samal: '/assets/aistudio/04_samal_5344c925.png',
  abucay: '/assets/aistudio/05_abucay_cd67243c.png',
  balanga: '/assets/aistudio/06_balanga_city_3e60525b.png',
  pilar: '/assets/aistudio/07_pilar_c08b9af4.png',
  orion: '/assets/aistudio/08_orion_ba451f79.png',
  limay: '/assets/aistudio/09_limay_96dfb0ba.png',
  mariveles: '/assets/aistudio/10_mariveles_ca1de6ce.png',
  bagac: '/assets/aistudio/11_bagac_afaed739.png',
  morong: '/assets/aistudio/12_morong_ec53d0dc.png',
  farming_fields: '/assets/aistudio/02_hermosa_0d9db9c8.png',
};

const townBgCache: Partial<Record<ZoneId, HTMLImageElement>> = {};
const townBgReady: Partial<Record<ZoneId, boolean>> = {};
let townBgsInitialized = false;

export function initTownPanoramicBackdrops(): void {
  if (townBgsInitialized || typeof window === 'undefined') return;
  townBgsInitialized = true;

  (Object.keys(TOWN_BG_FILES) as ZoneId[]).forEach((zoneId) => {
    const src = TOWN_BG_FILES[zoneId];
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      townBgReady[zoneId] = true;
    };
    img.onerror = () => {
      townBgReady[zoneId] = false;
    };
    townBgCache[zoneId] = img;
  });
}

export function getTownBackdropImage(zoneId: ZoneId): HTMLImageElement | undefined {
  initTownPanoramicBackdrops();
  return townBgCache[zoneId];
}

/**
 * Renders the authentic 16-bit panoramic town vista for all 12 Bataan towns
 * using smooth high-quality upscaling, aspect-ratio cover alignment to groundY,
 * atmospheric depth haze, distinct sidewalk + asphalt road layer, and Day/Golden/Night harmony.
 */
export function drawTownPanoramicBackdrop(
  ctx: CanvasRenderingContext2D,
  zoneId: ZoneId,
  viewW: number,
  viewH: number,
  groundY: number,
  cameraX: number,
  _zoneWidth: number,
  isNight: boolean,
  isGolden: boolean
): boolean {
  initTownPanoramicBackdrops();
  const img = townBgCache[zoneId];
  if (!img || !townBgReady[zoneId] || img.naturalWidth < 16) return false;

  const hasTopLabel =
    zoneId === 'limay' || zoneId === 'mariveles' || zoneId === 'bagac' || zoneId === 'morong';
  const drawn = drawPolishedTownBackdrop(
    ctx,
    img,
    viewW,
    viewH,
    groundY,
    cameraX,
    hasTopLabel ? 0.12 : 0
  );
  if (!drawn) return false;

  // Apply Day/Golden/Night atmospheric color harmony over the distant vista (keeping foreground road crisp)
  ctx.save();
  if (isNight) {
    ctx.fillStyle = 'rgba(8, 19, 36, 0.52)';
    ctx.fillRect(0, 0, viewW, groundY - 8);
  } else if (isGolden) {
    const g = ctx.createLinearGradient(0, 0, 0, groundY - 8);
    g.addColorStop(0, 'rgba(234, 88, 12, 0.22)');
    g.addColorStop(1, 'rgba(251, 191, 36, 0.14)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, groundY - 8);
  }
  ctx.restore();
  return true;
}

// =========================================================================
// 3. CLEAN UPLOADED VEHICLE SPRITES WITH WHITE-BG FILTER (threshold = 240)
// =========================================================================

const CLEAN_VEHICLE_URLS: Record<string, string[]> = {
  jeepney: [
    '/assets/aistudio/jeepney_frame1_c02e9c03.png',
    '/assets/aistudio/jeepney_frame2_271500c8.png',
  ],
  tricycle: [
    '/assets/aistudio/tricycle_green_frame1_6ab560c6.png',
    '/assets/aistudio/tricycle_green_frame2_35e9e73c.png',
  ],
  delivery_tricycle: [
    '/assets/aistudio/tricycle_delivery_frame1_fbc0a9fa.png',
    '/assets/aistudio/tricycle_delivery_frame2_94d93c4e.png',
  ],
  patrol_car: ['/assets/aistudio/police_patrol_car_6d05f65f.png'],
  rescue_van: ['/assets/aistudio/barangay_rescue_van_c1fcf470.png'],
  // Consistent single cyclist sprite (NEVER swaps between road_cyclist_1 and road_cyclist_2)
  road_cyclist: ['/assets/aistudio/road_cyclist_1_61e83407.png'],
};

const cleanVehicleCanvases: Record<string, HTMLCanvasElement[]> = {};
let cleanVehiclesInitialized = false;

export function initCleanVehicleSprites(): void {
  if (cleanVehiclesInitialized || typeof window === 'undefined') return;
  cleanVehiclesInitialized = true;

  Object.entries(CLEAN_VEHICLE_URLS).forEach(([kind, urls]) => {
    cleanVehicleCanvases[kind] = [];
    urls.forEach((url, idx) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        cleanVehicleCanvases[kind][idx] = removeWhiteBackground(img, 238);
      };
    });
  });
}

export function drawCleanUploadedVehicle(
  ctx: CanvasRenderingContext2D,
  kind: VehicleKind,
  x: number,
  groundY: number,
  dir: 1 | -1,
  scale: number,
  time: number
): boolean {
  initCleanVehicleSprites();
  const key = kind === 'motorcycle' ? 'road_cyclist' : kind;
  const frames = cleanVehicleCanvases[key];
  if (!frames || frames.length === 0) return false;

  const readyFrames = frames.filter(Boolean);
  if (readyFrames.length === 0) return false;

  // Jeepney & tricycles have 2 clean frames; patrol car, rescue van & cyclist stay 1 consistent sprite
  const frameIdx = readyFrames.length > 1 ? Math.floor(time * 9) % readyFrames.length : 0;
  const canvas = readyFrames[frameIdx];
  if (!canvas) return false;

  const targetHeights: Record<string, number> = {
    jeepney: 122,
    tricycle: 92,
    delivery_tricycle: 92,
    patrol_car: 84,
    rescue_van: 108,
    road_cyclist: 78,
  };
  const drawH = Math.round((targetHeights[key] || 96) * scale);
  const aspect = canvas.width / Math.max(1, canvas.height);
  const drawW = Math.round(drawH * aspect);
  const bounce = Math.sin(time * 16 + x * 0.025) * 0.9;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundY + 3 + bounce));

  // Crisp road contact shadow
  ctx.fillStyle = 'rgba(8, 14, 22, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 1 - bounce, drawW * 0.44, Math.max(5, drawH * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();

  if (dir === -1) {
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
  return true;
}

// =========================================================================
// 4. SMOOTH HERO KINEMATICS & DELTA-TIME ROTATING BICYCLE
// =========================================================================

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

export interface HeroMotionState {
  animTime: number;
  tiltAngle: number;  // Smooth forward lean when running or biking
  bobOffsetY: number; // Smooth breathing, running bounce, or road cadence
  wheelAngle: number; // Continuous 360-degree wheel spoke rotation
  pedalPhase: number; // Continuous pedal crank rotation
  scaleX: number;     // Squash-and-stretch horizontal scale
  scaleY: number;     // Squash-and-stretch vertical scale
  recoilX: number;    // Smooth weapon recoil kickback
  wasGrounded: boolean;
}

export function createHeroMotionState(): HeroMotionState {
  return {
    animTime: 0,
    tiltAngle: 0,
    bobOffsetY: 0,
    wheelAngle: 0,
    pedalPhase: 0,
    scaleX: 1,
    scaleY: 1,
    recoilX: 0,
    wasGrounded: true,
  };
}

export function updateSmoothHeroMotion(
  motion: HeroMotionState,
  vx: number,
  isRidingBike: boolean,
  isGrounded: boolean,
  dt: number
): void {
  const safeDt = Number.isFinite(dt) ? Math.min(0.05, Math.max(0, dt)) : 0.016;
  const safeVx = Number.isFinite(vx) ? vx : 0;
  motion.animTime += safeDt;
  const speed = Math.abs(safeVx);
  const normSpeed = Math.min(1.5, speed / 240);

  // Squash & Stretch impulses on Jump takeoff and Landing
  if (motion.wasGrounded && !isGrounded) {
    motion.scaleX = 0.88;
    motion.scaleY = 1.14;
  } else if (!motion.wasGrounded && isGrounded) {
    motion.scaleX = 1.16;
    motion.scaleY = 0.85;
  }
  motion.wasGrounded = isGrounded;

  // Smooth spring recovery back to (1, 1) and recoil back to 0
  motion.scaleX = lerp(motion.scaleX, 1, safeDt * 13);
  motion.scaleY = lerp(motion.scaleY, 1, safeDt * 13);
  motion.recoilX = lerp(motion.recoilX, 0, safeDt * 15);

  // 1. Smooth body lean (leans naturally forward with velocity)
  const targetTilt = isRidingBike
    ? (safeVx / 240) * 0.085
    : (safeVx / 240) * 0.1;
  motion.tiltAngle = lerp(motion.tiltAngle, Math.max(-0.18, Math.min(0.18, targetTilt)), safeDt * 10);

  // 2. Smooth wheel spokes, pedal crank & vertical cadence (idle breathing sine-wave / running bob)
  if (!isGrounded) {
    motion.wheelAngle += (safeVx * safeDt) * 0.04;
    motion.bobOffsetY = lerp(motion.bobOffsetY, 0, safeDt * 12);
  } else if (isRidingBike) {
    motion.wheelAngle += (safeVx * safeDt) * 0.085;
    motion.pedalPhase += (speed * safeDt) * 0.095;
    motion.bobOffsetY = Math.sin(motion.pedalPhase * 2) * (normSpeed > 0.05 ? 1.8 : 0.65);
  } else if (normSpeed > 0.08) {
    motion.bobOffsetY = -Math.abs(Math.sin(motion.animTime * 11.5)) * (3.2 * Math.min(1, normSpeed));
  } else {
    motion.bobOffsetY = Math.sin(motion.animTime * 3.0) * 1.25;
  }
}

/**
 * Draws a crisp, consistent bicycle with smooth delta-time rotating wheel spokes and pedal crank
 * (used both for procedural fallback and subtle live wheel-spoke spin overlays).
 */
export function drawSmoothBicycle(
  ctx: CanvasRenderingContext2D,
  motion: HeroMotionState,
  frameColor = '#1e90ff',
  rimColor = '#cbd5e1',
  basketAccent = '#facc15'
): void {
  const drawWheel = (wx: number, wy: number, radius: number) => {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(motion.wheelAngle);

    // Tire
    ctx.strokeStyle = '#1c1c1c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Rim & 6 Rotating Spokes
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (radius - 2), Math.sin(a) * (radius - 2));
      ctx.stroke();
    }

    // Center hub
    ctx.fillStyle = basketAccent;
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawWheel(-18, -12, 12);
  drawWheel(20, -12, 12);

  // Consistent Bicycle Frame
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.lineTo(-4, -26);
  ctx.lineTo(14, -26);
  ctx.lineTo(20, -12);
  ctx.moveTo(-18, -12);
  ctx.lineTo(0, -12);
  ctx.lineTo(14, -26);
  ctx.stroke();

  // Animated Pedal Crank
  const px = Math.cos(motion.pedalPhase) * 6;
  const py = Math.sin(motion.pedalPhase) * 6;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(px, -12 + py);
  ctx.stroke();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px - 2.5, -12 + py - 1.2, 5, 2.5);
}

/**
 * Subtle rotating wheel-spoke overlay placed cleanly onto the bike sprite's front & rear hubs
 * so even a single consistent bike frame shows silky 60fps delta-time wheel & crank motion!
 */
export function drawBikeWheelSpokeOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  scale: number,
  motion: HeroMotionState,
  rimColor = '#e2e8f0'
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(facing * scale, scale);
  ctx.rotate(motion.tiltAngle * facing);

  const drawSpokes = (wx: number, wy: number, r: number) => {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(motion.wheelAngle);
    ctx.strokeStyle = rimColor;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  };

  drawSpokes(-22, -13, 8.5);
  drawSpokes(21, -13, 8.5);

  // Subtle pedal crank rotation near bottom bracket
  const cpx = Math.cos(motion.pedalPhase) * 5.5;
  const cpy = Math.sin(motion.pedalPhase) * 5.5;
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, -14);
  ctx.lineTo(-1 + cpx, -14 + cpy);
  ctx.stroke();

  ctx.restore();
}

// =========================================================================
// 5. LOCAL HAND_SOCKETS WEAPON ANCHORING SYSTEM
// =========================================================================

export interface HandSocket {
  x: number;
  y: number;
  baseRot: number;
}

export const HAND_SOCKETS: Record<'idle' | 'run' | 'bike' | 'attack' | 'jump', HandSocket> = {
  idle: { x: 11, y: -33, baseRot: -0.22 },
  run: { x: 13, y: -34, baseRot: 0.14 },
  bike: { x: 14, y: -42, baseRot: -0.35 },
  attack: { x: 18, y: -38, baseRot: 0.45 },
  jump: { x: 12, y: -39, baseRot: -0.4 },
};

export interface WeaponGripDef {
  gripX: number;
  gripY: number;
  rotOffset: number;
}

export const WEAPON_GRIP_OFFSETS: Record<WeaponVisualStyle, WeaponGripDef> = {
  unarmed: { gripX: 0, gripY: 0, rotOffset: 0 },
  ang_payong: { gripX: -3, gripY: 4, rotOffset: -0.35 },
  megaphone: { gripX: -2, gripY: 3, rotOffset: 0.0 },
  itak: { gripX: -4, gripY: 2, rotOffset: -0.3 },
  balisong: { gripX: -3, gripY: 2, rotOffset: -0.15 },
  dambana_staff: { gripX: -5, gripY: 4, rotOffset: -0.4 },
  guitar_blade: { gripX: -5, gripY: 3, rotOffset: -0.25 },
  la_pluma: { gripX: -3, gripY: 3, rotOffset: -0.3 },
  bolo_katipunan: { gripX: -4, gripY: 3, rotOffset: -0.35 },
  kampilan: { gripX: -5, gripY: 3, rotOffset: -0.38 },
  sable_luna: { gripX: -4, gripY: 3, rotOffset: -0.32 },
  tirador: { gripX: -2, gripY: 2, rotOffset: -0.08 },
};

/**
 * Draws the equipped weapon cleanly locked to the hero's local HAND_SOCKETS anchor
 * inside a unified ctx.save() / translate() / scale(facing, 1) transform so it never detaches.
 */
export function drawAnchoredEquippedWeapon(
  ctx: CanvasRenderingContext2D,
  opts: {
    heroX: number;
    heroY: number;
    facing: 1 | -1;
    scale: number;
    weaponStyle: WeaponVisualStyle;
    pose: 'idle' | 'run' | 'bike' | 'attack' | 'jump';
    tiltAngle: number;
    bobOffsetY: number;
    slashProgress: number;
    primaryColor?: string;
    accentColor?: string;
  }
): void {
  const {
    heroX,
    heroY,
    facing,
    scale,
    weaponStyle,
    pose,
    tiltAngle,
    bobOffsetY,
    slashProgress,
    primaryColor = '#2463B5',
    accentColor = '#FACC15',
  } = opts;
  if (weaponStyle === 'unarmed') return;

  const socket = HAND_SOCKETS[pose];
  const grip = WEAPON_GRIP_OFFSETS[weaponStyle] || WEAPON_GRIP_OFFSETS.ang_payong;
  const swingArc = slashProgress > 0 ? Math.sin(slashProgress * Math.PI) * 1.15 - 0.35 : 0;

  ctx.save();
  ctx.translate(Math.round(heroX), Math.round(heroY + bobOffsetY));
  ctx.scale(facing * scale, scale);
  ctx.rotate(tiltAngle * facing);

  // Move to local hand socket, apply grip offset and swing arc
  ctx.translate(socket.x, socket.y);
  ctx.rotate(socket.baseRot + grip.rotOffset + swingArc);
  ctx.translate(-grip.gripX, -grip.gripY);

  if (weaponStyle === 'tirador') {
    // Classic Filipino Y-shaped Wooden Tirador Slingshot with red rubber band
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, -2);
    ctx.moveTo(0, -2);
    ctx.lineTo(-5, -10);
    ctx.moveTo(0, -2);
    ctx.lineTo(5, -10);
    ctx.stroke();

    // Red elastic bands pulled back when firing
    const pullX = slashProgress > 0 ? -9 * Math.sin(slashProgress * Math.PI) : -3;
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5, -9);
    ctx.lineTo(pullX, -6);
    ctx.lineTo(5, -9);
    ctx.stroke();

    // Leather pouch
    ctx.fillStyle = '#451A03';
    ctx.fillRect(pullX - 2, -8, 4, 4);
  } else if (weaponStyle === 'ang_payong' || weaponStyle === 'dambana_staff') {
    const isLance = weaponStyle === 'dambana_staff';
    ctx.strokeStyle = isLance ? '#FACC15' : primaryColor;
    ctx.lineWidth = isLance ? 3.5 : 3;
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.lineTo(18, -14);
    ctx.stroke();
    // Curved wooden handle
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-6, 7, 3, 0, Math.PI);
    ctx.stroke();
    // Tip star/point
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(18, -14, isLance ? 3.4 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (weaponStyle === 'megaphone') {
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(13, -7);
    ctx.lineTo(13, 5);
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(11, -7, 2.5, 12);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-1, 2, 3.5, 6);
  } else if (weaponStyle === 'la_pluma') {
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-3, 5);
    ctx.lineTo(14, -14);
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(14, -14, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Balisong / Bolo / Kampilan / Sable blade anchored cleanly at hilt
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = weaponStyle === 'balisong' ? 2.4 : 3.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(weaponStyle === 'balisong' ? 12 : 19, weaponStyle === 'balisong' ? -8 : -14);
    ctx.stroke();
    // Guard & hilt
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.lineTo(3, 3);
    ctx.stroke();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, 5);
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// 6. STATIC WORLD BUILDINGS LAYER (DECOUPLED FROM RECRUITED ALLIES!)
// =========================================================================

export type WorldBuildingSpriteType =
  | 'bunker'
  | 'police_outpost'
  | 'broadcast_rig'
  | 'jeepney_hub'
  | 'mechanic_bike'
  | 'sari_sari_goods';

export interface WorldBuilding {
  id: string;
  type: WorldBuildingSpriteType;
  x: number; // Fixed world X — NEVER moves when an ally follows the player!
  y: number; // Relative Y offset from groundY
  ownerNpcId?: string;
}

export interface AllyEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: 1 | -1;
  isRecruited: boolean;
  homeBuildingId?: string; // Reference only — never drawn with the ally!
}

/**
 * Extracts all static guardhouses, bunkers, booths, and shops from zone NPCs ONCE
 * so they remain permanently anchored on the map even when allies are recruited!
 */
export function extractZoneStaticBuildings(
  npcs: ZoneNpcSpawn[],
  resolveX: (npc: ZoneNpcSpawn) => number
): WorldBuilding[] {
  const buildings: WorldBuilding[] = [];
  for (const npc of npcs) {
    const nx = resolveX(npc);
    if (npc.npcVisual === 'honest_police') {
      buildings.push({
        id: `bldg_outpost_${npc.id}`,
        type: 'police_outpost',
        x: nx - 122,
        y: 2,
        ownerNpcId: npc.id,
      });
    } else if (npc.npcVisual === 'honest_soldier') {
      buildings.push({
        id: `bldg_bunker_${npc.id}`,
        type: 'bunker',
        x: nx + 124,
        y: 2,
        ownerNpcId: npc.id,
      });
    } else if (npc.npcVisual === 'journalist_girl') {
      buildings.push({
        id: `bldg_rig_${npc.id}`,
        type: 'broadcast_rig',
        x: nx + 82,
        y: 2,
        ownerNpcId: npc.id,
      });
    } else if (npc.npcVisual === 'jeepney_driver' || (npc.npcVisual === 'dispatch_officer' && npc.shopType === 'jeepney')) {
      buildings.push({
        id: `bldg_hub_${npc.id}`,
        type: 'jeepney_hub',
        x: nx - 16,
        y: -6,
        ownerNpcId: npc.id,
      });
    } else if (npc.npcVisual === 'mechanic') {
      buildings.push({
        id: `bldg_mechbike_${npc.id}`,
        type: 'mechanic_bike',
        x: nx + 78,
        y: 2,
        ownerNpcId: npc.id,
      });
    } else if (npc.npcVisual === 'aling_nena' || npc.npcVisual === 'street_vendor') {
      buildings.push({
        id: `bldg_stall_${npc.id}`,
        type: 'sari_sari_goods',
        x: nx + 84,
        y: 2,
        ownerNpcId: npc.id,
      });
    }
  }
  return buildings;
}

// =========================================================================
// 7. SMALL FILIPINO PET COMPANIONS (SHEET 24 — WHITE-BG FILTERED)
// =========================================================================

export type SmallPetKind = 'aspin_puppy' | 'chick' | 'pangolin' | 'tarsier' | 'carabao_calf' | 'eaglelet';

const PET_SHEET_URL = '/assets/aistudio/24_small_filipino_pet_companions_c3ab6abd.png';
let petSheetClean: HTMLCanvasElement | null = null;
let petSheetLoading = false;

export function initSmallPetSheet(): void {
  if (petSheetLoading || typeof window === 'undefined') return;
  petSheetLoading = true;
  const img = new Image();
  img.src = PET_SHEET_URL;
  img.onload = () => {
    petSheetClean = removeWhiteBackground(img, 238);
  };
}

// Normalized crop boxes [x%, y%, w%, h%] across the 3 rows x 6 columns of Sheet 24
const PET_FRAMES_PCT: Record<SmallPetKind, [number, number, number, number][]> = {
  aspin_puppy: [
    [0.05, 0.17, 0.11, 0.17],
    [0.21, 0.16, 0.12, 0.18],
    [0.36, 0.17, 0.11, 0.17],
  ],
  chick: [
    [0.54, 0.2, 0.09, 0.14],
    [0.69, 0.17, 0.09, 0.16],
    [0.84, 0.16, 0.1, 0.17],
  ],
  pangolin: [
    [0.06, 0.49, 0.1, 0.14],
    [0.21, 0.48, 0.11, 0.15],
    [0.33, 0.48, 0.15, 0.15],
  ],
  tarsier: [
    [0.53, 0.41, 0.11, 0.21],
    [0.68, 0.41, 0.12, 0.21],
    [0.84, 0.41, 0.11, 0.21],
  ],
  carabao_calf: [
    [0.04, 0.75, 0.13, 0.2],
    [0.2, 0.75, 0.13, 0.2],
    [0.35, 0.75, 0.14, 0.2],
  ],
  eaglelet: [
    [0.52, 0.75, 0.13, 0.2],
    [0.68, 0.72, 0.13, 0.2],
    [0.82, 0.71, 0.16, 0.24],
  ],
};

export function drawSmallFilipinoPet(
  ctx: CanvasRenderingContext2D,
  kind: SmallPetKind,
  x: number,
  groundY: number,
  facing: 1 | -1,
  time: number,
  moving: boolean
): boolean {
  initSmallPetSheet();
  if (!petSheetClean) return false;

  const frames = PET_FRAMES_PCT[kind] || PET_FRAMES_PCT.aspin_puppy;
  const fIdx = moving ? Math.floor(time * 7.5) % frames.length : 0;
  const [px0, py0, pw, ph] = frames[fIdx];

  const sx = Math.floor(px0 * petSheetClean.width);
  const sy = Math.floor(py0 * petSheetClean.height);
  const sw = Math.max(8, Math.floor(pw * petSheetClean.width));
  const sh = Math.max(8, Math.floor(ph * petSheetClean.height));

  const drawH = kind === 'carabao_calf' ? 42 : kind === 'eaglelet' ? 40 : 34;
  const drawW = Math.round(drawH * (sw / sh));
  const hoverY = kind === 'eaglelet' ? -26 + Math.sin(time * 5.2) * 5 : moving ? -Math.abs(Math.sin(time * 10)) * 3 : 0;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundY + 2 + hoverY));

  const altScale = Math.max(0.45, 1 - Math.max(0, -hoverY) / 90);
  ctx.fillStyle = `rgba(10, 18, 28, ${(0.34 * altScale).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(0, -hoverY, drawW * 0.38 * altScale, 3.5 * altScale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (facing === -1) {
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(petSheetClean, sx, sy, sw, sh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
  return true;
}

// =========================================================================
// 8. SHEET 23: HERO AIMING TIRADOR (ON FOOT & ON BIKE) + AMMO SPRITES
// =========================================================================

const TIRADOR_SHEET_URL = '/assets/aistudio/23_tirador_slingshot_and_ammo_a9492b83.png';
let tiradorSheetClean: HTMLCanvasElement | null = null;
let tiradorSheetLoading = false;
const tiradorAmmoCanvasCache: Partial<Record<TiradorAmmoKind, HTMLCanvasElement>> = {};

export function initTiradorSheet(): void {
  if (tiradorSheetLoading || typeof window === 'undefined') return;
  tiradorSheetLoading = true;
  const img = new Image();
  img.src = TIRADOR_SHEET_URL;
  img.onload = () => {
    tiradorSheetClean = removeWhiteBackground(img, 238);
  };
}

/**
 * Renders the Hero's Tirador Slingshot aiming & release pose (both On Foot and On Bike)
 * anchored strictly at bottom-center (x, bottomY) using Sheet 23!
 */
export function drawHeroTiradorPose(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  targetH: number,
  facing: 1 | -1,
  ridingBike: boolean,
  progress01: number,
  scaleX = 1,
  scaleY = 1
): boolean {
  initTiradorSheet();
  if (!tiradorSheetClean) return false;

  // Bottom row of Sheet 23: [0]=Foot Aim, [1]=Foot Release, [2]=Bike Aim, [3]=Bike Release
  const boxes: [number, number, number, number][] = ridingBike
    ? [
        [0.51, 0.7, 0.21, 0.28],
        [0.74, 0.7, 0.22, 0.28],
      ]
    : [
        [0.06, 0.72, 0.18, 0.26],
        [0.27, 0.72, 0.2, 0.26],
      ];
  const frameIdx = progress01 < 0.42 ? 0 : 1;
  const [px0, py0, pw, ph] = boxes[frameIdx];

  const sx = Math.floor(px0 * tiradorSheetClean.width);
  const sy = Math.floor(py0 * tiradorSheetClean.height);
  const sw = Math.max(8, Math.floor(pw * tiradorSheetClean.width));
  const sh = Math.max(8, Math.floor(ph * tiradorSheetClean.height));

  const drawH = Math.round(targetH);
  const drawW = Math.round(drawH * (sw / sh));

  ctx.save();
  ctx.translate(Math.round(x), Math.round(bottomY));

  // Crisp ground contact shadow
  ctx.fillStyle = 'rgba(8, 16, 26, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 1, ridingBike ? 32 : 20, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(facing * scaleX, scaleY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tiradorSheetClean, sx, sy, sw, sh, -drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
  return true;
}

/**
 * Returns a clean ammo sprite for River Pebble / Agimat Stone / Sili Bomb,
 * preferring the perfected V4 illustrated ammo PNGs when loaded.
 */
export function getTiradorAmmoSprite(ammo: TiradorAmmoKind): HTMLCanvasElement | HTMLImageElement | null {
  const v4 = getV4TiradorAmmoImage(ammo);
  if (v4) return v4;

  initTiradorSheet();
  if (!tiradorSheetClean) return null;
  if (tiradorAmmoCanvasCache[ammo]) return tiradorAmmoCanvasCache[ammo]!;

  const boxes: Record<TiradorAmmoKind, [number, number, number, number]> = {
    river_pebble: [0.06, 0.47, 0.06, 0.08],
    agimat_stone: [0.39, 0.46, 0.07, 0.1],
    sili_bomb: [0.62, 0.47, 0.08, 0.09],
  };
  const [px0, py0, pw, ph] = boxes[ammo];
  const sx = Math.floor(px0 * tiradorSheetClean.width);
  const sy = Math.floor(py0 * tiradorSheetClean.height);
  const sw = Math.max(8, Math.floor(pw * tiradorSheetClean.width));
  const sh = Math.max(8, Math.floor(ph * tiradorSheetClean.height));

  const off = document.createElement('canvas');
  off.width = sw;
  off.height = sh;
  const octx = off.getContext('2d');
  if (!octx) return null;
  octx.drawImage(tiradorSheetClean, sx, sy, sw, sh, 0, 0, sw, sh);
  tiradorAmmoCanvasCache[ammo] = off;
  return off;
}

let visualPolishPreloadPromise: Promise<void> | null = null;

/**
 * Strictly preloads all uploaded vehicles (with white-BG filter), Small Pet Companions sheet,
 * Tirador sheet, and Town Panoramic vistas via Promise.all.
 */
export function preloadVisualPolishAssets(): Promise<void> {
  if (visualPolishPreloadPromise) return visualPolishPreloadPromise;
  if (typeof window === 'undefined') return Promise.resolve();

  cleanVehiclesInitialized = true;
  townBgsInitialized = true;
  petSheetLoading = true;
  tiradorSheetLoading = true;

  const tasks: Promise<void>[] = [];

  // 1. Clean Vehicles
  Object.entries(CLEAN_VEHICLE_URLS).forEach(([kind, urls]) => {
    cleanVehicleCanvases[kind] = cleanVehicleCanvases[kind] || [];
    urls.forEach((url, idx) => {
      tasks.push(
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            cleanVehicleCanvases[kind][idx] = removeWhiteBackground(img, 238);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        })
      );
    });
  });

  // 2. Small Filipino Pet Sheet
  tasks.push(
    new Promise<void>((resolve) => {
      if (petSheetClean) {
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => {
        petSheetClean = removeWhiteBackground(img, 238);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = PET_SHEET_URL;
    })
  );

  // 3. Tirador Sheet
  tasks.push(
    new Promise<void>((resolve) => {
      if (tiradorSheetClean) {
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => {
        tiradorSheetClean = removeWhiteBackground(img, 238);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = TIRADOR_SHEET_URL;
    })
  );

  // 4. Town Panoramic Vistas
  (Object.keys(TOWN_BG_FILES) as ZoneId[]).forEach((zoneId) => {
    const src = TOWN_BG_FILES[zoneId];
    if (!src) return;
    tasks.push(
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          townBgReady[zoneId] = true;
          resolve();
        };
        img.onerror = () => {
          townBgReady[zoneId] = false;
          resolve();
        };
        img.src = src;
        townBgCache[zoneId] = img;
      })
    );
  });

  visualPolishPreloadPromise = Promise.all(tasks).then(() => undefined);
  return visualPolishPreloadPromise;
}


