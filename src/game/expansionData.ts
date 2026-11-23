import { BossProfile } from './bataanData';
import { PlayerProgress, RpgGearItem, VoiceProfile, ZoneId } from './types';

// ================= BICYCLE COSMETICS (BIKE SKINS) =================
export interface BikeSkinDef {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Relic';
  description: string;
  unlockHint: string;
  frameColor: string;
  frameHighlight: string;
  rimColor: string;
  headlightColor: string;
  basketAccent: string;
  trailColor: string | null;
}

export const BIKE_SKINS: BikeSkinDef[] = [
  {
    id: 'bike_classic_green',
    name: 'Classic Defender Green',
    rarity: 'Common',
    description: 'The iconic Bataan Hero Defender forest-green steel road bike with front evidence basket.',
    unlockHint: 'Default Bike Skin',
    frameColor: '#2E7D47',
    frameHighlight: '#5EEB8A',
    rimColor: '#CBD5E1',
    headlightColor: '#FEF08A',
    basketAccent: '#C9975B',
    trailColor: null,
  },
  {
    id: 'bike_patrol_sidecar',
    name: 'Bantay Patrol Sidecar',
    rarity: 'Rare',
    description: 'Custom Bataan patrol bike with aligned sidecar where loyal Aspin Bantay rides shotgun!',
    unlockHint: 'Unlocked via Achievement: Master Bataan Cyclist (or Buy at Kuya Rico Talyer)',
    frameColor: '#1D4ED8',
    frameHighlight: '#93C5FD',
    rimColor: '#F4C542',
    headlightColor: '#60A5FA',
    basketAccent: '#F59E0B',
    trailColor: 'rgba(96, 165, 250, 0.55)',
  },
  {
    id: 'bike_jeepney_gold',
    name: 'Jeepney Chrome & Gold',
    rarity: 'Rare',
    description: 'Polished stainless frame with Philippine jeepney chrome rims and blazing golden beam.',
    unlockHint: 'Unlock via Achievement: Dream Breaker (Clear Credits)',
    frameColor: '#D4AF37',
    frameHighlight: '#FFF3B0',
    rimColor: '#F8FAFC',
    headlightColor: '#FDE047',
    basketAccent: '#DC2626',
    trailColor: 'rgba(244, 197, 66, 0.55)',
  },
  {
    id: 'bike_patrol_blue',
    name: 'Honest Patrol Tactical Blue',
    rarity: 'Rare',
    description: 'Midnight-blue pursuit frame gifted by PO2 Clara and Sgt. Reyes with crisp blue-gold trim.',
    unlockHint: 'Unlock via Achievement: Bullet Deflector (Reflect 5 Bullets)',
    frameColor: '#1E40AF',
    frameHighlight: '#60A5FA',
    rimColor: '#93C5FD',
    headlightColor: '#38BDF8',
    basketAccent: '#F4C542',
    trailColor: 'rgba(56, 189, 248, 0.5)',
  },
  {
    id: 'bike_katipunan_crimson',
    name: 'Katipunan Crimson Flash',
    rarity: 'Epic',
    description: 'Blazing red revolutionary steel with white sunburst spokes and ember trails.',
    unlockHint: 'Unlock via Achievement: Corrupt Captain Exposed',
    frameColor: '#B91C1C',
    frameHighlight: '#F87171',
    rimColor: '#FEF3C7',
    headlightColor: '#FBBF24',
    basketAccent: '#F4C542',
    trailColor: 'rgba(239, 68, 68, 0.55)',
  },
  {
    id: 'bike_dambana_sunburst',
    name: 'Dambana Dawn Sovereign',
    rarity: 'Relic',
    description: 'Awakened radiant pearl-and-gold frame forged for champions who defeated the Corrupt Congressman.',
    unlockHint: 'Unlock via Achievement: Pork Barrel Dismantled',
    frameColor: '#F4C542',
    frameHighlight: '#FFFFFF',
    rimColor: '#FDE68A',
    headlightColor: '#FFFFFF',
    basketAccent: '#2563EB',
    trailColor: 'rgba(255, 240, 179, 0.72)',
  },
];

export function migrateBikeSkinId(id?: string | null): string {
  if (!id) return 'bike_classic_green';
  if (BIKE_SKINS.some((s) => s.id === id)) return id;
  // Smooth save migration from removed skins to closest curated match
  if (id === 'bike_natib_hunter' || id === 'bike_spectral_hero') return 'bike_patrol_blue';
  if (id === 'bike_sun_sea_racer') return 'bike_jeepney_gold';
  if (id === 'bike_overlord_cruiser') return 'bike_katipunan_crimson';
  return 'bike_classic_green';
}

