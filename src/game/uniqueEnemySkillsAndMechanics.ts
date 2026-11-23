// Unique Enemy & Boss Skills, Combat Telegraphs, Counterplay & Visual Effects Kit
// Gives every syndicate enemy, folklore creature, corrupt official, The Gracias Nomar,
// and El Mastermind distinct signature moves with clear windups, Umbrella Shield deflects,
// unblockable dodge cues, status effects, and 2.4x Weak-Spot punish windows.

export type EnemySkillVisualKind =
  | 'laser_bullet'
  | 'bribe_wad'
  | 'flashlight_cone'
  | 'whistle_wave'
  | 'rally_buff'
  | 'ledger_chain'
  | 'seal_shockwave'
  | 'decree_beam'
  | 'cash_barrage'
  | 'gavel_slam'
  | 'shadow_blink_slash'
  | 'sonic_wail_ring'
  | 'tiyanak_lunge'
  | 'balete_roots'
  | 'kulam_curse_orb'
  | 'usog_tether'
  | 'nomar_blitz'
  | 'nomar_counter_shield'
  | 'mastermind_lightning'
  | 'mastermind_summon';

export interface UniqueEnemySkill {
  id: string;
  name: string;
  visualKind: EnemySkillVisualKind;
  cooldownSec: number;
  windupSec: number;
  activeSec: number;
  rangePx: number;
  damageMult: number;
  reflectable?: boolean; // Can be reflected with Umbrella Shield [K]
  unblockable?: boolean; // Must be dodged with Dash/Jump or interrupted
  appliesStatus?: 'slow' | 'bleed' | 'blind' | 'sp_drain' | 'weak_spot_after';
  buffsNearbyAllies?: boolean;
  summonsNomar?: boolean;
  warningCue: string;
}

export interface EnemyUniqueKit {
  enemyKind: string;
  roleTitle: string;
  passiveMechanic: string;
  skills: UniqueEnemySkill[];
}

