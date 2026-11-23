// Dynamic Tropical Weather, Living Parallax Backdrop, Ally Spacing & Stray Pixel Artifact Filter
// Upgrades Bataan: Laban sa Korapsyon with authentic rain splashes, wet road sheen, fireflies,
// twinkling night stars, drifting clouds, safe ally spacing, and flood-fill stray pixel cleanup.

export type WeatherMode = 'clear' | 'drizzle' | 'heavy_rain' | 'monsoon_storm' | 'fog';

export const WEATHER_LABELS: Record<WeatherMode, string> = {
  clear: 'Sunny',
  drizzle: 'Drizzle',
  heavy_rain: 'Rain',
  monsoon_storm: 'Storm',
  fog: 'Fog',
};

export function nextWeatherMode(current: WeatherMode): WeatherMode {
  switch (current) {
    case 'clear':
      return 'drizzle';
    case 'drizzle':
      return 'heavy_rain';
    case 'heavy_rain':
      return 'monsoon_storm';
    case 'monsoon_storm':
      return 'fog';
    case 'fog':
    default:
      return 'clear';
  }
}

export function weatherFromRainIntensity(rainIntensity: number): WeatherMode {
  if (rainIntensity <= 0.02) return 'clear';
  if (rainIntensity < 0.3) return 'drizzle';
  if (rainIntensity < 0.7) return 'heavy_rain';
  return 'monsoon_storm';
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speedY: number;
  speedX: number;
  alpha: number;
}

interface RainSplash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

interface Firefly {
  x: number;
  y: number;
  phase: number;
  radius: number;
}

export class BataanAtmosphereSystem {
  public weather: WeatherMode = 'clear';
  private drops: RainDrop[] = [];
  private splashes: RainSplash[] = [];
  private fireflies: Firefly[] = [];
  private lightningAlpha = 0;
  private initialized = false;

  private ensureInit(width: number, height: number): void {
    if (this.initialized) return;
    this.initialized = true;

    this.drops = Array.from({ length: 185 }, () => ({
      x: Math.random() * (width + 240) - 120,
      y: Math.random() * height,
      length: 10 + Math.random() * 14,
      speedY: 460 + Math.random() * 280,
      speedX: -120 - Math.random() * 80,
      alpha: 0.22 + Math.random() * 0.34,
    }));

    this.fireflies = Array.from({ length: 24 }, () => ({
      x: Math.random() * Math.max(960, width),
      y: height * 0.32 + Math.random() * (height * 0.44),
      phase: Math.random() * Math.PI * 2,
      radius: 1.5 + Math.random() * 1.5,
    }));
  }

