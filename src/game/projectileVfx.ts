// Dynamic Projectile VFX, Impact Bursts, Polished Town Backdrop, PO2 Clara Shooting System & Runtime Health Check

export type ProjectileVfxKind =
  | 'pebble'
  | 'agimat'
  | 'sili'
  | 'salt'
  | 'energy'
  | 'bullet'
  | 'laser'
  | 'ink'
  | 'bribe'
  | 'curse';

export interface TrailParticle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  color: string;
}

export interface AnimatedProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  kind: ProjectileVfxKind;
  sprite?: HTMLImageElement | HTMLCanvasElement | null;
  rotation: number;
  spinSpeed: number;
  life: number;
  maxLife: number;
  trail: TrailParticle[];
}

export interface ImpactBurst {
  x: number;
  y: number;
  color: string;
  glowColor: string;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  sparks: Array<{ angle: number; dist: number; speed: number; size: number }>;
}

export interface BulletTracer {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
  maxLife: number;
}

export const VFX_COLORS: Record<
  ProjectileVfxKind,
  { glow: string; trail: string; core: string; secondary: string }
> = {
  pebble: { glow: 'rgba(203, 213, 225, 0.55)', trail: '#cbd5e1', core: '#94a3b8', secondary: '#475569' },
  agimat: { glow: 'rgba(250, 204, 21, 0.95)', trail: '#fde047', core: '#fef08a', secondary: '#f59e0b' },
  sili: { glow: 'rgba(239, 68, 68, 0.95)', trail: '#f97316', core: '#ef4444', secondary: '#fde047' },
  salt: { glow: 'rgba(241, 245, 249, 0.88)', trail: '#e2e8f0', core: '#ffffff', secondary: '#cbd5e1' },
  energy: { glow: 'rgba(56, 189, 248, 0.92)', trail: '#38bdf8', core: '#e0f2fe', secondary: '#0284c7' },
  bullet: { glow: 'rgba(251, 191, 36, 0.9)', trail: '#fde047', core: '#ffffff', secondary: '#f59e0b' },
  laser: { glow: 'rgba(239, 68, 68, 0.95)', trail: '#f87171', core: '#ffe4e6', secondary: '#dc2626' },
  ink: { glow: 'rgba(94, 234, 212, 0.92)', trail: '#5eead4', core: '#f0fdfa', secondary: '#f4c542' },
  bribe: { glow: 'rgba(34, 197, 94, 0.88)', trail: '#4ade80', core: '#bbf7d0', secondary: '#15803d' },
  curse: { glow: 'rgba(168, 85, 247, 0.95)', trail: '#c084fc', core: '#f3e8ff', secondary: '#7e22ce' },
};

/**
 * Updates projectile position (in px/sec), spin or velocity-aligned rotation, and spawns dynamic trail particles.
 */
export function updateProjectile(p: AnimatedProjectile, dt: number): void {
  const safeDt = Number.isFinite(dt) ? Math.min(0.05, Math.max(0, dt)) : 0.016;
  p.x += p.vx * safeDt;
  p.y += p.vy * safeDt;
  p.life -= safeDt;

  // Spin tumbling projectiles (pebbles/sili/agimat/bribe) or align directional energy/bullets along flight vector
  p.rotation =
    p.spinSpeed !== 0 ? p.rotation + p.spinSpeed * safeDt : Math.atan2(p.vy, p.vx);

  const palette = VFX_COLORS[p.kind] || VFX_COLORS.energy;

  // Spawn rich per-frame trail particles (smoke + embers for sili, sparkles for agimat, mist for salt, blur for pebble)
  const spawnCount = p.kind === 'sili' || p.kind === 'agimat' ? 2 : 1;
  for (let s = 0; s < spawnCount; s++) {
    const jitter = p.kind === 'salt' ? 11 : p.kind === 'sili' ? 8 : 5;
    const isSmoke = p.kind === 'sili' && s === 1 && Math.random() < 0.55;
    p.trail.push({
      x: p.x + (Math.random() - 0.5) * jitter,
      y: p.y + (Math.random() - 0.5) * jitter,
      alpha: isSmoke ? 0.52 : 0.88,
      size: Math.max(1.8, p.radius * (0.42 + Math.random() * 0.42)),
      color: isSmoke ? '#64748b' : s === 1 ? palette.core : palette.trail,
    });
  }

  // Cap trail length for 60fps stability and fade particles smoothly via dt
  if (p.trail.length > 26) {
    p.trail.splice(0, p.trail.length - 26);
  }
  const decayFactor = Math.pow(0.08, safeDt);
  for (let i = p.trail.length - 1; i >= 0; i--) {
    p.trail[i].alpha -= safeDt * (p.kind === 'salt' ? 2.4 : 3.4);
    p.trail[i].size *= 0.82 + 0.18 * decayFactor;
    if (p.kind === 'sili') {
      p.trail[i].y -= 18 * safeDt; // rising embers & smoke
    }
    if (p.trail[i].alpha <= 0 || p.trail[i].size < 0.6) {
      p.trail.splice(i, 1);
    }
  }
}