export const UNIQUE_ENEMY_KITS: Record<string, EnemyUniqueKit> = {
  // 1. Corrupt Law & Barangay Enforcers
  corrupt_police: {
    enemyKind: 'corrupt_police',
    roleTitle: 'Syndicate Patrolman',
    passiveMechanic: 'Locks red laser sight before firing reflectable service pistol rounds.',
    skills: [
      {
        id: 'police_laser_shot',
        name: 'Laser Lock Shot',
        visualKind: 'laser_bullet',
        cooldownSec: 4.4,
        windupSec: 0.72,
        activeSec: 0.25,
        rangePx: 460,
        damageMult: 1.2,
        reflectable: true,
        warningCue: 'RED LASER! Press [K] Shield to Reflect!',
      },
      {
        id: 'police_bribe_toss',
        name: 'Dirty Bribe Wad',
        visualKind: 'bribe_wad',
        cooldownSec: 7.8,
        windupSec: 0.55,
        activeSec: 0.35,
        rangePx: 320,
        damageMult: 0.9,
        reflectable: true,
        appliesStatus: 'slow',
        warningCue: 'BRIBE THROW! Deflect or Dodge!',
      },
    ],
  },

  corrupt_soldier: {
    enemyKind: 'corrupt_soldier',
    roleTitle: 'Rogue Garrison Trooper',
    passiveMechanic: 'Fires disciplined rifle bursts and tactical flashbangs along highways.',
    skills: [
      {
        id: 'soldier_rifle_burst',
        name: 'Tactical Laser Burst',
        visualKind: 'laser_bullet',
        cooldownSec: 4.8,
        windupSec: 0.78,
        activeSec: 0.32,
        rangePx: 500,
        damageMult: 1.3,
        reflectable: true,
        warningCue: 'RIFLE LOCK! Press [K] Umbrella Shield!',
      },
      {
        id: 'soldier_flash_sweep',
        name: 'Tactical Strobe Beam',
        visualKind: 'flashlight_cone',
        cooldownSec: 8.2,
        windupSec: 0.65,
        activeSec: 0.4,
        rangePx: 250,
        damageMult: 0.9,
        appliesStatus: 'blind',
        warningCue: 'FLASH STROBE! Dash Behind Him!',
      },
    ],
  },

  barangay_tanod: {
    enemyKind: 'barangay_tanod',
    roleTitle: 'Corrupt Night Watch',
    passiveMechanic: 'Uses blinding flashlight sweeps and whistle stuns to corner the hero.',
    skills: [
      {
        id: 'tanod_flash_cone',
        name: 'Blinding Flashlight Sweep',
        visualKind: 'flashlight_cone',
        cooldownSec: 5.5,
        windupSec: 0.65,
        activeSec: 0.42,
        rangePx: 220,
        damageMult: 0.9,
        appliesStatus: 'blind',
        warningCue: 'FLASHLIGHT BLIND! Dash Behind Him!',
      },
      {
        id: 'tanod_whistle_call',
        name: 'Curfew Whistle Wave',
        visualKind: 'whistle_wave',
        cooldownSec: 8.4,
        windupSec: 0.58,
        activeSec: 0.35,
        rangePx: 260,
        damageMult: 1.0,
        appliesStatus: 'slow',
        warningCue: 'WHISTLE WAVE! Jump or Interrupt!',
      },
    ],
  },

  barangay_captain: {
    enemyKind: 'barangay_captain',
    roleTitle: 'Corrupt Barangay Captain',
    passiveMechanic: 'Rallies nearby goons with a golden aura before slamming his barangay seal.',
    skills: [
      {
        id: 'kap_rally_aura',
        name: 'Syndicate Rally Call',
        visualKind: 'rally_buff',
        cooldownSec: 11.0,
        windupSec: 0.8,
        activeSec: 0.5,
        rangePx: 420,
        damageMult: 0,
        buffsNearbyAllies: true,
        warningCue: 'CAPTAIN RALLY! Interrupt with Megaphone [L]!',
      },
      {
        id: 'kap_seal_slam',
        name: 'Rubber-Stamp Shockwave',
        visualKind: 'seal_shockwave',
        cooldownSec: 6.4,
        windupSec: 0.78,
        activeSec: 0.4,
        rangePx: 240,
        damageMult: 1.45,
        unblockable: true,
        appliesStatus: 'weak_spot_after',
        warningCue: 'UNBLOCKABLE SLAM! Jump or Shift-Dash, then Counter!',
      },
    ],
  },

  // 2. Corrupt Municipal & Provincial Officials
  vice_mayor: {
    enemyKind: 'vice_mayor',
    roleTitle: 'Corrupt Vice Mayor',
    passiveMechanic: 'Wields Chained Corrupt Ledgers and bribes that drain SP.',
    skills: [
      {
        id: 'vm_ledger_whip',
        name: 'Chained Ledger Lash',
        visualKind: 'ledger_chain',
        cooldownSec: 5.4,
        windupSec: 0.72,
        activeSec: 0.4,
        rangePx: 290,
        damageMult: 1.35,
        appliesStatus: 'sp_drain',
        warningCue: 'LEDGER LASH! Block or Jump!',
      },
      {
        id: 'vm_cash_barrage',
        name: 'Kickback Cash Barrage',
        visualKind: 'cash_barrage',
        cooldownSec: 7.4,
        windupSec: 0.68,
        activeSec: 0.52,
        rangePx: 400,
        damageMult: 1.15,
        reflectable: true,
        warningCue: 'CASH BARRAGE! Hold [K] Umbrella Shield!',
      },
    ],
  },

  mayor: {
    enemyKind: 'mayor',
    roleTitle: 'Corrupt Town Mayor',
    passiveMechanic: 'Projects an Approval Shield and slams his Executive Seal for ground shockwaves.',
    skills: [
      {
        id: 'mayor_seal_shockwave',
        name: 'Executive Seal Slam',
        visualKind: 'seal_shockwave',
        cooldownSec: 6.0,
        windupSec: 0.85,
        activeSec: 0.42,
        rangePx: 280,
        damageMult: 1.55,
        unblockable: true,
        appliesStatus: 'weak_spot_after',
        warningCue: 'UNBLOCKABLE SEAL SLAM! Jump to Expose 2.4x Weak Spot!',
      },
      {
        id: 'mayor_decree_beam',
        name: 'Pork-Barrel Decree Beam',
        visualKind: 'decree_beam',
        cooldownSec: 8.6,
        windupSec: 0.92,
        activeSec: 0.55,
        rangePx: 460,
        damageMult: 1.45,
        reflectable: true,
        warningCue: 'DECREE BEAM! Reflect with [K] or Dash Through!',
      },
    ],
  },

  congressman: {
    enemyKind: 'congressman',
    roleTitle: 'Corrupt District Congressman',
    passiveMechanic: 'Rains down Pork-Barrel Cash Barrages and Unblockable Gavel Judgment Slams.',
    skills: [
      {
        id: 'cong_gavel_slam',
        name: 'Congressional Gavel Judgment',
        visualKind: 'gavel_slam',
        cooldownSec: 5.8,
        windupSec: 0.86,
        activeSec: 0.45,
        rangePx: 310,
        damageMult: 1.65,
        unblockable: true,
        appliesStatus: 'weak_spot_after',
        warningCue: 'GAVEL JUDGMENT! Dodge & Punish 2.4x Weak Spot!',
      },
      {
        id: 'cong_cash_barrage',
        name: 'Pork-Barrel Rain',
        visualKind: 'cash_barrage',
        cooldownSec: 7.4,
        windupSec: 0.72,
        activeSec: 0.6,
        rangePx: 460,
        damageMult: 1.3,
        reflectable: true,
        warningCue: 'PORK-BARREL RAIN! Reflect with Umbrella Shield [K]!',
      },
    ],
  },

  // 3. Philippine Folklore Monsters
  aswang: {
    enemyKind: 'aswang',
    roleTitle: 'Bataan Night Aswang',
    passiveMechanic: 'Teleports behind the player at night for a bleeding shadow claw ambush.',
    skills: [
      {
        id: 'aswang_blink_slash',
        name: 'Shadow Blink Claw',
        visualKind: 'shadow_blink_slash',
        cooldownSec: 5.4,
        windupSec: 0.65,
        activeSec: 0.34,
        rangePx: 340,
        damageMult: 1.35,
        appliesStatus: 'bleed',
        warningCue: 'ASWANG BLINK! Turn & Press [K] Shield!',
      },
    ],
  },

  white_lady: {
    enemyKind: 'white_lady',
    roleTitle: 'Balete White Lady',
    passiveMechanic: 'Emits chilling sonic wail rings that slow movement and drain SP.',
    skills: [
      {
        id: 'whitelady_sonic_wail',
        name: 'Haunted Sonic Wail',
        visualKind: 'sonic_wail_ring',
        cooldownSec: 5.8,
        windupSec: 0.76,
        activeSec: 0.5,
        rangePx: 310,
        damageMult: 1.2,
        appliesStatus: 'slow',
        warningCue: 'SONIC WAIL RING! Dash Away or Use White Magic!',
      },
    ],
  },

  tiyanak: {
    enemyKind: 'tiyanak',
    roleTitle: 'Forest Tiyanak',
    passiveMechanic: 'Leaps in rapid erratic arcs aiming to inflict Bleed.',
    skills: [
      {
        id: 'tiyanak_leap_bite',
        name: 'Feral Pounce Bite',
        visualKind: 'tiyanak_lunge',
        cooldownSec: 4.5,
        windupSec: 0.52,
        activeSec: 0.36,
        rangePx: 270,
        damageMult: 1.25,
        appliesStatus: 'bleed',
        warningCue: 'TIYANAK POUNCE! Jump or Counter-Slash!',
      },
    ],
  },

  balete_tree: {
    enemyKind: 'balete_tree',
    roleTitle: 'Haunted Balete Guardian',
    passiveMechanic: 'Summons erupting root spikes beneath the player’s feet.',
    skills: [
      {
        id: 'balete_root_eruption',
        name: 'Cursed Root Eruption',
        visualKind: 'balete_roots',
        cooldownSec: 6.2,
        windupSec: 0.85,
        activeSec: 0.5,
        rangePx: 350,
        damageMult: 1.35,
        unblockable: true,
        appliesStatus: 'slow',
        warningCue: 'GROUND ROOTS! Move Off the Red Cracks!',
      },
    ],
  },

  corrupted_priest: {
    enemyKind: 'corrupted_priest',
    roleTitle: 'Corrupt Cultist / Hexer',
    passiveMechanic: 'Casts homing Kulam Curse Orbs and Usog SP-drain tethers.',
    skills: [
      {
        id: 'cultist_kulam_orb',
        name: 'Kulam Shadow Orb',
        visualKind: 'kulam_curse_orb',
        cooldownSec: 5.4,
        windupSec: 0.72,
        activeSec: 0.45,
        rangePx: 420,
        damageMult: 1.25,
        reflectable: true,
        warningCue: 'KULAM ORB! Reflect with [K] Umbrella Shield!',
      },
      {
        id: 'cultist_usog_tether',
        name: 'Usog Drain Tether',
        visualKind: 'usog_tether',
        cooldownSec: 8.6,
        windupSec: 0.68,
        activeSec: 0.58,
        rangePx: 290,
        damageMult: 1.0,
        appliesStatus: 'sp_drain',
        warningCue: 'USOG TETHER! Dash Out of Range!',
      },
    ],
  },

  // 4. Special Summon & Final Boss
  the_gracias_nomar: {
    enemyKind: 'the_gracias_nomar',
    roleTitle: 'El Mastermind’s Elite Summon',
    passiveMechanic: 'Uses high-speed Shadow Blitzes and raises a Crimson Counter Shield that reflects careless strikes.',
    skills: [
      {
        id: 'nomar_shadow_blitz',
        name: 'Crimson Shadow Blitz',
        visualKind: 'nomar_blitz',
        cooldownSec: 5.0,
        windupSec: 0.68,
        activeSec: 0.42,
        rangePx: 380,
        damageMult: 1.5,
        appliesStatus: 'weak_spot_after',
        warningCue: 'NOMAR SHADOW BLITZ! Block [K] or Dash, then Punish!',
      },
      {
        id: 'nomar_crimson_counter',
        name: 'Crimson Barrier Counter',
        visualKind: 'nomar_counter_shield',
        cooldownSec: 8.8,
        windupSec: 0.55,
        activeSec: 1.15,
        rangePx: 220,
        damageMult: 1.35,
        unblockable: true,
        warningCue: 'COUNTER STANCE! Do NOT Melee — Break with [L] Megaphone!',
      },
    ],
  },

  boss_el_mastermind: {
    enemyKind: 'boss_el_mastermind',
    roleTitle: 'Supreme Syndicate Mastermind',
    passiveMechanic: 'Commands Capitol Crimson Lightning, Pork-Barrel Beams, and summons The Gracias Nomar.',
    skills: [
      {
        id: 'mastermind_capitol_lightning',
        name: 'Capitol Crimson Lightning',
        visualKind: 'mastermind_lightning',
        cooldownSec: 5.8,
        windupSec: 0.88,
        activeSec: 0.5,
        rangePx: 500,
        damageMult: 1.65,
        unblockable: true,
        appliesStatus: 'weak_spot_after',
        warningCue: 'CRIMSON LIGHTNING! Dodge & Punish 2.4x Weak Spot!',
      },
      {
        id: 'mastermind_summon_nomar',
        name: 'Summon: The Gracias Nomar',
        visualKind: 'mastermind_summon',
        cooldownSec: 22.0,
        windupSec: 1.05,
        activeSec: 0.8,
        rangePx: 620,
        damageMult: 0,
        summonsNomar: true,
        warningCue: 'EL MASTERMIND SUMMONS THE GRACIAS NOMAR!',
      },
    ],
  },
};