export function migrateBikeSkinList(ids?: string[] | null): string[] {
  const valid = new Set<string>(['bike_classic_green']);
  if (Array.isArray(ids)) {
    for (const raw of ids) {
      valid.add(migrateBikeSkinId(raw));
    }
  }
  return Array.from(valid);
}

export function getBikeSkinById(id?: string | null): BikeSkinDef {
  const migrated = migrateBikeSkinId(id);
  return BIKE_SKINS.find((s) => s.id === migrated) || BIKE_SKINS[0];
}

// ================= CULTURAL RELICS & SPECIAL AWAKENED COSMETICS =================
export const CULTURAL_AND_AWAKENED_GEAR: RpgGearItem[] = [
  // Legendary Philippine Cultural Relics gifted by Spectral National Hero Ghosts
  {
    id: 'wpn_la_pluma',
    slot: 'weapon',
    name: 'La Pluma (Rizal’s Golden Quill)',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#F4C542',
    accentColor: '#5EEAD4',
    weaponStyle: 'la_pluma',
    bonusAtk: 26,
    bonusSp: 35,
    bonusSpRegen: 3.2,
    bonusCrit: 0.14,
    description:
      'Gifted by the Ghost of Dr. José Rizal. Each strike launches an ink-light truth wave that pierces corrupt defenses!',
    statNote: '+26 ATK · +35 SP · Fires Ink-Light Wave on Strike',
    shopSource: 'drop',
  },
  {
    id: 'wpn_bolo_katipunan',
    slot: 'weapon',
    name: 'Bolo ng Katipunan',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#E2E8F0',
    accentColor: '#DC2626',
    weaponStyle: 'bolo_katipunan',
    bonusAtk: 34,
    bonusCrit: 0.2,
    description:
      'Andres Bonifacio’s legendary curved Philippine cultural sword. Cleaves wide and shatters enemy Riot Shields with raw courage!',
    statNote: '+34 ATK · +20% Crit · Bonus Shield Shatter',
    shopSource: 'drop',
  },
  {
    id: 'wpn_kampilan',
    slot: 'weapon',
    name: 'Kampilan of Lapulapu',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#F1F5F9',
    accentColor: '#F4C542',
    weaponStyle: 'kampilan',
    bonusAtk: 38,
    bonusHp: 45,
    bonusCrit: 0.16,
    description:
      'Ancient forked-tip Philippine cultural greatblade gifted by the Spirit of Lapulapu. Massive reach and crushing boss damage.',
    statNote: '+38 ATK · +45 HP · Extended Cultural Cleave',
    shopSource: 'drop',
  },
  {
    id: 'wpn_sable_luna',
    slot: 'weapon',
    name: 'Sable ni Heneral Luna',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#CBD5E1',
    accentColor: '#2563EB',
    weaponStyle: 'sable_luna',
    bonusAtk: 32,
    bonusSpeed: 0.14,
    bonusCrit: 0.18,
    description:
      'General Antonio Luna’s officer saber. Amplifies Umbrella bullet deflections and accelerates dash combos.',
    statNote: '+32 ATK · +14% Speed · 2.5x Bullet Deflect Power',
    shopSource: 'drop',
  },
  {
    id: 'acc_gabriela_talisman',
    slot: 'accessory',
    name: 'Talisman of Gabriela Silang',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#5EEAD4',
    accentColor: '#F4C542',
    bonusHp: 60,
    bonusDef: 10,
    bonusCrit: 0.15,
    bonusSpeed: 0.1,
    description:
      'Radiant spectral charm bestowed by Gabriela Silang. Shields the Hero Defender against Awakened gunfire and curses.',
    statNote: '+60 HP · +10 DEF · +15% Crit · +10% Speed',
    shopSource: 'drop',
  },

  // Special Unlockable Character Cosmetics (Achievements & Awakened Bosses)
  {
    id: 'outfit_awakened_barong',
    slot: 'outfit',
    name: 'Awakened Golden Barong',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#F4C542',
    accentColor: '#1E3A5F',
    outfitStyle: 'barong',
    bonusHp: 75,
    bonusDef: 14,
    bonusAtk: 14,
    description:
      'Special cosmetic unlocked after waking up from the dream into Awakened Mode. Gleams with Bataan dawn embroidery.',
    statNote: '+75 HP · +14 DEF · +14 ATK',
    shopSource: 'drop',
  },
  {
    id: 'back_katipunero_cloak',
    slot: 'back',
    name: 'Spectral Katipunero Cloak',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#B91C1C',
    accentColor: '#F4C542',
    backStyle: 'sun_mantle',
    bonusAtk: 14,
    bonusSpeed: 0.12,
    bonusCrit: 0.1,
    description:
      'Flowing crimson revolutionary cape unlocked by defeating the Corrupt Barangay Captain in Awakened Mode.',
    statNote: '+14 ATK · +12% Speed · +10% Crit',
    shopSource: 'drop',
  },
  {
    id: 'head_hero_laurels',
    slot: 'headgear',
    name: 'Crown of Bataan Dawn Laurels',
    rarity: 'Relic',
    price: 0,
    sellValue: 0,
    primaryColor: '#F4C542',
    accentColor: '#5EEAD4',
    headgearStyle: 'circlet',
    bonusHp: 55,
    bonusAtk: 12,
    bonusSp: 40,
    description:
      'Special relic headgear unlocked by dismantling the Corrupt Congressman in Awakened Mode.',
    statNote: '+55 HP · +12 ATK · +40 SP',
    shopSource: 'drop',
  },
  {
    id: 'outfit_tactical_defender',
    slot: 'outfit',
    name: 'Honest Force Tactical Coat',
    rarity: 'Epic',
    price: 0,
    sellValue: 0,
    primaryColor: '#1E3A5F',
    accentColor: '#38BDF8',
    outfitStyle: 'armor_coat',
    bonusHp: 65,
    bonusDef: 15,
    bonusSp: 25,
    description:
      'Special bulletproof patrol coat awarded for mastering Shield Breaks and standing with Honest Police & Soldiers.',
    statNote: '+65 HP · +15 DEF · +25 SP',
    shopSource: 'drop',
  },
];