/**
 * Renders an animated projectile with particle trails, additive glow bloom, velocity-aligned rotation, and crisp art.
 * Pass cameraX and groundY so world coordinates convert cleanly to screen space.
 */
export function drawAnimatedProjectile(
  ctx: CanvasRenderingContext2D,
  p: AnimatedProjectile,
  cameraX = 0,
  groundY = 0
): void {
  const palette = VFX_COLORS[p.kind] || VFX_COLORS.energy;
  const sx = p.x - cameraX;
  const sy = groundY + p.y;

  // 1. Dynamic Particle Trail + Motion Blur Lines behind projectile
  ctx.save();
  if (p.kind === 'pebble' || p.kind === 'bullet') {
    const dir = Math.sign(p.vx) || 1;
    ctx.strokeStyle = palette.trail;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = p.kind === 'bullet' ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.moveTo(sx - dir * (p.kind === 'bullet' ? 26 : 18), sy);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  }
  for (const t of p.trail) {
    ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x - cameraX, groundY + t.y, t.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Additive Radial Bloom Glow around projectile center
  ctx.save();
  const bloomR = p.radius * (p.kind === 'pebble' ? 1.8 : 2.7);
  const bloom = ctx.createRadialGradient(sx, sy, 1, sx, sy, bloomR);
  bloom.addColorStop(0, palette.glow);
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Rotating Projectile Core / Sprite
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(p.rotation);
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = p.kind === 'pebble' ? 6 : 14;

  const spriteReady =
    p.sprite &&
    ('complete' in p.sprite
      ? p.sprite.complete && p.sprite.naturalWidth > 0
      : p.sprite.width > 0 && p.sprite.height > 0);

  if (spriteReady && p.sprite) {
    const size = p.radius * 2.6;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(p.sprite, -size / 2, -size / 2, size, size);
  } else if (p.kind === 'sili') {
    // Spinning fiery red chili pepper bomb with green stem & glowing tip
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius * 1.25, p.radius * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(p.radius * 0.35, -1, p.radius * 0.42, p.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-p.radius * 1.35, -2, 4, 4);
  } else if (p.kind === 'agimat') {
    // Faceted glowing Golden Agimat Stone
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const rx = Math.cos(a) * p.radius;
      const ry = Math.sin(a) * p.radius;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-p.radius * 0.22, -p.radius * 0.22, p.radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'pebble') {
    // Tumbling shaded Bataan river pebble
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius, p.radius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-p.radius * 0.25, -p.radius * 0.22, p.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'bullet') {
    ctx.fillStyle = palette.trail;
    ctx.fillRect(-p.radius * 1.7, -2.8, p.radius * 3.4, 5.6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-p.radius * 1.1, -1.3, p.radius * 2.2, 2.6);
  } else if (p.kind === 'laser') {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-24, -4.5, 48, 9);
    ctx.fillStyle = '#ffe4e6';
    ctx.fillRect(-20, -2, 40, 4);
  } else if (p.kind === 'ink') {
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.15, -1.1, 1.1);
    ctx.stroke();
    ctx.strokeStyle = '#f4c542';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-4, 0, p.radius * 0.78, -0.9, 0.9);
    ctx.stroke();
  } else if (p.kind === 'bribe') {
    // Spinning wad of corrupt cash bills
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-p.radius, -p.radius * 0.65, p.radius * 2, p.radius * 1.3);
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-p.radius, -p.radius * 0.65, p.radius * 2, p.radius * 1.3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2.5, -p.radius * 0.65, 5, p.radius * 1.3);
  } else {
    // Glowing energy / salt / curse orb
    ctx.fillStyle = palette.trail;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-p.radius * 0.25, -p.radius * 0.25, p.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function spawnImpactBurst(
  bursts: ImpactBurst[],
  x: number,
  y: number,
  kind: ProjectileVfxKind
): void {
  const palette = VFX_COLORS[kind] || VFX_COLORS.energy;
  const count = kind === 'sili' || kind === 'agimat' ? 12 : 8;
  const maxRadius = kind === 'sili' ? 42 : kind === 'agimat' ? 34 : 24;
  bursts.push({
    x,
    y,
    color: palette.trail,
    glowColor: palette.glow,
    radius: 4,
    maxRadius,
    life: 0.26,
    maxLife: 0.26,
    sparks: Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
      dist: 4,
      speed: (kind === 'sili' ? 175 : 130) + Math.random() * 85,
      size: 2.2 + Math.random() * 2.8,
    })),
  });
}

