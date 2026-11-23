import { GAME_CONFIG } from './gameConfig';

export type MagicSchool = 'white_magic' | 'black_magic';

export interface SkillBuffSpec {
  stat: 'atk_up' | 'def_up' | 'speed_up' | 'lucky_drop';
  label: string;
  multiplier: number;
  durationSec: number;
}

export interface MagicSkillDef {
  id: string;
  name: string;
  filipinoTitle: string;
  school: MagicSchool;
  mentorName: 'Albularyo' | 'Mangkukulam';
  requiredLevel: number;
  spCost: number;
  cooldownSec: number;
  hotkey: string;
  powerMultiplier: number;
  healAmount?: number;
  durationSec?: number;
  buff?: SkillBuffSpec | null;
  effectKind:
    | 'tawas_shield'
    | 'herbal_banig'
    | 'agimat_nova'
    | 'bathala_dawn'
    | 'kulam_hex'
    | 'usog_drain'
    | 'barang_swarm'
    | 'abyssal_eclipse';
  description: string;
}

export interface RpgStatAllocation {
  str: number; // +3 ATK, +1% Crit Damage per point
  vit: number; // +22 Max HP, +1 DEF per point
  agi: number; // +0.6% Crit Chance, +3 Speed per point
  int: number; // +15 Max SP, +4% White/Black Magic Power per point
}

export function createDefaultStatAllocation(): RpgStatAllocation {
  return { str: 0, vit: 0, agi: 0, int: 0 };
}

const S = GAME_CONFIG.skills;