  public update(rawDt: number, viewportWidth: number, viewportHeight: number, groundY: number): void {
    this.ensureInit(viewportWidth, viewportHeight);
    const dt = Math.min(0.05, Math.max(0, rawDt));

    const activeCount =
      this.weather === 'clear' || this.weather === 'fog'
        ? 0
        : this.weather === 'drizzle'
        ? 60
        : this.weather === 'heavy_rain'
        ? 135
        : this.drops.length;

    const windMult = this.weather === 'monsoon_storm' ? 1.55 : this.weather === 'heavy_rain' ? 1.1 : 0.72;

    for (let i = 0; i < activeCount; i++) {
      const d = this.drops[i];
      d.x += d.speedX * windMult * dt;
      d.y += d.speedY * windMult * dt;

      if (d.y >= groundY + 4) {
        if (Math.random() < (this.weather === 'monsoon_storm' ? 0.42 : 0.28) && this.splashes.length < 72) {
          this.splashes.push({
            x: d.x,
            y: groundY + 2 + Math.random() * 8,
            life: 0,
            maxLife: 0.18 + Math.random() * 0.14,
          });
        }
        d.y = -20 - Math.random() * 110;
        d.x = Math.random() * (viewportWidth + 280) - 60;
      }

      if (d.x < -140) d.x = viewportWidth + 140;
    }

    for (let i = this.splashes.length - 1; i >= 0; i--) {
      this.splashes[i].life += dt;
      if (this.splashes[i].life >= this.splashes[i].maxLife) {
        this.splashes.splice(i, 1);
      }
    }

    // Monsoon distant lightning flash
    if (this.weather === 'monsoon_storm') {
      if (this.lightningAlpha > 0) {
        this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 2.6);
      } else if (Math.random() < dt * 0.14) {
        this.lightningAlpha = 0.28 + Math.random() * 0.2;
      }
    } else {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 4);
    }

    // Gentle firefly drift at night
    for (const f of this.fireflies) {
      f.phase += dt * 2.2;
      f.x += Math.cos(f.phase * 0.7) * 14 * dt;
      f.y += Math.sin(f.phase * 1.1) * 9 * dt;
      if (f.x < -20) f.x = viewportWidth + 20;
      if (f.x > viewportWidth + 20) f.x = -20;
      const minY = Math.max(80, groundY - 190);
      const maxY = groundY - 16;
      if (f.y < minY) f.y = minY;
      if (f.y > maxY) f.y = maxY;
    }
  }

  /**
   * Living parallax background: twinkling stars, drifting clouds, distant Bataan ridge shimmer, and fireflies.
   */
  public renderLivingBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    groundY: number,
    isNight: boolean,
    timeSec: number
  ): void {
    this.ensureInit(width, height);
    ctx.save();

    // 1. Twinkling stars at night (reduced during heavy storms)
    if (isNight) {
      const starAlphaScale = this.weather === 'monsoon_storm' ? 0.35 : this.weather === 'heavy_rain' ? 0.6 : 1;
      for (let i = 0; i < 42; i++) {
        const sx = ((i * 197 + 43 - cameraX * 0.04) % (width + 80) + width + 80) % (width + 80) - 40;
        const sy = 16 + ((i * 73) % Math.max(80, Math.floor(groundY * 0.48)));
        const twinkle = (0.3 + 0.7 * Math.abs(Math.sin(timeSec * (1.2 + (i % 4) * 0.5) + i))) * starAlphaScale;
        ctx.fillStyle = `rgba(241, 245, 249, ${twinkle.toFixed(2)})`;
        ctx.fillRect(Math.round(sx), Math.round(sy), i % 5 === 0 ? 2 : 1.5, i % 5 === 0 ? 2 : 1.5);
      }
    }

    // 2. Drifting tropical clouds (parallax speed = 0.09)
    const cloudCount = this.weather === 'clear' ? 5 : 8;
    const cloudColor = isNight
      ? this.weather === 'monsoon_storm'
        ? 'rgba(30, 41, 59, 0.52)'
        : 'rgba(148, 163, 184, 0.16)'
      : this.weather === 'monsoon_storm'
      ? 'rgba(71, 85, 105, 0.45)'
      : 'rgba(255, 255, 255, 0.34)';

    for (let c = 0; c < cloudCount; c++) {
      const span = width + 360;
      const cx = (((c * 280 + timeSec * (11 + (c % 3) * 4) - cameraX * 0.09) % span) + span) % span - 180;
      const cy = 40 + (c % 3) * 34;
      const cw = 96 + (c % 3) * 42;
      ctx.fillStyle = cloudColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw * 0.55, 15, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - cw * 0.28, cy + 4, cw * 0.34, 11, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + cw * 0.28, cy + 5, cw * 0.32, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Soft distant Bataan atmospheric haze band above the ridge
    const ridgeHaze = ctx.createLinearGradient(0, groundY - 120, 0, groundY);
    if (isNight) {
      ridgeHaze.addColorStop(0, 'rgba(30, 58, 95, 0)');
      ridgeHaze.addColorStop(1, 'rgba(56, 189, 248, 0.08)');
    } else {
      ridgeHaze.addColorStop(0, 'rgba(255, 255, 255, 0)');
      ridgeHaze.addColorStop(1, 'rgba(254, 243, 199, 0.12)');
    }
    ctx.fillStyle = ridgeHaze;
    ctx.fillRect(0, groundY - 120, width, 120);

    // 4. Glowing ambient fireflies at night (calm/drizzle)
    if (isNight && this.weather !== 'monsoon_storm') {
      for (const f of this.fireflies) {
        const pulse = 0.28 + 0.72 * Math.abs(Math.sin(f.phase * 1.4));
        ctx.fillStyle = `rgba(253, 224, 71, ${(pulse * 0.85).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Renders foreground rain streaks, road puddle splashes, wet asphalt sheen, and monsoon lightning.
   */
  public renderRainForeground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundY: number,
    timeSec: number
  ): void {
    if (this.weather === 'clear') return;
    this.ensureInit(width, height);

    if (this.weather === 'fog') {
      ctx.save();
      const fogGrad = ctx.createLinearGradient(0, 0, 0, height);
      fogGrad.addColorStop(0, 'rgba(203, 213, 225, 0.24)');
      fogGrad.addColorStop(0.55, 'rgba(226, 232, 240, 0.36)');
      fogGrad.addColorStop(1, 'rgba(148, 163, 184, 0.44)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);

      // Slow drifting coastal/mountain fog banks
      for (let i = 0; i < 6; i++) {
        const span = width + 480;
        const fx = (((i * 290 + timeSec * (16 + i * 3)) % span) + span) % span - 240;
        const fy = groundY - 40 - (i % 3) * 55;
        ctx.fillStyle = 'rgba(241, 245, 249, 0.16)';
        ctx.beginPath();
        ctx.ellipse(fx, fy, 175 + (i % 2) * 55, 36 + (i % 3) * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    ctx.save();

    // Subtle wet road reflection sheen + animated puddle ripples
    const sheenAlpha = this.weather === 'monsoon_storm' ? 0.2 : this.weather === 'heavy_rain' ? 0.14 : 0.08;
    const wetGrad = ctx.createLinearGradient(0, groundY, 0, height);
    wetGrad.addColorStop(0, `rgba(147, 197, 253, ${sheenAlpha})`);
    wetGrad.addColorStop(1, 'rgba(15, 23, 42, 0.08)');
    ctx.fillStyle = wetGrad;
    ctx.fillRect(0, groundY, width, Math.max(0, height - groundY));

    const activeCount =
      this.weather === 'drizzle' ? 60 : this.weather === 'heavy_rain' ? 135 : this.drops.length;
    const windDx = this.weather === 'monsoon_storm' ? -7.5 : this.weather === 'heavy_rain' ? -5.0 : -2.8;

    // Diagonal crisp rain streaks
    ctx.lineCap = 'round';
    ctx.lineWidth = this.weather === 'monsoon_storm' ? 1.55 : 1.15;
    for (let i = 0; i < activeCount; i++) {
      const d = this.drops[i];
      ctx.strokeStyle = `rgba(203, 230, 255, ${d.alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + windDx, d.y + d.length);
      ctx.stroke();
    }

    // Crisp ground impact splashes
    for (const s of this.splashes) {
      const t = s.life / s.maxLife;
      const rx = 2.5 + t * 8;
      const alpha = (1 - t) * 0.52;
      ctx.strokeStyle = `rgba(224, 242, 254, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rx, 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Brief distant monsoon lightning glow
    if (this.lightningAlpha > 0.01) {
      ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningAlpha.toFixed(2)})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Subtle rain mist drift near ground
    if (this.weather === 'heavy_rain' || this.weather === 'monsoon_storm') {
      const drift = Math.sin(timeSec * 0.9) * 18;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.045)';
      ctx.fillRect(0, groundY - 22 + drift * 0.08, width, 26);
    }

    ctx.restore();
  }
}

/**
 * Prevents allies/NPCs (PO2 Clara Santos, Kap Ben, Kuya Rico, Aling Nena) from overlapping inside buildings.
 */
export function resolveSafeAllyStandX(
  desiredX: number,
  buildings: Array<{ x: number; width: number }>
): number {
  let safeX = desiredX;
  for (let pass = 0; pass < 3; pass++) {
    let shifted = false;
    for (const b of buildings) {
      const half = b.width * 0.5 + 34;
      if (Math.abs(safeX - b.x) < half) {
        safeX = safeX < b.x ? b.x - half : b.x + half;
        shifted = true;
      }
    }
    if (!shifted) break;
  }
  return safeX;
}

/**
 * Removes stray floating pixel debris (e.g. clipped shoes, adjacent sign/folder corners)
 * from cached sprite canvases using 4-connected component flood-fill filtering.
 */
export function removeStrayFloatingArtifacts(
  canvas: HTMLCanvasElement,
  minPixelClusterSize = 32
): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  if (w < 8 || h < 8) return;

  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const total = w * h;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  const clusters: { indices: number[]; touchesBorder: boolean }[] = [];

  for (let i = 0; i < total; i++) {
    if (visited[i] || data[i * 4 + 3] < 24) continue;
    let qHead = 0;
    let qTail = 0;
    visited[i] = 1;
    queue[qTail++] = i;
    const indices: number[] = [];
    let touchesBorder = false;

    while (qHead < qTail) {
      const idx = queue[qHead++];
      indices.push(idx);
      const x = idx % w;
      const y = (idx - x) / w;
      if (x <= 1 || x >= w - 2 || y <= 1 || y >= h - 2) {
        touchesBorder = true;
      }

      if (x > 0) {
        const n = idx - 1;
        if (!visited[n] && data[n * 4 + 3] >= 24) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
      if (x + 1 < w) {
        const n = idx + 1;
        if (!visited[n] && data[n * 4 + 3] >= 24) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
      if (y > 0) {
        const n = idx - w;
        if (!visited[n] && data[n * 4 + 3] >= 24) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
      if (y + 1 < h) {
        const n = idx + w;
        if (!visited[n] && data[n * 4 + 3] >= 24) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
    }

    clusters.push({ indices, touchesBorder });
  }

  if (clusters.length <= 1) return;

  let maxCluster = 0;
  for (const c of clusters) {
    if (c.indices.length > maxCluster) maxCluster = c.indices.length;
  }

  let modified = false;
  for (const c of clusters) {
    // Strip tiny isolated debris or small border-hugging neighbor fragments (<12% of main body and touching crop edge)
    const isTiny = c.indices.length < minPixelClusterSize;
    const isBorderNeighborSlice =
      c.touchesBorder && c.indices.length < Math.max(minPixelClusterSize * 3, maxCluster * 0.09);
    if (isTiny || isBorderNeighborSlice) {
      for (const idx of c.indices) {
        data[idx * 4 + 3] = 0;
      }
      modified = true;
    }
  }

  if (modified) {
    ctx.putImageData(img, 0, 0);
  }
}