/**
 * Maps any in-game mob/boss kind (including street variants & town bosses) to its signature tactical kit.
 */
export function resolveEnemyKitKey(kind: string, bossRoleOrId?: string): string {
  if (bossRoleOrId) {
    const low = bossRoleOrId.toLowerCase();
    if (low.includes('mastermind')) return 'boss_el_mastermind';
    if (low.includes('nomar')) return 'the_gracias_nomar';
    if (low.includes('congress')) return 'congressman';
    if (low.includes('captain')) return 'barangay_captain';
    if (low === 'vice_mayor' || low.startsWith('vm_')) return 'vice_mayor';
    if (low === 'mayor' || low.startsWith('mayor_')) return 'mayor';
  }

  switch (kind) {
    case 'corrupt_police':
      return 'corrupt_police';
    case 'corrupt_soldier':
      return 'corrupt_soldier';
    case 'thief':
    case 'robber':
    case 'bad_guy':
    case 'bad_woman':
    case 'bully_kid':
      return 'barangay_tanod';
    case 'fat_guy':
      return 'barangay_captain';
    case 'corrupt_politician':
      return 'vice_mayor';
    case 'evil_pastor':
    case 'corrupted_priest':
      return 'corrupted_priest';
    case 'aswang':
      return 'aswang';
    case 'white_lady':
      return 'white_lady';
    case 'tiyanak':
    case 'asong_ulol':
    case 'cobra':
    case 'insekto':
      return 'tiyanak';
    case 'balete_tree':
      return 'balete_tree';
    default:
      return UNIQUE_ENEMY_KITS[kind] ? kind : 'barangay_tanod';
  }
}

export function getEnemySkillKit(kind: string, bossRoleOrId?: string): EnemyUniqueKit {
  const key = resolveEnemyKitKey(kind, bossRoleOrId);
  return UNIQUE_ENEMY_KITS[key] || UNIQUE_ENEMY_KITS.barangay_tanod;
}