export const MAGIC_SKILLS: MagicSkillDef[] = [
  // ================= ALBULARYO (WHITE MAGIC & BUFFS) =================
  {
    id: 'wm_lv30_tawas',
    name: 'Tawas Iron Ward',
    filipinoTitle: 'Suob at Tawas (DEF Buff)',
    school: 'white_magic',
    mentorName: 'Albularyo',
    requiredLevel: S.wm_lv30_tawas.unlockLevel,
    spCost: S.wm_lv30_tawas.spCost,
    cooldownSec: S.wm_lv30_tawas.cooldownSec,
    hotkey: '1',
    powerMultiplier: 0.9,
    healAmount: 75,
    durationSec: S.wm_lv30_tawas.buff.durationSec,
    buff: S.wm_lv30_tawas.buff,
    effectKind: 'tawas_shield',
    description:
      'Unlocks at Lv.5. Cleanses Poison/Shadow, restores HP, and grants +35% DEF for 3 minutes (re-casting refreshes duration).',
  },
  {
    id: 'wm_lv50_banig',
    name: 'Herbal Wind Surge',
    filipinoTitle: 'Buhay-Lupa (Speed + Heal Buff)',
    school: 'white_magic',
    mentorName: 'Albularyo',
    requiredLevel: S.wm_lv50_banig.unlockLevel,
    spCost: S.wm_lv50_banig.spCost,
    cooldownSec: S.wm_lv50_banig.cooldownSec,
    hotkey: '2',
    powerMultiplier: 1.2,
    healAmount: 145,
    durationSec: S.wm_lv50_banig.buff.durationSec,
    buff: S.wm_lv50_banig.buff,
    effectKind: 'herbal_banig',
    description:
      'Unlocks at Lv.10. Restores Hero HP and grants +28% Movement Speed for 2 minutes while searing nearby folklore foes.',
  },
  {
    id: 'wm_lv70_agimat',
    name: 'Agimat Solar Strike',
    filipinoTitle: 'Sinag ng Walong Araw',
    school: 'white_magic',
    mentorName: 'Albularyo',
    requiredLevel: S.wm_lv70_agimat.unlockLevel,
    spCost: S.wm_lv70_agimat.spCost,
    cooldownSec: S.wm_lv70_agimat.cooldownSec,
    hotkey: '3',
    powerMultiplier: 2.6,
    buff: null,
    effectKind: 'agimat_nova',
    description:
      'Unlocks at Lv.22. Releases a piercing golden solar burst that shatters enemy shields and stuns corrupt foes.',
  },
  {
    id: 'wm_lv100_bathala',
    name: "Bathala's Dawn Blessing",
    filipinoTitle: 'Liwanag ng Bataan (Lucky Drop Buff)',
    school: 'white_magic',
    mentorName: 'Albularyo',
    requiredLevel: S.wm_lv100_bathala.unlockLevel,
    spCost: S.wm_lv100_bathala.spCost,
    cooldownSec: S.wm_lv100_bathala.cooldownSec,
    hotkey: '4',
    powerMultiplier: 3.9,
    healAmount: 360,
    durationSec: S.wm_lv100_bathala.buff.durationSec,
    buff: S.wm_lv100_bathala.buff,
    effectKind: 'bathala_dawn',
    description:
      'Unlocks at Lv.45. Calls down radiant sunrise energy for heavy holy damage, large heal, and +50% Lucky Drop & Pesos for 5 minutes!',
  },

  // ================= MANGKUKULAM (BLACK MAGIC & OFFENSE BUFFS) =================
  {
    id: 'bm_lv30_kulam',
    name: 'Kulam Fury Chant',
    filipinoTitle: 'Bagsik ng Anino (ATK Buff)',
    school: 'black_magic',
    mentorName: 'Mangkukulam',
    requiredLevel: S.bm_lv30_kulam.unlockLevel,
    spCost: S.bm_lv30_kulam.spCost,
    cooldownSec: S.bm_lv30_kulam.cooldownSec,
    hotkey: '5',
    powerMultiplier: 1.5,
    durationSec: S.bm_lv30_kulam.buff.durationSec,
    buff: S.bm_lv30_kulam.buff,
    effectKind: 'kulam_hex',
    description:
      'Unlocks at Lv.16. Pierces nearby foes with cursed needles and empowers the Defender with +28% ATK for 2 minutes.',
  },
  {
    id: 'bm_lv50_usog',
    name: 'Usog Soul Drain',
    filipinoTitle: 'Higop-Lakas ng Anino',
    school: 'black_magic',
    mentorName: 'Mangkukulam',
    requiredLevel: S.bm_lv50_usog.unlockLevel,
    spCost: S.bm_lv50_usog.spCost,
    cooldownSec: S.bm_lv50_usog.cooldownSec,
    hotkey: '6',
    powerMultiplier: 2.15,
    healAmount: 165,
    buff: null,
    effectKind: 'usog_drain',
    description:
      'Unlocks at Lv.28. Binds nearby enemies in dark violet energy, draining their HP directly back into the Hero.',
  },
  {
    id: 'bm_lv70_barang',
    name: 'Barang Shadow Swarm',
    filipinoTitle: 'Itim na Insekto at Usok',
    school: 'black_magic',
    mentorName: 'Mangkukulam',
    requiredLevel: S.bm_lv70_barang.unlockLevel,
    spCost: S.bm_lv70_barang.spCost,
    cooldownSec: S.bm_lv70_barang.cooldownSec,
    hotkey: '7',
    powerMultiplier: 2.95,
    durationSec: 6,
    buff: null,
    effectKind: 'barang_swarm',
    description:
      'Unlocks at Lv.35. Unleashes a cursed shadow vortex that damages enemies in range and lowers their DEF by 35%.',
  },
  {
    id: 'bm_lv100_eclipse',
    name: 'Hukom ng Kadiliman',
    filipinoTitle: 'Abyssal Kulam Eclipse (Ultimate)',
    school: 'black_magic',
    mentorName: 'Mangkukulam',
    requiredLevel: S.bm_lv100_eclipse.unlockLevel,
    spCost: S.bm_lv100_eclipse.spCost,
    cooldownSec: S.bm_lv100_eclipse.cooldownSec,
    hotkey: '8',
    powerMultiplier: 4.8,
    buff: null,
    effectKind: 'abyssal_eclipse',
    description:
      'Unlocks at Lv.60. Summons a compact crimson-violet Kulam Eclipse sigil that deals devastating dark damage to corrupt bosses.',
  },
];

export function isSkillUnlockedForLevel(skill: MagicSkillDef, playerLevel: number): boolean {
  return playerLevel >= skill.requiredLevel;
}

export function getAvailableStatPoints(level: number, allocated: RpgStatAllocation): number {
  const totalEarned = Math.max(0, (level - 1) * 3); // 3 Stat Points per level up
  const used = allocated.str + allocated.vit + allocated.agi + allocated.int;
  return Math.max(0, totalEarned - used);
}

export function computeMagicDamage(
  baseAtk: number,
  intPoints: number,
  skill: MagicSkillDef
): number {
  const magicBonus = 1 + intPoints * 0.04;
  return Math.round(baseAtk * skill.powerMultiplier * magicBonus);
}

export function getMagicSkillById(id: string): MagicSkillDef | undefined {
  return MAGIC_SKILLS.find((s) => s.id === id);
}

export function getMagicSkillIconKey(skillId: string): string {
  return `icon_${skillId}`;
}

export function getMagicSkillVfxKey(effectKind: MagicSkillDef['effectKind']): string {
  return `vfx_${effectKind}`;
}
