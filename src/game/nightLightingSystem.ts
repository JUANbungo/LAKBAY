// Subtle 16-Bit Night & Dusk Lighting System
// Replaces harsh flat white lamppost cones with crisp warm amber radial pools
// and balanced twilight/night atmospheric contrast so sprites stay vivid and readable.

export interface NightLightSource {
  x: number; // Screen-space X
  y: number; // Screen-space Y
  radius: number;
  colorRgb: string; // e.g. '255, 204, 112'
  intensity: number; // 0.15 to 0.9
  kind: 'lamppost' | 'hearth' | 'headlight' | 'magic_aura';
}

let lightMaskCanvas: HTMLCanvasElement | null = null;

function ensureLightMaskCanvas(width: number, height: number): HTMLCanvasElement {
  if (!lightMaskCanvas) {
    lightMaskCanvas = document.createElement('canvas');
  }
  if (lightMaskCanvas.width !== width || lightMaskCanvas.height !== height) {
    lightMaskCanvas.width = width;
    lightMaskCanvas.height = height;
  }
  return lightMaskCanvas;
}

/**
 * Returns normalized night darkness factor (0.0 in bright daytime, up to 0.44 at midnight).
 * Capped at 0.44 so characters, buildings, and combat cues stay crisp and readable.
 */
export function computeNightDarkness(timeOfDay: number, isHauntedZone = false): number {
  const h = ((timeOfDay % 24) + 24) % 24;
  let darkness = 0;

  if (h >= 17.5 && h < 20.0) {
    // Sunset / Dusk transition
    darkness = ((h - 17.5) / 2.5) * 0.36;
  } else if (h >= 20.0 || h < 4.5) {
    // Deep Night
    darkness = 0.4;
  } else if (h >= 4.5 && h < 6.5) {
    // Dawn transition
    darkness = (1 - (h - 4.5) / 2.0) * 0.4;
  }

  if (isHauntedZone) {
    darkness = Math.max(darkness, 0.36);
  }

  return Math.min(0.44, darkness);
}

/**
 * Draws a crisp, subtle warm radial light glow around a lamppost lantern bulb, hearth, or headlight
 * (ZERO flat white triangles or oversized blobs).
 */
export function drawPixelWarmLight(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  radius: number,
  intensity = 0.72,
  colorRgb = '255, 196, 92'
): void {
  const grad = ctx.createRadialGradient(screenX, screenY, 2, screenX, screenY, radius);
  grad.addColorStop(0, `rgba(${colorRgb}, ${Math.min(0.7, intensity * 0.56)})`);
  grad.addColorStop(0.38, `rgba(${colorRgb}, ${intensity * 0.24})`);
  grad.addColorStop(0.72, `rgba(${colorRgb}, ${intensity * 0.08})`);
  grad.addColorStop(1, `rgba(${colorRgb}, 0)`);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Renders the balanced 16-bit twilight/night atmosphere mask with soft punched-out light pools
 * and subtle warm glow halos around lampposts, hearths, vehicle headlights, and magic auras.
 */
export function renderNightLightingPass(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  timeOfDay: number,
  lights: NightLightSource[],
  isHauntedZone = false
): void {
  const darkness = computeNightDarkness(timeOfDay, isHauntedZone);
  if (darkness <= 0.02) return;

  const mask = ensureLightMaskCanvas(canvasWidth, canvasHeight);
  const mctx = mask.getContext('2d');
  if (!mctx) return;

  // 1. Fill offscreen darkness mask with deep moonlight indigo (never muddy pitch-black)
  mctx.globalCompositeOperation = 'source-over';
  mctx.clearRect(0, 0, canvasWidth, canvasHeight);
  mctx.fillStyle = isHauntedZone
    ? `rgba(14, 16, 40, ${darkness})`
    : `rgba(10, 18, 42, ${darkness})`;
  mctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Softly carve warm visibility holes around lampposts, hearths, headlights, and magic auras
  mctx.globalCompositeOperation = 'destination-out';
  for (const light of lights) {
    if (light.x + light.radius < -20 || light.x - light.radius > canvasWidth + 20) continue;
    const punch = mctx.createRadialGradient(
      light.x,
      light.y,
      light.radius * 0.08,
      light.x,
      light.y,
      light.radius
    );
    punch.addColorStop(0, `rgba(0, 0, 0, ${Math.min(0.92, light.intensity * 0.95)})`);
    punch.addColorStop(0.58, `rgba(0, 0, 0, ${light.intensity * 0.42})`);
    punch.addColorStop(1, 'rgba(0, 0, 0, 0)');
    mctx.fillStyle = punch;
    mctx.beginPath();
    mctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
    mctx.fill();
  }

  // 3. Composite night tint over gameplay world
  ctx.save();
  ctx.drawImage(mask, 0, 0);
  ctx.restore();

  // 4. Add subtle warm amber/cyan/gold light blooms using screen blending
  for (const light of lights) {
    if (light.x + light.radius < -20 || light.x - light.radius > canvasWidth + 20) continue;
    const glowScale = light.kind === 'lamppost' ? 0.72 : light.kind === 'headlight' ? 0.65 : 0.85;
    drawPixelWarmLight(
      ctx,
      light.x,
      light.y,
      light.radius * glowScale,
      light.intensity * (0.45 + darkness),
      light.colorRgb
    );
  }
}
