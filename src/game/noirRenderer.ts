import {
  drawBoss14x16Frame,
  drawBoss14x16Portrait,
  drawEnemy16x17Frame,
  drawIllustratedParallaxBackdrop,
  resolveBossAtlasRow,
  resolveEnemyAtlasStrip,
} from './assetPreloader';
import { BossProfile } from './bataanData';
import { DyingEntityState } from './deathAnimationSystem';
import { AwakenedBossDef, BikeSkinDef, getBikeSkinById, HeroGhostDef } from './expansionData';
import {
  drawHeroComposite,
  drawHeroCompositePortrait,
  getHeroSpriteBank,
  HeroPoseState,
} from './heroCompositeRenderer';
import { ENTITY_WORLD_SCALES } from './levelUpAndScaleSystem';
import { MagicSchool, MagicSkillDef } from './magicSkillsData';
import { drawPixelWarmLight } from './nightLightingSystem';
import { drawAtlasSprite, getBossAtlasId } from './spriteAtlas';
import { TARGET_VISUAL_HEIGHTS } from './spriteSizeNormalizer';
import { EnemySkillVisualKind } from './uniqueEnemySkillsAndMechanics';
import { computeSmooth16FrameAnim, drawV2Sprite, hasV2Sprite, SmoothAnimTransform } from './v2Sprites';
export { computeSmooth16FrameAnim };
export type { SmoothAnimTransform };
import { drawPoliceShootingOverlay, PoliceAllyState } from './projectileVfx';
import { renderVehicleOccupants } from './vehicleOccupantsRenderer';
import {
  AllyEntity,
  drawCleanUploadedVehicle,
  HeroMotionState,
  WorldBuilding,
} from './visualPolishAndAssets';
import { getMaterialById } from './gameConfig';
import {
  AmbientAnimalKind,
  BackVisualStyle,
  CommercialBuildingKind,
  HeadgearVisualStyle,
  HouseDef,
  MobKind,
  NpcVisualKind,
  OutfitVisualStyle,
  PlayerProgress,
  VehicleKind,
  WeaponVisualStyle,
  ZoneDef,
} from './types';
import { ZONES } from './worldData';

const INK = '#111A26';

export type LegacyBossVisualKind =
  | 'corrupt_politician'
  | 'evil_pastor'
  | 'corrupted_priest'
  | 'vice_mayor'
  | 'mayor'
  | 'aswang'
  | 'el_mastermind';

export interface FigureRenderOpts {
  x: number;
  y: number;
  facing: 1 | -1;
  walkPhase: number;
  scale?: number;
  coatColor: string;
  accentColor: string;
  hairColor: string;
  outfitStyle?: OutfitVisualStyle;
  headgearStyle?: HeadgearVisualStyle;
  headgearColor?: string;
  headgearAccent?: string;
  backStyle?: BackVisualStyle;
  backColor?: string;
  backAccent?: string;
  weaponStyle?: WeaponVisualStyle;
  weaponColor?: string;
  weaponAccent?: string;
  accessoryColor?: string | null;
  slashProgress?: number;
  comboStep?: number;
  hurtFlash?: number;
  umbrellaOpen?: boolean;
  shieldActive?: boolean;
  ridingBike?: boolean;
  bikeSkin?: BikeSkinDef;
  dashAlpha?: number;
  time?: number;
  /** Render the hero using the HD v2 / Atlas sprite strips */
  useAtlasHero?: boolean;
  isDashing?: boolean;
  speedRatio?: number;
  airborne?: boolean;
  skidding?: boolean;
  magicCastSchool?: MagicSchool | null;
  magicCastProgress?: number;
  equippedOutfitId?: string;
  /** Full player progress for modular paper-doll cosmetics */
  progress?: PlayerProgress;
  /** Horizontal velocity for cape & headband flutter */
  velocityX?: number;
  /** Active Level-Up Celebration frame index (0..3) */
  levelUpFrameIdx?: number | null;
  /** Smooth delta-time Hero & Bicycle kinematics */
  motion?: HeroMotionState;
  /** Tirador Slingshot aiming/firing animation progress (0..1) when pressing [L] */
  tiradorProgress?: number;
}

function px(n: number) {
  return Math.floor(n);
}

function drawOutlinedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline = INK,
  lw = 1.6
) {
  const rx = px(x);
  const ry = px(y);
  const rw = px(w);
  const rh = px(h);
  ctx.fillStyle = fill;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = outline;
  ctx.lineWidth = lw;
  ctx.strokeRect(rx, ry, rw, rh);
}

function shadeHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/** 16-bit Neo Geo multi-band shaded pixel rectangle (outline + base + top-left specular + bottom-right core shadow) */
function drawShadedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseHex: string,
  outline = INK,
  lw = 1.5
) {
  const rx = px(x);
  const ry = px(y);
  const rw = Math.max(2, px(w));
  const rh = Math.max(2, px(h));
  ctx.fillStyle = baseHex;
  ctx.fillRect(rx, ry, rw, rh);
  // Top-left 16-bit highlight rim
  if (rw >= 4 && rh >= 4) {
    ctx.fillStyle = shadeHex(baseHex, 30);
    ctx.fillRect(rx + 1, ry + 1, Math.max(1, rw - 2), Math.max(1, Math.min(3, Math.floor(rh * 0.25))));
    ctx.fillRect(rx + 1, ry + 1, Math.max(1, Math.min(2, Math.floor(rw * 0.2))), Math.max(1, rh - 2));
    // Bottom-right core shadow band
    ctx.fillStyle = shadeHex(baseHex, -28);
    ctx.fillRect(rx + 1, ry + rh - Math.max(2, Math.min(4, Math.floor(rh * 0.26))), rw - 2, Math.max(1, Math.min(3, Math.floor(rh * 0.26))));
    ctx.fillRect(rx + rw - Math.max(2, Math.min(3, Math.floor(rw * 0.22))), ry + 2, Math.max(1, Math.min(2, Math.floor(rw * 0.22))), rh - 3);
  }
  ctx.strokeStyle = outline;
  ctx.lineWidth = lw;
  ctx.strokeRect(rx, ry, rw, rh);
}

// =========================================================================
// 1. 16-BIT BATAAN BACKDROPS + DYNAMIC DAY/NIGHT CYCLE
// =========================================================================

export function isTimeNight(timeOfDay: number): boolean {
  return timeOfDay >= 19 || timeOfDay < 5.5;
}

export function drawNoirBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  groundY: number,
  cameraX: number,
  zone: ZoneDef,
  time: number,
  timeOfDay = 10
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const clockNight = isTimeNight(timeOfDay);
  const clockGolden = (timeOfDay >= 16.5 && timeOfDay < 19) || (timeOfDay >= 5.5 && timeOfDay < 7.2);
  const isNight = zone.lighting === 'haunted_night' || clockNight;
  const isGolden = !isNight && (zone.lighting === 'golden' || zone.lighting === 'dusk' || clockGolden);
  const tod: 'day' | 'golden' | 'night' = isNight ? 'night' : isGolden ? 'golden' : 'day';
  const isCave = zone.lighting === 'cave_dark' || zone.architectureStyle === 'mining_cave';

  // 4-Layer Seamless Illustrated Parallax Environment (Sky+Mt.Samat 0.1x, Town Skyline 0.3x,
  // Roadside Foliage 0.65x, Concrete Curb + Asphalt Road 1.0x anchored at groundY)
  drawIllustratedParallaxBackdrop(ctx, w, h, groundY, cameraX, zone, time, tod);

  if (isCave) {
    // Warm flickering cavern lanterns along the mine tunnel
    const beamShift = -(px(cameraX * 0.65) % 340);
    for (let bx = beamShift - 340; bx < w + 340; bx += 340) {
      const flick = 0.82 + Math.sin(time * 5 + bx) * 0.15;
      drawPixelWarmLight(ctx, bx + 26, 76, 98, 0.52 * flick, '251, 191, 36');
    }
    return;
  }

  // SINGLE DESIGNATED ZONE LANDMARK (Placed ONCE per zone using crisp HD v2 sprites!)
  if (zone.landmark) {
    const lx = px(zone.landmark.x - cameraX);
    if (lx > -480 && lx < w + 480) {
      const lid = zone.landmark.spriteId;
      if (lid === 'beach_bangka_isolated' || lid === 'bataan_beach_bangka') {
        drawV2Sprite(ctx, 'beach_palms_isolated', lx - 145, groundY - 8, 210, 1, time, {
          alpha: isNight ? 0.84 : 0.98,
          shadowRadius: 0,
        });
        drawV2Sprite(ctx, 'beach_nipa_isolated', lx + 125, groundY - 6, 165, 1, time, {
          alpha: isNight ? 0.86 : 0.98,
          shadowRadius: 48,
        });
        drawV2Sprite(ctx, 'beach_bangka_isolated', lx - 10, groundY - 12, 132, 1, time, {
          alpha: isNight ? 0.88 : 0.98,
          shadowRadius: 56,
        });
      } else if (hasV2Sprite(lid)) {
        drawV2Sprite(ctx, lid, lx, groundY - 4, zone.landmark.height ?? 225, 1, time, {
          alpha: isNight ? 0.88 : 0.98,
          shadowRadius: 72,
        });
      } else {
        const scenicIds = new Set([
          'san_jose_stone_church',
          'paaralang_bataan',
          'bataan_beach_bangka',
          'dambana_mt_samat',
          'plaza_garden_gazebo',
        ]);
        const isScenic = scenicIds.has(lid);
        drawAtlasSprite(ctx, lid, lx, groundY - 12, zone.landmark.height ?? 215, 1, time, {
          scenicFrame: isScenic,
          alpha: isNight ? 0.88 : 0.97,
          shadowRadius: isScenic ? 0 : 54,
        });
      }
    }
  }

  // Historic KM 0 Marker in Mariveles
  if (zone.id === 'mariveles') {
    const kmx = px(320 - cameraX);
    if (kmx > -180 && kmx < w + 180) {
      drawV2Sprite(ctx, 'prop_km0_marker', kmx, groundY + 2, ENTITY_WORLD_SCALES.km0_marker.height, 1, time, {
        shadowRadius: 24,
      });
    }
  }

  // Balanga Provincial Capitol HD Monument + Cordons placed ONCE behind El Mastermind
  if (zone.hasElMastermind && zone.elMastermindX) {
    const capX = px(zone.elMastermindX - cameraX);
    if (capX > -520 && capX < w + 520) {
      drawV2Sprite(
        ctx,
        'capitol_hd',
        capX,
        groundY - 6,
        ENTITY_WORLD_SCALES.capitol_building.height,
        1,
        time,
        {
          alpha: isNight ? 0.88 : 0.98,
          shadowRadius: 130,
          maxWidth: ENTITY_WORLD_SCALES.capitol_building.width,
        }
      );
    }
    for (const offset of [-180, 180]) {
      const bx = px(zone.elMastermindX + offset - cameraX);
      if (bx > -200 && bx < w + 200) {
        drawAtlasSprite(ctx, 'barangay_barrier', bx, groundY + 2, 84, offset < 0 ? 1 : -1, time, {
          shadowRadius: 30,
        });
      }
    }
  }

  // Commercial Buildings (7-Elevate, O!Sulit, Patrol Gas — HD v2 & Atlas sprites!)
  if (zone.buildings) {
    for (const b of zone.buildings) {
      const bx = px(b.x - cameraX);
      if (bx > -360 && bx < w + 360) {
        drawCommercialBuilding(ctx, bx, groundY, b.kind, time);
      }
    }
  }

  // Subtle Night / Haunted Ground Mist
  if (isNight) {
    const mist = ctx.createLinearGradient(0, groundY - 82, 0, groundY + 12);
    mist.addColorStop(0, 'rgba(0,0,0,0)');
    mist.addColorStop(1, zone.fogColor || 'rgba(14, 30, 46, 0.36)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, groundY - 82, w, 94);
  }
}

export function drawDambanaShrine(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  claimed: boolean,
  time: number,
  playerDist = 0
) {
  ctx.save();
  ctx.translate(px(x), px(groundY));
  const glow = 0.65 + Math.sin(time * 4) * 0.25;

  // HD Mt. Samat Dambana ng Kagitingan Shrine Sprite (placed ONCE in Pilar!)
  if (!drawV2Sprite(ctx, 'mt_samat_shrine', 0, -4, 245, 1, time, { shadowRadius: 80 })) {
    drawAtlasSprite(ctx, 'dambana_mt_samat', 0, -10, 224, 1, time, {
      scenicFrame: true,
    });
  }

  if (!claimed) {
    const aura = ctx.createRadialGradient(0, -64, 6, 0, -64, 54);
    aura.addColorStop(0, `rgba(244, 197, 66, ${0.52 * glow})`);
    aura.addColorStop(1, 'rgba(244, 197, 66, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -64, 54, 0, Math.PI * 2);
    ctx.fill();
  }

  // Uploaded Atlas 1 Floating Dambana Badge Sprite
  drawAtlasSprite(ctx, 'dambana_badge', 0, -28, 62, 1, time, {
    offsetY: Math.sin(time * 3.2) * 5,
    alpha: claimed ? 0.78 : 1,
    shadowRadius: 24,
  });

  ctx.restore();

  // Proximity-based nameplate (hidden until player approaches)
  if (playerDist < 280) {
    const alpha = Math.min(1, (280 - playerDist) / 90);
    drawEntityNameplate(
      ctx,
      x,
      groundY - 252,
      'Dambana ng Kagitingan Shrine',
      claimed ? 'Dambana Badge Claimed' : 'Press [E] to Claim Dambana Badge',
      !claimed && playerDist < 120,
      { alpha }
    );
  } else if (!claimed) {
    drawProximityMarkerDot(ctx, x, groundY - 256, '#F4C542', time);
  }
}

function drawCommercialBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  kind: CommercialBuildingKind,
  time = 0
) {
  if (kind === 'patrol_gas') {
    if (
      drawV2Sprite(ctx, 'patrol_gas_station', x, groundY + 2, ENTITY_WORLD_SCALES.store_patrol_gas.height, 1, time, {
        shadowRadius: 88,
        maxWidth: ENTITY_WORLD_SCALES.store_patrol_gas.width,
      })
    ) {
      drawV2Sprite(ctx, 'prop_gas_pump', x + 136, groundY + 2, ENTITY_WORLD_SCALES.gas_pump.height, 1, time, {
        shadowRadius: 24,
      });
      return;
    }
  } else if (kind === 'osulit') {
    if (
      drawV2Sprite(ctx, 'osulit_grocery', x, groundY + 2, ENTITY_WORLD_SCALES.store_osulit.height, 1, time, {
        shadowRadius: 84,
        maxWidth: ENTITY_WORLD_SCALES.store_osulit.width,
      })
    ) {
      return;
    }
  } else if (kind === '7_elevate') {
    if (
      drawV2Sprite(ctx, 'sari_sari_store', x, groundY + 2, ENTITY_WORLD_SCALES.store_7_elevate.height, 1, time, {
        shadowRadius: 72,
        maxWidth: ENTITY_WORLD_SCALES.store_7_elevate.width,
      })
    ) {
      return;
    }
  }

  const spriteId =
    kind === '7_elevate'
      ? 'shop_7_elevate'
      : kind === 'osulit'
        ? 'shop_o_sulit'
        : 'station_patrol_gas';
  drawAtlasSprite(ctx, spriteId, x, groundY + 4, ENTITY_WORLD_SCALES.store_7_elevate.height, 1, time);
}

