// Ambient Wildlife & Roadside Flora for Bataan: Laban sa Korapsyon
// Renders swaying roadside gumamela/sampaguita pixel flowers anchored cleanly on groundY,
// soaring sky birds, daytime butterflies, and glowing night fireflies behind foreground combat.

export interface FloraFlower {
  worldX: number;
  petalColor: string;
  centerColor: string;
  stemHeight: number;
  swayPhase: number;
}

export interface AmbientBird {
  x: number;
  y: number;
  vx: number;
  wingPhase: number;
  scale: number;
}

export interface AmbientInsect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  kind: 'butterfly' | 'firefly';
  color: string;
}

export class AmbientWildlifeAndFlora {
  private flowers: FloraFlower[] = [];
  private birds: AmbientBird[] = [];
  private insects: AmbientInsect[] = [];
  private initialized = false;
  private worldSpanX = 6400;

  private ensureInit(worldSpanX: number, groundY: number, viewportHeight: number): void {
    if (this.initialized) return;
    this.initialized = true;
    this.worldSpanX = Math.max(4200, worldSpanX);

    const palette = [
      { petal: '#FACC15', center: '#EA580C' }, // Yellow gumamela / santan
      { petal: '#FB7185', center: '#FEF08A' }, // Pink/coral bloom
      { petal: '#F8FAFC', center: '#F59E0B' }, // White sampaguita/wildflower
      { petal: '#C084FC', center: '#FDE047' }, // Violet roadside blossom
    ];

    for (let wx = 90; wx < this.worldSpanX; wx += 145 + Math.random() * 155) {
      const pick = palette[Math.floor(Math.random() * palette.length)];
      this.flowers.push({
        worldX: wx,
        petalColor: pick.petal,
        centerColor: pick.center,
        stemHeight: 7 + Math.round(Math.random() * 5),
        swayPhase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 9; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      this.birds.push({
        x: Math.random() * 1400,
        y: 62 + Math.random() * Math.max(90, viewportHeight * 0.26),
        vx: dir * (48 + Math.random() * 38),
        wingPhase: Math.random() * Math.PI * 2,
        scale: 0.85 + Math.random() * 0.45,
      });
    }

    for (let i = 0; i < 24; i++) {
      const isFirefly = i % 2 === 0;
      this.insects.push({
        x: Math.random() * 1400,
        y: groundY - 26 - Math.random() * 115,
        vx: (Math.random() - 0.5) * 34,
        vy: (Math.random() - 0.5) * 20,
        phase: Math.random() * Math.PI * 2,
        kind: isFirefly ? 'firefly' : 'butterfly',
        color: isFirefly ? '#BEF264' : i % 3 === 0 ? '#FDE047' : '#38BDF8',
      });
    }
  }

  public update(
    rawDt: number,
    viewportWidth: number,
    viewportHeight: number,
    groundY: number,
    isStorm: boolean
  ): void {
    this.ensureInit(6400, groundY, viewportHeight);
    const dt = Math.min(0.05, Math.max(0, rawDt));

    // Birds fly across sky (slower/sparser during heavy storm)
    const birdSpeedMult = isStorm ? 0.35 : 1;
    for (const b of this.birds) {
      b.x += b.vx * birdSpeedMult * dt;
      b.wingPhase += dt * (isStorm ? 6 : 12);

      if (b.x > viewportWidth + 80) b.x = -80;
      if (b.x < -80) b.x = viewportWidth + 80;
    }

    // Insects flutter gently in organic sine waves
    for (const ins of this.insects) {
      ins.phase += dt * 4.5;
      ins.x += (ins.vx + Math.cos(ins.phase) * 14) * dt;
      ins.y += (ins.vy + Math.sin(ins.phase * 1.4) * 12) * dt;

      if (ins.x < -40) ins.x = viewportWidth + 40;
      if (ins.x > viewportWidth + 40) ins.x = -40;
      // Keep insects & fireflies cleanly in the mid/far background foliage band behind buildings & heroes
      const minY = Math.max(70, groundY - 220);
      const maxY = Math.max(minY + 24, groundY - 82);
      if (ins.y < minY) ins.y = minY;
      if (ins.y > maxY) ins.y = maxY;
    }
  }

  /**
   * Renders roadside pixel flowers, far sky birds, and background butterflies / fireflies behind buildings & combat.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    cameraX: number,
    groundY: number,
    isNight: boolean,
    timeSec: number
  ): void {
    this.ensureInit(6400, groundY, 720);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const baseY = Math.round(groundY);

    // 1. Background Flying Pixel Birds high in the sky
    for (const b of this.birds) {
      if (b.x < -40 || b.x > viewportWidth + 40) continue;
      const wingLift = Math.round(Math.sin(b.wingPhase) * 3.5 * b.scale);
      const bx = Math.round(b.x);
      const by = Math.round(b.y);
      const w = Math.max(3, Math.round(4.5 * b.scale));

      ctx.strokeStyle = isNight ? 'rgba(203, 213, 225, 0.55)' : 'rgba(30, 41, 59, 0.62)';
      ctx.lineWidth = Math.max(1.3, 1.8 * b.scale);
      ctx.beginPath();
      ctx.moveTo(bx - w, by + wingLift);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + w, by + wingLift);
      ctx.stroke();
    }

    // 2. Background Daytime Butterflies & Nighttime Fireflies (soft depth parallax, strictly behind buildings & hero)
    for (const ins of this.insects) {
      if (ins.x < -30 || ins.x > viewportWidth + 30) continue;
      if (isNight && ins.kind === 'butterfly') continue;
      if (!isNight && ins.kind === 'firefly') continue;

      const parallaxX = ((ins.x - cameraX * 0.22) % (viewportWidth + 60) + (viewportWidth + 60)) % (viewportWidth + 60) - 30;
      const ix = Math.round(parallaxX);
      const iy = Math.round(Math.min(groundY - 78, ins.y));
      const flap = Math.abs(Math.sin(ins.phase * 2.4));

      if (ins.kind === 'firefly') {
        const pulse = 0.22 + flap * 0.52;
        ctx.fillStyle = `rgba(190, 242, 100, ${(pulse * 0.65).toFixed(2)})`;
        ctx.fillRect(ix - 1, iy - 1, 3, 3);
        ctx.fillStyle = `rgba(254, 249, 195, ${(pulse * 0.85).toFixed(2)})`;
        ctx.fillRect(ix, iy, 1.5, 1.5);
      } else {
        ctx.globalAlpha = 0.72;
        const wingW = Math.max(1, Math.round(1.5 + flap * 1.5));
        ctx.fillStyle = ins.color;
        ctx.fillRect(ix - wingW, iy - 1, wingW, 2);
        ctx.fillRect(ix + 1, iy - 1, wingW, 2);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(ix, iy - 1, 1, 3);
        ctx.globalAlpha = 1;
      }
    }

    // 3. Roadside Pixel Flowers anchored neatly along the back curb edge of groundY
    for (const f of this.flowers) {
      const sx = Math.round(f.worldX - cameraX);
      if (sx < -24 || sx > viewportWidth + 24) continue;

      const sway = Math.sin(timeSec * 2.8 + f.swayPhase) * 1.8;
      const topX = Math.round(sx + sway);
      const topY = baseY - f.stemHeight;

      ctx.fillStyle = isNight ? '#15803D' : '#22C55E';
      ctx.fillRect(sx, topY, 2, f.stemHeight);
      ctx.fillRect(sx - 2, baseY - 4, 2, 2);

      ctx.fillStyle = f.petalColor;
      ctx.fillRect(topX - 2, topY - 2, 2, 2);
      ctx.fillRect(topX + 2, topY - 2, 2, 2);
      ctx.fillRect(topX, topY - 4, 2, 2);
      ctx.fillRect(topX, topY, 2, 2);

      ctx.fillStyle = f.centerColor;
      ctx.fillRect(topX, topY - 2, 2, 2);
    }

    ctx.restore();
  }
}