export function updateImpactBursts(bursts: ImpactBurst[], dt: number): void {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life -= dt;
    const progress = 1 - Math.max(0, b.life / b.maxLife);
    b.radius = 4 + (b.maxRadius - 4) * progress;
    for (const sp of b.sparks) {
      sp.dist += sp.speed * dt;
      sp.speed *= Math.pow(0.15, dt);
    }
    if (b.life <= 0) {
      bursts.splice(i, 1);
    }
  }
}

export function drawImpactBursts(
  ctx: CanvasRenderingContext2D,
  bursts: ImpactBurst[],
  cameraX: number,
  groundY: number
): void {
  for (const b of bursts) {
    const a = Math.max(0, b.life / b.maxLife);
    const sx = b.x - cameraX;
    const sy = groundY + b.y;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = b.glowColor;
    ctx.shadowBlur = 12;

    // Expanding shockwave ring
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3 * a + 1;
    ctx.beginPath();
    ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright flash core
    if (a > 0.55) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }

    // Radial sparks
    ctx.fillStyle = b.color;
    for (const sp of b.sparks) {
      const px = sx + Math.cos(sp.angle) * sp.dist;
      const py = sy + Math.sin(sp.angle) * sp.dist;
      ctx.beginPath();
      ctx.arc(px, py, sp.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawBulletTracers(
  ctx: CanvasRenderingContext2D,
  tracers: BulletTracer[],
  cameraX: number,
  groundY: number
): void {
  for (const tr of tracers) {
    const a = Math.max(0, tr.life / tr.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = tr.color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = tr.color;
    ctx.lineWidth = 3.2 * a + 0.8;
    ctx.beginPath();
    ctx.moveTo(tr.x1 - cameraX, groundY + tr.y1);
    ctx.lineTo(tr.x2 - cameraX, groundY + tr.y2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4 * a;
    ctx.stroke();
    ctx.restore();
  }
}

// =========================================================================
// POLISHED TOWN BACKDROP (SMOOTH UPSCALING + HORIZON HAZE + ROAD LAYER)
// =========================================================================

export function drawPolishedTownBackdrop(
  ctx: CanvasRenderingContext2D,
  bgImg: HTMLImageElement | null,
  canvasWidth: number,
  canvasHeight: number,
  groundY: number,
  cameraX: number,
  cropTopPct = 0
): boolean {
  if (!bgImg || !bgImg.complete || bgImg.naturalWidth === 0) return false;

  const iw = bgImg.naturalWidth;
  const ih = bgImg.naturalHeight;
  const srcY = Math.floor(ih * cropTopPct);
  const srcH = Math.max(1, ih - srcY);

  ctx.save();
  // 1. Smooth high-quality backdrop pass so upscaled 12-town art never looks blocky
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 2. Aspect-ratio cover scaling cleanly aligned to horizon (groundY + 24), never stretched
  const backdropHeight = groundY + 24;
  const scale = Math.max(canvasWidth / iw, backdropHeight / srcH);
  const drawW = iw * scale;
  const drawH = srcH * scale;

  // Gentle horizontal parallax so backdrop feels spacious and deep (never a flat pasted wall)
  const maxPan = Math.max(0, drawW - canvasWidth);
  const panX = maxPan > 0 ? -((cameraX * 0.12) % maxPan) : (canvasWidth - drawW) / 2;
  const drawY = backdropHeight - drawH;

  ctx.drawImage(bgImg, 0, srcY, iw, srcH, panX, drawY, drawW, drawH);

  // 3. Atmospheric depth haze to push backdrop back so foreground characters pop
  const haze = ctx.createLinearGradient(0, groundY - 120, 0, groundY + 10);
  haze.addColorStop(0, 'rgba(20, 28, 45, 0.0)');
  haze.addColorStop(1, 'rgba(20, 28, 45, 0.42)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, groundY - 120, canvasWidth, 130);

  // 4. Distinct Sidewalk Curb & Asphalt Road Layer in front of backdrop
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, groundY - 8, canvasWidth, 14);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, groundY - 8, canvasWidth, 2);
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, groundY + 6, canvasWidth, Math.max(120, canvasHeight - groundY));

  // Scrolling yellow road lane dashes
  ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
  const dashOffset = -(((cameraX % 80) + 80) % 80);
  for (let x = dashOffset; x < canvasWidth + 80; x += 80) {
    ctx.fillRect(Math.floor(x), groundY + 34, 42, 4);
  }

  ctx.restore();
  return true;
}

// =========================================================================
// ALLY PO2 CLARA SANTOS (HONEST POLICE) SHOOTING ANIMATION & TRACER SYSTEM
// =========================================================================

export interface PoliceAllyState {
  x: number;
  y: number;
  facing: 1 | -1;
  shootAnimTimer: number; // > 0 while firing (e.g. 0.22s)
  shootCooldown: number;
  recoilX: number;
  aimAngle: number;
}

export function createPoliceAllyState(): PoliceAllyState {
  return {
    x: 0,
    y: 0,
    facing: 1,
    shootAnimTimer: 0,
    shootCooldown: 0.6,
    recoilX: 0,
    aimAngle: 0,
  };
}

export function updatePoliceShooting<T extends { x: number; y: number; hp: number }>(
  ally: PoliceAllyState,
  enemies: T[],
  dt: number,
  spawnBulletTracer: (x1: number, y1: number, x2: number, y2: number, target: T) => void
): boolean {
  if (ally.shootAnimTimer > 0) ally.shootAnimTimer = Math.max(0, ally.shootAnimTimer - dt);
  if (ally.shootCooldown > 0) ally.shootCooldown = Math.max(0, ally.shootCooldown - dt);
  ally.recoilX += (0 - ally.recoilX) * Math.min(1, dt * 16); // Smooth recoil recovery

  // Find closest live hostile within 380px
  const target = enemies
    .filter((e) => e.hp > 0 && Math.abs(e.x - ally.x) < 380)
    .sort((a, b) => Math.abs(a.x - ally.x) - Math.abs(b.x - ally.x))[0];

  if (!target) return false;

  ally.facing = target.x >= ally.x ? 1 : -1;
  const dx = Math.max(12, Math.abs(target.x - ally.x));
  const dy = (target.y - 34) - (ally.y - 40);
  ally.aimAngle = Math.max(-0.55, Math.min(0.45, Math.atan2(dy, dx)));

  if (ally.shootCooldown <= 0) {
    ally.shootCooldown = 1.15;
    ally.shootAnimTimer = 0.24; // Trigger aiming arm + pistol + muzzle flash
    ally.recoilX = -6;          // Crisp kickback recoil

    const muzzleX = ally.x + ally.facing * 26;
    const muzzleY = ally.y - 40;
    spawnBulletTracer(muzzleX, muzzleY, target.x, target.y - 34, target);
    return true;
  }
  return false;
}

export function drawPoliceShootingOverlay(
  ctx: CanvasRenderingContext2D,
  ally: PoliceAllyState,
  screenX: number,
  screenY: number
): void {
  if (ally.shootAnimTimer <= 0) return;

  ctx.save();
  ctx.translate(Math.round(screenX + ally.recoilX * ally.facing), Math.round(screenY - 40));
  ctx.scale(ally.facing, 1);
  ctx.rotate(ally.aimAngle);

  // Aiming Police Uniform Arm + Service Pistol
  ctx.fillStyle = '#1e3a8a';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.fillRect(3, -3.5, 14, 6.5);
  ctx.strokeRect(3, -3.5, 14, 6.5);

  // Hand
  ctx.fillStyle = '#d99b6c';
  ctx.fillRect(14, -2.5, 4, 4.5);

  // Service Pistol Slide & Grip
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(16, -4.5, 12, 5);
  ctx.fillRect(16, 0, 4.5, 6);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(18, -3.8, 8, 1.5);

  // Bright Starburst Muzzle Flash (first ~0.09s of gunshot)
  if (ally.shootAnimTimer > 0.15) {
    ctx.shadowColor = 'rgba(253, 224, 71, 0.95)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.lineTo(44, -10);
    ctx.lineTo(38, -2);
    ctx.lineTo(48, 0);
    ctx.lineTo(38, 2.5);
    ctx.lineTo(44, 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(31, -1, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// =========================================================================
// RUNTIME HEALTH CHECK AUDIT HELPER
// =========================================================================

export function runGameHealthCheck(state: {
  hero: { x: number; y: number };
  enemies: Array<{ id?: string; x: number; y?: number; maxHp: number }>;
  npcs: Array<{ id?: string; x: number }>;
  sprites: Record<string, HTMLImageElement | undefined>;
}): void {
  const brokenSprites = Object.entries(state.sprites)
    .filter(([, img]) => img && img.complete && img.naturalWidth === 0)
    .map(([key]) => key);

  if (brokenSprites.length > 0) {
    console.warn('[AUDIT] Broken Sprites:', brokenSprites);
  }
  if (!Number.isFinite(state.hero.x) || !Number.isFinite(state.hero.y)) {
    console.error('[AUDIT] Hero position is non-finite!', state.hero);
  }
  state.enemies.forEach((e, i) => {
    if (e.maxHp <= 0 || !Number.isFinite(e.x)) {
      console.warn(`[AUDIT] Enemy #${i} invalid stats/pos:`, e);
    }
  });
}