export function drawStreetLanterns(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  cameraX: number,
  zone: ZoneDef,
  time: number,
  timeOfDay = 10
) {
  const isNight =
    zone.lighting === 'haunted_night' || zone.lighting === 'dusk' || timeOfDay >= 17.5 || timeOfDay < 6.2;
  const spacing = 580;
  const start = Math.floor(cameraX / spacing) * spacing + 160;
  const lampH = ENTITY_WORLD_SCALES.street_lamppost.height;

  for (let wx = start; wx < cameraX + w + spacing; wx += spacing) {
    const sx = px(wx - cameraX);
    if (sx < -120 || sx > w + 120) continue;

    // Always draw crisp pixel-art lamppost sprite without baked-in pale white cone blobs!
    drawV2Sprite(ctx, 'prop_streetlamp_off', sx, groundY - 2, lampH, 1, time, {
      shadowRadius: 15,
    });

    if (isNight) {
      const flicker = 0.88 + Math.sin(time * 4.5 + wx * 0.015) * 0.1;
      const bulbY = groundY - lampH + 18;
      // Crisp warm golden bulb core at lantern head
      ctx.save();
      ctx.fillStyle = `rgba(255, 232, 160, ${0.9 * flicker})`;
      ctx.beginPath();
      ctx.arc(sx, bulbY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtle warm amber radial pool around the lantern head only
      drawPixelWarmLight(ctx, sx, bulbY, 76, 0.72 * flicker, '255, 196, 92');
    }
  }
}

export function drawAmbientAnimal(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  kind: AmbientAnimalKind,
  time: number
) {
  const spriteId =
    kind === 'kalabaw' ? 'kalabaw_carabao' : kind === 'manok' ? 'manok_rooster' : 'aspin_askal';
  const targetH = kind === 'kalabaw' ? 98 : 68;
  drawAtlasSprite(ctx, spriteId, x, groundY + 2, targetH, 1, time, {
    shadowRadius: kind === 'kalabaw' ? 38 : 18,
  });
}

function drawProximityMarkerDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  time: number
) {
  const bob = Math.sin(time * 4) * 3;
  ctx.save();
  ctx.translate(px(x), px(y + bob));
  ctx.fillStyle = '#0B1520';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 7);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -4.5);
  ctx.lineTo(4.5, 0);
  ctx.lineTo(0, 4.5);
  ctx.lineTo(-4.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawTownHouseFacade(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  house: HouseDef,
  owned: boolean,
  time: number,
  playerDist = 0
) {
  // Unique HD standalone 16-bit Safe House sprites from Sheet 08 & Sheet 03!
  const houseSpriteMap: Record<string, string> = {
    house_defender_home: 'house_wood_stone',
    house_balanga_flat: 'house_heritage_white',
    house_pilar_cabin: 'house_mountain_cabin',
    house_orion_nipa: 'house_coastal_nipa',
    house_bagac_villa: 'bahay_na_bato',
    house_mariveles_post: 'house_concrete_bunker',
  };
  const v2HouseId = houseSpriteMap[house.id] || 'typical_bataan_house';
  const sanctuaryH = house.id === 'house_bagac_villa' || house.id === 'house_balanga_flat' ? 205 : 192;

  const drawnV2 = drawV2Sprite(ctx, v2HouseId, x, groundY + 2, sanctuaryH, 1, time, {
    alpha: owned ? 1 : 0.92,
    shadowRadius: 86,
  });

  if (!drawnV2) {
    const isCoastalHouse =
      house.zoneId === 'orion' || house.zoneId === 'mariveles' || house.zoneId === 'bagac';
    const sanctuarySpriteId = isCoastalHouse ? 'bataan_beach_bangka' : 'plaza_garden_gazebo';
    drawAtlasSprite(ctx, sanctuarySpriteId, x, groundY - 4, 148, 1, time, {
      scenicFrame: true,
      alpha: owned ? 1 : 0.9,
    });
  }

  // Floating ownership emblem (Dambana Badge if owned, Evidence Deed if for sale)
  drawAtlasSprite(ctx, owned ? 'dambana_badge' : 'ebidensya', x + 74, groundY - 16, 44, 1, time, {
    offsetY: Math.sin(time * 3) * 4,
    shadowRadius: 16,
  });

  const labelY = groundY - sanctuaryH - 14;
  if (playerDist < 260) {
    const alpha = Math.min(1, (260 - playerDist) / 80);
    drawEntityNameplate(
      ctx,
      x,
      labelY,
      house.name,
      owned ? 'Safe House · [E] Enter' : `For Sale · ₱${house.price.toLocaleString()} · [E]`,
      playerDist < 115,
      { alpha }
    );
  } else {
    drawProximityMarkerDot(ctx, x, labelY - 6, owned ? '#7AE582' : '#F4C542', time);
  }
}

export function drawHearthAndDummy(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  groundY: number,
  zone: ZoneDef,
  dummyRecoil: number,
  time: number,
  playerX = 0
) {
  if (zone.hasHearth && zone.hearthX) {
    const hx = px(zone.hearthX - cameraX);
    const dist = Math.abs(playerX - zone.hearthX);
    ctx.save();
    ctx.translate(hx, px(groundY));
    const glow = ctx.createRadialGradient(0, -28, 6, 0, -28, 64);
    glow.addColorStop(0, `rgba(251, 146, 60, ${0.42 + Math.sin(time * 6) * 0.12})`);
    glow.addColorStop(1, 'rgba(244, 197, 66, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -28, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4-frame animated HD Stone Campfire Hearth from Sheet 09!
    if (!drawV2Sprite(ctx, 'prop_campfire_hearth', hx, groundY + 4, 82, 1, time, { fps: 8, shadowRadius: 34 })) {
      drawAtlasSprite(ctx, 'bataan_cashew', hx - 22, groundY - 4, 48, 1, time, {
        offsetY: Math.sin(time * 3.2) * 3,
        shadowRadius: 18,
      });
    }

    if (dist < 240) {
      drawEntityNameplate(ctx, hx, groundY - 88, 'Campfire Hearth & Rest', 'Press [E] to Restore 100%', dist < 100, {
        alpha: Math.min(1, (240 - dist) / 80),
      });
    } else {
      drawProximityMarkerDot(ctx, hx, groundY - 88, '#7AE582', time);
    }
  }

  if (zone.hasPracticeDummy && zone.dummyX) {
    const dx = px(zone.dummyX - cameraX);
    const dist = Math.abs(playerX - zone.dummyX);
    ctx.save();
    ctx.translate(dx, px(groundY));
    ctx.rotate(dummyRecoil * 0.24);
    drawAtlasSprite(ctx, 'barangay_barrier', 0, 2, 92, 1, time, {
      hitFlash: dummyRecoil > 0.35 ? 1 : 0,
      shadowRadius: 34,
    });
    ctx.restore();

    if (dist < 260) {
      drawEntityNameplate(ctx, dx, groundY - 102, 'Barangay Barrier', 'Strike [J] / Click to Train', dist < 130, {
        alpha: Math.min(1, (260 - dist) / 80),
      });
    }
  }
}

export function drawPortalArch(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  label: string,
  time: number,
  playerDist = 0
) {
  const pulse = 0.65 + Math.sin(time * 3.5) * 0.25;
  ctx.save();
  ctx.translate(px(x), px(groundY));
  const aura = ctx.createRadialGradient(0, -64, 10, 0, -64, 80);
  aura.addColorStop(0, `rgba(244, 197, 66, ${0.28 * pulse})`);
  aura.addColorStop(1, 'rgba(244, 197, 66, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -64, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // HD Bataan Brick & Wrought-Iron Portal Arch + Green Highway Sign (Proper World Scale!)
  const archH = ENTITY_WORLD_SCALES.welcome_arch.height;
  const signH = ENTITY_WORLD_SCALES.highway_signpost.height;
  const archDrawn = drawV2Sprite(ctx, 'prop_portal_arch', x, groundY + 4, archH, 1, time, {
    shadowRadius: 72,
    maxWidth: ENTITY_WORLD_SCALES.welcome_arch.width,
  });
  if (archDrawn) {
    drawV2Sprite(ctx, 'prop_highway_sign', x + 132, groundY + 2, signH, 1, time, { shadowRadius: 22 });
  } else {
    drawAtlasSprite(ctx, 'barangay_barrier', x, groundY + 2, 78, 1, time, {
      shadowRadius: 30,
    });
  }

  const labelY = archDrawn ? groundY - archH - 12 : groundY - 92;
  if (playerDist < 340) {
    drawEntityNameplate(ctx, x, labelY, label, 'Press [E] to Travel', playerDist < 115, {
      alpha: Math.min(1, (340 - playerDist) / 90),
    });
  } else {
    drawProximityMarkerDot(ctx, x, labelY, '#38BDF8', time);
  }
}

export function drawBossArenaCrest(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  defeated: boolean,
  time: number
) {
  ctx.save();
  ctx.translate(px(x), px(groundY));
  ctx.strokeStyle = defeated
    ? 'rgba(53, 168, 84, 0.5)'
    : `rgba(214, 58, 58, ${0.45 + Math.sin(time * 4) * 0.2})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 2, 72, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// =========================================================================
// 2. DETAILED 16-BIT FOREGROUND ROAD VEHICLES (NON-DAMAGING ATMOSPHERIC PROPS)
// =========================================================================

export function drawFilipinoVehicle(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  kind: VehicleKind,
  dir: 1 | -1,
  opts?: { scale?: number; time?: number; isNight?: boolean; foreground?: boolean }
) {
  const scale = opts?.scale ?? 1.0;
  const time = opts?.time ?? 0;
  const isNight = opts?.isNight ?? false;
  const wheelSpin = time * 14;
  const bounce = Math.sin(time * 18 + x * 0.03) * 0.9;

  // Priority 1: Clean Individual Uploaded Vehicle PNGs processed with removeWhiteBackground(img, 240)
  // (These already have built-in drivers & commuters — no duplicate occupant overlay!)
  if (drawCleanUploadedVehicle(ctx, kind, x, groundY, dir, scale, time)) {
    if (isNight) {
      const lightReach = kind === 'jeepney' ? 92 : kind === 'rescue_van' ? 84 : 62;
      drawPixelWarmLight(ctx, x + lightReach * scale * dir, groundY - 34 * scale, 62 * scale, 0.76, '255, 240, 175');
      if (kind === 'patrol_car' || kind === 'rescue_van') {
        const sirenFlash = Math.floor(time * 9) % 2 === 0;
        drawPixelWarmLight(
          ctx,
          x,
          groundY - (kind === 'rescue_van' ? 96 : 74) * scale,
          38 * scale,
          0.74,
          sirenFlash ? '239, 68, 68' : '59, 130, 246'
        );
      }
    }
    return;
  }

  // Priority 2: Proper-Scale 2-Frame Spinning-Wheel Philippine Traffic Vehicles!
  const v2VehMap: Partial<
    Record<VehicleKind, { id: string; w: number; h: number; shadow: number; fps: number }>
  > = {
    jeepney: {
      id: 'veh21_jeepney',
      w: ENTITY_WORLD_SCALES.jeepney_large.width,
      h: ENTITY_WORLD_SCALES.jeepney_large.height,
      shadow: 112,
      fps: 9,
    },
    tricycle: {
      id: 'veh21_tricycle_pax',
      w: ENTITY_WORLD_SCALES.tricycle_passenger.width,
      h: ENTITY_WORLD_SCALES.tricycle_passenger.height,
      shadow: 62,
      fps: 10,
    },
    delivery_tricycle: {
      id: 'veh21_tricycle_deliv',
      w: ENTITY_WORLD_SCALES.tricycle_delivery.width,
      h: ENTITY_WORLD_SCALES.tricycle_delivery.height,
      shadow: 64,
      fps: 10,
    },
    patrol_car: {
      id: 'veh21_patrol_car',
      w: ENTITY_WORLD_SCALES.patrol_car.width,
      h: ENTITY_WORLD_SCALES.patrol_car.height,
      shadow: 88,
      fps: 9,
    },
    rescue_van: {
      id: 'veh21_rescue_van',
      w: ENTITY_WORLD_SCALES.rescue_van.width,
      h: ENTITY_WORLD_SCALES.rescue_van.height,
      shadow: 96,
      fps: 9,
    },
    motorcycle: {
      id: 'veh_kap_bike',
      w: 96,
      h: 74,
      shadow: 38,
      fps: 8,
    },
    bus: {
      id: 'veh21_jeepney',
      w: Math.round(ENTITY_WORLD_SCALES.jeepney_large.width * 1.15),
      h: Math.round(ENTITY_WORLD_SCALES.jeepney_large.height * 1.08),
      shadow: 124,
      fps: 9,
    },
  };
  const v2Veh = v2VehMap[kind] || v2VehMap.jeepney!;
  const drawn = drawV2Sprite(ctx, v2Veh.id, x, groundY + 4, v2Veh.h * scale, dir, time, {
    shadowRadius: v2Veh.shadow * scale,
    offsetY: bounce,
    fps: v2Veh.fps,
    maxWidth: v2Veh.w * scale * 1.08,
  });
  if (drawn) {
    renderVehicleOccupants(ctx, kind, x, groundY + bounce, dir, scale, time);
    if (isNight) {
      const frontOffset = (v2Veh.w * 0.48) * scale * dir;
      drawPixelWarmLight(ctx, x + frontOffset, groundY - v2Veh.h * 0.34 * scale, 62 * scale, 0.78, '255, 240, 175');
      if (kind === 'patrol_car' || kind === 'rescue_van') {
        const sirenFlash = Math.floor(time * 9) % 2 === 0;
        drawPixelWarmLight(
          ctx,
          x,
          groundY - v2Veh.h * 0.92 * scale,
          38 * scale,
          0.75,
          sirenFlash ? '239, 68, 68' : '59, 130, 246'
        );
      }
    }
  }
  void wheelSpin;
}

// =========================================================================
// 3. UNIFIED V4 ILLUSTRATED HERO COMPOSITE RENDERER (ZERO 8-BIT FALLBACKS)
// =========================================================================

export function drawNoirFigure(ctx: CanvasRenderingContext2D, opts: FigureRenderOpts) {
  const {
    x,
    y,
    facing,
    walkPhase,
    scale = 1,
    headgearStyle = 'none',
    backStyle = 'none',
    weaponStyle = 'unarmed',
    slashProgress = 0,
    hurtFlash = 0,
    umbrellaOpen = false,
    shieldActive = false,
    ridingBike = false,
    bikeSkin,
    dashAlpha = 1,
    time = 0,
    isDashing = false,
    speedRatio = 0,
    airborne = false,
    skidding = false,
    magicCastSchool = null,
    magicCastProgress = 0,
    equippedOutfitId,
    progress,
    levelUpFrameIdx = null,
    motion,
    tiradorProgress = 0,
  } = opts;

  const attacking = slashProgress > 0;
  const firingTirador = tiradorProgress > 0;
  const castingMagic = Boolean(magicCastSchool && magicCastProgress > 0);
  const celebratingLevelUp = typeof levelUpFrameIdx === 'number' && levelUpFrameIdx >= 0;
  const activeBikeSkin = bikeSkin || getBikeSkinById(progress?.equippedBikeSkinId || 'bike_classic_green');
  const resolvedOutfitId = progress?.equippedOutfitId || equippedOutfitId || 'outfit_worn_tee';

  const smoothBob = motion ? motion.bobOffsetY : 0;
  const smoothTilt = motion ? motion.tiltAngle : 0;
  const smoothScaleX = motion ? motion.scaleX : 1;
  const smoothScaleY = motion ? motion.scaleY : 1;
  const smoothRecoilX = motion ? motion.recoilX : 0;

  // Build effective PlayerProgress so Gameplay, Dash Ghosts, Story Plates & Inventory Preview share ONE pipeline!
  const effectiveProgress: PlayerProgress = progress
    ? {
        ...progress,
        ridingBike,
        umbrellaOpen,
        equippedBikeSkinId: activeBikeSkin.id,
      }
    : ({
        equippedOutfitId: resolvedOutfitId,
        equippedHairId: 'hair_defender',
        equippedHeadgearId: headgearStyle !== 'none' ? headgearStyle : null,
        equippedBackId: backStyle !== 'none' ? backStyle : null,
        equippedWeaponId: weaponStyle !== 'unarmed' ? weaponStyle : null,
        equippedAccessoryId: null,
        equippedBikeSkinId: activeBikeSkin.id,
        hasBike: ridingBike,
        ridingBike,
        hasUmbrella: umbrellaOpen,
        umbrellaOpen,
      } as unknown as PlayerProgress);

  // 3-phase kinetic motion for crisp melee strikes + smooth delta-time breathing/lean/recoil
  let atkOffsetX = celebratingLevelUp ? 0 : smoothRecoilX * facing;
  let atkOffsetY = celebratingLevelUp ? 0 : smoothBob;
  let atkRotation = celebratingLevelUp ? 0 : smoothTilt;
  if (attacking && !celebratingLevelUp && !firingTirador) {
    if (slashProgress < 0.25) {
      const t = Math.sin((slashProgress / 0.25) * Math.PI);
      atkOffsetX += -facing * 6 * t;
      atkRotation += -facing * 0.06 * t;
    } else if (slashProgress < 0.74) {
      const t = Math.sin(((slashProgress - 0.25) / 0.49) * Math.PI);
      atkOffsetX += facing * (ridingBike ? 16 : 12) * t;
      atkOffsetY += -3 * t;
      atkRotation += facing * 0.08 * t;
    } else {
      const t = 1 - (slashProgress - 0.74) / 0.26;
      atkOffsetX += facing * 3 * t;
    }
  }

  // Dynamic Bike Wheelie Dash / Jump / Skid Tilt
  if (ridingBike && !celebratingLevelUp) {
    if (isDashing) {
      atkRotation += -facing * 0.22;
      atkOffsetY -= 8;
    } else if (airborne) {
      atkRotation += -facing * 0.16;
    } else if (skidding) {
      atkRotation += facing * 0.14;
    }
  }

  // Bike Skin Wheel Trails, Bonus Skin Auras & Skid Dust
  if (ridingBike && !celebratingLevelUp) {
    if (activeBikeSkin.trailColor) {
      ctx.save();
      ctx.translate(px(x), px(y));
      ctx.scale(facing * scale, scale);
      ctx.fillStyle = activeBikeSkin.trailColor;
      const trailCount = isDashing ? 7 : 4;
      for (let tr = 0; tr < trailCount; tr++) {
        const tx = -38 - tr * 10 - ((time * (isDashing ? 86 : 48)) % 9);
        const ty = -8 - (tr % 2) * 5;
        ctx.fillRect(tx, ty, (isDashing ? 11 : 7) - tr * 0.7, isDashing ? 4 : 3);
      }
      if (activeBikeSkin.id === 'bike_dambana_sunburst') {
        const aura = ctx.createRadialGradient(0, -30, 8, 0, -30, 52);
        aura.addColorStop(0, activeBikeSkin.trailColor);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, -30, 52, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (skidding || isDashing) {
      drawV2Sprite(ctx, 'fx_dust_puffs', x - facing * 38 * scale, y + 4, 38 * scale, facing, time, {
        fps: 12,
        shadowRadius: 0,
      });
    }
  }

  // Magic Casting Ground Aura
  if (castingMagic && magicCastSchool) {
    ctx.save();
    const mAura = ctx.createRadialGradient(px(x), px(y - 44 * scale), 10, px(x), px(y - 44 * scale), 68 * scale);
    mAura.addColorStop(
      0,
      magicCastSchool === 'white_magic' ? 'rgba(250, 240, 150, 0.55)' : 'rgba(168, 85, 247, 0.58)'
    );
    mAura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mAura;
    ctx.beginPath();
    ctx.arc(px(x), px(y - 44 * scale), 68 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Special Level-Up Golden Celebration Pose (Sheet 22)
  if (celebratingLevelUp) {
    const lvH = Math.round((levelUpFrameIdx === 1 || levelUpFrameIdx === 2 ? 104 : 86) * scale);
    drawV2Sprite(ctx, 'hero_level_up_pose', x, y + 3, lvH, facing, time, {
      fixedFrame: Math.max(0, Math.min(3, levelUpFrameIdx as number)),
      glowColor: 'rgba(250, 204, 21, 0.85)',
      glowBlur: 10,
      shadowRadius: 24 * scale,
      alpha: dashAlpha,
    });
    return;
  }

  // Unified V4 Illustrated Hero Composite Renderer (On-Foot, On-Bike, Bike-Firing Tirador!)
  const heroAnimState: 'idle' | 'walk' | 'telegraph' | 'attack' | 'recoil' =
    hurtFlash > 0
      ? 'recoil'
      : attacking || firingTirador
        ? 'attack'
        : speedRatio > 0.08 || isDashing
          ? 'walk'
          : 'idle';
  const heroSmooth = computeSmooth16FrameAnim(heroAnimState, time, 8, false);
  const applyOnFootSmooth = !ridingBike && !airborne;

  const pose: HeroPoseState = ridingBike
    ? 'bike'
    : firingTirador
      ? 'slingshot'
      : attacking
        ? 'attack'
        : speedRatio > 0.08 || isDashing
          ? 'run'
          : 'idle';

  const wheelSpinRad = motion ? motion.wheelAngle : walkPhase * 1.65;
  const bank = getHeroSpriteBank();
  const compositeScale = scale * (ridingBike ? 0.52 : 0.48);

  if (bank) {
    drawHeroComposite(
      ctx,
      bank,
      effectiveProgress,
      pose,
      x + atkOffsetX,
      y + 3,
      compositeScale,
      facing,
      wheelSpinRad,
      {
        forcePose: pose,
        firingTirador,
        actionProgress: firingTirador ? tiradorProgress : slashProgress,
        shieldActive,
        hurtFlash,
        alpha: dashAlpha,
        tiltRad: atkRotation + (applyOnFootSmooth ? heroSmooth.tiltRad * 0.55 : 0),
        bobOffsetY: atkOffsetY + (applyOnFootSmooth ? heroSmooth.offsetY : 0),
        scaleX: smoothScaleX * (applyOnFootSmooth ? heroSmooth.scaleX : 1),
        scaleY: smoothScaleY * (applyOnFootSmooth ? heroSmooth.scaleY : 1),
        drawShadow: dashAlpha > 0.85,
        time,
      }
    );
  } else {
    drawV2Sprite(
      ctx,
      ridingBike ? 'hero_bike_idle' : 'hero_starter_idle',
      x + atkOffsetX,
      y + 3,
      Math.round(86 * scale),
      facing,
      time,
      {
        hitFlash: hurtFlash,
        alpha: dashAlpha,
        offsetY: atkOffsetY,
        shadowRadius: (ridingBike ? 34 : 22) * scale,
      }
    );
  }

  // Crisp HD Combat FX overlays from Sheet 07 & Sheet 04
  if (attacking && slashProgress >= 0.14 && slashProgress <= 0.9) {
    const fxX = x + atkOffsetX + facing * 46 * scale;
    const fxY = y - 14 * scale;
    const fxKey =
      weaponStyle === 'la_pluma' || weaponStyle === 'sable_luna'
        ? 'fx_spirit_slash'
        : weaponStyle === 'bolo_katipunan' || weaponStyle === 'kampilan'
          ? 'fx_flame_slash'
          : weaponStyle === 'dambana_staff'
            ? 'fx_lance_beam'
            : weaponStyle === 'megaphone'
              ? 'fx_megaphone_wave'
              : weaponStyle === 'balisong'
                ? 'fx_balisong_slash'
                : 'fx_umbrella_slash';
    drawV2Sprite(ctx, fxKey, fxX, fxY, 82 * scale, facing, time, {
      progress01: Math.max(0, Math.min(1, (slashProgress - 0.14) / 0.76)),
      shadowRadius: 0,
    });
  }

  // Mounted or On-Foot HD Umbrella Shield Barrier (Sheet 07!)
  if (shieldActive) {
    const shX = x + facing * (ridingBike ? 44 : 34) * scale;
    const shY = y - (ridingBike ? 12 : 8) * scale;
    if (
      !drawV2Sprite(ctx, 'fx_umbrella_shield', shX, shY, 86 * scale, facing, time, {
        fps: 10,
        shadowRadius: 0,
      })
    ) {
      ctx.save();
      ctx.translate(px(shX), px(shY - 36 * scale));
      ctx.scale(facing * scale, scale);
      ctx.beginPath();
      ctx.arc(0, 0, 34, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.strokeStyle = '#7DD3FC';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fill();
      ctx.restore();
    }
  }
}

// =========================================================================
// 4. DISTINCT WORLD NPCS (NEO GEO 16-BIT SCALE & PROPS)
// =========================================================================

export function drawWorldNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  facing: 1 | -1,
  visual: NpcVisualKind,
  coatColor: string,
  accentColor: string,
  hairColor: string,
  time: number,
  walkPhase = 0
) {
  if (visual === 'aspin') {
    drawNoirAspin(ctx, x, groundY, facing, walkPhase || time * 1.8, time);
    return;
  }
  // NOTE: Guardhouses, sandbag bunkers, broadcast rigs, hubs & stalls are now rendered in the
  // static `drawWorldBuildings` layer at fixed world coordinates so recruited allies NEVER drag buildings!

  // Mystic Aura behind Albularyo (White Magic) and Mangkukulam (Black Magic)
  if (visual === 'albularyo' || visual === 'mangkukulam') {
    ctx.save();
    const g = ctx.createRadialGradient(px(x), px(groundY - 46), 8, px(x), px(groundY - 46), 62);
    g.addColorStop(
      0,
      visual === 'albularyo'
        ? `rgba(74, 222, 128, ${0.32 + Math.sin(time * 3.5) * 0.1})`
        : `rgba(168, 85, 247, ${0.36 + Math.sin(time * 4.2) * 0.12})`
    );
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px(x), px(groundY - 46), 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const isVehicleNpc = visual === 'jeepney_driver';
  const npcAnimState: 'idle' | 'walk' = !isVehicleNpc && Math.abs(Math.sin(walkPhase)) > 0.08 ? 'walk' : 'idle';
  const npcSmooth = isVehicleNpc
    ? { frameIndex: 0, offsetY: 0, scaleX: 1, scaleY: 1, tiltRad: 0 }
    : computeSmooth16FrameAnim(npcAnimState, time + (x % 7) * 0.13, 4, false);

  // Primary Normalized HD v2 NPC Sprite Map (anchored cleanly at TARGET_VISUAL_HEIGHTS.npc_human = 80px!)
  const npcH = TARGET_VISUAL_HEIGHTS.npc_human;
  const v2NpcMap: Partial<Record<NpcVisualKind, { id: string; height: number; shadow: number; fps?: number }>> = {
    kap_ben: { id: 'kapben_idle', height: npcH, shadow: 24, fps: 5 },
    aling_nena: { id: 'ally_nena_idle', height: npcH, shadow: 24, fps: 5 },
    mechanic: { id: 'ally_rico_idle', height: npcH, shadow: 24, fps: 5 },
    honest_police: { id: 'ally_clara_idle', height: npcH, shadow: 24, fps: 5 },
    honest_soldier: { id: 'npc_sgt_reyes_idle', height: npcH + 3, shadow: 25, fps: 5 },
    albularyo: { id: 'npc_albularyo_idle', height: npcH + 4, shadow: 26, fps: 5 },
    mangkukulam: { id: 'npc_mangkukulam_idle', height: npcH + 4, shadow: 26, fps: 5 },
    jeepney_driver: { id: 'veh21_jeepney', height: ENTITY_WORLD_SCALES.jeepney_large.height, shadow: 108, fps: 1 },
  };
  const v2Npc = v2NpcMap[visual];
  if (
    v2Npc &&
    drawV2Sprite(ctx, v2Npc.id, x, groundY + 3, v2Npc.height, isVehicleNpc ? 1 : facing, time, {
      shadowRadius: v2Npc.shadow,
      fps: v2Npc.fps ?? 5,
      offsetY: npcSmooth.offsetY,
      scaleX: npcSmooth.scaleX,
      scaleY: npcSmooth.scaleY,
      tiltRad: npcSmooth.tiltRad,
    })
  ) {
    return;
  }

  // Gender-accurate Illustrated HD NPC Sprites from 14x16 Townfolk/Official Atlas (ZERO 8-bit boxes!)
  // Ate Linda (female vendor -> row 10), Ms. Clara (female teacher -> row 8),
  // Ate Maya (female reporter -> row 13), Dispatch Officer (-> row 15)
  const atlasNpcRowMap: Partial<Record<NpcVisualKind, number>> = {
    street_vendor: 10,
    teacher: 8,
    journalist_girl: 13,
    dispatch_officer: 15,
  };
  const npcRow = atlasNpcRowMap[visual];
  if (npcRow !== undefined) {
    const drawn = drawBoss14x16Frame(
      ctx,
      npcRow,
      npcAnimState,
      time + (x % 7) * 0.13,
      x,
      groundY + 4,
      npcH + 6,
      facing,
      {
        shadowRadius: 24,
        offsetY: npcSmooth.offsetY,
        scaleX: npcSmooth.scaleX,
        scaleY: npcSmooth.scaleY,
        tiltRad: npcSmooth.tiltRad,
      }
    );
    if (drawn) {
      if (visual === 'journalist_girl') {
        // Sleek pulsing LIVE Broadcast Badge above Reporter Ate Maya
        const livePulse = 0.55 + Math.sin(time * 6) * 0.45;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
        ctx.fillRect(px(x - 20), px(groundY - npcH - 22), 40, 14);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px(x - 20), px(groundY - npcH - 22), 40, 14);
        ctx.fillStyle = `rgba(239, 68, 68, ${livePulse.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px(x - 12), px(groundY - npcH - 15), 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '800 8px "Chakra Petch", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE', px(x - 6), px(groundY - npcH - 12));
        ctx.restore();
      }
      return;
    }
  }

  // Atlas 1 NPC Sprite Strips (Mamang Sorbetero, etc.)
  const npcAtlasMap: Partial<Record<NpcVisualKind, { id: string; height: number; shadow: number }>> = {
    kap_ben: { id: 'kap_ben_job_giver', height: 128, shadow: 42 },
    aling_nena: { id: 'aling_nena_payong_seller', height: 126, shadow: 44 },
    sorbetero: { id: 'mamang_sorbetero', height: 126, shadow: 40 },
    jeepney_driver: { id: 'jeepney_and_driver', height: 108, shadow: 68 },
  };
  const npcSprite = npcAtlasMap[visual];
  if (
    npcSprite &&
    drawAtlasSprite(ctx, npcSprite.id, x, groundY + 4, npcSprite.height, isVehicleNpc ? 1 : facing, time, {
      shadowRadius: npcSprite.shadow,
      offsetY: npcSmooth.offsetY,
      scaleX: npcSmooth.scaleX,
      scaleY: npcSmooth.scaleY,
      tiltRad: npcSmooth.tiltRad,
    })
  ) {
    return;
  }

  // Final illustrated fallback (never 8-bit procedural boxes)
  drawBoss14x16Frame(ctx, 15, npcAnimState, time, x, groundY + 4, npcH + 4, facing, {
    shadowRadius: 24,
  });
  void coatColor;
  void accentColor;
  void hairColor;
}

// =========================================================================
// 5. DISTINCT ENEMIES (STREET FOES, WILD, CORRUPT & FOLKLORE HORROR!)
// =========================================================================

export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  kind: MobKind,
  facing: 1 | -1,
  walkPhase: number,
  hurtFlash: number,
  time: number,
  variantSeed = 0,
  opts?: {
    attacking?: boolean;
    stunned?: boolean;
    guarding?: boolean;
    telegraphing?: boolean;
    altitudeY?: number;
    stolenPesos?: number;
  }
) {
  const isAtk = Boolean(opts?.attacking);
  const isFlyingMob =
    kind === 'aswang' ||
    kind === 'insekto' ||
    kind === 'white_lady' ||
    kind === 'cave_bat' ||
    kind === 'bukid_pest';
  const enemyAnimState: 'idle' | 'walk' | 'telegraph' | 'attack' | 'recoil' =
    hurtFlash > 0
      ? 'recoil'
      : isAtk
        ? 'attack'
        : opts?.telegraphing
          ? 'telegraph'
          : Math.abs(Math.sin(walkPhase)) > 0.08
            ? 'walk'
            : 'idle';

  const humanH = TARGET_VISUAL_HEIGHTS.enemy_human;
  const tallH = TARGET_VISUAL_HEIGHTS.enemy_tall;

  const heightMap: Partial<Record<MobKind, number>> = {
    balete_tree: tallH + 20,
    aswang: tallH - 6,
    white_lady: humanH + 16,
    evil_pastor: humanH + 8,
    corrupted_priest: humanH + 8,
    fat_guy: humanH + 14,
    corrupt_politician: humanH + 8,
    corrupt_police: humanH + 4,
    corrupt_soldier: humanH + 4,
    bad_guy: humanH + 2,
    bad_woman: humanH,
    thief: humanH,
    robber: humanH + 2,
    bully_kid: Math.round(humanH * 0.84),
    tiyanak: 64,
    insekto: 64,
    cobra: 62,
    asong_ulol: TARGET_VISUAL_HEIGHTS.dog_pet + 6,
    rodent_daga: 50,
    bukid_pest: 54,
    cave_bat: 62,
    cave_spider: 56,
    cave_centipede: 56,
  };
  const targetH = heightMap[kind] ?? humanH;
  const shadowR =
    kind === 'balete_tree'
      ? 48
      : kind === 'fat_guy'
        ? 30
        : kind === 'rodent_daga' || kind === 'bukid_pest' || kind === 'tiyanak'
          ? 18
          : 24;

  const smoothAnim = computeSmooth16FrameAnim(enemyAnimState, time + variantSeed * 0.27, 8, isFlyingMob);
  const baseAltitude =
    typeof opts?.altitudeY === 'number' && opts.altitudeY !== 0
      ? opts.altitudeY
      : kind === 'white_lady'
        ? -14
        : kind === 'cave_bat'
          ? -44 + Math.sin(time * 7 + variantSeed) * 8
          : kind === 'bukid_pest'
            ? -18 + Math.sin(time * 8 + variantSeed) * 6
            : kind === 'insekto' || kind === 'aswang'
              ? -24
              : 0;
  const floatOffset = baseAltitude + smoothAnim.offsetY;

  let drawn = false;

  // 1. Corrupt Police uses Row 14 of the 14x16 Boss Atlas (with hit/kneel/defeated) or V2 firing frame when shooting
  if (kind === 'corrupt_police') {
    if (isAtk) {
      drawn = drawV2Sprite(ctx, 'police_fire', x, groundY + 4, targetH, facing, time, {
        hitFlash: hurtFlash,
        offsetY: floatOffset,
        scaleX: smoothAnim.scaleX,
        scaleY: smoothAnim.scaleY,
        tiltRad: smoothAnim.tiltRad,
        shadowRadius: shadowR,
        fps: 11,
      });
    }
    if (!drawn) {
      const policeState =
        hurtFlash > 0 ? 'hit' : opts?.stunned ? 'kneel' : Math.abs(Math.sin(walkPhase)) > 0.08 ? 'walk' : 'idle';
      drawn = drawBoss14x16Frame(ctx, 14, policeState, time + variantSeed * 0.2, x, groundY + 4, targetH, facing, {
        hitFlash: hurtFlash,
        offsetY: floatOffset,
        scaleX: smoothAnim.scaleX,
        scaleY: smoothAnim.scaleY,
        tiltRad: smoothAnim.tiltRad,
        shadowRadius: shadowR,
      });
    }
  } else if (kind === 'corrupt_soldier') {
    drawn = drawV2Sprite(ctx, 'enemy_soldier_fire', x, groundY + 4, targetH, facing, time, {
      hitFlash: hurtFlash,
      offsetY: floatOffset,
      scaleX: smoothAnim.scaleX,
      scaleY: smoothAnim.scaleY,
      tiltRad: smoothAnim.tiltRad,
      shadowRadius: shadowR,
      fps: isAtk ? 11 : 7,
    });
  }

  // 2. Primary 16x17 Illustrated Enemy Atlas (covers all street, folklore, farming, and cave enemies!)
  if (!drawn) {
    const strip = resolveEnemyAtlasStrip(kind, variantSeed);
    if (strip) {
      drawn = drawEnemy16x17Frame(ctx, strip, smoothAnim.frameIndex + variantSeed, x, groundY + 4, targetH, facing, {
        hitFlash: hurtFlash,
        offsetY: floatOffset,
        scaleX: smoothAnim.scaleX,
        scaleY: smoothAnim.scaleY,
        tiltRad: smoothAnim.tiltRad,
        shadowRadius: shadowR,
      });
    }
  }

  // 3. Secondary HD V2 Sprite Fallback (never 8-bit boxes)
  if (!drawn) {
    const v2FallbackMap: Partial<Record<MobKind, string>> = {
      aswang: isAtk ? 'enemy_aswang_atk' : 'enemy_aswang_idle',
      tiyanak: 'enemy_tiyanak',
      white_lady: isAtk ? 'enemy_whitelady_atk' : 'enemy_whitelady_idle',
      balete_tree: 'enemy_balete',
      corrupted_priest: 'enemy_priest',
      cobra: 'enemy_cobra',
      asong_ulol: 'enemy_asong_ulol',
      insekto: isAtk ? 'enemy_insekto_atk' : 'enemy_insekto_idle',
      fat_guy: isAtk ? 'enemy_fatguy_atk' : 'enemy_fatguy_walk',
      bad_guy: isAtk ? 'enemy_thug_atk' : 'enemy_thug_walk',
      thief: isAtk ? 'tanod_batuta' : 'tanod_walk',
      robber: isAtk ? 'enemy_thug_atk' : 'enemy_thug_walk',
    };
    drawV2Sprite(ctx, v2FallbackMap[kind] || 'enemy_thug_walk', x, groundY + 4, targetH, facing, time, {
      hitFlash: hurtFlash,
      offsetY: floatOffset,
      scaleX: smoothAnim.scaleX,
      scaleY: smoothAnim.scaleY,
      tiltRad: smoothAnim.tiltRad,
      shadowRadius: shadowR,
      fps: isAtk ? 11 : 8,
    });
  }

  // Status & combat cue overlays (stun stars, guard arc, telegraph '!', stolen pesos tag)
  if (opts?.stunned) {
    drawV2Sprite(ctx, 'fx_stun_stars', x, groundY + floatOffset - targetH - 6, 36, 1, time, {
      fps: 9,
      shadowRadius: 0,
    });
  }
  if (opts?.guarding) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px(x + facing * 26), px(groundY + floatOffset - targetH * 0.5), 28, -1.1, 1.1);
    ctx.stroke();
    ctx.restore();
  }
  if (opts?.telegraphing) {
    ctx.save();
    ctx.fillStyle = '#EF4444';
    ctx.font = '900 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', px(x), px(groundY + floatOffset - targetH - 14));
    ctx.restore();
  }
  if (opts?.stolenPesos && opts.stolenPesos > 0) {
    ctx.save();
    const tagY = px(groundY + floatOffset - targetH - 26 + Math.sin(time * 7) * 3);
    ctx.fillStyle = 'rgba(120, 53, 15, 0.92)';
    ctx.fillRect(px(x - 34), tagY - 12, 68, 16);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(px(x - 34), tagY - 12, 68, 16);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '700 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💰 ₱${opts.stolenPesos}`, px(x), tagY);
    ctx.restore();
  }
}

