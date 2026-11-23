// ============================================================================
// LAKBAY BATAAN — PERFECTED LAYERED HERO, OUTFIT, HAIRSTYLE, SLINGSHOT & BIKE RENDERER (V4)
// Frame dimensions: 256x256 per sprite (groundY baseline at y = 242)
// Supports all 5 outfits x 5 poses ('idle' | 'run' | 'attack' | 'slingshot' | 'bike')
// AND all 3 hairstyles ('hair_defender' | 'hair_midnight' | 'hair_sunlit') natively!
// Single source of truth for On-Foot Gameplay, On-Bike Gameplay, Inventory Preview, and HUD Portrait.
// ============================================================================

import { PlayerProgress, TiradorAmmoKind } from './types';
import { drawV2Sprite, isV2SpriteReady } from './v2Sprites';

export type HeroPoseState = 'idle' | 'run' | 'attack' | 'slingshot' | 'bike';

export interface HeroSpriteBank {
  outfitsByHair: Record<string, HTMLImageElement>; // `${hairId}/${outfitId}_${pose}`
  outfits: Record<string, HTMLImageElement>;       // `${outfitId}_${pose}`
  hair: Record<string, HTMLImageElement>;
  headgear: Record<string, HTMLImageElement>;
  back: Record<string, HTMLImageElement>;
  weapons: Record<string, HTMLImageElement>;
  accessories: Record<string, HTMLImageElement>;
  ammo: Record<string, HTMLImageElement>;
  bikeParts: Record<string, HTMLImageElement>;
}

const OUTFIT_IDS = [
  'outfit_worn_tee',
  'outfit_defender_vest',
  'outfit_barong_patrol',
  'outfit_sentinel_coat',
  'outfit_dambana_armor',
] as const;

const HAIR_IDS = ['hair_defender', 'hair_midnight', 'hair_sunlit'] as const;
const POSES: HeroPoseState[] = ['idle', 'run', 'attack', 'slingshot', 'bike'];

const HEAD_IDS = [
  'head_defender_band',
  'head_salakot',
  'head_patrol_cap',
  'head_dambana_circlet',
  'head_miners_lamp',
  'head_buri_hat',
  'head_blue_cap',
  'head_red_headband',
] as const;

const BACK_IDS = [
  'back_courier_satchel',
  'back_tricolor_scarf',
  'back_sun_mantle',
  'back_green_bandana',
  'back_red_scarf',
  'back_bayong_pack',
  'back_canvas_rucksack',
] as const;

const WEAPON_IDS = [
  'wpn_tirador',
  'wpn_tirador_agimat',
  'wpn_ang_payong',
  'wpn_ang_payong_open',
  'wpn_megaphone',
  'wpn_balisong',
  'wpn_dambana_staff',
  'wpn_bamboo_spear',
] as const;

const ACCESSORY_IDS = [
  'acc_pito_whistle',
  'acc_dambana_badge',
  'acc_arid_charm',
  'acc_agimat_pendant',
] as const;

const AMMO_IDS = [
  'ammo_river_pebble',
  'ammo_agimat_stone',
  'ammo_sili_bomb',
] as const;

const BIKE_PART_IDS = [
  'bike_wheel_transparent',
  'bike_basket_evidence',
  'bike_pandesal_bangus',
] as const;

// Relative anchor sockets normalized to the 256x256 frame (groundY at y = 242)
const POSE_ANCHORS_256: Record<
  HeroPoseState,
  {
    head: { x: number; y: number; scale: number; rot?: number };
    back: { x: number; y: number; scale: number; rot?: number };
    acc: { x: number; y: number; scale: number };
    weapon: { x: number; y: number; scale: number; rot: number };
    umbrella: { x: number; y: number; scale: number; rot: number };
    basket: { x: number; y: number; scale: number };
  }