// ================= RARE SPECTRAL NATIONAL HERO GHOSTS =================
export interface HeroGhostDef {
  id: string;
  name: string;
  title: string;
  era: string;
  gender: 'male' | 'female';
  shrineZoneId?: ZoneId; // Guaranteed manifestation zone
  coatColor: string;
  accentColor: string;
  weaponStyle: 'la_pluma' | 'bolo_katipunan' | 'kampilan' | 'sable_luna' | 'talisman';
  rewardGearId: string;
  rewardName: string;
  blessingQuote: string;
  repeatQuote: string;
  voiceProfile: VoiceProfile;
}

export const NATIONAL_HERO_GHOSTS: HeroGhostDef[] = [
  {
    id: 'ghost_rizal',
    name: 'Spirit of Dr. José Rizal',
    title: 'National Hero · The Pen Mightier Than Tyranny',
    era: '1861–1896',
    gender: 'male',
    shrineZoneId: 'abucay', // St. Dominic Parish Historic Shrine
    coatColor: '#1E293B',
    accentColor: '#5EEAD4',
    weaponStyle: 'la_pluma',
    rewardGearId: 'wpn_la_pluma',
    rewardName: 'La Pluma (Rizal’s Golden Quill)',
    blessingQuote:
      'My young Defender of Bataan, the youth remain the fair hope of our motherland. Take La Pluma—let every stroke write truth against corruption!',
    repeatQuote:
      'Keep your mind sharp and your heart fearless, Defender. Truth illuminates even the darkest capitol.',
    voiceProfile: { pitch: 0.94, rate: 0.95, style: 'hero_ghost_male' },
  },
  {
    id: 'ghost_bonifacio',
    name: 'Spirit of Andres Bonifacio',
    title: 'Supremo of the Katipunan',
    era: '1863–1897',
    gender: 'male',
    shrineZoneId: 'pilar', // Mt. Samat Dambana ng Kagitingan Shrine
    coatColor: '#F8FAFC',
    accentColor: '#DC2626',
    weaponStyle: 'bolo_katipunan',
    rewardGearId: 'wpn_bolo_katipunan',
    rewardName: 'Bolo ng Katipunan',
    blessingQuote:
      'Stand tall, child of Bataan! When tyrants hide behind armed guards and stolen wealth, answer with unbreakable courage. Wield my Bolo ng Katipunan!',
    repeatQuote:
      'Shatter their shields and never bow to greed! The spirit of the Katipunan rides with you!',
    voiceProfile: { pitch: 0.86, rate: 0.98, style: 'hero_ghost_male' },
  },
  {
    id: 'ghost_luna',
    name: 'Spirit of Gen. Antonio Luna',
    title: 'Commander of Discipline & Strategy',
    era: '1866–1899',
    gender: 'male',
    shrineZoneId: 'mariveles', // Death March KM 0 Historic Shrine
    coatColor: '#1E3A5F',
    accentColor: '#F4C542',
    weaponStyle: 'sable_luna',
    rewardGearId: 'wpn_sable_luna',
    rewardName: 'Sable ni Heneral Luna',
    blessingQuote:
      'Discipline wins wars, Defender! Watch the enemy’s laser aim, deflect their bullets right back at them, and strike with my Cavalry Saber!',
    repeatQuote:
      'Nation before self! Keep your Umbrella Shield ready and break every corrupt formation!',
    voiceProfile: { pitch: 0.82, rate: 1.0, style: 'hero_ghost_male' },
  },
  {
    id: 'ghost_lapulapu',
    name: 'Spirit of Datu Lapulapu',
    title: 'First Defender of the Islands',
    era: '1521',
    gender: 'male',
    coatColor: '#92400E',
    accentColor: '#F4C542',
    weaponStyle: 'kampilan',
    rewardGearId: 'wpn_kampilan',
    rewardName: 'Kampilan of Lapulapu',
    blessingQuote:
      'No invader and no corrupt lord shall claim our shores! Take the Kampilan—carve through their ranks with the strength of our ancestors!',
    repeatQuote:
      'Let the waves of Bataan roar with your bravery, Hero Defender!',
    voiceProfile: { pitch: 0.8, rate: 0.94, style: 'hero_ghost_male' },
  },
  {
    id: 'ghost_gabriela',
    name: 'Spirit of Gabriela Silang',
    title: 'Fearless General of Freedom',
    era: '1731–1763',
    gender: 'female',
    coatColor: '#F8FAFC',
    accentColor: '#5EEAD4',
    weaponStyle: 'talisman',
    rewardGearId: 'acc_gabriela_talisman',
    rewardName: 'Talisman of Gabriela Silang',
    blessingQuote:
      'Rise without hesitation, Bataan Defender! Even in your toughest awakened battles, wear my Talisman and ride swiftly for the people!',
    repeatQuote:
      'Courage knows no fear and no limit. Protect every barangay with honor!',
    voiceProfile: { pitch: 1.12, rate: 0.98, style: 'hero_ghost_female' },
  },
];