// =========================================================================
// 5B. RARE SPECTRAL NATIONAL HERO GHOST & AWAKENED BOSS RENDERERS
// =========================================================================

export function drawSpectralHeroGhost(
  ctx: CanvasRenderingContext2D,
  ghost: HeroGhostDef,
  x: number,
  groundY: number,
  time: number,
  alreadyMet: boolean,
  playerDist = 0
) {
  const floatY = Math.sin(time * 2.8) * 10 - 12;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(px(x), px(groundY + floatY));

  // Pulsing Ethereal Spectral Halo & Ground Light Pillar
  const pulse = 0.6 + Math.sin(time * 3.8) * 0.25;
  const glow = ctx.createRadialGradient(0, -64, 10, 0, -64, 92);
  glow.addColorStop(0, `rgba(94, 234, 212, ${0.46 * pulse})`);
  glow.addColorStop(0.55, `rgba(244, 197, 66, ${0.22 * pulse})`);
  glow.addColorStop(1, 'rgba(94, 234, 212, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -64, 92, 0, Math.PI * 2);
  ctx.fill();

  // Rising Spirit Orbs
  for (let i = 0; i < 6; i++) {
    const ox = Math.sin(time * 2 + i * 1.4) * 34;
    const oy = -14 - ((time * 28 + i * 22) % 98);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(94, 234, 212, 0.8)' : 'rgba(244, 197, 66, 0.8)';
    ctx.fillRect(px(ox), px(oy), 4, 4);
  }

  // Crisp HD v2 Spectral National Hero Sprite (Sheet 01 & Sheet 19 for Heneral Antonio Luna!)
  const ghostSpriteMap: Record<string, string> = {
    ghost_luna: 'ghost_luna_idle',
    ghost_gabriela: 'ghost_gabriela_idle',
    ghost_bonifacio: 'ghost_bonifacio_idle',
    ghost_rizal: 'ghost_rizal_idle',
    ghost_lapulapu: 'ghost_bonifacio_idle',
  };
  const v2GhostId = ghostSpriteMap[ghost.id] || 'ghost_rizal_idle';
  drawV2Sprite(ctx, v2GhostId, 0, 2, 134, 1, time, {
    alpha: 0.86 + Math.sin(time * 3.8) * 0.08,
    fps: 5,
    shadowRadius: 0,
  });

  // Proximity-based Spectral Title Tag
  if (playerDist < 340) {
    drawEntityNameplate(
      ctx,
      0,
      -142,
      ghost.name,
      alreadyMet ? 'National Hero Spirit · [E] Blessing' : `RARE SPIRIT · [E] ${ghost.rewardName}`,
      playerDist < 135,
      { alpha: Math.min(1, (340 - playerDist) / 90) }
    );
  } else {
    drawProximityMarkerDot(ctx, 0, -144, '#5EEAD4', time);
  }

  ctx.restore();
}

export function drawBossWeakSpotOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  height: number,
  time: number,
  opts?: { weakSpotActive?: boolean; telegraphLabel?: string | null; stunned?: boolean }
) {
  if (opts?.stunned) {
    drawV2Sprite(ctx, 'fx_stun_stars', x, groundY - height - 8, 42, 1, time, { fps: 9, shadowRadius: 0 });
  }
  if (opts?.weakSpotActive) {
    ctx.save();
    ctx.translate(px(x), px(groundY - height * 0.55));
    const r = 34 + Math.sin(time * 16) * 5;
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '800 11px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF08A';
    ctx.fillText('WEAK SPOT 2×!', 0, -r - 8);
    ctx.restore();
  } else if (opts?.telegraphLabel) {
    ctx.save();
    ctx.translate(px(x), px(groundY - height - 22));
    ctx.fillStyle = 'rgba(185, 28, 28, 0.92)';
    ctx.fillRect(-76, -16, 152, 20);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-76, -16, 152, 20);
    ctx.font = '800 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF08A';
    ctx.fillText(`⚠ ${opts.telegraphLabel}`, 0, -3);
    ctx.restore();
  }
}