> = {
  idle: {
    head: { x: 128, y: 34, scale: 0.36 },
    back: { x: 105, y: 112, scale: 0.42 },
    acc: { x: 132, y: 106, scale: 0.20 },
    weapon: { x: 158, y: 134, scale: 0.30, rot: -0.25 },
    umbrella: { x: 154, y: 78, scale: 0.50, rot: 0.12 },
    basket: { x: 196, y: 120, scale: 0.24 },
  },
  run: {
    head: { x: 134, y: 44, scale: 0.36 },
    back: { x: 100, y: 116, scale: 0.44, rot: -0.14 },
    acc: { x: 136, y: 112, scale: 0.20 },
    weapon: { x: 162, y: 132, scale: 0.30, rot: 0.22 },
    umbrella: { x: 156, y: 82, scale: 0.50, rot: 0.18 },
    basket: { x: 196, y: 120, scale: 0.24 },
  },
  attack: {
    head: { x: 136, y: 48, scale: 0.36 },
    back: { x: 98, y: 120, scale: 0.44, rot: -0.18 },
    acc: { x: 138, y: 116, scale: 0.20 },
    weapon: { x: 176, y: 108, scale: 0.36, rot: 0.55 },
    umbrella: { x: 168, y: 86, scale: 0.52, rot: 0.42 },
    basket: { x: 196, y: 120, scale: 0.24 },
  },
  slingshot: {
    head: { x: 122, y: 34, scale: 0.36 },
    back: { x: 100, y: 112, scale: 0.42 },
    acc: { x: 126, y: 106, scale: 0.20 },
    weapon: { x: 196, y: 88, scale: 0.28, rot: 0.0 },
    umbrella: { x: 146, y: 74, scale: 0.48, rot: 0.08 },
    basket: { x: 196, y: 120, scale: 0.24 },
  },
  bike: {
    head: { x: 118, y: 28, scale: 0.36 },
    back: { x: 86, y: 104, scale: 0.42, rot: -0.15 },
    acc: { x: 122, y: 102, scale: 0.19 },
    weapon: { x: 158, y: 112, scale: 0.30, rot: -0.35 },
    umbrella: { x: 144, y: 66, scale: 0.50, rot: 0.05 },
    basket: { x: 192, y: 114, scale: 0.22 },
  },
};

// Bike skin subtle color harmonization (never flat procedural boxes)
const BIKE_SKIN_FILTERS: Record<string, string> = {
  bike_classic_green: '',
  bike_patrol_sidecar: 'saturate(1.08)',
  bike_jeepney_gold: 'hue-rotate(-48deg) saturate(1.22) brightness(1.06)',
  bike_patrol_blue: 'hue-rotate(84deg) saturate(1.15)',
  bike_katipunan_crimson: 'hue-rotate(-118deg) saturate(1.2)',
  bike_dambana_sunburst: 'hue-rotate(-58deg) saturate(1.3) brightness(1.08)',
};

// Resolve any legacy/awakened/cultural gear ID to its exact V4 sprite key
export function resolveOutfitId(rawId?: string | null): string {
  if (!rawId) return 'outfit_worn_tee';
  if ((OUTFIT_IDS as readonly string[]).includes(rawId)) return rawId;
  if (rawId.includes('dambana') || rawId.includes('tactical')) return 'outfit_dambana_armor';
  if (rawId.includes('sentinel') || rawId.includes('coat') || rawId.includes('bantay')) return 'outfit_sentinel_coat';
  if (rawId.includes('barong') || rawId.includes('awakened')) return 'outfit_barong_patrol';
  if (rawId.includes('defender') || rawId.includes('vest')) return 'outfit_defender_vest';
  return 'outfit_worn_tee';
}

export function resolveHairId(rawId?: string | null): string {
  if (!rawId) return 'hair_defender';
  if ((HAIR_IDS as readonly string[]).includes(rawId)) return rawId;
  if (rawId.includes('midnight') || rawId.includes('dark') || rawId.includes('black')) return 'hair_midnight';
  if (rawId.includes('sunlit') || rawId.includes('gold') || rawId.includes('light')) return 'hair_sunlit';
  return 'hair_defender';
}

export function resolveWeaponId(rawId?: string | null): { id: string; tintFilter?: string } | null {
  if (!rawId) return null;
  if ((WEAPON_IDS as readonly string[]).includes(rawId)) return { id: rawId };
  if (rawId.includes('tirador') && rawId.includes('agimat')) return { id: 'wpn_tirador_agimat' };
  if (rawId.includes('tirador')) return { id: 'wpn_tirador' };
  if (rawId.includes('payong')) return { id: 'wpn_ang_payong' };
  if (rawId.includes('megaphone')) return { id: 'wpn_megaphone' };
  if (rawId.includes('balisong') || rawId.includes('itak') || rawId.includes('bolo')) {
    return { id: 'wpn_balisong', tintFilter: rawId.includes('katipunan') ? 'drop-shadow(0 0 5px rgba(250,204,21,0.75))' : undefined };
  }
  if (rawId.includes('spear') || rawId.includes('kampilan') || rawId.includes('sable')) {
    return { id: 'wpn_bamboo_spear', tintFilter: 'drop-shadow(0 0 6px rgba(56,189,248,0.8))' };
  }
  if (rawId.includes('staff') || rawId.includes('pluma') || rawId.includes('dambana') || rawId.includes('guitar')) {
    return { id: 'wpn_dambana_staff', tintFilter: 'drop-shadow(0 0 6px rgba(250,204,21,0.82))' };
  }
  return { id: 'wpn_ang_payong' };
}

