// Multi-Frame Enemy, Boss & Hero Death Animation System
// Supports:
//  - sprite_collapse: 3-frame defeated sprite strip (El Mastermind, The Gracias Nomar, Fat Guy, Insekto)
//  - spirit_banish: upward glowing spirit-dissolve for Philippine folklore monsters
//  - knockout_tumble: physics arc knockback + tumble + dust/smoke burst for human enemies & corrupt officials
//  - hero_down: 1.8s hero defeat collapse sequence before Safe House respawn

export type DeathStyle =
  | 'sprite_collapse'
  | 'spirit_banish'
  | 'knockout_tumble'
  | 'hero_down';

export interface DeathParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface DyingEntityState {
  id: string;
  kind: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  style: DeathStyle;
  elapsedSec: number;
  durationSec: number;
  frameIndex: number; // 0 -> 1 -> 2 for 3-frame defeated animations
  hitstopSec: number; // Brief freeze-frame impact on final blow
  flashAlpha: number; // White/gold hit flash on death trigger
  rotationRad: number; // Ground tumble angle for knockout_tumble
  opacity: number; // Smooth fade-out at end of death animation
  lootDropped: boolean; // Ensures XP, Pesos & Evidence drop once on ground impact
  particles: DeathParticle[];
  /** Optional metadata for rendering the exact boss/mob sprite during collapse */
  targetHeight?: number;
  role?: string;
  bossId?: string;
}

const SPRITE_DEFEAT_KINDS = new Set([
  'insekto',
  'fat_guy',
  'boss_el_mastermind',
  'el_mastermind',
  'the_gracias_nomar',
  'gracias_nomar',
  'mayor',
  'vice_mayor',
  'awakened_boss',
  'corrupt_police',
]);

const SPIRIT_BANISH_KINDS = new Set([
  'aswang',
  'tiyanak',
  'white_lady',
  'balete_tree',
  'corrupted_priest',
  'mangkukulam',
]);

export function resolveDeathStyle(kind: string): DeathStyle {
  if (kind === 'hero') return 'hero_down';
  if (SPRITE_DEFEAT_KINDS.has(kind)) return 'sprite_collapse';
  if (SPIRIT_BANISH_KINDS.has(kind)) return 'spirit_banish';
  return 'knockout_tumble';
}

export function spawnDeathSequence(params: {
  id: string;
  kind: string;
  name: string;
  x: number;
  y: number;
  facing: 1 | -1;
  knockbackDir: 1 | -1;
  targetHeight?: number;
  role?: string;
  bossId?: string;
}): DyingEntityState {
  const style = resolveDeathStyle(params.kind);
  const isBoss =
    params.kind.startsWith('boss_') ||
    params.kind === 'el_mastermind' ||
    params.kind === 'the_gracias_nomar' ||
    params.kind === 'gracias_nomar' ||
    params.kind === 'vice_mayor' ||
    params.kind === 'mayor' ||
    params.kind === 'awakened_boss';

  const durationSec =
    style === 'hero_down'
      ? 1.8
      : style === 'sprite_collapse'
        ? isBoss
          ? 2.2
          : 1.15
        : style === 'spirit_banish'
          ? 1.1
          : isBoss
            ? 1.6
            : 0.95;

  const particles: DeathParticle[] = [];
  const particleCount = isBoss ? 26 : 14;
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.45;
    const speed = (style === 'spirit_banish' ? 40 : 65) + Math.random() * 110;
    const color =
      style === 'spirit_banish'
        ? i % 2 === 0
          ? '#93C5FD'
          : '#C084FC'
        : style === 'hero_down'
          ? '#FDE047'
          : params.kind === 'the_gracias_nomar' || params.kind === 'gracias_nomar' || params.kind === 'el_mastermind'
            ? i % 2 === 0
              ? '#EF4444'
              : '#F59E0B'
            : i % 2 === 0
              ? '#E5E7EB'
              : '#FBBF24';

    particles.push({
      x: params.x + (Math.random() - 0.5) * 28,
      y: params.y - 26 + (Math.random() - 0.5) * 32,
      vx: Math.cos(angle) * speed,
      vy:
        style === 'spirit_banish'
          ? -Math.abs(Math.sin(angle) * speed) - 35
          : Math.sin(angle) * speed - 45,
      size: 2.5 + Math.random() * (isBoss ? 5 : 3.5),
      color,
      alpha: 0.95,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.55,
    });
  }

  return {
    id: params.id,
    kind: params.kind,
    name: params.name,
    x: params.x,
    y: params.y,
    vx:
      style === 'knockout_tumble'
        ? params.knockbackDir * (isBoss ? 120 : 165)
        : style === 'sprite_collapse'
          ? params.knockbackDir * 42
          : 0,
    vy: style === 'knockout_tumble' ? (isBoss ? -190 : -230) : 0,
    facing: params.facing,
    style,
    elapsedSec: 0,
    durationSec,
    frameIndex: 0,
    hitstopSec: isBoss || style === 'hero_down' ? 0.14 : 0.06,
    flashAlpha: 1,
    rotationRad: 0,
    opacity: 1,
    lootDropped: false,
    particles,
    targetHeight: params.targetHeight,
    role: params.role,
    bossId: params.bossId,
  };
}

