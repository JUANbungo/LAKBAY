// =========================================================================
// UNIFIED SKILL & COMBAT VFX ENGINE
// Replaces flat dropped PNG boxes with clean, centered particle/glow/ring
// effects with distinct school color themes and automatic TTL disposal.
// =========================================================================

export type SkillVfxTheme =
  | 'tawas_shield'
  | 'herbal_banig'
  | 'agimat_nova'
  | 'bathala_dawn'
  | 'kulam_hex'
  | 'usog_drain'
  | 'barang_swarm'
  | 'abyssal_eclipse'
  | 'buff_atk'
  | 'buff_def'
  | 'buff_speed'
  | 'buff_luck'
  | 'ally_muzzle'
  | 'ally_slash'
  | 'debuff_poison'
  | 'debuff_freeze'
  | 'debuff_confusion'
  | 'debuff_shadow';

interface VfxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
}

interface ActiveSkillVfx {
  id: number;
  theme: SkillVfxTheme;
  x: number;
  y: number;
  facing: 1 | -1;
  elapsed: number;
  duration: number;
  maxRadius: number;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  particles: VfxParticle[];
}

const THEME_PALETTES: Record<
  SkillVfxTheme,
  { primary: string; secondary: string; glow: string; radius: number; duration: number; count: number }
> = {
  tawas_shield: {
    primary: '#38BDF8',
    secondary: '#FDE047',
    glow: 'rgba(56, 189, 248, 0.45)',
    radius: 78,
    duration: 0.85,
    count: 20,
  },
  herbal_banig: {
    primary: '#22C55E',
    secondary: '#A7F3D0',
    glow: 'rgba(34, 197, 94, 0.45)',
    radius: 86,
    duration: 0.9,
    count: 24,
  },
  agimat_nova: {
    primary: '#FACC15',
    secondary: '#FFFFFF',
    glow: 'rgba(250, 204, 21, 0.55)',
    radius: 120,
    duration: 0.72,
    count: 28,
  },
  bathala_dawn: {
    primary: '#FDE047',
    secondary: '#FB923C',
    glow: 'rgba(253, 224, 71, 0.52)',
    radius: 145,
    duration: 1.05,
    count: 34,
  },
  kulam_hex: {
    primary: '#F43F5E',
    secondary: '#C084FC',
    glow: 'rgba(244, 63, 94, 0.48)',
    radius: 92,
    duration: 0.78,
    count: 22,
  },
  usog_drain: {
    primary: '#A855F7',
    secondary: '#E879F9',
    glow: 'rgba(168, 85, 247, 0.48)',
    radius: 96,
    duration: 0.85,
    count: 22,
  },
  barang_swarm: {
    primary: '#7C3AED',
    secondary: '#4ADE80',
    glow: 'rgba(124, 58, 237, 0.44)',
    radius: 118,
    duration: 0.92,
    count: 30,
  },
  abyssal_eclipse: {
    primary: '#E11D48',
    secondary: '#C084FC',
    glow: 'rgba(126, 34, 206, 0.52)',
    radius: 112,
    duration: 1.1,
    count: 32,
  },
  buff_atk: {
    primary: '#F97316',
    secondary: '#FDE047',
    glow: 'rgba(249, 115, 22, 0.45)',
    radius: 68,
    duration: 0.75,
    count: 18,
  },
  buff_def: {
    primary: '#38BDF8',
    secondary: '#BAE6FD',
    glow: 'rgba(56, 189, 248, 0.45)',
    radius: 68,
    duration: 0.75,
    count: 18,
  },
  buff_speed: {
    primary: '#2DD4BF',
    secondary: '#CCFBF1',
    glow: 'rgba(45, 212, 191, 0.45)',
    radius: 68,
    duration: 0.7,
    count: 18,
  },
  buff_luck: {
    primary: '#FACC15',
    secondary: '#86EFAC',
    glow: 'rgba(250, 204, 21, 0.48)',
    radius: 74,
    duration: 0.85,
    count: 22,
  },
  ally_muzzle: {
    primary: '#FDE047',
    secondary: '#FB923C',
    glow: 'rgba(253, 224, 71, 0.5)',
    radius: 26,
    duration: 0.22,
    count: 8,
  },
  ally_slash: {
    primary: '#38BDF8',
    secondary: '#F8FAFC',
    glow: 'rgba(56, 189, 248, 0.42)',
    radius: 42,
    duration: 0.28,
    count: 10,
  },
  debuff_poison: {
    primary: '#22C55E',
    secondary: '#A3E635',
    glow: 'rgba(34, 197, 94, 0.4)',
    radius: 44,
    duration: 0.55,
    count: 12,
  },
  debuff_freeze: {
    primary: '#38BDF8',
    secondary: '#E0F2FE',
    glow: 'rgba(56, 189, 248, 0.48)',
    radius: 48,
    duration: 0.6,
    count: 14,
  },
  debuff_confusion: {
    primary: '#F472B6',
    secondary: '#FDE047',
    glow: 'rgba(244, 114, 182, 0.45)',
    radius: 52,
    duration: 0.65,
    count: 14,
  },
  debuff_shadow: {
    primary: '#7E22CE',
    secondary: '#1E1B4B',
    glow: 'rgba(126, 34, 206, 0.5)',
    radius: 56,
    duration: 0.65,
    count: 16,
  },
};

