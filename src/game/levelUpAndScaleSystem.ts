// Level-Up Celebration Animation & Proper World-Scale System
// Integrates:
//  - ENTITY_WORLD_SCALES for proper Philippine vehicle, landmark, building & prop proportions
//  - ActiveLevelUpAnimation state with 4-frame celebration pose & 5-frame Golden Sun Pillar VFX
//  - Celebratory golden rays, rising particles, and RPG banner overlay

export interface WorldScaleSpec {
  width: number;
  height: number;
  yOffset?: number;
}

export const ENTITY_WORLD_SCALES: Record<string, WorldScaleSpec> = {
  // Humans & Characters (Baseline reference: Hero = 82px tall)
  hero_on_foot: { width: 58, height: 82 },
  hero_on_bike: { width: 92, height: 86 },
  npc_human: { width: 54, height: 80 },
  aspin_dog: { width: 54, height: 46 },

  // Street Props & Landmarks (scaled realistically against 82px hero)
  welcome_arch: { width: 290, height: 195 },
  highway_signpost: { width: 135, height: 145 },
  street_lamppost: { width: 54, height: 158 },
  gas_pump: { width: 76, height: 102 },
  police_outpost: { width: 168, height: 128 },
  sandbag_bunker: { width: 175, height: 98 },
  rest_hearth: { width: 84, height: 58 },
  km0_marker: { width: 58, height: 96 },

  // Vehicles (Proper Philippine Vehicle Proportions)
  jeepney_large: { width: 275, height: 144 },
  rescue_van: { width: 230, height: 122 },
  patrol_car: { width: 215, height: 108 },
  tricycle_passenger: { width: 158, height: 110 },
  tricycle_delivery: { width: 164, height: 112 },

  // Buildings & Safe Houses
  capitol_building: { width: 620, height: 310 },
  limay_refinery: { width: 540, height: 290 },
  store_7_elevate: { width: 290, height: 185 },
  store_osulit: { width: 280, height: 180 },
  store_patrol_gas: { width: 320, height: 190 },
  safe_house: { width: 310, height: 195 },
};

export interface LevelUpParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface ActiveLevelUpAnimation {
  active: boolean;
  newLevel: number;
  elapsedSec: number;
  durationSec: number;
  heroFrameIdx: number; // 0..3 from Hero Level Up Celebration Pose (4 frames)
  vfxFrameIdx: number; // 0..4 from Golden Sun Pillar & Rising Rings VFX (5 frames)
  originX: number;
  originY: number;
  particles: LevelUpParticle[];
}

export function triggerLevelUpAnimation(
  heroX: number,
  heroY: number,
  newLevel: number
): ActiveLevelUpAnimation {
  const particles: LevelUpParticle[] = [];
  for (let i = 0; i < 36; i++) {
    const spreadX = (Math.random() - 0.5) * 90;
    particles.push({
      x: heroX + spreadX,
      y: heroY - Math.random() * 40,
      vx: (Math.random() - 0.5) * 48,
      vy: -85 - Math.random() * 145,
      size: 2.5 + Math.random() * 4.5,
      color: i % 3 === 0 ? '#FEF08A' : i % 3 === 1 ? '#FACC15' : '#FFFFFF',
      life: 0,
      maxLife: 0.95 + Math.random() * 0.95,
    });
  }

  return {
    active: true,
    newLevel,
    elapsedSec: 0,
    durationSec: 2.1,
    heroFrameIdx: 0,
    vfxFrameIdx: 0,
    originX: heroX,
    originY: heroY,
    particles,
  };
}

export function updateLevelUpAnimation(
  anim: ActiveLevelUpAnimation | null,
  dt: number,
  followHeroX: number,
  followHeroY: number
): ActiveLevelUpAnimation | null {
  if (!anim || !anim.active) return null;

  anim.elapsedSec += dt;
  anim.originX = followHeroX;
  anim.originY = followHeroY;

  const t = Math.min(1, anim.elapsedSec / anim.durationSec);

  // 4-frame Hero Celebration timing: Charge -> Leap -> Peak -> Landing
  if (t < 0.2) anim.heroFrameIdx = 0;
  else if (t < 0.45) anim.heroFrameIdx = 1;
  else if (t < 0.78) anim.heroFrameIdx = 2;
  else anim.heroFrameIdx = 3;

  // 5-frame Golden Sun Pillar VFX timing
  anim.vfxFrameIdx = Math.min(4, Math.floor(t * 5));

  for (const p of anim.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy *= 0.985;
  }

  if (anim.elapsedSec >= anim.durationSec) {
    return null;
  }
  return anim;
}

export function renderLevelUpOverlay(
  ctx: CanvasRenderingContext2D,
  anim: ActiveLevelUpAnimation,
  cameraX: number,
  drawPillarVfx?: (
    ctx: CanvasRenderingContext2D,
    screenX: number,
    groundY: number,
    vfxFrameIdx: number,
    alpha: number
  ) => void
): void {
  const screenX = Math.round(anim.originX - cameraX);
  const screenY = Math.round(anim.originY);
  const t = Math.min(1, anim.elapsedSec / anim.durationSec);
  const fadeOut = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;

  ctx.save();

  // Golden sun pillar sprite (from Sheet 21) behind/around hero
  if (drawPillarVfx) {
    drawPillarVfx(ctx, screenX, screenY + 12, anim.vfxFrameIdx, fadeOut * 0.94);
  } else {
    // Fallback golden sun-ray column
    const pillarGrad = ctx.createLinearGradient(screenX, screenY - 240, screenX, screenY + 10);
    pillarGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
    pillarGrad.addColorStop(0.5, `rgba(253, 224, 71, ${0.42 * fadeOut})`);
    pillarGrad.addColorStop(1, `rgba(254, 240, 138, ${0.72 * fadeOut})`);
    ctx.fillStyle = pillarGrad;
    ctx.fillRect(screenX - 42, screenY - 240, 84, 250);
  }

  // Rising golden sparkles
  for (const p of anim.particles) {
    const pAlpha = Math.max(0, 1 - p.life / p.maxLife) * fadeOut;
    if (pAlpha <= 0.02) continue;
    ctx.globalAlpha = pAlpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(Math.round(p.x - cameraX), Math.round(p.y), p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floating RPG "LEVEL UP!" golden pixel banner above hero
  const floatOffset = Math.min(34, anim.elapsedSec * 28);
  const bannerY = screenY - 116 - floatOffset;
  ctx.globalAlpha = fadeOut;
  ctx.textAlign = 'center';

  ctx.font = 'bold 20px "Trebuchet MS", monospace';
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 5;
  ctx.strokeText(`★ LEVEL UP! LV. ${anim.newLevel} ★`, screenX, bannerY);
  ctx.fillStyle = '#FACC15';
  ctx.fillText(`★ LEVEL UP! LV. ${anim.newLevel} ★`, screenX, bannerY);

  ctx.font = 'bold 12px "Trebuchet MS", monospace';
  ctx.lineWidth = 3;
  ctx.strokeText('+3 STAT POINTS AVAILABLE! • HP & SP RESTORED', screenX, bannerY + 19);
  ctx.fillStyle = '#FEF9C3';
  ctx.fillText('+3 STAT POINTS AVAILABLE! • HP & SP RESTORED', screenX, bannerY + 19);

  ctx.restore();
}
