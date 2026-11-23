// Modular Paper-Doll Hero Cosmetics & Outfit Tinting System
// Ensures equipped Outfit, Headgear, Cape/Backgear, Weapon, and Bike Skin render consistently
// across ALL hero animations (on-foot idle, walk, run, combat, shield, magic casts, level-up, and all 10 bike skins)
// as well as the Character Inventory & Cosmetics preview canvas.

import { PlayerProgress } from './types';

export interface OutfitPalette {
  shirtHex: string;
  shirtShadowHex: string;
  pantsHex: string;
  trimHex: string;
  badgeText?: string;
}

export const OUTFIT_PALETTES: Record<string, OutfitPalette> = {
  // Starter Worn Shirt
  outfit_worn_tshirt: {
    shirtHex: '#F3EFE4',
    shirtShadowHex: '#D8D1C2',
    pantsHex: '#5B7FA0',
    trimHex: '#94A3B8',
  },
  outfit_starter: {
    shirtHex: '#F3EFE4',
    shirtShadowHex: '#D8D1C2',
    pantsHex: '#5B7FA0',
    trimHex: '#94A3B8',
  },
  // Defender Vest
  outfit_defender_vest: {
    shirtHex: '#2E7D32',
    shirtShadowHex: '#1B5E20',
    pantsHex: '#37474F',
    trimHex: '#FACC15',
  },
  // Bataan Barong Tagalog
  outfit_barong: {
    shirtHex: '#FFF8E7',
    shirtShadowHex: '#E8D9B5',
    pantsHex: '#1E293B',
    trimHex: '#D4AF37',
  },
  outfit_bataan_barong: {
    shirtHex: '#FFF8E7',
    shirtShadowHex: '#E8D9B5',
    pantsHex: '#1E293B',
    trimHex: '#D4AF37',
  },
  // Midnight Trench Coat / Kapitan Coat / Vigilante Jacket
  outfit_midnight_trench: {
    shirtHex: '#1E3A5F',
    shirtShadowHex: '#0F172A',
    pantsHex: '#111827',
    trimHex: '#38BDF8',
  },
  outfit_balanga_trench: {
    shirtHex: '#1E3A5F',
    shirtShadowHex: '#0F172A',
    pantsHex: '#111827',
    trimHex: '#38BDF8',
  },
  outfit_bataan_jacket: {
    shirtHex: '#264653',
    shirtShadowHex: '#172E38',
    pantsHex: '#1F2937',
    trimHex: '#F4A261',
  },
  // Dambana Sun Armor / Katipunan Coat / Awakened Mantle
  outfit_dambana_armor: {
    shirtHex: '#B91C1C',
    shirtShadowHex: '#7F1D1D',
    pantsHex: '#1F2937',
    trimHex: '#FBBF24',
  },
  outfit_katipunan_coat: {
    shirtHex: '#991B1B',
    shirtShadowHex: '#63171B',
    pantsHex: '#1E293B',
    trimHex: '#FDE047',
  },
  outfit_awakened_mantle: {
    shirtHex: '#312E81',
    shirtShadowHex: '#1E1B4B',
    pantsHex: '#111827',
    trimHex: '#F59E0B',
  },
  // Barangay Tanod Blue Uniform
  outfit_tanod_blue: {
    shirtHex: '#1D4ED8',
    shirtShadowHex: '#1E3A8A',
    pantsHex: '#1E293B',
    trimHex: '#93C5FD',
  },
  // Syndicate Infiltrator Black-Gold Barong
  outfit_syndicate_barong: {
    shirtHex: '#18181B',
    shirtShadowHex: '#09090B',
    pantsHex: '#09090B',
    trimHex: '#EF4444',
  },
};

export interface HeroRenderContext {
  x: number;
  y: number;
  facing: 1 | -1;
  width: number;
  height: number;
  timeSec: number;
  velocityX: number;
  isOnBike: boolean;
  isAttacking: boolean;
  isDefending: boolean;
  isJumping: boolean;
  progress: PlayerProgress;
  /** Optional explicit palette override derived from equipped gear item */
  paletteOverride?: OutfitPalette;
}

const tintedSpriteCache = new Map<string, HTMLCanvasElement>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [243, 239, 228];
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function resolveOutfitPalette(
  outfitId: string | undefined,
  fallbackPrimary?: string,
  fallbackAccent?: string
): OutfitPalette {
  if (outfitId && OUTFIT_PALETTES[outfitId]) {
    return OUTFIT_PALETTES[outfitId];
  }
  if (fallbackPrimary) {
    const [r, g, b] = hexToRgb(fallbackPrimary);
    const sr = Math.max(0, r - 34);
    const sg = Math.max(0, g - 34);
    const sb = Math.max(0, b - 34);
    const shadowHex = `#${sr.toString(16).padStart(2, '0')}${sg.toString(16).padStart(2, '0')}${sb.toString(16).padStart(2, '0')}`;
    return {
      shirtHex: fallbackPrimary,
      shirtShadowHex: shadowHex,
      pantsHex: '#2B3A4D',
      trimHex: fallbackAccent || '#FACC15',
    };
  }
  return OUTFIT_PALETTES.outfit_worn_tshirt;
}