export class SkillVfxManager {
  private effects: ActiveSkillVfx[] = [];
  private nextId = 1;

  public spawn(theme: SkillVfxTheme, worldX: number, worldY: number, facing: 1 | -1 = 1): void {
    const spec = THEME_PALETTES[theme] || THEME_PALETTES.agimat_nova;
    // Cap concurrent effects to avoid clutter or leaks
    if (this.effects.length > 24) {
      this.effects.shift();
    }

    const particles: VfxParticle[] = [];
    for (let i = 0; i < spec.count; i++) {
      const angle = (i / spec.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const speed =
        theme === 'ally_muzzle'
          ? 70 + Math.random() * 110
          : 55 + Math.random() * (spec.radius * 1.6);
      const isRising =
        theme === 'herbal_banig' ||
        theme === 'bathala_dawn' ||
        theme === 'buff_atk' ||
        theme === 'buff_def' ||
        theme === 'buff_speed' ||
        theme === 'buff_luck';
      particles.push({
        x: (Math.random() - 0.5) * 14,
        y: isRising ? (Math.random() - 0.2) * 20 : (Math.random() - 0.5) * 16,
        vx:
          theme === 'ally_muzzle'
            ? facing * Math.abs(Math.cos(angle)) * speed
            : Math.cos(angle) * speed * (isRising ? 0.55 : 1),
        vy: isRising ? -55 - Math.random() * 110 : Math.sin(angle) * speed * 0.72,
        size: 2.2 + Math.random() * 3.4,
        color: i % 2 === 0 ? spec.primary : spec.secondary,
        life: 0,
        maxLife: spec.duration * (0.55 + Math.random() * 0.45),
        gravity: isRising ? -25 : 40,
      });
    }

    this.effects.push({
      id: this.nextId++,
      theme,
      x: worldX,
      y: worldY,
      facing,
      elapsed: 0,
      duration: spec.duration,
      maxRadius: spec.radius,
      primaryColor: spec.primary,
      secondaryColor: spec.secondary,
      glowColor: spec.glow,
      particles,
    });
  }

  public update(dt: number): void {
    const safeDt = Math.min(0.05, Math.max(0, dt));
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.elapsed += safeDt;
      for (const p of fx.particles) {
        p.life += safeDt;
        p.x += p.vx * safeDt;
        p.y += p.vy * safeDt;
        p.vy += p.gravity * safeDt;
        p.vx *= 0.96;
      }
      if (fx.elapsed >= fx.duration) {
        this.effects.splice(i, 1);
      }
    }
  }

  public clear(): void {
    this.effects.length = 0;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, timeSec: number): void {
    if (this.effects.length === 0) return;

    for (const fx of this.effects) {
      const p = Math.max(0, Math.min(1, fx.elapsed / fx.duration));
      const fade = p < 0.16 ? p / 0.16 : p > 0.7 ? (1 - p) / 0.3 : 1;
      const sx = fx.x - cameraX;
      const sy = fx.y;
      const r = fx.maxRadius * (0.35 + 0.65 * Math.sin(Math.min(1, p * 1.45) * (Math.PI / 2)));

      ctx.save();
      ctx.translate(sx, sy);
      ctx.globalAlpha = Math.max(0, Math.min(0.85, fade * 0.85));

      if (fx.theme === 'ally_muzzle') {
        // Crisp directional starburst muzzle flash
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.45, fx.primaryColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(fx.facing * 8, 0, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.theme === 'ally_slash') {
        // Sweeping directional blade/strike arc
        ctx.strokeStyle = fx.primaryColor;
        ctx.lineWidth = 4 * (1 - p * 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        const startA = fx.facing === 1 ? -1.05 : Math.PI - 1.05;
        ctx.arc(0, 0, r * 0.85, startA, startA + 1.9);
        ctx.stroke();
      } else {
        // Ground-perspective aura ring + soft radial bloom (clean, centered, zero flat boxes!)
        ctx.save();
        ctx.scale(1, 0.48);
        const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
        grad.addColorStop(0, fx.glowColor);
        grad.addColorStop(0.65, fx.glowColor.replace(/0\.\d+\)/, '0.18)'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Rotating rune/energy ring
        ctx.rotate(timeSec * (fx.theme === 'abyssal_eclipse' ? 1.8 : 2.6));
        ctx.strokeStyle = fx.primaryColor;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = fx.secondaryColor;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Rising luminous pillar for Dawn / Buff / Heal skills
        if (
          fx.theme === 'bathala_dawn' ||
          fx.theme === 'herbal_banig' ||
          fx.theme === 'tawas_shield' ||
          fx.theme.startsWith('buff_')
        ) {
          const beamW = r * 0.52 * (1 - p * 0.25);
          const beamH = fx.theme === 'bathala_dawn' ? 210 : 120;
          const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamH);
          beamGrad.addColorStop(0, fx.glowColor);
          beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = beamGrad;
          ctx.fillRect(-beamW / 2, -beamH, beamW, beamH);
        }
      }

      // Crisp energy particles
      for (const pt of fx.particles) {
        const ptAlpha = Math.max(0, 1 - pt.life / Math.max(0.01, pt.maxLife));
        if (ptAlpha <= 0) continue;
        ctx.globalAlpha = ptAlpha * fade;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (0.4 + ptAlpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