export function drawAwakenedBoss(
  ctx: CanvasRenderingContext2D,
  boss: AwakenedBossDef,
  x: number,
  groundY: number,
  facing: 1 | -1,
  walkPhase: number,
  hurtFlash: number,
  slashProgress: number,
  time: number,
  opts: { shieldHp: number; shieldMax: number; aiming: boolean; weakSpotActive?: boolean; telegraphLabel?: string | null; stunned?: boolean }
) {
  const isCongressman = boss.id === 'awakened_congressman';
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(px(x), px(groundY));

  const aura = ctx.createRadialGradient(0, -68, 14, 0, -68, 92);
  aura.addColorStop(0, isCongressman ? 'rgba(244, 197, 66, 0.36)' : 'rgba(220, 38, 38, 0.32)');
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -68, 92, 0, Math.PI * 2);
  ctx.fill();

  const attacking = slashProgress > 0;
  const lungeOffset = attacking ? facing * Math.sin(slashProgress * Math.PI) * 18 : 0;
  const v2Key = isCongressman
    ? attacking
      ? 'boss_congressman_atk'
      : 'boss_congressman_idle'
    : attacking
      ? 'captain_atk'
      : 'captain_walk';
  const targetH = isCongressman ? 156 : 148;
  const awAnimState: 'idle' | 'walk' | 'telegraph' | 'attack' | 'recoil' =
    hurtFlash > 0
      ? 'recoil'
      : attacking
        ? 'attack'
        : opts.telegraphLabel || opts.aiming
          ? 'telegraph'
          : Math.abs(Math.sin(walkPhase)) > 0.1
            ? 'walk'
            : 'idle';
  const awSmooth = computeSmooth16FrameAnim(awAnimState, time, 8, false);
  const boss14State: 'idle' | 'walk' | 'hit' | 'kneel' =
    hurtFlash > 0
      ? 'hit'
      : opts.stunned
        ? 'kneel'
        : Math.abs(Math.sin(walkPhase)) > 0.1 || attacking
          ? 'walk'
          : 'idle';

  const bossRow = resolveBossAtlasRow(boss.id);
  const drawn =
    drawBoss14x16Frame(ctx, bossRow, boss14State, time, lungeOffset, 4, targetH, facing, {
      hitFlash: hurtFlash,
      offsetY: awSmooth.offsetY,
      scaleX: awSmooth.scaleX,
      scaleY: awSmooth.scaleY,
      tiltRad: awSmooth.tiltRad,
      shadowRadius: 46,
    }) ||
    drawV2Sprite(ctx, v2Key, lungeOffset, 4, targetH, facing, time, {
      hitFlash: hurtFlash,
      progress01: attacking ? slashProgress : undefined,
      offsetY: awSmooth.offsetY,
      scaleX: awSmooth.scaleX,
      scaleY: awSmooth.scaleY,
      tiltRad: awSmooth.tiltRad,
      shadowRadius: 46,
      fps: attacking ? 11 : 7,
    }) ||
    drawAtlasSprite(ctx, isCongressman ? 'corrupt_politicians' : 'mayor_corrupt_default', lungeOffset, 4, targetH, facing, time, {
      hitFlash: hurtFlash,
      fixedFrame: awSmooth.frameIndex,
      offsetY: awSmooth.offsetY,
      scaleX: awSmooth.scaleX,
      scaleY: awSmooth.scaleY,
      tiltRad: awSmooth.tiltRad,
      shadowRadius: 46,
    });
  void drawn;

  // Active Tactical Shield Dome
  if (opts.shieldHp > 0) {
    const ratio = Math.max(0.25, opts.shieldHp / Math.max(1, opts.shieldMax));
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.55 + ratio * 0.4})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -68, 58, 76, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(56, 189, 248, ${0.14 * ratio})`;
    ctx.fill();
  }

  if (opts.aiming) {
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(facing * 42, -62, 6 + Math.sin(time * 24) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawBossWeakSpotOverlay(ctx, x, groundY, targetH, time, opts);
}

// =========================================================================
// 6. 24 UNIQUE TOWN BOSSES (14x16 TRANSPARENT BOSS ATLAS) + PORTRAIT RENDERER
// =========================================================================

export function drawUniqueTownBoss(
  ctx: CanvasRenderingContext2D,
  boss: BossProfile,
  x: number,
  groundY: number,
  facing: 1 | -1,
  walkPhase: number,
  hurtFlash: number,
  slashProgress: number,
  time: number,
  opts?: { weakSpotActive?: boolean; telegraphLabel?: string | null; stunned?: boolean }
) {
  const { gender } = boss;
  const isMayor = !boss.title.includes('Vice');
  const attacking = slashProgress > 0;
  const lungeX = attacking ? facing * Math.sin(slashProgress * Math.PI) * 16 : 0;
  const targetH = isMayor ? 148 : 138;

  const bossAnimState: 'idle' | 'walk' | 'telegraph' | 'attack' | 'recoil' =
    hurtFlash > 0
      ? 'recoil'
      : attacking
        ? 'attack'
        : opts?.telegraphLabel
          ? 'telegraph'
          : Math.abs(Math.sin(walkPhase)) > 0.1
            ? 'walk'
            : 'idle';
  const bossSmooth = computeSmooth16FrameAnim(bossAnimState, time, 8, false);
  const boss14State: 'idle' | 'walk' | 'hit' | 'kneel' =
    hurtFlash > 0
      ? 'hit'
      : opts?.stunned
        ? 'kneel'
        : Math.abs(Math.sin(walkPhase)) > 0.1 || attacking
          ? 'walk'
          : 'idle';

  const v2BossKey = isMayor
    ? gender === 'female'
      ? attacking
        ? 'boss_mayor_f_atk'
        : 'boss_mayor_f_idle'
      : attacking
        ? 'boss_mayor_m_atk'
        : 'boss_mayor_m_idle'
    : gender === 'female'
      ? attacking
        ? 'boss_vmayor_f_atk'
        : 'boss_vmayor_f_idle'
      : attacking
        ? 'boss_vmayor_m_atk'
        : 'boss_vmayor_m_idle';

  // Primary: 14x16 Transparent Boss Atlas (all 24 town bosses with walk/hit/kneel/defeated)
  const bossRow = resolveBossAtlasRow(boss);
  const drawn =
    drawBoss14x16Frame(ctx, bossRow, boss14State, time, x + lungeX, groundY + 4, targetH, facing, {
      hitFlash: hurtFlash,
      offsetY: bossSmooth.offsetY,
      scaleX: bossSmooth.scaleX,
      scaleY: bossSmooth.scaleY,
      tiltRad: bossSmooth.tiltRad,
      shadowRadius: isMayor ? 40 : 34,
    }) ||
    drawV2Sprite(ctx, v2BossKey, x + lungeX, groundY + 4, targetH, facing, time, {
      hitFlash: hurtFlash,
      progress01: attacking ? slashProgress : undefined,
      offsetY: bossSmooth.offsetY,
      scaleX: bossSmooth.scaleX,
      scaleY: bossSmooth.scaleY,
      tiltRad: bossSmooth.tiltRad,
      shadowRadius: isMayor ? 40 : 34,
      fps: attacking ? 11 : 7,
    }) ||
    drawAtlasSprite(ctx, getBossAtlasId(boss), x + lungeX, groundY + 4, targetH, facing, time, {
      hitFlash: hurtFlash,
      fixedFrame: bossSmooth.frameIndex,
      offsetY: bossSmooth.offsetY,
      scaleX: bossSmooth.scaleX,
      scaleY: bossSmooth.scaleY,
      tiltRad: bossSmooth.tiltRad,
      shadowRadius: isMayor ? 40 : 34,
    });
  void drawn;

  drawBossWeakSpotOverlay(ctx, x, groundY, targetH, time, opts);
}

export function drawBossPortrait(ctx: CanvasRenderingContext2D, boss: BossProfile, size: number, time = 0) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, '#223E58');
  bg.addColorStop(1, '#101F30');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  drawBoss14x16Portrait(ctx, boss, size, time);

  ctx.strokeStyle = boss.title.includes('Vice') ? '#7FA4BE' : '#F4C542';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.restore();
}

// =========================================================================
// 7. EL MASTERMIND OVERWORLD & FINAL BOSS RENDERER + LEGACY SHOWCASE BOSSES
// =========================================================================

export function drawElMastermind(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  facing: 1 | -1,
  walkPhase: number,
  hurtFlash: number,
  slashProgress: number,
  time: number,
  opts: { immune: boolean; phase: 1 | 2; eyeFlash: number; weakSpotActive?: boolean; telegraphLabel?: string | null; stunned?: boolean }
) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(px(x), px(groundY));

  // Phase 2 Crimson Energy Aura
  if (opts.phase === 2 && !opts.immune) {
    const aura = ctx.createRadialGradient(0, -82, 16, 0, -82, 118);
    aura.addColorStop(0, `rgba(220, 38, 38, ${0.5 + Math.sin(time * 9) * 0.16})`);
    aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -82, 118, 0, Math.PI * 2);
    ctx.fill();
  }

  // HD v2 Final Boss El Mastermind Phase 1 & Phase 2 + 16x17 Transparent Enemy Atlas fallback
  const attacking = slashProgress > 0;
  const mmLunge = attacking ? facing * Math.sin(slashProgress * Math.PI) * 20 : 0;
  const mmKey =
    opts.phase === 2
      ? attacking
        ? 'mastermind_p2_atk'
        : 'mastermind_p2_idle'
      : attacking
        ? 'mastermind_p1_atk'
        : Math.abs(Math.sin(walkPhase)) > 0.25
          ? 'mastermind_p1_walk'
          : 'mastermind_p1_idle';
  const mmH = opts.phase === 2 ? TARGET_VISUAL_HEIGHTS.final_boss + 14 : TARGET_VISUAL_HEIGHTS.final_boss;
  const mmAnimState: 'idle' | 'walk' | 'telegraph' | 'attack' | 'recoil' =
    hurtFlash > 0
      ? 'recoil'
      : attacking
        ? 'attack'
        : opts.telegraphLabel
          ? 'telegraph'
          : Math.abs(Math.sin(walkPhase)) > 0.12
            ? 'walk'
            : 'idle';
  const mmSmooth = computeSmooth16FrameAnim(mmAnimState, time, 8, false);
  const mmStrip = resolveEnemyAtlasStrip('el_mastermind_portrait');
  const mmDrawn =
    drawV2Sprite(ctx, mmKey, mmLunge, 4, mmH, facing, time, {
      hitFlash: hurtFlash,
      progress01: attacking ? slashProgress : undefined,
      offsetY: mmSmooth.offsetY,
      scaleX: mmSmooth.scaleX,
      scaleY: mmSmooth.scaleY,
      tiltRad: mmSmooth.tiltRad,
      shadowRadius: 42,
      fps: attacking ? 11 : 7,
    }) ||
    (mmStrip
      ? drawEnemy16x17Frame(ctx, mmStrip, mmSmooth.frameIndex, mmLunge, 4, mmH, facing, {
          hitFlash: hurtFlash,
          offsetY: mmSmooth.offsetY,
          scaleX: mmSmooth.scaleX,
          scaleY: mmSmooth.scaleY,
          tiltRad: mmSmooth.tiltRad,
          shadowRadius: 42,
        })
      : false) ||
    drawAtlasSprite(ctx, 'final_boss_el_mastermind_portrait', mmLunge, -6, mmH, facing, time, {
      hitFlash: hurtFlash,
      clipOval: true,
      offsetY: mmSmooth.offsetY,
      scaleX: mmSmooth.scaleX,
      scaleY: mmSmooth.scaleY,
      tiltRad: mmSmooth.tiltRad,
      shadowRadius: 42,
    });

  if (mmDrawn && opts.eyeFlash > 0) {
    ctx.fillStyle = `rgba(255, 50, 50, ${Math.min(1, opts.eyeFlash)})`;
    ctx.beginPath();
    ctx.arc(mmLunge + facing * 10, -mmH * 0.78, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.immune) {
    const pulse = 0.65 + Math.sin(time * 4.5) * 0.25;
    ctx.strokeStyle = `rgba(244, 197, 66, ${pulse})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, -mmH * 0.52, 56, mmH * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(214, 58, 58, ${0.14 * pulse})`;
    ctx.fill();
  }

  ctx.restore();
  if (!opts.immune) {
    drawBossWeakSpotOverlay(ctx, x, groundY, mmH, time, opts);
  }
}

/** Renders El Mastermind's Phase 2 Summon: The Gracias Nomar (Sheet 20) */
export function drawGraciasNomar(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  facing: 1 | -1,
  state: 'portal' | 'idle' | 'blitz' | 'counter' | 'defeated',
  progress01: number,
  hurtFlash: number,
  time: number
) {
  const keyMap: Record<typeof state, string> = {
    portal: 'gracias_nomar_portal',
    idle: 'gracias_nomar_idle',
    blitz: 'gracias_nomar_blitz',
    counter: 'gracias_nomar_counter',
    defeated: 'gracias_nomar_defeated',
  };
  const targetH =
    state === 'portal'
      ? 112
      : state === 'counter'
        ? 102
        : TARGET_VISUAL_HEIGHTS.boss_human;

  // Crimson Syndicate Summon Aura
  ctx.save();
  const aura = ctx.createRadialGradient(px(x), px(groundY - targetH * 0.45), 10, px(x), px(groundY - targetH * 0.45), 70);
  aura.addColorStop(0, `rgba(220, 38, 38, ${0.36 + Math.sin(time * 8) * 0.12})`);
  aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(px(x), px(groundY - targetH * 0.45), 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawV2Sprite(ctx, keyMap[state], x, groundY + 4, targetH, facing, time, {
    hitFlash: hurtFlash,
    progress01: state === 'idle' ? undefined : Math.max(0, Math.min(0.99, progress01)),
    fps: state === 'idle' ? 7 : 10,
    shadowRadius: 34,
    glowColor: state === 'counter' ? 'rgba(239, 68, 68, 0.9)' : undefined,
    glowBlur: 10,
  });
}

/** Renders Sheet 21's 5-Frame Golden Sun Pillar & Rising Rings Level-Up VFX */
export function drawLevelUpSunPillar(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  groundY: number,
  vfxFrameIdx: number,
  alpha: number
) {
  drawV2Sprite(ctx, 'hero_level_up_pillar', screenX, groundY, 215, 1, 0, {
    fixedFrame: Math.max(0, Math.min(4, vfxFrameIdx)),
    alpha,
    shadowRadius: 0,
    glowColor: 'rgba(250, 204, 21, 0.72)',
    glowBlur: 12,
  });
}

/** Draws the correct sprite frame for a DyingEntityState during collapse, spirit-banish, or knockout tumble */
export function drawDyingEntitySprite(
  ctx: CanvasRenderingContext2D,
  entity: DyingEntityState,
  frameIndex: number,
  useDefeatedRow: boolean,
  time = 0
) {
  const kind = entity.kind;
  const progress01 = Math.max(0, Math.min(0.999, entity.elapsedSec / Math.max(0.01, entity.durationSec)));
  const h =
    entity.targetHeight ??
    (kind === 'el_mastermind' || kind === 'boss_el_mastermind'
      ? TARGET_VISUAL_HEIGHTS.final_boss
      : kind === 'the_gracias_nomar' || kind === 'gracias_nomar'
        ? TARGET_VISUAL_HEIGHTS.boss_human
        : kind === 'hero'
          ? TARGET_VISUAL_HEIGHTS.hero_human
          : TARGET_VISUAL_HEIGHTS.enemy_human);

  if (useDefeatedRow) {
    if (kind === 'el_mastermind' || kind === 'boss_el_mastermind') {
      if (
        drawV2Sprite(ctx, 'mastermind_defeat', 0, 4, h, entity.facing, time, {
          fixedFrame: Math.min(2, frameIndex),
          shadowRadius: 0,
        })
      ) {
        return;
      }
    }
    if (kind === 'the_gracias_nomar' || kind === 'gracias_nomar') {
      if (
        drawV2Sprite(ctx, 'gracias_nomar_defeated', 0, 4, h, entity.facing, time, {
          fixedFrame: Math.min(2, frameIndex),
          shadowRadius: 0,
        })
      ) {
        return;
      }
    }
    if (kind === 'fat_guy' || kind === 'insekto') {
      const strip = resolveEnemyAtlasStrip(kind);
      ctx.save();
      ctx.rotate(entity.facing * (frameIndex === 0 ? -0.25 : frameIndex === 1 ? -0.78 : -1.45));
      ctx.scale(1, frameIndex === 2 ? 0.72 : 1);
      if (
        !strip ||
        !drawEnemy16x17Frame(ctx, strip, 0, 0, 4, kind === 'fat_guy' ? 88 : 56, entity.facing, {
          shadowRadius: 0,
        })
      ) {
        const collapseKey = kind === 'fat_guy' ? 'enemy_fatguy_idle' : 'enemy_insekto_idle';
        drawV2Sprite(ctx, collapseKey, 0, 4, kind === 'fat_guy' ? 88 : 56, entity.facing, time, {
          fixedFrame: 0,
          shadowRadius: 0,
        });
      }
      ctx.restore();
      return;
    }
  }

  if (kind === 'hero') {
    const bank = getHeroSpriteBank();
    if (bank) {
      const fallbackHero = {
        equippedOutfitId: 'outfit_worn_tee',
        equippedHairId: 'hair_spiky_dark',
        equippedHeadgearId: 'none',
        equippedBackId: 'none',
        equippedWeaponId: 'none',
        equippedAccessoryId: 'none',
        equippedBikeSkinId: 'bike_classic_green',
        ridingBike: false,
      } as PlayerProgress;
      if (
        drawHeroComposite(ctx, bank, fallbackHero, 'idle', 0, 4, 0.56, entity.facing, 0, {
          drawShadow: false,
          time,
        })
      ) {
        return;
      }
    }
    drawV2Sprite(ctx, 'hero_starter_idle', 0, 4, h, entity.facing, time, {
      fixedFrame: 0,
      shadowRadius: 0,
    });
    return;
  }

  // Bosses, Awakened Bosses & Corrupt Police -> Full 14x16 Atlas Defeated Collapse + Rising Blue Spirit (cols 8..13)!
  if (kind === 'awakened_boss' || kind === 'vice_mayor' || kind === 'mayor' || kind === 'corrupt_police') {
    const bossKey =
      entity.bossId ||
      (kind === 'awakened_boss'
        ? entity.id.includes('congress')
          ? 'awakened_congressman'
          : 'awakened_captain'
        : kind);
    const bossRow = resolveBossAtlasRow(bossKey);
    const bossH = kind === 'corrupt_police' ? h : TARGET_VISUAL_HEIGHTS.boss_human;
    if (
      drawBoss14x16Frame(ctx, bossRow, 'defeated', progress01, 0, 4, bossH, entity.facing, {
        progress01,
        shadowRadius: 0,
      })
    ) {
      return;
    }
    const v2Key =
      kind === 'awakened_boss'
        ? entity.id.includes('congress')
          ? 'boss_congressman'
          : 'boss_brgy_capt_idle'
        : kind === 'mayor'
          ? 'boss_mayor_male'
          : kind === 'vice_mayor'
            ? 'boss_vicemayor_male'
            : 'police_walk';
    drawV2Sprite(ctx, v2Key, 0, 4, bossH, entity.facing, time, {
      fixedFrame: 0,
      shadowRadius: 0,
    });
    return;
  }

  // Standard mobs, farming/cave pests & folklore monsters -> 16x17 Enemy Atlas primary, V2 HD fallback
  const enemyStrip = resolveEnemyAtlasStrip(kind);
  if (
    enemyStrip &&
    drawEnemy16x17Frame(ctx, enemyStrip, Math.min(enemyStrip.frames - 1, frameIndex), 0, 4, h, entity.facing, {
      shadowRadius: 0,
    })
  ) {
    return;
  }

  const mobKeyMap: Record<string, string> = {
    aswang: 'enemy_aswang_idle',
    tiyanak: 'enemy_tiyanak',
    white_lady: 'enemy_whitelady_idle',
    balete_tree: 'enemy_balete',
    corrupted_priest: 'enemy_priest',
    corrupt_police: 'police_walk',
    corrupt_soldier: 'enemy_soldier_fire',
    cobra: 'enemy_cobra',
    asong_ulol: 'enemy_asong_ulol',
    bad_guy: 'enemy_thug_walk',
    robber: 'enemy_thug_walk',
    thief: 'tanod_walk',
  };
  const spriteKey = mobKeyMap[kind] || 'enemy_thug_walk';
  drawV2Sprite(ctx, spriteKey, 0, 4, h, entity.facing, time, {
    fixedFrame: 0,
    shadowRadius: 0,
  });
}

/**
 * Compact, ground-perspective procedural ABYSSAL KULAM ECLIPSE sigil VFX:
 * Never obscures the hero, has zero white-fringed sprite box, and fades cleanly in/out.
 */
export function drawAbyssalKulamEclipse(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  timeSec: number,
  progress01: number
): void {
  const p = Math.max(0, Math.min(1, progress01));
  const fadeAlpha = p < 0.15 ? p / 0.15 : p > 0.82 ? (1 - p) / 0.18 : 1;
  const maxRadius = 105; // Compact ground-perspective footprint
  const r = maxRadius * (0.45 + 0.55 * Math.min(1, p * 2.2));

  ctx.save();
  ctx.translate(centerX, centerY);
  // Perspective squash so the sigil lies flat along the ground plane!
  ctx.scale(1, 0.48);
  ctx.globalAlpha = Math.max(0, Math.min(0.72, 0.72 * fadeAlpha));

  // 1. Soft radial dark-purple ground aura (zero square edges, zero white halo)
  const grad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
  grad.addColorStop(0, 'rgba(30, 8, 52, 0.88)');
  grad.addColorStop(0.55, 'rgba(126, 34, 206, 0.45)');
  grad.addColorStop(0.88, 'rgba(225, 29, 72, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rotating outer crimson rune ring + 8 golden Kulam glyph nodes
  ctx.save();
  ctx.rotate(timeSec * 1.4);
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Counter-rotating inner violet dashed magic ring
  ctx.save();
  ctx.rotate(-timeSec * 2.1);
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

export function drawActiveMagicEffect(
  ctx: CanvasRenderingContext2D,
  effectKind: MagicSkillDef['effectKind'],
  x: number,
  groundY: number,
  _facing: 1 | -1,
  progress01: number,
  time: number
) {
  if (effectKind === 'abyssal_eclipse') {
    drawAbyssalKulamEclipse(ctx, x, groundY - 4, time, progress01);
    return;
  }

  // Batch 1.4: Clean procedural skill VFX — zero flat white-fringed sprite boxes!
  const p = Math.max(0, Math.min(1, progress01));
  const fade = p < 0.14 ? p / 0.14 : p > 0.8 ? (1 - p) / 0.2 : 1;
  const themeMap: Record<
    MagicSkillDef['effectKind'],
    { primary: string; secondary: string; core: string; pillar: boolean; radius: number }
  > = {
    tawas_shield: { primary: '#38BDF8', secondary: '#7DD3FC', core: '#E0F2FE', pillar: false, radius: 74 },
    herbal_banig: { primary: '#22C55E', secondary: '#86EFAC', core: '#DCFCE7', pillar: false, radius: 92 },
    agimat_nova: { primary: '#F59E0B', secondary: '#FDE047', core: '#FFFBEB', pillar: true, radius: 108 },
    bathala_dawn: { primary: '#FACC15', secondary: '#FB923C', core: '#FFFFFF', pillar: true, radius: 128 },
    kulam_hex: { primary: '#A855F7', secondary: '#D8B4FE', core: '#F3E8FF', pillar: false, radius: 88 },
    usog_drain: { primary: '#EC4899', secondary: '#C084FC', core: '#FCE7F3', pillar: false, radius: 96 },
    barang_swarm: { primary: '#84CC16', secondary: '#A855F7', core: '#ECFCCB', pillar: false, radius: 104 },
    abyssal_eclipse: { primary: '#E11D48', secondary: '#9333EA', core: '#FDE047', pillar: true, radius: 112 },
  };
  const theme = themeMap[effectKind] || themeMap.agimat_nova;
  const r = theme.radius * (0.45 + 0.55 * Math.min(1, p * 2.2));

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(0.88, fade * 0.88));

  // Rising light/shadow pillar for major ultimates & offensive bursts
  if (theme.pillar) {
    const pillarW = r * (0.52 + Math.sin(p * Math.PI) * 0.3);
    const pg = ctx.createLinearGradient(x - pillarW, 0, x + pillarW, 0);
    pg.addColorStop(0, 'rgba(0,0,0,0)');
    pg.addColorStop(0.5, theme.primary);
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pg;
    ctx.globalAlpha = fade * 0.42;
    ctx.fillRect(x - pillarW, groundY - 260, pillarW * 2, 260);
    ctx.globalAlpha = fade * 0.88;
  }

  // Perspective ground rune circle + radial glow
  ctx.save();
  ctx.translate(x, groundY - 4);
  ctx.scale(1, 0.42);
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, theme.core);
  g.addColorStop(0.45, theme.primary);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.globalAlpha = fade * 0.46;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = fade * 0.9;
  ctx.rotate(time * 2.1);
  ctx.strokeStyle = theme.secondary;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([8, 6]);
  ctx.rotate(-time * 3.8);
  ctx.strokeStyle = theme.core;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Rising energy motes
  for (let i = 0; i < 8; i++) {
    const ang = time * 3.2 + (i * Math.PI * 2) / 8;
    const mx = x + Math.cos(ang) * r * 0.62;
    const my = groundY - 12 - ((p * 110 + i * 19) % 105);
    ctx.fillStyle = i % 2 === 0 ? theme.core : theme.secondary;
    ctx.beginPath();
    ctx.arc(mx, my, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawBossSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  kind: LegacyBossVisualKind,
  facing: 1 | -1,
  walkPhase: number,
  hurtFlash: number,
  slashProgress: number,
  time: number
) {
  if (kind === 'el_mastermind') {
    drawElMastermind(ctx, x, groundY, facing, walkPhase, hurtFlash, slashProgress, time, {
      immune: false,
      phase: 1,
      eyeFlash: 0,
    });
    return;
  }
  if (kind === 'aswang') {
    ctx.save();
    ctx.translate(px(x), px(groundY));
    ctx.scale(1.42, 1.42);
    drawEnemySprite(ctx, 0, 0, 'aswang', facing, walkPhase, hurtFlash, time);
    ctx.restore();
    return;
  }

  const bossState: 'idle' | 'walk' | 'hit' =
    hurtFlash > 0 ? 'hit' : Math.abs(Math.sin(walkPhase)) > 0.1 || slashProgress > 0 ? 'walk' : 'idle';
  if (kind === 'mayor' || kind === 'vice_mayor') {
    drawBoss14x16Frame(ctx, resolveBossAtlasRow(kind), bossState, time, x, groundY + 4, kind === 'mayor' ? 148 : 138, facing, {
      hitFlash: hurtFlash,
      shadowRadius: 36,
    });
    return;
  }
  const strip =
    resolveEnemyAtlasStrip(kind === 'corrupt_politician' ? 'corrupt_politician' : kind) ||
    resolveEnemyAtlasStrip('evil_pastor');
  if (strip) {
    drawEnemy16x17Frame(ctx, strip, Math.floor(time * 8), x, groundY + 4, 140, facing, {
      hitFlash: hurtFlash,
      shadowRadius: 34,
    });
  }
}

export function drawNoirAspin(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  facing: 1 | -1,
  walkPhase: number,
  time: number,
  lunging = false
) {
  if (
    drawV2Sprite(
      ctx,
      lunging ? 'ally_bantay_bark' : 'ally_bantay_run',
      x,
      groundY + 4,
      TARGET_VISUAL_HEIGHTS.dog_pet,
      facing,
      time,
      {
        offsetY: lunging ? -6 : 0,
        shadowRadius: 16,
        fps: lunging ? 12 : 8,
      }
    )
  ) {
    return;
  }
  void walkPhase;
  drawAtlasSprite(ctx, 'aspin_askal', x, groundY + 2, 72, facing, time, {
    offsetY: lunging ? -8 : 0,
    shadowRadius: 20,
    fps: lunging ? 14 : 8,
  });
}

export function drawEntityNameplate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  subtitle?: string,
  highlighted = false,
  opts?: { compact?: boolean; alpha?: number }
) {
  const alpha = opts?.alpha ?? 1;
  if (alpha <= 0.04) return;
  const compact = opts?.compact ?? false;
  const showSub = Boolean(subtitle) && !compact;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.font = compact ? '700 10px "Chakra Petch", sans-serif' : '700 11px "Chakra Petch", sans-serif';
  const nameW = ctx.measureText(name).width + (compact ? 14 : 18);
  let subW = 0;
  if (showSub && subtitle) {
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    subW = ctx.measureText(subtitle).width + 18;
  }
  const tw = Math.max(nameW, subW, compact ? 54 : 74);
  const bh = showSub ? 30 : 18;

  ctx.fillStyle = highlighted ? 'rgba(18, 34, 52, 0.94)' : 'rgba(18, 34, 52, 0.82)';
  ctx.fillRect(px(x - tw / 2), px(y - bh), px(tw), bh);
  ctx.strokeStyle = highlighted ? '#F4C542' : '#7FA4BE';
  ctx.lineWidth = highlighted ? 1.8 : 1.3;
  ctx.strokeRect(px(x - tw / 2), px(y - bh), px(tw), bh);

  ctx.font = compact ? '700 10px "Chakra Petch", sans-serif' : '700 11px "Chakra Petch", sans-serif';
  ctx.fillStyle = highlighted ? '#F4C542' : '#FFFFFF';
  ctx.fillText(name, px(x), px(y - (showSub ? 16 : 5)));
  if (showSub && subtitle) {
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#BDD3E2';
    ctx.fillText(subtitle, px(x), px(y - 4));
  }
  ctx.restore();
}

export function drawRainOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  intensity: number,
  time: number
) {
  if (intensity <= 0.02) return;
  const count = Math.floor(intensity * 110);
  ctx.save();
  ctx.strokeStyle = 'rgba(180, 224, 248, 0.34)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const rx = ((i * 173 + time * 420) % (w + 120)) - 60;
    const ry = ((i * 97 + time * 720) % (groundY + 40)) - 20;
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 5, ry + 14);
  }
  ctx.stroke();
  ctx.restore();
}

// =========================================================================
// 8. ON-CANVAS TACTICAL MINIMAP
// =========================================================================

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  zone: ZoneDef,
  playerX: number,
  bossMarkers: Array<{ x: number; defeated: boolean; isMayor: boolean }>,
  elMastermind: { x: number; defeated: boolean; immune: boolean } | null
) {
  const mw = Math.min(240, viewW - 40);
  const mh = 26;
  const mx = px((viewW - mw) * 0.5);
  const my = px(viewH - 76);

  ctx.save();
  ctx.fillStyle = 'rgba(16, 32, 48, 0.84)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#7FA4BE';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx, my, mw, mh);

  // Road bar
  ctx.fillStyle = '#2A4359';
  ctx.fillRect(mx + 6, my + 12, mw - 12, 4);

  const mapX = (wx: number) => mx + 6 + (Math.max(0, Math.min(zone.width, wx)) / zone.width) * (mw - 12);

  // Portals
  ctx.fillStyle = '#38BDF8';
  for (const p of zone.portals) {
    ctx.fillRect(px(mapX(p.x)) - 2, my + 8, 4, 10);
  }
  // Safe house
  if (zone.houseX) {
    ctx.fillStyle = '#7AE582';
    ctx.fillRect(px(mapX(zone.houseX)) - 2, my + 7, 5, 5);
  }
  // NPCs
  ctx.fillStyle = '#C8DFEE';
  for (const n of zone.npcs) {
    ctx.fillRect(px(mapX(n.x)) - 1, my + 11, 3, 5);
  }
  // Town Bosses
  for (const b of bossMarkers) {
    if (b.defeated) continue;
    ctx.fillStyle = b.isMayor ? '#EF4444' : '#F97316';
    ctx.fillRect(px(mapX(b.x)) - 3, my + 6, 6, 8);
  }
  // El Mastermind
  if (elMastermind && !elMastermind.defeated) {
    ctx.fillStyle = elMastermind.immune ? '#F4C542' : '#DC2626';
    ctx.fillRect(px(mapX(elMastermind.x)) - 4, my + 5, 8, 10);
  }
  // Player dot
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(px(mapX(playerX)) - 3, my + 9, 6, 9);
  ctx.strokeStyle = '#F4C542';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(px(mapX(playerX)) - 3, my + 9, 6, 9);

  ctx.restore();
}

// =========================================================================
// 9. SAFE HOUSE INTERIOR, CHARACTER INVENTORY PAPER-DOLL & STORY PLATES
// =========================================================================

export function drawSanctuaryRoom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  house: HouseDef,
  decorIds: string[],
  time: number
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#16283A';
  ctx.fillRect(0, 0, w, h);

  drawOutlinedRect(ctx, 18, 18, w - 36, h - 56, house.wallTint, '#7FA4BE', 2);
  drawOutlinedRect(ctx, 18, h - 42, w - 36, 26, '#5A3E28', INK, 2);

  const hasArchWindow = decorIds.includes('decor_plaza_window');
  drawOutlinedRect(ctx, w * 0.64, 42, hasArchWindow ? 86 : 66, 72, '#8FD3F4', '#7FA4BE', 2);

  if (decorIds.includes('decor_evidence_board')) {
    drawOutlinedRect(ctx, 36, 46, 86, 56, '#C49A64', '#5A3E28', 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(44, 54, 18, 16);
    ctx.fillRect(72, 58, 20, 18);
    ctx.fillRect(96, 52, 18, 16);
    ctx.strokeStyle = '#D63A3A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(52, 62);
    ctx.lineTo(82, 66);
    ctx.lineTo(104, 60);
    ctx.stroke();
  }

  if (decorIds.includes('decor_capiz_lamp')) {
    ctx.strokeStyle = '#F4C542';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.48, 18);
    ctx.lineTo(w * 0.48, 46);
    ctx.stroke();
    const glow = ctx.createRadialGradient(w * 0.48, 54, 4, w * 0.48, 54, 72);
    glow.addColorStop(0, `rgba(255, 232, 145, ${0.55 + Math.sin(time * 3) * 0.08})`);
    glow.addColorStop(1, 'rgba(255, 232, 145, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w * 0.48, 54, 72, 0, Math.PI * 2);
    ctx.fill();
    drawOutlinedRect(ctx, w * 0.48 - 18, 46, 36, 14, '#FFF3C4');
  }

  if (decorIds.includes('decor_dambana_shrine')) {
    drawOutlinedRect(ctx, w * 0.42, h - 78, 52, 36, '#7A5434');
    ctx.fillStyle = '#F4C542';
    ctx.fillRect(px(w * 0.42 + 23), h - 108, 6, 30);
    ctx.fillRect(px(w * 0.42 + 13), h - 100, 26, 6);
  }

  if (decorIds.includes('decor_bike_rack')) {
    drawOutlinedRect(ctx, w - 92, h - 78, 52, 36, '#2E7D47', '#F4C542', 1.6);
    ctx.fillStyle = '#F4C542';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BIKE RACK', w - 66, h - 57);
  }

  drawOutlinedRect(ctx, 36, h - 68, 86, 26, '#2463B5', '#7FA4BE', 2);
  drawOutlinedRect(ctx, 40, h - 74, 24, 12, '#FFFFFF');
}

export function drawHeroPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: PlayerProgress,
  time: number
) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2B4861');
  bg.addColorStop(1, '#152739');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(127, 164, 190, 0.14)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < w; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  const bank = getHeroSpriteBank();
  const riding = progress.hasBike && progress.ridingBike;
  if (bank) {
    drawHeroComposite(
      ctx,
      bank,
      progress,
      riding ? 'bike' : 'idle',
      w * 0.5,
      h * 0.86,
      riding ? 0.78 : 0.86,
      1,
      time * 4,
      { drawShadow: true, time }
    );
  } else {
    drawNoirFigure(ctx, {
      x: w * 0.5,
      y: h * 0.86,
      facing: 1,
      walkPhase: time * 2.4,
      scale: riding ? 1.48 : 1.62,
      coatColor: '#4B833C',
      accentColor: '#E56A36',
      hairColor: '#2A1B14',
      umbrellaOpen: progress.hasUmbrella && progress.umbrellaOpen,
      ridingBike: riding,
      bikeSkin: getBikeSkinById(progress.equippedBikeSkinId),
      equippedOutfitId: progress.equippedOutfitId,
      progress,
      useAtlasHero: true,
      speedRatio: riding ? 0.65 : 0,
      time,
    });
  }
  ctx.restore();
}

/** Live Illustrated HUD Portrait powered by the exact same V4 Composite Hero Renderer */
export function drawHeroHudPortrait(
  ctx: CanvasRenderingContext2D,
  progress: PlayerProgress,
  size: number,
  time = 0
) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, '#2B4C6A');
  bg.addColorStop(1, '#122233');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  drawHeroCompositePortrait(ctx, progress, size, time);

  ctx.strokeStyle = '#F4C542';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.restore();
}

export function drawStoryPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sceneKind: 'plaza' | 'corrupt' | 'folklore' | 'mastermind',
  time: number
) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const groundY = Math.floor(h * 0.8);
  const allZones = Object.values(ZONES);
  const plazaZone = allZones[0];
  const goldenZone = allZones[Math.min(5, allZones.length - 1)];
  const nightZone = allZones[Math.min(8, allZones.length - 1)];

  if (sceneKind === 'plaza') {
    drawIllustratedParallaxBackdrop(ctx, w, h, groundY, time * 22, plazaZone, time, 'day');
    drawCommercialBuilding(ctx, w * 0.24, groundY, '7_elevate', time);
    drawWorldNpc(ctx, w * 0.78, groundY, -1, 'kap_ben', '#E8DFCA', '#2463B5', '#2C221E', time);
    drawNoirFigure(ctx, {
      x: w * 0.52,
      y: groundY,
      facing: 1,
      walkPhase: time * 5,
      scale: 1.4,
      coatColor: '#4B833C',
      accentColor: '#E56A36',
      hairColor: '#2A1B14',
      outfitStyle: 'defender_vest',
      headgearStyle: 'defender_headband',
      backStyle: 'satchel',
      weaponStyle: 'ang_payong',
      umbrellaOpen: true,
      ridingBike: true,
      useAtlasHero: true,
      time,
    });
  } else if (sceneKind === 'corrupt') {
    drawIllustratedParallaxBackdrop(ctx, w, h, groundY, time * 14, goldenZone, time, 'golden');
    drawBoss14x16Frame(ctx, resolveBossAtlasRow('vice_mayor_01_carla_mendoza'), 'walk', time, w * 0.26, groundY + 4, 152, 1, {
      shadowRadius: 34,
    });
    const pastorStrip = resolveEnemyAtlasStrip('evil_pastor');
    if (pastorStrip) {
      drawEnemy16x17Frame(ctx, pastorStrip, Math.floor(time * 7), w * 0.5, groundY + 4, 154, -1, {
        shadowRadius: 36,
      });
    }
    drawBoss14x16Frame(ctx, resolveBossAtlasRow('mayor_02_arturo_balboa'), 'idle', time, w * 0.74, groundY + 4, 156, -1, {
      shadowRadius: 38,
    });
  } else if (sceneKind === 'folklore') {
    drawIllustratedParallaxBackdrop(ctx, w, h, groundY, time * 10, nightZone, time, 'night');
    drawEnemySprite(ctx, w * 0.22, groundY, 'balete_tree', 1, time, 0, time, 0);
    drawEnemySprite(ctx, w * 0.44, groundY, 'tiyanak', 1, time * 3, 0, time, 2);
    drawEnemySprite(ctx, w * 0.62, groundY, 'white_lady', -1, time * 2, 0, time, 0);
    drawEnemySprite(ctx, w * 0.81, groundY, 'aswang', -1, time * 4, 0, time, 0);
  } else {
    drawIllustratedParallaxBackdrop(ctx, w, h, groundY, time * 8, nightZone, time, 'night');
    ctx.fillStyle = 'rgba(24, 6, 14, 0.48)';
    ctx.fillRect(0, 0, w, h);
    // Dramatic wide El Mastermind Throne Scene strip from 16x17 Enemy Atlas (row 16 cols 8..15) + Hero facing him!
    const sceneStrip = resolveEnemyAtlasStrip('el_mastermind_scene');
    const sceneDrawn =
      (sceneStrip
        ? drawEnemy16x17Frame(ctx, sceneStrip, Math.floor(time * 7), w * 0.66, groundY - 8, 168, 1, {
            shadowRadius: 110,
          })
        : false) ||
      drawAtlasSprite(ctx, 'final_boss_el_mastermind_scene', w * 0.66, groundY - 12, 168, 1, time, {
        shadowRadius: 110,
      });
    if (!sceneDrawn) {
      drawElMastermind(ctx, w * 0.68, groundY, -1, time * 1.5, 0, 0, time, {
        immune: true,
        phase: 1,
        eyeFlash: 0,
      });
    }
    drawNoirFigure(ctx, {
      x: w * 0.22,
      y: groundY,
      facing: 1,
      walkPhase: time * 4,
      scale: 1.38,
      coatColor: '#4B833C',
      accentColor: '#E56A36',
      hairColor: '#2A1B14',
      outfitStyle: 'defender_vest',
      weaponStyle: 'ang_payong',
      slashProgress: (time * 0.7) % 1,
      useAtlasHero: true,
      time,
    });
  }
  ctx.restore();
}

// =========================================================================
// 11. UNIQUE ENEMY SKILL VFX (ALL 20 VISUAL KINDS) & STATUS OVERLAYS
// =========================================================================

export interface EnemySkillVfxOpts {
  visualKind: EnemySkillVisualKind;
  casterX: number;
  targetX: number;
  groundY: number;
  facing: 1 | -1;
  phase: 'windup' | 'active';
  progress01: number;
  unblockable?: boolean;
  reflectable?: boolean;
  warningCue?: string;
  time: number;
}

export function drawEnemySkillEffect(ctx: CanvasRenderingContext2D, opts: EnemySkillVfxOpts): void {
  const {
    visualKind,
    casterX,
    targetX,
    groundY,
    facing,
    phase,
    progress01,
    unblockable,
    reflectable,
    warningCue,
    time,
  } = opts;
  const p = Math.max(0, Math.min(1, progress01));
  const isWindup = phase === 'windup';

  ctx.save();

  // Crisp overhead telegraph badge during windup
  if (isWindup) {
    const pulse = 0.7 + 0.3 * Math.sin(time * 22);
    const badgeColor = unblockable ? '#EF4444' : reflectable ? '#38BDF8' : '#FACC15';
    const label = unblockable
      ? `⚠ ${warningCue || 'UNBLOCKABLE! DODGE!'}`
      : reflectable
      ? `🛡 ${warningCue || 'REFLECT WITH [K]!'}`
      : `⚡ ${warningCue || 'INCOMING SKILL!'}`;
    ctx.font = 'bold 11px monospace';
    const tw = Math.min(310, ctx.measureText(label).width + 16);
    const bx = Math.round(casterX - tw / 2);
    const by = Math.round(groundY - 146);
    ctx.fillStyle = `rgba(11, 18, 28, ${(0.88 * pulse).toFixed(2)})`;
    ctx.fillRect(bx, by, tw, 20);
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, tw, 20);
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'center';
    ctx.fillText(label, casterX, by + 14, tw - 8);
  }

  switch (visualKind) {
    case 'laser_bullet': {
      const gunX = casterX + facing * 26;
      const gunY = groundY - 56;
      const aimX = isWindup ? targetX : casterX + facing * 420;
      ctx.strokeStyle = isWindup
        ? `rgba(239, 68, 68, ${(0.45 + 0.45 * Math.sin(time * 28)).toFixed(2)})`
        : 'rgba(254, 240, 138, 0.95)';
      ctx.lineWidth = isWindup ? 2 : 4;
      ctx.setLineDash(isWindup ? [8, 5] : []);
      ctx.beginPath();
      ctx.moveTo(gunX, gunY);
      ctx.lineTo(aimX, gunY);
      ctx.stroke();
      ctx.setLineDash([]);
      if (isWindup) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetX, gunY, 12 - p * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'bribe_wad':
    case 'cash_barrage': {
      const count = visualKind === 'cash_barrage' ? 5 : 2;
      for (let i = 0; i < count; i++) {
        const bx = isWindup
          ? casterX + facing * (20 + i * 10)
          : casterX + facing * (30 + p * 360 + i * 28);
        const by = groundY - 58 - Math.sin(p * Math.PI + i) * 32 + (i % 2) * 14;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(time * 8 + i);
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(-10, -5, 20, 10);
        ctx.strokeStyle = '#14532D';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-10, -5, 20, 10);
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(-3, -5, 6, 10);
        ctx.restore();
      }
      break;
    }

    case 'flashlight_cone': {
      const originX = casterX + facing * 22;
      const originY = groundY - 58;
      const reach = isWindup ? 140 * p : 230;
      const grad = ctx.createLinearGradient(originX, originY, originX + facing * reach, originY);
      grad.addColorStop(0, isWindup ? 'rgba(254, 249, 195, 0.35)' : 'rgba(254, 249, 195, 0.82)');
      grad.addColorStop(1, 'rgba(254, 249, 195, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + facing * reach, originY - 58);
      ctx.lineTo(originX + facing * reach, originY + 52);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'whistle_wave':
    case 'sonic_wail_ring': {
      const isGhost = visualKind === 'sonic_wail_ring';
      const maxR = isGhost ? 240 : 190;
      const rings = isWindup ? 1 : 3;
      for (let i = 0; i < rings; i++) {
        const rp = (p + i * 0.24) % 1;
        const r = isWindup ? 28 + p * 34 : 36 + rp * maxR;
        ctx.strokeStyle = isGhost
          ? `rgba(125, 211, 252, ${(1 - rp * 0.85).toFixed(2)})`
          : `rgba(250, 204, 21, ${(1 - rp * 0.8).toFixed(2)})`;
        ctx.lineWidth = isWindup ? 2 : 3.5;
        ctx.beginPath();
        ctx.arc(casterX, groundY - 54, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'rally_buff': {
      const r = 45 + p * 260;
      ctx.strokeStyle = isWindup ? 'rgba(250, 204, 21, 0.65)' : 'rgba(251, 146, 60, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(casterX, groundY - 4, r, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
      ctx.fill();
      break;
    }

    case 'ledger_chain': {
      const startX = casterX + facing * 18;
      const endX = startX + facing * (isWindup ? 75 * p : 275 * Math.sin(Math.min(1, p * 1.4) * (Math.PI / 2)));
      const yMid = groundY - 52;
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, yMid);
      ctx.lineTo(endX, yMid + Math.sin(time * 24) * 10);
      ctx.stroke();
      ctx.setLineDash([]);
      // Heavy chained ledger book at tip
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(endX - 14, yMid - 14, 28, 22);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.strokeRect(endX - 14, yMid - 14, 28, 22);
      break;
    }

    case 'seal_shockwave':
    case 'gavel_slam': {
      const isGavel = visualKind === 'gavel_slam';
      const slamX = casterX + facing * 64;
      if (isWindup) {
        // Red unblockable ground danger zone
        const dangerW = isGavel ? 290 : 240;
        ctx.fillStyle = `rgba(239, 68, 68, ${(0.18 + 0.16 * Math.sin(time * 24)).toFixed(2)})`;
        ctx.fillRect(casterX - dangerW * 0.5, groundY - 12, dangerW, 18);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(casterX - dangerW * 0.5, groundY - 12, dangerW, 18);
        // Raised giant golden gavel / municipal seal overhead
        ctx.fillStyle = isGavel ? '#D97706' : '#DC2626';
        ctx.fillRect(casterX - 18, groundY - 128 - p * 14, 36, 20);
        ctx.strokeStyle = '#FDE047';
        ctx.strokeRect(casterX - 18, groundY - 128 - p * 14, 36, 20);
      } else {
        const waveR = 30 + p * (isGavel ? 290 : 240);
        ctx.strokeStyle = isGavel ? '#F59E0B' : '#EF4444';
        ctx.lineWidth = 6 * (1 - p * 0.6);
        ctx.beginPath();
        ctx.ellipse(slamX, groundY - 2, waveR, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Ground debris sparks
        for (let i = -3; i <= 3; i++) {
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(slamX + i * waveR * 0.25, groundY - 12 - (1 - p) * 26, 6, 6);
        }
      }
      break;
    }

    case 'decree_beam': {
      const ox = casterX + facing * 28;
      const oy = groundY - 62;
      const beamLen = 450;
      if (isWindup) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + facing * beamLen, oy);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const h = 28 * (1 - p * 0.3);
        const grad = ctx.createLinearGradient(ox, oy - h, ox, oy + h);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
        grad.addColorStop(0.5, 'rgba(254, 240, 138, 0.95)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(facing === 1 ? ox : ox - beamLen, oy - h / 2, beamLen, h);
      }
      break;
    }

    case 'shadow_blink_slash':
    case 'tiyanak_lunge': {
      const isAswang = visualKind === 'shadow_blink_slash';
      const fxX = isWindup ? targetX : casterX + facing * 34;
      ctx.strokeStyle = isAswang ? '#A855F7' : '#F43F5E';
      ctx.lineWidth = isWindup ? 2.5 : 5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(fxX - 24, groundY - 82 + i * 14);
        ctx.lineTo(fxX + 26, groundY - 30 + i * 14);
        ctx.stroke();
      }
      break;
    }

    case 'balete_roots': {
      const rx = targetX;
      if (isWindup) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.34)';
        ctx.fillRect(rx - 52, groundY - 8, 104, 14);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx - 52, groundY - 8, 104, 14);
      } else {
        const spikeH = Math.sin(Math.min(1, p * 1.3) * Math.PI) * 92;
        ctx.fillStyle = '#451A03';
        ctx.strokeStyle = '#84CC16';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          const sx = rx + i * 20;
          ctx.beginPath();
          ctx.moveTo(sx - 9, groundY + 4);
          ctx.lineTo(sx, groundY - spikeH * (1 - Math.abs(i) * 0.14));
          ctx.lineTo(sx + 9, groundY + 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      break;
    }

    case 'kulam_curse_orb': {
      const ox = isWindup ? casterX + facing * 24 : casterX + (targetX - casterX) * p;
      const oy = groundY - 66 - Math.sin(time * 10) * 8;
      const r = isWindup ? 8 + p * 10 : 18;
      const g = ctx.createRadialGradient(ox, oy, 2, ox, oy, r * 1.6);
      g.addColorStop(0, '#F5D0FE');
      g.addColorStop(0.5, '#9333EA');
      g.addColorStop(1, 'rgba(88, 28, 135, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'usog_tether': {
      ctx.strokeStyle = isWindup ? 'rgba(192, 132, 252, 0.55)' : 'rgba(168, 85, 247, 0.95)';
      ctx.lineWidth = isWindup ? 2 : 5;
      ctx.beginPath();
      ctx.moveTo(casterX, groundY - 58);
      const midX = (casterX + targetX) * 0.5;
      ctx.quadraticCurveTo(midX, groundY - 88 + Math.sin(time * 22) * 18, targetX, groundY - 52);
      ctx.stroke();
      break;
    }

    case 'nomar_blitz': {
      ctx.strokeStyle = isWindup ? 'rgba(244, 63, 94, 0.65)' : '#FB7185';
      ctx.lineWidth = isWindup ? 3 : 8;
      ctx.beginPath();
      ctx.moveTo(casterX, groundY - 52);
      ctx.lineTo(casterX + facing * (isWindup ? 190 : 340), groundY - 52);
      ctx.stroke();
      break;
    }

    case 'nomar_counter_shield': {
      const pulse = 0.72 + 0.28 * Math.sin(time * 20);
      ctx.strokeStyle = `rgba(244, 63, 94, ${pulse.toFixed(2)})`;
      ctx.fillStyle = 'rgba(159, 18, 57, 0.24)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(casterX, groundY - 56, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'mastermind_lightning': {
      const strikes = [targetX - 110, targetX, targetX + 110];
      for (const sx of strikes) {
        if (isWindup) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          ctx.fillRect(sx - 28, groundY - 10, 56, 16);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - 28, groundY - 10, 56, 16);
        } else {
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx - 14, groundY * 0.35);
          ctx.lineTo(sx + 16, groundY * 0.68);
          ctx.lineTo(sx, groundY);
          ctx.stroke();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
      break;
    }

    case 'mastermind_summon': {
      const portalX = casterX + facing * 130;
      const r = 24 + p * 46;
      const g = ctx.createRadialGradient(portalX, groundY - 56, 4, portalX, groundY - 56, r);
      g.addColorStop(0, '#0F172A');
      g.addColorStop(0.55, '#DC2626');
      g.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(portalX, groundY - 56, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

export function drawRallyBuffAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  time: number
): void {
  ctx.save();
  const pulse = 0.55 + 0.35 * Math.sin(time * 12);
  ctx.strokeStyle = `rgba(251, 191, 36, ${pulse.toFixed(2)})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 2, 34, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawPlayerDebuffFeedback(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  heroScreenX: number,
  heroScreenY: number,
  debuffs: {
    slow: number;
    bleed: number;
    blind: number;
    poison?: number;
    stun?: number;
    freeze?: number;
    confusion?: number;
    shadow?: number;
    soaked?: boolean;
    burn?: boolean;
  },
  time: number
): void {
  ctx.save();
  if (debuffs.slow > 0 || debuffs.soaked) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(heroScreenX, heroScreenY - 4, 28 + Math.sin(time * 9) * 3, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (debuffs.freeze && debuffs.freeze > 0) {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.fillRect(heroScreenX - 24, heroScreenY - 82, 48, 82);
    ctx.strokeRect(heroScreenX - 24, heroScreenY - 82, 48, 82);
  }
  if (debuffs.poison && debuffs.poison > 0) {
    for (let i = 0; i < 5; i++) {
      const rise = (time * 34 + i * 16) % 58;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.85)';
      ctx.beginPath();
      ctx.arc(heroScreenX - 16 + i * 8, heroScreenY - 12 - rise, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (debuffs.burn) {
    for (let i = 0; i < 4; i++) {
      const rise = (time * 42 + i * 18) % 52;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(249, 115, 22, 0.85)' : 'rgba(250, 204, 21, 0.85)';
      ctx.fillRect(heroScreenX - 14 + i * 9, heroScreenY - 16 - rise, 4, 6);
    }
  }
  if (debuffs.stun && debuffs.stun > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 6.5 + (i * Math.PI * 2) / 3;
      const sx = heroScreenX + Math.cos(a) * 20;
      const sy = heroScreenY - 94 + Math.sin(a) * 6;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (debuffs.confusion && debuffs.confusion > 0) {
    ctx.fillStyle = '#E879F9';
    ctx.font = '900 15px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('? ? ?', heroScreenX + Math.sin(time * 8) * 6, heroScreenY - 96);
  }
  if (debuffs.shadow && debuffs.shadow > 0) {
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(heroScreenX, heroScreenY - 44, 34 + Math.sin(time * 7) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (debuffs.bleed > 0) {
    for (let i = 0; i < 4; i++) {
      const dy = (time * 38 + i * 19) % 44;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(heroScreenX - 12 + i * 8, heroScreenY - 68 + dy, 3, 5);
    }
  }
  if (debuffs.blind > 0) {
    const a = Math.min(0.46, debuffs.blind * 0.24);
    const g = ctx.createRadialGradient(
      heroScreenX,
      heroScreenY - 48,
      70,
      heroScreenX,
      heroScreenY - 48,
      Math.max(viewW, viewH) * 0.68
    );
    g.addColorStop(0, `rgba(254, 249, 195, ${(a * 0.45).toFixed(2)})`);
    g.addColorStop(1, `rgba(15, 23, 42, ${(a * 0.95).toFixed(2)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  ctx.restore();
}

// =========================================================================
// STATIC WORLD BUILDINGS LAYER & DECOUPLED RECRUITED ALLY RENDERER
// =========================================================================

export function drawWorldBuildings(
  ctx: CanvasRenderingContext2D,
  buildings: WorldBuilding[],
  cameraX: number,
  viewW: number,
  groundY: number,
  time: number
): void {
  for (const b of buildings) {
    const sx = b.x - cameraX;
    if (sx < -260 || sx > viewW + 260) continue;
    const by = groundY + b.y;
    if (b.type === 'police_outpost') {
      drawV2Sprite(ctx, 'prop_police_outpost', sx, by, ENTITY_WORLD_SCALES.police_outpost.height, 1, time, {
        shadowRadius: 56,
      });
    } else if (b.type === 'bunker') {
      drawV2Sprite(ctx, 'prop_sandbag_bunker', sx, by, ENTITY_WORLD_SCALES.sandbag_bunker.height, 1, time, {
        shadowRadius: 58,
      });
    } else if (b.type === 'broadcast_rig') {
      drawV2Sprite(ctx, 'prop_broadcast_rig', sx, by, 92, 1, time, { shadowRadius: 30 });
    } else if (b.type === 'jeepney_hub') {
      drawV2Sprite(ctx, 'balanga_jeepney_hub', sx, by, 178, 1, time, { shadowRadius: 88 });
    } else if (b.type === 'mechanic_bike') {
      drawV2Sprite(ctx, 'veh_kap_bike', sx, by, 72, -1, time, { shadowRadius: 30 });
    } else if (b.type === 'sari_sari_goods') {
      drawV2Sprite(ctx, 'prop_sari_sari_goods', sx, by, TARGET_VISUAL_HEIGHTS.small_prop, 1, time, {
        shadowRadius: 24,
      });
    }
  }
}

/**
 * Draws ONLY the recruited ally character sprite + full attack/shooting animation + compact nameplate!
 * Batch 1.2: Every ally plays a distinct shoot/strike/heal/rally animation when attacking!
 */
export function drawAlly(
  ctx: CanvasRenderingContext2D,
  ally: AllyEntity,
  visual: NpcVisualKind,
  coatColor: string,
  accentColor: string,
  hairColor: string,
  walkPhase: number,
  slashTimer: number,
  isAspin: boolean,
  time: number,
  policeState?: PoliceAllyState,
  confused = false
): void {
  const isShooting = slashTimer > 0 || Boolean(policeState && policeState.shootAnimTimer > 0);
  const recoilShift =
    visual === 'honest_police' && policeState && policeState.shootAnimTimer > 0
      ? policeState.recoilX * ally.facing
      : isShooting
        ? (visual === 'honest_soldier' ? -5 : 7) * ally.facing * Math.sin(Math.min(1, slashTimer * 4) * Math.PI)
        : 0;

  if (isAspin) {
    drawNoirAspin(ctx, ally.x + recoilShift, ally.y, ally.facing, walkPhase, time, slashTimer > 0);
    if (slashTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ally.x + ally.facing * 26, ally.y - 24, 20, -0.7, 0.7);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    drawWorldNpc(ctx, ally.x + recoilShift, ally.y, ally.facing, visual, coatColor, accentColor, hairColor, time, walkPhase);
    if (visual === 'honest_police' && policeState && policeState.shootAnimTimer > 0) {
      drawPoliceShootingOverlay(ctx, policeState, ally.x, ally.y);
    } else if (visual === 'honest_soldier' && isShooting) {
      // Sgt. Marco Reyes tactical rifle recoil + bright starburst muzzle flash + tracer!
      ctx.save();
      const gunX = ally.x + recoilShift + ally.facing * 12;
      const gunY = ally.y - 46;
      const muzzleX = gunX + ally.facing * 32;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(gunX - ally.facing * 6, gunY);
      ctx.lineTo(muzzleX, gunY - 2);
      ctx.stroke();
      // Muzzle starburst flash
      const flashR = 11 + Math.sin(time * 55) * 4;
      const mg = ctx.createRadialGradient(muzzleX, gunY - 2, 1, muzzleX, gunY - 2, flashR);
      mg.addColorStop(0, '#FFFFFF');
      mg.addColorStop(0.5, '#FACC15');
      mg.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(muzzleX, gunY - 2, flashR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (slashTimer > 0) {
      // Clear visual attack/heal/rally VFX for Kap Ben, Aling Nena, Ate Linda, Ms. Clara
      ctx.save();
      const isHealer = visual === 'aling_nena';
      const isBard = visual === 'street_vendor' || visual === 'teacher';
      if (isHealer) {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(ally.x, ally.y - 40, 26 + (0.35 - Math.min(0.35, slashTimer)) * 60, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isBard) {
        for (let r = 0; r < 2; r++) {
          ctx.strokeStyle = r === 0 ? 'rgba(250, 204, 21, 0.9)' : 'rgba(56, 189, 248, 0.78)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ally.x + ally.facing * 18, ally.y - 46, 18 + r * 14, -0.8, 0.8);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.92)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ally.x + ally.facing * 26, ally.y - 44, 28, -1.0, 1.0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Crisp compact ally nameplate (turns purple/red when confused!)
  ctx.save();
  ctx.font = '700 10px "Chakra Petch", sans-serif';
  const label = confused ? `${ally.name} · CONFUSED!` : `${ally.name} · ALLY`;
  const lw = ctx.measureText(label).width + 14;
  const ly = ally.y - (isAspin ? 56 : 94);
  ctx.fillStyle = confused ? 'rgba(88, 28, 135, 0.92)' : 'rgba(12, 24, 38, 0.84)';
  ctx.fillRect(px(ally.x - lw / 2), px(ly - 13), px(lw), 16);
  ctx.strokeStyle = confused ? '#F43F5E' : 'rgba(94, 234, 212, 0.72)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(px(ally.x - lw / 2), px(ly - 13), px(lw), 16);
  ctx.fillStyle = confused ? '#FDA4AF' : '#99F6E4';
  ctx.textAlign = 'center';
  ctx.fillText(label, px(ally.x), px(ly - 2));
  ctx.restore();
}

/**
 * Hit-detection helper for the hero's Umbrella Shield deflection event on `reflectable: true` projectiles.
 */
export function checkProjectileShieldDeflection(
  proj: { x: number; y: number; vx: number; reflectable?: boolean; deflected?: boolean },
  hero: { x: number; y: number; shieldActive: boolean }
): boolean {
  if (!hero.shieldActive || proj.deflected) return false;
  if (proj.reflectable === false) return false;
  const dx = Math.abs(proj.x - hero.x);
  const dy = Math.abs(proj.y - (hero.y - 38));
  return dx < 48 && dy < 46;
}

// =========================================================================
// BATCH 4 & 5 WORLD RENDERERS: ORE NODES, GATHER NODES, FISHING & SIDE JOBS
// =========================================================================

export function drawOreNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  oreItemId: string,
  depleted: boolean,
  time: number,
  playerDist: number
): void {
  const mat = getMaterialById(oreItemId);
  const veinColor = mat?.color || '#F59E0B';
  ctx.save();
  ctx.translate(px(x), px(groundY));

  if (!depleted) {
    const glow = ctx.createRadialGradient(0, -24, 4, 0, -24, 44);
    glow.addColorStop(0, `${veinColor}55`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -24, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  // Volcanic rock boulder
  ctx.fillStyle = depleted ? '#1F2937' : '#334155';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 2);
  ctx.lineTo(-20, -28);
  ctx.lineTo(-4, -38);
  ctx.lineTo(18, -30);
  ctx.lineTo(26, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!depleted) {
    // Glowing mineral crystals embedded in rock
    ctx.fillStyle = veinColor;
    ctx.fillRect(-10, -28, 7, 10);
    ctx.fillRect(4, -24, 8, 9);
    ctx.fillRect(-2, -16, 6, 7);
    const sparkle = 0.5 + 0.5 * Math.sin(time * 5 + x);
    ctx.fillStyle = `rgba(255,255,255,${sparkle.toFixed(2)})`;
    ctx.fillRect(-8, -26, 3, 3);
    ctx.fillRect(6, -22, 3, 3);
  }
  ctx.restore();

  if (!depleted && playerDist < 210) {
    drawEntityNameplate(ctx, x, groundY - 48, mat?.name || 'Ore Vein', 'Press [E] to Mine', playerDist < 95, {
      alpha: Math.min(1, (210 - playerDist) / 70),
    });
  }
}

export function drawGatherNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  itemId: string,
  depleted: boolean,
  time: number,
  playerDist: number
): void {
  const mat = getMaterialById(itemId);
  const color = mat?.color || '#22C55E';
  const sway = Math.sin(time * 3 + x * 0.05) * 2;
  ctx.save();
  ctx.translate(px(x), px(groundY));

  if (depleted) {
    ctx.fillStyle = '#3F6212';
    ctx.fillRect(-8, -6, 16, 6);
    ctx.restore();
    return;
  }

  // Lush tropical shrub / herb cluster
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.arc(-8 + sway * 0.5, -12, 11, 0, Math.PI * 2);
  ctx.arc(8 + sway * 0.5, -12, 11, 0, Math.PI * 2);
  ctx.arc(sway, -20, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bright harvestable herb/veggie/fruit buds
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(-6 + sway, -18, 4, 0, Math.PI * 2);
  ctx.arc(5 + sway, -22, 4.5, 0, Math.PI * 2);
  ctx.arc(7 + sway, -11, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (playerDist < 200) {
    drawEntityNameplate(ctx, x, groundY - 40, mat?.name || 'Wild Plant', 'Press [E] to Gather', playerDist < 95, {
      alpha: Math.min(1, (200 - playerDist) / 65),
    });
  }
}

export function drawFishingSpot(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  label: string,
  time: number,
  playerDist: number
): void {
  ctx.save();
  ctx.translate(px(x), px(groundY));

  // Wooden coastal pier deck + post
  drawShadedBox(ctx, -42, -14, 84, 10, '#854D0E');
  drawShadedBox(ctx, -34, -4, 8, 16, '#5C3409');
  drawShadedBox(ctx, 26, -4, 8, 16, '#5C3409');
  // Signpost with fish emblem
  drawShadedBox(ctx, -38, -46, 6, 34, '#713F12');
  drawShadedBox(ctx, -50, -56, 30, 14, '#0369A1', '#7DD3FC', 1.5);
  ctx.fillStyle = '#E0F2FE';
  ctx.font = '700 8px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FISH', -35, -46);

  // Rippling coastal water shimmer beside the pier
  const ripple = 14 + ((time * 18) % 24);
  ctx.strokeStyle = `rgba(125, 211, 252, ${(1 - (ripple - 14) / 24).toFixed(2)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(38, 10, ripple, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (playerDist < 240) {
    drawEntityNameplate(ctx, x, groundY - 64, label, 'Press [E] to Fish', playerDist < 110, {
      alpha: Math.min(1, (240 - playerDist) / 70),
    });
  } else {
    drawProximityMarkerDot(ctx, x, groundY - 64, '#38BDF8', time);
  }
}

export function drawHeroFishingOverlay(
  ctx: CanvasRenderingContext2D,
  heroX: number,
  heroY: number,
  facing: 1 | -1,
  stage: 'casting' | 'waiting' | 'bite' | 'reeling',
  time: number
): void {
  ctx.save();
  const handX = heroX + facing * 16;
  const handY = heroY - 46;
  const bend = stage === 'reeling' ? Math.sin(time * 22) * 8 : stage === 'bite' ? 12 : 0;
  const tipX = handX + facing * 66;
  const tipY = handY - 44 + bend;
  const bobberX = handX + facing * 96;
  const bobberY =
    heroY +
    8 +
    (stage === 'bite' ? Math.sin(time * 28) * 7 : stage === 'reeling' ? Math.sin(time * 18) * 4 : Math.sin(time * 4) * 2.5);

  // Bamboo Fishing Rod
  ctx.strokeStyle = '#A16207';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.quadraticCurveTo(handX + facing * 36, handY - 36, tipX, tipY);
  ctx.stroke();

  // Fishing Line
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.quadraticCurveTo((tipX + bobberX) * 0.5, (tipY + bobberY) * 0.5 + (stage === 'waiting' ? 12 : 0), bobberX, bobberY);
  ctx.stroke();

  // Red & White Floating Bobber
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(bobberX, bobberY - 3, 5, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(bobberX, bobberY - 3, 5, 0, Math.PI);
  ctx.fill();

  // Splash & Exclamation Mark on Bite!
  if (stage === 'bite' || stage === 'reeling') {
    ctx.strokeStyle = '#7DD3FC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bobberX, bobberY + 2, 16 + Math.sin(time * 24) * 5, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (stage === 'bite') {
      ctx.fillStyle = '#FACC15';
      ctx.font = '900 22px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('! BITE !', bobberX, bobberY - 26);
    }
  }
  ctx.restore();
}

export function drawSideJobBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  label: string,
  kind: 'food_delivery' | 'taxi',
  time: number
): void {
  const color = kind === 'food_delivery' ? '#FB923C' : '#FACC15';
  const pulse = 0.65 + Math.sin(time * 6) * 0.3;
  ctx.save();
  const beam = ctx.createLinearGradient(x, groundY - 220, x, groundY);
  beam.addColorStop(0, 'rgba(0,0,0,0)');
  beam.addColorStop(1, kind === 'food_delivery' ? `rgba(251, 146, 60, ${(0.34 * pulse).toFixed(2)})` : `rgba(250, 204, 21, ${(0.34 * pulse).toFixed(2)})`);
  ctx.fillStyle = beam;
  ctx.fillRect(px(x - 36), groundY - 220, 72, 220);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(px(x), groundY - 2, 38 + Math.sin(time * 6) * 5, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawEntityNameplate(
    ctx,
    x,
    groundY - 120 + Math.sin(time * 5) * 4,
    kind === 'food_delivery' ? `DELIVERY: ${label}` : `TAXI DROP-OFF: ${label}`,
    'Press [E] to Complete Job!',
    true
  );
}