export function updateDyingEntity(
  entity: DyingEntityState,
  dt: number,
  groundY: number
): { finished: boolean; triggerLootDrop: boolean } {
  if (entity.hitstopSec > 0) {
    entity.hitstopSec = Math.max(0, entity.hitstopSec - dt);
    return { finished: false, triggerLootDrop: false };
  }

  entity.elapsedSec += dt;
  const t = Math.min(1, entity.elapsedSec / Math.max(0.01, entity.durationSec));
  entity.flashAlpha = Math.max(0, 1 - entity.elapsedSec * 5.2);

  let triggerLootDrop = false;

  if (entity.style === 'sprite_collapse') {
    entity.x += entity.vx * dt;
    entity.vx *= Math.pow(0.08, dt);

    if (t < 0.28) {
      entity.frameIndex = 0; // Staggered / reels back
    } else if (t < 0.62) {
      entity.frameIndex = 1; // Collapsing to knees / curling up
    } else {
      entity.frameIndex = 2; // Flat on ground defeated
      if (!entity.lootDropped) {
        entity.lootDropped = true;
        triggerLootDrop = true;
      }
    }

    if (t > 0.78) {
      entity.opacity = Math.max(0, 1 - (t - 0.78) / 0.22);
    }
  } else if (entity.style === 'spirit_banish') {
    entity.y -= 34 * dt;
    entity.opacity = Math.max(0, 1 - Math.pow(t, 1.35));
    if (!entity.lootDropped && t > 0.35) {
      entity.lootDropped = true;
      triggerLootDrop = true;
    }
  } else if (entity.style === 'knockout_tumble') {
    entity.x += entity.vx * dt;
    entity.vy += 880 * dt;
    entity.y += entity.vy * dt;

    const targetAngle = entity.facing === 1 ? -Math.PI * 0.48 : Math.PI * 0.48;
    entity.rotationRad += (targetAngle - entity.rotationRad) * Math.min(1, dt * 8.5);

    if (entity.y >= groundY) {
      entity.y = groundY;
      if (Math.abs(entity.vy) > 85) {
        entity.vy = -entity.vy * 0.28;
        entity.vx *= 0.52;
      } else {
        entity.vy = 0;
        entity.vx *= Math.pow(0.04, dt);
      }
      if (!entity.lootDropped) {
        entity.lootDropped = true;
        triggerLootDrop = true;
      }
    }

    if (t > 0.68) {
      entity.opacity = Math.max(0, 1 - (t - 0.68) / 0.32);
    }
  } else if (entity.style === 'hero_down') {
    if (t < 0.32) {
      entity.frameIndex = 0;
    } else if (t < 0.66) {
      entity.frameIndex = 1;
      entity.rotationRad = (entity.facing === 1 ? -1 : 1) * Math.min(0.65, (t - 0.32) * 2.2);
    } else {
      entity.frameIndex = 2;
      entity.rotationRad = (entity.facing === 1 ? -1 : 1) * Math.min(Math.PI * 0.45, 0.65 + (t - 0.66) * 2.4);
    }
    entity.opacity = t > 0.86 ? Math.max(0.25, 1 - (t - 0.86) * 4.5) : 1;
  }

  for (const p of entity.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (entity.style !== 'spirit_banish') {
      p.vy += 260 * dt;
    } else {
      p.vy -= 28 * dt;
    }
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);
  }

  return {
    finished: entity.elapsedSec >= entity.durationSec,
    triggerLootDrop,
  };
}

export function renderDyingEntity(
  ctx: CanvasRenderingContext2D,
  entity: DyingEntityState,
  cameraX: number,
  drawSpriteFn: (
    ctx: CanvasRenderingContext2D,
    entity: DyingEntityState,
    frameIndex: number,
    useDefeatedRow: boolean
  ) => void
): void {
  const screenX = Math.round(entity.x - cameraX);
  const screenY = Math.round(entity.y);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, entity.opacity));

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 2, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(screenX, screenY);
  if (entity.style === 'knockout_tumble' || entity.style === 'hero_down') {
    ctx.rotate(entity.rotationRad);
  }

  if (entity.flashAlpha > 0.08) {
    ctx.filter = `brightness(${1 + entity.flashAlpha * 2.2})`;
  }

  drawSpriteFn(ctx, entity, entity.frameIndex, entity.style === 'sprite_collapse');

  ctx.filter = 'none';
  ctx.restore();

  // Render death particles (smoke, spirit orbs, impact sparks)
  for (const p of entity.particles) {
    if (p.alpha <= 0.02) continue;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(Math.round(p.x - cameraX), Math.round(p.y), p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