// ================= AWAKENED-MODE EXCLUSIVE BOSSES =================
export interface AwakenedBossDef {
  id: 'awakened_barangay_captain' | 'awakened_congressman';
  zoneId: ZoneId;
  spawnX: number;
  name: string;
  title: string;
  hp: number;
  atk: number;
  shieldMax: number;
  usesGun: boolean;
  rewardPesos: number;
  rewardXp: number;
  rewardGearId: string;
  achievementId: string;
  introQuote: string;
  defeatQuote: string;
  profile: BossProfile;
}

export const AWAKENED_BOSSES: AwakenedBossDef[] = [
  {
    id: 'awakened_barangay_captain',
    zoneId: 'dinalupihan',
    spawnX: 4620,
    name: 'Kapitan Bruno "Kotong" Magtanggol',
    title: 'Awakened Boss · Corrupt Barangay Captain',
    hp: 2100,
    atk: 30,
    shieldMax: 160,
    usesGun: true,
    rewardPesos: 900,
    rewardXp: 520,
    rewardGearId: 'back_katipunero_cloak',
    achievementId: 'ach_corrupt_captain',
    introQuote:
      'You woke up from your dream only to cross MY barangay checkpoint? Guards, raise the Riot Barrier—no one passes without paying tribute!',
    defeatQuote:
      'My checkpoint! My barangay funds! How did you shatter my Riot Shield?!',
    profile: {
      id: 'awakened_barangay_captain',
      title: 'Corrupt Barangay Captain',
      name: 'Kapitan Bruno "Kotong" Magtanggol',
      gender: 'male',
      hp: 2100,
      dropId: 'drop_awakened_captain',
      dropName: 'Barangay Extortion Ledger',
      appearance: {
        skinTone: '#D49B6A',
        hairStyle: 'crew_cut',
        hairColor: '#222226',
        facialFeature: 'thick_mustache_and_gold_chain',
        outfit: 'crimson_captain_vest',
        outfitColor: '#7F1D1D',
        prop: 'riot_shield_and_pistol',
        build: 'heavy',
        ageGroup: 'middle',
      },
    },
  },
  {
    id: 'awakened_congressman',
    zoneId: 'balanga',
    spawnX: 5060,
    name: 'Cong. Don Aurelio "Pork Barrel" Villafuerte',
    title: 'Awakened Boss · Corrupt Congressman',
    hp: 3600,
    atk: 40,
    shieldMax: 240,
    usesGun: true,
    rewardPesos: 1600,
    rewardXp: 900,
    rewardGearId: 'head_hero_laurels',
    achievementId: 'ach_corrupt_congressman',
    introQuote:
      'So the dreamer finally woke up! I control the District Pork Barrel and the corrupted escorts. Try breaking my Immunity Shield while dodging rifle fire!',
    defeatQuote:
      'Impossible! My Congressional Immunity... my armored escorts... Bataan truly belongs to the Defender!',
    profile: {
      id: 'awakened_congressman',
      title: 'Corrupt Congressman',
      name: 'Cong. Don Aurelio "Pork Barrel" Villafuerte',
      gender: 'male',
      hp: 3600,
      dropId: 'drop_awakened_congressman',
      dropName: 'District Pork Barrel Blueprint',
      appearance: {
        skinTone: '#E0AC7E',
        hairStyle: 'gray_side_part',
        hairColor: '#64748B',
        facialFeature: 'gold_glasses_and_smirk',
        outfit: 'navy_congress_suit',
        outfitColor: '#1E1B4B',
        prop: 'tactical_carbine_and_ledger',
        build: 'heavy',
        ageGroup: 'senior',
      },
    },
  },
];