/**
 * Generates and caches a crisp palette-swapped hero sprite frame matching the equipped outfit
 * (recoloring the base white shirt & blue denim pixels while preserving warm brown skin, hair & outlines).
 */
export function getOutfitTintedFrame(
  sourceCanvas: HTMLCanvasElement,
  cacheKey: string,
  outfitId: string,
  paletteOverride?: OutfitPalette
): HTMLCanvasElement {
  const palette = paletteOverride ?? OUTFIT_PALETTES[outfitId] ?? OUTFIT_PALETTES.outfit_worn_tshirt;
  if (!outfitId || outfitId === 'outfit_worn_tshirt' || outfitId === 'outfit_starter') {
    return sourceCanvas;
  }

  const fullKey = `${cacheKey}__${outfitId}__${palette.shirtHex}`;
  const existing = tintedSpriteCache.get(fullKey);
  if (existing) return existing;

  const off = document.createElement('canvas');
  off.width = sourceCanvas.width;
  off.height = sourceCanvas.height;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  try {
    const imgData = ctx.getImageData(0, 0, off.width, off.height);
    const data = imgData.data;
    const [sr, sg, sb] = hexToRgb(palette.shirtHex);
    const [pr, pg, pb] = hexToRgb(palette.pantsHex);

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 25) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const lum = (r + g + b) / 3;

      // 1. Detect white/off-white starter T-shirt pixels (high brightness, very low saturation, NOT dark skin/hair)
      if (lum > 188 && sat < 0.16) {
        const shade = Math.max(0.62, Math.min(1.12, lum / 238));
        data[i] = Math.min(255, Math.round(sr * shade));
        data[i + 1] = Math.min(255, Math.round(sg * shade));
        data[i + 2] = Math.min(255, Math.round(sb * shade));
      }
      // 2. Detect starter blue jeans pixels (dominant blue channel, medium luminance)
      else if (b > r + 18 && b > g + 8 && lum > 55 && lum < 185) {
        const shade = Math.max(0.65, Math.min(1.15, lum / 128));
        data[i] = Math.min(255, Math.round(pr * shade));
        data[i + 1] = Math.min(255, Math.round(pg * shade));
        data[i + 2] = Math.min(255, Math.round(pb * shade));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tintedSpriteCache.set(fullKey, off);
    return off;
  } catch {
    return sourceCanvas;
  }
}

/**
 * Proportional anchor sockets relative to the hero's bottom-center origin (0, 0).
 * Keeps Salakot/Caps, Headbands, Barong/Vest emblems, Capes/Satchels, and Weapons
 * perfectly aligned across both the Inventory Preview and the gameplay canvas.
 */
export function getHeroSockets(heroW: number, heroH: number, isOnBike = false) {
  const bikeLift = isOnBike ? heroH * 0.03 : 0;
  return {
    headTop:   { x: 0,              y: -heroH * 0.93 + bikeLift }, // Salakot / Cap / Crown
    forehead:  { x: 0,              y: -heroH * 0.79 + bikeLift }, // Mt. Samat Valor Band / Headband
    torso:     { x: 0,              y: -heroH * 0.52 + bikeLift }, // Vest / Barong / Coat
    back:      { x: -heroW * 0.14,  y: -heroH * 0.58 + bikeLift }, // Mantle / Satchel / Scarf
    handRight: { x: heroW * 0.24,   y: -heroH * 0.44 + bikeLift }, // Tirador / Payong / Balisong
  };
}

/**
 * Modular Paper-Doll Overlay Layer for the Bataan Hero Defender.
 * Strict draw order: back -> body/outfit -> hair/chest detail -> headgear -> weapon.
 * Works identically on-foot, in combat, during level-up, on every bike skin, and in Inventory Preview.
 */
export function renderModularHeroCosmetics(
  ctx: CanvasRenderingContext2D,
  heroCtx: HeroRenderContext,
  drawBaseHeroBody: () => void
): void {
  // All hero gear layers (hair, outfits, headgear, back gear, weapons, accessories)
  // are now rendered via preloaded HD illustrated PNGs in heroCompositeRenderer.ts.
  // Keep this hook delegating cleanly to drawBaseHeroBody with zero procedural 8-bit boxes.
  void ctx;
  void heroCtx;
  drawBaseHeroBody();
}