export function resolveHeadgearId(rawId?: string | null): string | null {
  if (!rawId) return null;
  if ((HEAD_IDS as readonly string[]).includes(rawId)) return rawId;
  if (rawId.includes('salakot')) return 'head_salakot';
  if (rawId.includes('circlet') || rawId.includes('dambana')) return 'head_dambana_circlet';
  if (rawId.includes('lamp') || rawId.includes('miner')) return 'head_miners_lamp';
  if (rawId.includes('buri')) return 'head_buri_hat';
  if (rawId.includes('blue')) return 'head_blue_cap';
  if (rawId.includes('patrol') || rawId.includes('cap')) return 'head_patrol_cap';
  if (rawId.includes('red')) return 'head_red_headband';
  return 'head_defender_band';
}

export function resolveBackId(rawId?: string | null): string | null {
  if (!rawId) return null;
  if ((BACK_IDS as readonly string[]).includes(rawId)) return rawId;
  if (rawId.includes('tricolor')) return 'back_tricolor_scarf';
  if (rawId.includes('sun') || rawId.includes('mantle')) return 'back_sun_mantle';
  if (rawId.includes('green')) return 'back_green_bandana';
  if (rawId.includes('red')) return 'back_red_scarf';
  if (rawId.includes('bayong')) return 'back_bayong_pack';
  if (rawId.includes('rucksack')) return 'back_canvas_rucksack';
  return 'back_courier_satchel';
}

export function resolveAccessoryId(rawId?: string | null): string | null {
  if (!rawId) return null;
  if ((ACCESSORY_IDS as readonly string[]).includes(rawId)) return rawId;
  if (rawId.includes('dambana') || rawId.includes('badge')) return 'acc_dambana_badge';
  if (rawId.includes('arid') || rawId.includes('charm')) return 'acc_arid_charm';
  if (rawId.includes('agimat') || rawId.includes('pendant')) return 'acc_agimat_pendant';
  return 'acc_pito_whistle';
}

let singletonBank: HeroSpriteBank | null = null;
let preloadPromise: Promise<HeroSpriteBank> | null = null;

export function getHeroSpriteBank(): HeroSpriteBank | null {
  return singletonBank;
}

export function isHeroSpriteBankReady(): boolean {
  return singletonBank !== null;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function getHeroSpriteTotalCount(): number {
  return (
    HAIR_IDS.length +
    HAIR_IDS.length * OUTFIT_IDS.length * POSES.length +
    HEAD_IDS.length +
    BACK_IDS.length +
    WEAPON_IDS.length +
    ACCESSORY_IDS.length +
    AMMO_IDS.length +
    BIKE_PART_IDS.length
  );
}

export function preloadHeroSpriteBank(
  basePath = '/assets/polished_v4',
  onItemDone?: () => void
): Promise<HeroSpriteBank> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const bank: HeroSpriteBank = {
      outfitsByHair: {},
      outfits: {},
      hair: {},
      headgear: {},
      back: {},
      weapons: {},
      accessories: {},
      ammo: {},
      bikeParts: {},
    };

    const track = (p: Promise<void>) =>
      p.finally(() => {
        if (onItemDone) onItemDone();
      });

    const tasks: Promise<void>[] = [];

    for (const hid of HAIR_IDS) {
      tasks.push(
        track(
          loadImg(`${basePath}/hair/${hid}.png`).then((img) => {
            if (img) bank.hair[hid] = img;
          })
        )
      );
      for (const oid of OUTFIT_IDS) {
        for (const pose of POSES) {
          tasks.push(
            track(
              loadImg(`${basePath}/outfits_by_hair/${hid}/${oid}_${pose}.png`).then((img) => {
                if (img) {
                  bank.outfitsByHair[`${hid}/${oid}_${pose}`] = img;
                  if (hid === 'hair_defender') bank.outfits[`${oid}_${pose}`] = img;
                }
              })
            )
          );
        }
      }
    }

    for (const id of HEAD_IDS) {
      tasks.push(track(loadImg(`${basePath}/headgear/${id}.png`).then((img) => { if (img) bank.headgear[id] = img; })));
    }
    for (const id of BACK_IDS) {
      tasks.push(track(loadImg(`${basePath}/back/${id}.png`).then((img) => { if (img) bank.back[id] = img; })));
    }
    for (const id of WEAPON_IDS) {
      tasks.push(track(loadImg(`${basePath}/weapons/${id}.png`).then((img) => { if (img) bank.weapons[id] = img; })));
    }
    for (const id of ACCESSORY_IDS) {
      tasks.push(track(loadImg(`${basePath}/accessories/${id}.png`).then((img) => { if (img) bank.accessories[id] = img; })));
    }
    for (const id of AMMO_IDS) {
      tasks.push(track(loadImg(`${basePath}/ammo_and_bike/${id}.png`).then((img) => { if (img) bank.ammo[id] = img; })));
    }
    for (const id of BIKE_PART_IDS) {
      tasks.push(track(loadImg(`${basePath}/ammo_and_bike/${id}.png`).then((img) => { if (img) bank.bikeParts[id] = img; })));
    }

    await Promise.all(tasks);
    singletonBank = bank;
    return bank;
  })();

  return preloadPromise;
}

