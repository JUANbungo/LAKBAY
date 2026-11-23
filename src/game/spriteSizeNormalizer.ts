// Sprite Size Normalizer & Auto-Tight-Bounds Utility
// Eliminates inconsistent sprite sizes caused by extra blank whitespace inside manifest frames
// and enforces unified grounded visual heights across all characters, enemies, bosses, vehicles & buildings.

export interface TightBounds {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface NormalizedDrawBox {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Standard target standing pixel heights on the game canvas (relative to the 82px tall Hero).
 */
export const TARGET_VISUAL_HEIGHTS = {
  hero_human: 82,
  npc_human: 80,
  enemy_human: 82,
  enemy_tall: 128, // Balete Tree, Aswang
  boss_human: 96, // Corrupt Mayors, Vice Mayors, Congressman, Captain, The Gracias Nomar
  final_boss: 112, // El Mastermind
  dog_pet: 46, // Bantay & Asong Ulol
  small_prop: 58, // Hearth, Barrier, Sign
  medium_prop: 148, // Street Lamppost, Outpost
  vehicle_small: 108, // Tricycle, Patrol Car
  vehicle_large: 144, // Bataan Jeepney, Rescue Van
  house_building: 205, // Safe Houses, 7-Elevate, O!Sulit
} as const;

export type VisualHeightCategory = keyof typeof TARGET_VISUAL_HEIGHTS;

/**
 * Scans an ImageData buffer and returns the tightest non-empty pixel bounding box,
 * auto-trimming extra transparent/white padding around any sprite frame.
 */
export function getTightSpriteBounds(imgData: ImageData): TightBounds {
  const { width, height, data } = imgData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { sx: 0, sy: 0, sw: width, sh: height };
  }

  return {
    sx: minX,
    sy: minY,
    sw: maxX - minX + 1,
    sh: maxY - minY + 1,
  };
}

/**
 * Computes destination draw rectangle that guarantees exact visual height anchored to groundY.
 */
export function computeGroundedSpriteBox(
  centerX: number,
  groundY: number,
  tightBounds: TightBounds,
  targetVisualHeight: number,
  maxAllowedWidth?: number
): NormalizedDrawBox {
  const aspect = tightBounds.sw / Math.max(1, tightBounds.sh);
  let dh = targetVisualHeight;
  let dw = dh * aspect;

  if (maxAllowedWidth && dw > maxAllowedWidth) {
    dw = maxAllowedWidth;
    dh = dw / Math.max(0.1, aspect);
  }

  return {
    dx: Math.round(centerX - dw / 2),
    dy: Math.round(groundY - dh),
    dw: Math.round(dw),
    dh: Math.round(dh),
  };
}