// ================= ACHIEVEMENTS SYSTEM =================
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardLabel: string;
  rewardGearId?: string;
  rewardBikeSkinId?: string;
  rewardPesos?: number;
  check: (p: PlayerProgress) => boolean;
  progressText: (p: PlayerProgress) => string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_first_steps',
    title: 'Bataan Defender Rises',
    description: 'Complete the Prologue at Defender Home and earn your Defender Umbrella.',
    rewardLabel: '+₱200 Bonus',
    rewardPesos: 200,
    check: (p) => p.completedChapterIds.includes('ch0_home'),
    progressText: (p) => (p.completedChapterIds.includes('ch0_home') ? '1/1' : '0/1'),
  },
  {
    id: 'ach_dream_breaker',
    title: 'Ahh... Time to Wake Up!',
    description: 'Defeat El Mastermind, watch Juan.exe’s Credits, and wake up into Awakened Mode.',
    rewardLabel: 'Awakened Golden Barong + Jeepney Chrome Bike Skin',
    rewardGearId: 'outfit_awakened_barong',
    rewardBikeSkinId: 'bike_jeepney_gold',
    check: (p) => p.awakenedCount >= 1,
    progressText: (p) => (p.awakenedCount >= 1 ? 'Awakened' : '0/1'),
  },
  {
    id: 'ach_juan_champion',
    title: 'Juan.exe’s Champion',
    description: 'Defeat El Mastermind at the Bataan Provincial Capitol.',
    rewardLabel: '+₱500 + Syndicate Overlord Cruiser Skin',
    rewardBikeSkinId: 'bike_overlord_cruiser',
    rewardPesos: 500,
    check: (p) => p.bossProgression.elMastermindDefeated || p.awakenedCount >= 1,
    progressText: (p) => (p.bossProgression.elMastermindDefeated || p.awakenedCount >= 1 ? '1/1' : '0/1'),
  },
  {
    id: 'ach_corrupt_captain',
    title: 'Corrupt Captain Exposed',
    description: 'Defeat Awakened Boss Kapitan Bruno "Kotong" Magtanggol in Dinalupihan.',
    rewardLabel: 'Spectral Katipunero Cloak + Katipunan Crimson Bike Skin',
    rewardGearId: 'back_katipunero_cloak',
    rewardBikeSkinId: 'bike_katipunan_crimson',
    check: (p) => p.awakenedBossesDefeated.includes('awakened_barangay_captain'),
    progressText: (p) => (p.awakenedBossesDefeated.includes('awakened_barangay_captain') ? '1/1' : '0/1'),
  },
  {
    id: 'ach_corrupt_congressman',
    title: 'Pork Barrel Dismantled',
    description: 'Defeat Awakened Boss Cong. Don Aurelio Villafuerte in Balanga City.',
    rewardLabel: 'Dawn Laurels Crown + Dambana Sunburst Bike Skin',
    rewardGearId: 'head_hero_laurels',
    rewardBikeSkinId: 'bike_dambana_sunburst',
    check: (p) => p.awakenedBossesDefeated.includes('awakened_congressman'),
    progressText: (p) => (p.awakenedBossesDefeated.includes('awakened_congressman') ? '1/1' : '0/1'),
  },
  {
    id: 'ach_bullet_deflector',
    title: 'Bullet Deflector',
    description: 'Use the Umbrella Shield [K] to reflect 5 enemy bullets back at corrupted gunmen.',
    rewardLabel: 'Honest Patrol Blue Bike Skin',
    rewardBikeSkinId: 'bike_patrol_blue',
    check: (p) => p.deflectedBulletsCount >= 5,
    progressText: (p) => `${Math.min(5, p.deflectedBulletsCount)}/5`,
  },
  {
    id: 'ach_shield_breaker',
    title: 'Voice of Accountability',
    description: 'Shatter 5 enemy Riot or Bureaucracy Shields using Whistle/Megaphone [L].',
    rewardLabel: 'Honest Force Tactical Coat',
    rewardGearId: 'outfit_tactical_defender',
    check: (p) => p.shieldsBrokenCount >= 5,
    progressText: (p) => `${Math.min(5, p.shieldsBrokenCount)}/5`,
  },
  {
    id: 'ach_ghost_whisperer',
    title: 'Ghost Whisperer',
    description: 'Meet 2 Spectral Philippine National Heroes across Bataan.',
    rewardLabel: '+₱500 + Bantay Patrol Sidecar Skin',
    rewardBikeSkinId: 'bike_patrol_sidecar',
    rewardPesos: 500,
    check: (p) => p.metHeroGhostIds.length >= 2,
    progressText: (p) => `${Math.min(2, p.metHeroGhostIds.length)}/2`,
  },
  {
    id: 'ach_cultural_collector',
    title: 'Keeper of Philippine Relics',
    description: 'Receive all 5 Cultural Relics from the Spectral National Hero Ghosts.',
    rewardLabel: '+₱1,000 Heritage Grant',
    rewardPesos: 1000,
    check: (p) => p.metHeroGhostIds.length >= 5,
    progressText: (p) => `${Math.min(5, p.metHeroGhostIds.length)}/5`,
  },
  {
    id: 'ach_honest_force',
    title: 'Honest Force Alliance',
    description: 'Befriend PO2 Clara (Honest Police) or Sgt. Reyes (Bataan Soldier) to Rank 2.',
    rewardLabel: '+₱350 + Honest Patrol Blue Bike Skin',
    rewardBikeSkinId: 'bike_patrol_blue',
    rewardPesos: 350,
    check: (p) =>
      (p.friendBonds.friend_po2_clara || 0) >= 60 || (p.friendBonds.friend_sgt_reyes || 0) >= 60,
    progressText: (p) =>
      (p.friendBonds.friend_po2_clara || 0) >= 60 || (p.friendBonds.friend_sgt_reyes || 0) >= 60
        ? 'Rank 2+'
        : '0/1',
  },
  {
    id: 'ach_full_evidence',
    title: '24/24 Provincial Prosecutor',
    description: 'Collect all 24 Evidence Drops from every Mayor and Vice Mayor in Bataan.',
    rewardLabel: '+₱800 Civic Reward',
    rewardPesos: 800,
    check: (p) => p.bossProgression.collectedDrops.length >= 24,
    progressText: (p) => `${Math.min(24, p.bossProgression.collectedDrops.length)}/24`,
  },
  {
    id: 'ach_master_cyclist',
    title: 'Master Bataan Cyclist',
    description: 'Own the Green Bicycle and unlock at least 2 Bicycle Cosmetics.',
    rewardLabel: '+₱400 + Bantay Patrol Sidecar Skin',
    rewardBikeSkinId: 'bike_patrol_sidecar',
    rewardPesos: 400,
    check: (p) => p.hasBike && p.unlockedBikeSkinIds.length >= 2,
    progressText: (p) => `${Math.min(2, p.unlockedBikeSkinIds.length)}/2 Skins`,
  },
];