export interface DrawHeroCompositeOpts {
  /** Override ridingBike check if needed (e.g., Inventory Preview toggle) */
  forcePose?: HeroPoseState;
  /** True while firing Tirador slingshot (keeps equipped outfit+hair+bike when riding!) */
  firingTirador?: boolean;
  /** 0..1 progress of Tirador draw/release or melee slash */
  actionProgress?: number;
  /** True while holding shield / umbrella open */
  shieldActive?: boolean;
  /** Flash intensity (0..1) when hurt */
  hurtFlash?: number;
  /** Overall opacity */
  alpha?: number;
  /** Forward velocity tilt in radians */
  tiltRad?: number;
  /** Vertical bob/breathing/suspension offset in world px */
  bobOffsetY?: number;
  /** Squash & stretch horizontal factor */
  scaleX?: number;
  /** Squash & stretch vertical factor */
  scaleY?: number;
  /** Draw soft contact shadow anchored at groundY */
  drawShadow?: boolean;
  /** Current clock time (seconds) for subtle animation polish */
  time?: number;
}

export function drawHeroComposite(
  ctx: CanvasRenderingContext2D,
  bank: HeroSpriteBank,
  progress: PlayerProgress,
  pose: HeroPoseState,
  centerX: number,
  groundY: number,
  scale = 0.5,
  facing: 1 | -1 = 1,
  wheelSpinRad = 0,
  opts: DrawHeroCompositeOpts = {}
): boolean {
  const outfitId = resolveOutfitId(progress.equippedOutfitId);
  const hairId = resolveHairId(progress.equippedHairId);
  const activePose: HeroPoseState =
    opts.forcePose ?? (progress.ridingBike ? 'bike' : opts.firingTirador ? 'slingshot' : pose);

  const bodyImg =
    bank.outfitsByHair[`${hairId}/${outfitId}_${activePose}`] ||
    bank.outfits[`${outfitId}_${activePose}`] ||
    bank.outfits[`outfit_worn_tee_${activePose}`];
  if (!bodyImg) return false;

  const anchors = POSE_ANCHORS_256[activePose];
  const frameSize = 256;
  const bobY = opts.bobOffsetY ?? 0;
  const sxFactor = opts.scaleX ?? 1;
  const syFactor = opts.scaleY ?? 1;
  const tiltRad = opts.tiltRad ?? 0;
  const actionP = opts.actionProgress ?? 0;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Soft elliptical ground contact shadow anchored directly at groundY
  if (opts.drawShadow !== false) {
    const shadowRx = activePose === 'bike' ? 68 * scale : 42 * scale;
    const shadowRy = Math.max(4, 11 * scale);
    ctx.fillStyle = 'rgba(10, 16, 26, 0.36)';
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 1, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.alpha !== undefined) {
    ctx.globalAlpha = Math.max(0, Math.min(1, opts.alpha));
  }

  // Optional Bantay sidecar companion sprite behind/beside bike when equipped with Patrol Sidecar
  if (activePose === 'bike' && progress.equippedBikeSkinId === 'bike_patrol_sidecar' && isV2SpriteReady('ally_bantay_idle')) {
    drawV2Sprite(
      ctx,
      'ally_bantay_idle',
      centerX - facing * 28 * scale,
      groundY - 4 * scale + bobY,
      58 * scale,
      facing,
      opts.time ?? 0,
      { fps: 5, shadowRadius: 0 }
    );
  }

  ctx.translate(centerX, groundY + bobY);
  if (tiltRad !== 0) {
    ctx.rotate(tiltRad);
  }
  ctx.scale(facing * scale * sxFactor, scale * syFactor);
  ctx.translate(-frameSize / 2, -242);

  const hurtFilter =
    opts.hurtFlash && opts.hurtFlash > 0.05
      ? 'brightness(2.35) contrast(1.25) drop-shadow(0 0 8px rgba(255,255,255,0.9))'
      : '';
  if (hurtFilter) {
    ctx.filter = hurtFilter;
  }

  // 1. Back Layer (Satchel, Tricolor Scarf, Sun Mantle, Bayong, Rucksack)
  const backId = resolveBackId(progress.equippedBackId);
  if (backId && bank.back[backId]) {
    const bImg = bank.back[backId];
    const bw = bImg.width * anchors.back.scale;
    const bh = bImg.height * anchors.back.scale;
    ctx.save();
    ctx.translate(anchors.back.x, anchors.back.y);
    if (anchors.back.rot) ctx.rotate(anchors.back.rot);
    ctx.drawImage(bImg, -bw / 2, -bh / 2, bw, bh);
    ctx.restore();
  }

  // 2. Hero Body + Equipped Outfit + Native Hairstyle
  if (activePose === 'bike' && progress.equippedBikeSkinId && BIKE_SKIN_FILTERS[progress.equippedBikeSkinId] && !hurtFilter) {
    ctx.save();
    ctx.filter = BIKE_SKIN_FILTERS[progress.equippedBikeSkinId];
    ctx.drawImage(bodyImg, 0, 0, frameSize, frameSize);
    ctx.restore();
  } else {
    ctx.drawImage(bodyImg, 0, 0, frameSize, frameSize);
  }

  // 3. Bike Front Basket & Spinning Hollow-Spoked Wheels
  if (activePose === 'bike') {
    const basketKey =
      progress.equippedBikeSkinId === 'bike_jeepney_gold' || progress.equippedBikeSkinId === 'bike_dambana_sunburst'
        ? 'bike_pandesal_bangus'
        : 'bike_basket_evidence';
    const basketImg = bank.bikeParts[basketKey];
    if (basketImg) {
      const bw = basketImg.width * anchors.basket.scale;
      const bh = basketImg.height * anchors.basket.scale;
      ctx.drawImage(basketImg, anchors.basket.x - bw / 2, anchors.basket.y - bh / 2, bw, bh);
    }

    if (bank.bikeParts.bike_wheel_transparent) {
      const wImg = bank.bikeParts.bike_wheel_transparent;
      const wheels = [
        { cx: 56, cy: 196, size: 82 },
        { cx: 196, cy: 196, size: 82 },
      ];
      for (const wh of wheels) {
        ctx.save();
        ctx.translate(wh.cx, wh.cy);
        ctx.rotate(wheelSpinRad);
        ctx.drawImage(wImg, -wh.size / 2, -wh.size / 2, wh.size, wh.size);
        ctx.restore();
      }
    }
  }

  // 4. Accessory Layer
  const accId = resolveAccessoryId(progress.equippedAccessoryId);
  if (accId && bank.accessories[accId]) {
    const aImg = bank.accessories[accId];
    const aw = aImg.width * anchors.acc.scale;
    const ah = aImg.height * anchors.acc.scale;
    ctx.drawImage(aImg, anchors.acc.x - aw / 2, anchors.acc.y - ah / 2, aw, ah);
  }

  // 5. Headgear Layer
  const headId = resolveHeadgearId(progress.equippedHeadgearId);
  if (headId && bank.headgear[headId]) {
    const hImg = bank.headgear[headId];
    const hw = hImg.width * anchors.head.scale;
    const hh = hImg.height * anchors.head.scale;
    ctx.save();
    ctx.translate(anchors.head.x, anchors.head.y);
    if (anchors.head.rot) ctx.rotate(anchors.head.rot);
    ctx.drawImage(hImg, -hw / 2, -hh / 2, hw, hh);
    ctx.restore();
  }

  // 6. Weapon / Tirador Layer (Preserves equipped cosmetics even while riding bike & firing!)
  if (activePose === 'bike' && opts.firingTirador) {
    const tiradorKey =
      progress.equippedWeaponId?.includes('agimat') ? 'wpn_tirador_agimat' : 'wpn_tirador';
    const tImg = bank.weapons[tiradorKey] || bank.weapons.wpn_tirador;
    if (tImg) {
      const tw = tImg.width * 0.30;
      const th = tImg.height * 0.30;
      const recoil = Math.sin(actionP * Math.PI) * -6;
      ctx.save();
      ctx.translate(174 + recoil, 92);
      ctx.rotate(-0.1 + Math.sin(actionP * Math.PI) * 0.16);
      ctx.drawImage(tImg, -tw / 2, -th / 2, tw, th);
      ctx.restore();
    }
  } else if (activePose !== 'slingshot') {
    const resolvedWpn = resolveWeaponId(progress.equippedWeaponId);
    if (resolvedWpn && bank.weapons[resolvedWpn.id]) {
      const wImg = bank.weapons[resolvedWpn.id];
      const ww = wImg.width * anchors.weapon.scale;
      const wh = wImg.height * anchors.weapon.scale;
      const swingRot = actionP > 0 ? Math.sin(actionP * Math.PI) * 0.95 - 0.25 : 0;
      ctx.save();
      ctx.translate(anchors.weapon.x, anchors.weapon.y);
      ctx.rotate(anchors.weapon.rot + swingRot);
      if (resolvedWpn.tintFilter && !hurtFilter) {
        ctx.filter = resolvedWpn.tintFilter;
      }
      ctx.drawImage(wImg, -ww / 2, -wh / 2, ww, wh);
      ctx.restore();
    }
  }

  // 7. Open Defender Umbrella Shield Layer [U] / [K]
  if ((progress.hasUmbrella && progress.umbrellaOpen) || opts.shieldActive) {
    const uImg = bank.weapons.wpn_ang_payong_open;
    if (uImg) {
      const uw = uImg.width * anchors.umbrella.scale;
      const uh = uImg.height * anchors.umbrella.scale;
      ctx.save();
      ctx.translate(anchors.umbrella.x, anchors.umbrella.y);
      ctx.rotate(anchors.umbrella.rot);
      if (opts.shieldActive && !hurtFilter) {
        ctx.filter = 'drop-shadow(0 0 10px rgba(56,189,248,0.85))';
      }
      ctx.drawImage(uImg, -uw / 2, -uh / 2, uw, uh);
      ctx.restore();
    }
  }

  ctx.restore();
  return true;
}

/**
 * Draws the exact equipped Hero (Outfit + Hair + Headgear + Back + Accessory) as a crisp
 * head-and-shoulders HUD bust portrait using the exact same V4 composite sprites!
 */
export function drawHeroCompositePortrait(
  ctx: CanvasRenderingContext2D,
  progress: PlayerProgress,
  size: number,
  time = 0
): boolean {
  const bank = getHeroSpriteBank();
  if (!bank) return false;

  ctx.save();
  ctx.clearRect(0, 0, size, size);

  // Subtle warm Philippine sunset/sky studio gradient inside portrait frame
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, '#1e3a5f');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Crop head & upper torso cleanly inside the square HUD portrait
  const previewProgress: PlayerProgress = {
    ...progress,
    ridingBike: false,
    umbrellaOpen: false,
  };
  const scale = (size / 138) * 1.04;
  const bob = Math.sin(time * 2.4) * 1.0;

  drawHeroComposite(
    ctx,
    bank,
    previewProgress,
    'idle',
    size * 0.5,
    size * 1.68 + bob,
    scale,
    1,
    0,
    { forcePose: 'idle', drawShadow: false, time }
  );

  ctx.restore();
  return true;
}

/**
 * Returns the crisp illustrated V4 Tirador projectile sprite for River Pebble / Agimat Stone / Sili Bomb.
 */
export function getV4TiradorAmmoImage(ammo: TiradorAmmoKind): HTMLImageElement | null {
  const bank = getHeroSpriteBank();
  if (!bank) return null;
  if (ammo === 'agimat_stone') return bank.ammo.ammo_agimat_stone || null;
  if (ammo === 'sili_bomb') return bank.ammo.ammo_sili_bomb || null;
  return bank.ammo.ammo_river_pebble || null;
}
