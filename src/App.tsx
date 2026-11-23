/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssetLoadingScreen } from './components/AssetLoadingScreen';
import { CreditsScreen, DreamWakeupScreen } from './components/CreditsAndWakeup';
import { GameCanvas } from './components/GameCanvas';
import { GameHud } from './components/GameHud';
import { Modals } from './components/Modals';
import { StoryIntro } from './components/StoryIntro';
import { TitleScreen } from './components/TitleScreen';
import { AssetPreloadProgress, preloadAllGameAssets } from './game/assetPreloader';
import { BGM_TRACK_LABELS, englishVoice, noirAudio } from './game/audio';
import {
  BossProfile,
  BossRole,
  getFinalBossProgress,
  handleTownBossDefeated as applyTownBossVictory,
  INITIAL_BOSS_STATE,
} from './game/bataanData';
import {
  ACHIEVEMENTS,
  AchievementDef,
  migrateBikeSkinId,
  migrateBikeSkinList,
  NATIONAL_HERO_GHOSTS,
} from './game/expansionData';
import {
  COOKING_RECIPES,
  GAME_CONFIG,
  getFishById,
  getMaterialById,
} from './game/gameConfig';
import { createDefaultStatAllocation, getAvailableStatPoints, getMagicSkillById } from './game/magicSkillsData';
import { isTimeNight } from './game/noirRenderer';
import {
  ActiveModal,
  ActiveSideJobState,
  DerivedStats,
  GameScreen,
  HudSnapshot,
  PlayerProgress,
  RpgStatAllocation,
  WorldBridge,
  ZoneId,
} from './game/types';
import {
  ALLY_SUMMON_REQUIRED_RANK,
  createInitialProgress,
  DECOR_UPGRADES,
  FOODS,
  FRIENDS,
  getAllySummonCost,
  getBondRank,
  getGearById,
  getXpForNextLevel,
  HANGOUT_ENERGY_COST,
  HOUSES,
  LOOT_ITEMS,
  STORY_CHAPTERS,
  ZONES,
} from './game/worldData';

const SAVE_KEY = 'bataan_laban_korapsyon_v2';

function loadSavedProgress(): PlayerProgress | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    if (!parsed || typeof parsed.zoneId !== 'string' || !ZONES[parsed.zoneId as ZoneId]) {
      return null;
    }
    const base = createInitialProgress();
    const rawBp = parsed.bossProgression;
    const removedSet = new Set<string>(GAME_CONFIG.removedAllyIds);
    const cleanedMetFriends = Array.isArray(parsed.metFriendIds)
      ? parsed.metFriendIds.filter((id) => !removedSet.has(id))
      : base.metFriendIds;
    const cleanedFriendBonds: Record<string, number> = {};
    if (parsed.friendBonds && typeof parsed.friendBonds === 'object') {
      for (const [fid, val] of Object.entries(parsed.friendBonds)) {
        if (!removedSet.has(fid)) cleanedFriendBonds[fid] = Number(val) || 0;
      }
    } else {
      Object.assign(cleanedFriendBonds, base.friendBonds);
    }
    const cleanedCompanion =
      typeof parsed.activeCompanionId === 'string' && !removedSet.has(parsed.activeCompanionId)
        ? parsed.activeCompanionId
        : null;
    const migratedBikes = migrateBikeSkinList(
      Array.isArray(parsed.unlockedBikeSkinIds) ? parsed.unlockedBikeSkinIds : base.unlockedBikeSkinIds
    );
    const migratedEquippedBike = migrateBikeSkinId(
      typeof parsed.equippedBikeSkinId === 'string' ? parsed.equippedBikeSkinId : base.equippedBikeSkinId
    );
    if (!migratedBikes.includes(migratedEquippedBike)) {
      migratedBikes.push(migratedEquippedBike);
    }

    return {
      ...base,
      ...parsed,
      visitedZones: Array.isArray(parsed.visitedZones) ? parsed.visitedZones : base.visitedZones,
      defeatedBossIds: Array.isArray(parsed.defeatedBossIds) ? parsed.defeatedBossIds : base.defeatedBossIds,
      completedChapterIds: Array.isArray(parsed.completedChapterIds)
        ? parsed.completedChapterIds
        : base.completedChapterIds,
      ownedHouseIds: Array.isArray(parsed.ownedHouseIds) ? parsed.ownedHouseIds : base.ownedHouseIds,
      homeDecorIds: Array.isArray(parsed.homeDecorIds) ? parsed.homeDecorIds : base.homeDecorIds,
      ownedGearIds: Array.isArray(parsed.ownedGearIds) ? parsed.ownedGearIds : base.ownedGearIds,
      metFriendIds: cleanedMetFriends,
      activeCompanionId: cleanedCompanion,
      foodPouch: parsed.foodPouch && typeof parsed.foodPouch === 'object' ? parsed.foodPouch : base.foodPouch,
      lootBag: parsed.lootBag && typeof parsed.lootBag === 'object' ? parsed.lootBag : base.lootBag,
      friendBonds: cleanedFriendBonds,
      bossProgression: {
        ...INITIAL_BOSS_STATE,
        ...(rawBp || {}),
        defeatedBossIds: Array.isArray(rawBp?.defeatedBossIds) ? rawBp.defeatedBossIds : [],
        collectedDrops: Array.isArray(rawBp?.collectedDrops) ? rawBp.collectedDrops : [],
      },
      awakenedCount: typeof parsed.awakenedCount === 'number' ? parsed.awakenedCount : 0,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds)
        ? parsed.unlockedAchievementIds
        : base.unlockedAchievementIds,
      unlockedBikeSkinIds: migratedBikes,
      equippedBikeSkinId: migratedEquippedBike,
      metHeroGhostIds: Array.isArray(parsed.metHeroGhostIds) ? parsed.metHeroGhostIds : base.metHeroGhostIds,
      awakenedBossesDefeated: Array.isArray(parsed.awakenedBossesDefeated)
        ? parsed.awakenedBossesDefeated
        : base.awakenedBossesDefeated,
      deflectedBulletsCount: typeof parsed.deflectedBulletsCount === 'number' ? parsed.deflectedBulletsCount : 0,
      shieldsBrokenCount: typeof parsed.shieldsBrokenCount === 'number' ? parsed.shieldsBrokenCount : 0,
      statAllocation:
        parsed.statAllocation && typeof parsed.statAllocation === 'object'
          ? {
              str: Number(parsed.statAllocation.str) || 0,
              vit: Number(parsed.statAllocation.vit) || 0,
              agi: Number(parsed.statAllocation.agi) || 0,
              int: Number(parsed.statAllocation.int) || 0,
            }
          : createDefaultStatAllocation(),
      learnedMagicSkillIds: Array.isArray(parsed.learnedMagicSkillIds)
        ? parsed.learnedMagicSkillIds
        : base.learnedMagicSkillIds,
      metAlbularyo: Boolean(parsed.metAlbularyo),
      metMangkukulam: Boolean(parsed.metMangkukulam),
      materialsBag:
        parsed.materialsBag && typeof parsed.materialsBag === 'object' ? parsed.materialsBag : base.materialsBag,
      fishBag: parsed.fishBag && typeof parsed.fishBag === 'object' ? parsed.fishBag : base.fishBag,
      hasFishingRod: Boolean(parsed.hasFishingRod),
      sfxVolume:
        typeof parsed.sfxVolume === 'number' && !Number.isNaN(parsed.sfxVolume)
          ? Math.max(0, Math.min(1, parsed.sfxVolume))
          : noirAudio.sfxVolume,
      bgmVolume:
        typeof parsed.bgmVolume === 'number' && !Number.isNaN(parsed.bgmVolume)
          ? Math.max(0, Math.min(1, parsed.bgmVolume))
          : noirAudio.bgmVolume,
      hudLayoutMode:
        parsed.hudLayoutMode === 'desktop' || parsed.hudLayoutMode === 'mobile' || parsed.hudLayoutMode === 'auto'
          ? parsed.hudLayoutMode
          : 'auto',
    };
  } catch {
    return null;
  }
}

function computeDerivedStats(progress: PlayerProgress): DerivedStats {
  const pb = GAME_CONFIG.playerBase;
  let maxHp = Math.round(pb.baseHp + (progress.level - 1) * pb.hpPerLevel);
  let maxSp = Math.round(pb.baseSp + (progress.level - 1) * pb.spPerLevel);
  let atk = Math.round(pb.baseAtk + (progress.level - 1) * pb.atkPerLevel);
  let def = Math.round(pb.baseDef + (progress.level - 1) * pb.defPerLevel);
  let critChance = pb.baseCritChance;
  let spRegen = pb.baseSpRegen;
  let moveSpeed = pb.baseMoveSpeed;
  let bondMult = 1;
  let pesoMult = 1;

  for (const decorId of progress.homeDecorIds) {
    const d = DECOR_UPGRADES.find((item) => item.id === decorId);
    if (!d) continue;
    if (d.bonusHp) maxHp += d.bonusHp;
    if (d.bonusSp) maxSp += d.bonusSp;
    if (d.bonusAtk) atk += d.bonusAtk;
    if (d.bonusDef) def += d.bonusDef;
    if (d.bonusCrit) critChance += d.bonusCrit;
    if (d.bonusSpRegen) spRegen += d.bonusSpRegen;
    if (d.bonusBondMult) bondMult += d.bonusBondMult;
    if (d.bonusPesoMult) pesoMult += d.bonusPesoMult;
  }

  const equippedIds = [
    progress.equippedOutfitId,
    progress.equippedHairId,
    progress.equippedHeadgearId,
    progress.equippedBackId,
    progress.equippedWeaponId,
    progress.equippedAccessoryId,
  ];
  for (const gid of equippedIds) {
    const item = getGearById(gid);
    if (!item) continue;
    if (item.bonusHp) maxHp += item.bonusHp;
    if (item.bonusSp) maxSp += item.bonusSp;
    if (item.bonusAtk) atk += item.bonusAtk;
    if (item.bonusDef) def += item.bonusDef;
    if (item.bonusCrit) critChance += item.bonusCrit;
    if (item.bonusSpeed) moveSpeed *= 1 + item.bonusSpeed;
    if (item.bonusSpRegen) spRegen += item.bonusSpRegen;
    if (item.bonusPesoMult) pesoMult += item.bonusPesoMult;
  }

  if (progress.hasDambanaBadge) {
    atk += 8;
    def += 4;
  }

  for (const friend of FRIENDS) {
    const xp = progress.friendBonds[friend.id] || 0;
    const { rank } = getBondRank(xp);
    if (xp <= 0) continue;
    if (friend.id === 'friend_kap_ben') maxHp += rank * 12;
    if (friend.id === 'friend_ate_linda') atk += rank * 3;
    if (friend.id === 'friend_bantay') critChance += rank * 0.04;
    if (friend.id === 'friend_teacher_clara') spRegen += rank * 0.8;
    if (friend.id === 'friend_po2_clara') def += rank * 3;
    if (friend.id === 'friend_sgt_reyes') atk += rank * 5;
  }

  const alloc = progress.statAllocation || createDefaultStatAllocation();
  atk += alloc.str * 3;
  maxHp += alloc.vit * 22;
  def += alloc.vit * 1;
  critChance += alloc.agi * 0.006;
  moveSpeed += alloc.agi * 3;
  maxSp += alloc.int * 15;
  const critDamageMult = 1.55 + alloc.str * 0.01;
  const magicPowerMult = 1 + alloc.int * 0.04;

  if (progress.sanctuaryBuffSec > 0) {
    maxHp = Math.round(maxHp * 1.1);
    spRegen += 3.0;
  }

  return {
    maxHp,
    maxSp,
    atk,
    def,
    critChance: Math.min(0.68, critChance),
    critDamageMult,
    magicPowerMult,
    spRegen,
    moveSpeed,
    bondMult,
    pesoMult,
  };
}

export default function App() {
  const [savedSnapshot] = useState<PlayerProgress | null>(() => loadSavedProgress());
  const [screen, setScreen] = useState<GameScreen>('TITLE_MENU');
  const [progress, setProgress] = useState<PlayerProgress>(() => savedSnapshot || createInitialProgress());
  const [modal, setModal] = useState<ActiveModal>(null);
  const [mastermindKillDialogue, setMastermindKillDialogue] = useState<string | null>(null);
  const [provinceUnlockAlert, setProvinceUnlockAlert] = useState<boolean>(false);
  const [achievementToast, setAchievementToast] = useState<AchievementDef | null>(null);
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<AssetPreloadProgress>({
    loaded: 0,
    total: 1,
    percent: 0,
    stage: 'Preparing Bataan Illustrated Assets…',
    done: false,
  });
  const toastTimerRef = useRef<number | null>(null);
  const bridgeRef = useRef<WorldBridge | null>(null);

  useEffect(() => {
    let active = true;
    preloadAllGameAssets((p) => {
      if (active) setLoadProgress(p);
    })
      .then(() => {
        if (active) setAssetsReady(true);
      })
      .catch((err) => {
        console.error('Asset preloader encountered an error:', err);
        if (active) setAssetsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const derivedStats = useMemo(() => computeDerivedStats(progress), [progress]);

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    hp: progress.hp,
    maxHp: derivedStats.maxHp,
    sp: progress.sp,
    maxSp: derivedStats.maxSp,
    xp: progress.xp,
    xpNext: getXpForNextLevel(progress.level),
    energy: progress.energy,
    mood: progress.mood,
    sanctuaryBuffSec: progress.sanctuaryBuffSec,
    comboCount: 0,
    timeOfDay: progress.timeOfDay ?? 9.5,
    isNight: isTimeNight(progress.timeOfDay ?? 9.5),
    currentBarangay: ZONES[progress.zoneId].name,
    nearestTarget: null,
    bossHud: null,
    speechBanner: null,
    companionStatus: null,
    activeBgmLabel: BGM_TRACK_LABELS[ZONES[progress.zoneId].bgmTrack],
    magicCooldowns: {},
    shieldCooldown: 0,
    shieldCooldownMax: GAME_CONFIG.combat.shieldCooldownSec,
    dodgeCooldown: 0,
    dodgeCooldownMax: GAME_CONFIG.combat.dodgeCooldownSec,
    activeBuffs: [],
    accuracyPct: 100,
    availableStatPoints: getAvailableStatPoints(progress.level, progress.statAllocation),
  }));

  useEffect(() => {
    noirAudio.enabled = progress.soundEnabled;
    noirAudio.setSfxVolume(progress.sfxVolume ?? GAME_CONFIG.audio.defaultSfxVolume);
    noirAudio.setBgmVolume(progress.bgmVolume ?? GAME_CONFIG.audio.defaultBgmVolume);
    noirAudio.setBgmEnabled(progress.bgmEnabled);
    englishVoice.enabled = progress.voiceEnabled;
  }, [progress.soundEnabled, progress.bgmEnabled, progress.voiceEnabled, progress.sfxVolume, progress.bgmVolume]);

  useEffect(() => {
    if (screen === 'TITLE_MENU' || screen === 'PAUSED' || screen === 'DEFEATED') {
      if (screen === 'PAUSED') noirAudio.setBgmEnabled(false);
    } else if (screen === 'PLAYING') {
      noirAudio.setBgmEnabled(progress.bgmEnabled);
      if (progress.bgmEnabled) {
        noirAudio.playBgm(ZONES[progress.zoneId].bgmTrack);
      }
    }
  }, [screen, progress.bgmEnabled, progress.zoneId]);

  useEffect(() => {
    if (screen === 'PLAYING' || screen === 'PAUSED' || screen === 'CREDITS' || screen === 'DREAM_WAKEUP') {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [progress, screen]);

  // Automatic Achievement Watcher — Unlocks Trophies, Special Cosmetics & Bike Skins live!
  useEffect(() => {
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !progress.unlockedAchievementIds.includes(a.id) && a.check(progress)
    );
    if (newlyUnlocked.length === 0) return;

    setProgress((prev) => {
      const nextAch = [...prev.unlockedAchievementIds];
      const nextGear = [...prev.ownedGearIds];
      const nextBikeSkins = [...prev.unlockedBikeSkinIds];
      let bonusPesos = 0;

      for (const a of newlyUnlocked) {
        if (!nextAch.includes(a.id)) nextAch.push(a.id);
        if (a.rewardGearId && !nextGear.includes(a.rewardGearId)) nextGear.push(a.rewardGearId);
        if (a.rewardBikeSkinId && !nextBikeSkins.includes(a.rewardBikeSkinId)) {
          nextBikeSkins.push(a.rewardBikeSkinId);
        }
        if (a.rewardPesos) bonusPesos += a.rewardPesos;
      }

      return {
        ...prev,
        pesos: prev.pesos + bonusPesos,
        unlockedAchievementIds: nextAch,
        ownedGearIds: nextGear,
        unlockedBikeSkinIds: nextBikeSkins,
      };
    });

    noirAudio.playAchievementFanfare();
    setAchievementToast(newlyUnlocked[0]);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setAchievementToast(null);
    }, 4800);
  }, [progress]);

  const awardXpAndPesos = useCallback((prev: PlayerProgress, pesosGain: number, xpGain: number): PlayerProgress => {
    let level = prev.level;
    let xp = prev.xp + xpGain;
    let needed = getXpForNextLevel(level);
    while (xp >= needed) {
      xp -= needed;
      level += 1;
      needed = getXpForNextLevel(level);
    }
    return {
      ...prev,
      level,
      xp,
      pesos: prev.pesos + pesosGain,
    };
  }, []);

  // Chapter 0 completion rewards Ang Payong weapon + Shield-Glide [U] + ₱360 + Kap Ben Rank 2!
  const maybeCompletePrologue = useCallback(
    (next: PlayerProgress): PlayerProgress => {
      if (
        !next.completedChapterIds.includes('ch0_home') &&
        next.prologueTalkedKapBen &&
        next.prologueDummyHits >= 3 &&
        next.prologueRested
      ) {
        const ch0 = STORY_CHAPTERS[0];
        const rewarded = awardXpAndPesos(next, ch0.rewardPesos, ch0.rewardXp);
        const kapXp = (rewarded.friendBonds.friend_kap_ben || 0) + 35;
        const ownedGearIds = rewarded.ownedGearIds.includes('wpn_ang_payong')
          ? rewarded.ownedGearIds
          : [...rewarded.ownedGearIds, 'wpn_ang_payong'];
        noirAudio.playVictory();
        bridgeRef.current?.spawnBanner(
          'Prologue Complete!',
          'Received Defender Umbrella & ₱360! Check Bag [I], summon Kap Ben [G], or head east to Balanga City!'
        );
        if (rewarded.voiceEnabled) {
          englishVoice.speak(
            'Outstanding work, Bataan Hero Defender! Take this Defender Umbrella and three hundred sixty pesos. You are ready to defend all of Bataan!',
            FRIENDS[0].voiceProfile
          );
        }
        return {
          ...rewarded,
          completedChapterIds: [...rewarded.completedChapterIds, 'ch0_home'],
          ownedGearIds,
          equippedWeaponId: rewarded.equippedWeaponId || 'wpn_ang_payong',
          hasUmbrella: true,
          friendBonds: {
            ...rewarded.friendBonds,
            friend_kap_ben: kapXp,
          },
        };
      }
      return next;
    },
    [awardXpAndPesos]
  );

  const handleStartNew = () => {
    const fresh = createInitialProgress();
    setProgress(fresh);
    setModal(null);
    setMastermindKillDialogue(null);
    setProvinceUnlockAlert(false);
    setScreen('STORY_INTRO');
  };

  const handleContinue = () => {
    setModal(null);
    setMastermindKillDialogue(null);
    setScreen(progress.storyIntroSeen ? 'PLAYING' : 'STORY_INTRO');
  };

  const handleFinishIntro = () => {
    setProgress((prev) => ({ ...prev, storyIntroSeen: true }));
    setScreen('PLAYING');
  };

  const handlePortalTravel = useCallback((targetZone: ZoneId, spawnX: number) => {
    setProgress((prev) => ({
      ...prev,
      zoneId: targetZone,
      spawnX,
      visitedZones: prev.visitedZones.includes(targetZone)
        ? prev.visitedZones
        : [...prev.visitedZones, targetZone],
    }));
  }, []);

  const handleFastTravel = useCallback((targetZone: ZoneId) => {
    const z = ZONES[targetZone];
    setProgress((prev) => ({
      ...prev,
      zoneId: targetZone,
      spawnX: z.safeSpawnX,
      visitedZones: prev.visitedZones.includes(targetZone)
        ? prev.visitedZones
        : [...prev.visitedZones, targetZone],
    }));
  }, []);

  const handleInteractNpc = useCallback(
    (npcId: string) => {
      const zone = ZONES[progress.zoneId];
      const npc = zone.npcs.find((n) => n.id === npcId);
      let justUnlockedSidecarBike = false;
      setProgress((prev) => {
        let updated = prev;
        if (npc?.friendId && !prev.metFriendIds.includes(npc.friendId)) {
          updated = { ...updated, metFriendIds: [...updated.metFriendIds, npc.friendId] };
        }
        if (npc?.npcVisual === 'albularyo' || npc?.npcVisual === 'mangkukulam') {
          const nextBikes = updated.unlockedBikeSkinIds.includes('bike_patrol_sidecar')
            ? updated.unlockedBikeSkinIds
            : [...updated.unlockedBikeSkinIds, 'bike_patrol_sidecar'];
          if (nextBikes.length > updated.unlockedBikeSkinIds.length) {
            justUnlockedSidecarBike = true;
          }
          updated = {
            ...updated,
            metAlbularyo: updated.metAlbularyo || npc.npcVisual === 'albularyo',
            metMangkukulam: updated.metMangkukulam || npc.npcVisual === 'mangkukulam',
            unlockedBikeSkinIds: nextBikes,
          };
        }
        if (npcId === 'npc_kap_ben_home' && !updated.prologueTalkedKapBen) {
          updated = maybeCompletePrologue({ ...updated, prologueTalkedKapBen: true });
        }
        return updated;
      });
      if (justUnlockedSidecarBike) {
        noirAudio.playAchievementFanfare();
        bridgeRef.current?.spawnBanner(
          'Mystic Mentor Reward!',
          'Unlocked Bantay Patrol Sidecar Bike Skin! Equip it in Bag [I] → Bike Skins!'
        );
      }
      if (npc?.shopType === 'news_desk') {
        if (progress.voiceEnabled) englishVoice.speak(npc.greeting, npc.voiceProfile);
        setModal({ type: 'news' });
        return;
      }
      if (npc?.shopType === 'side_jobs') {
        if (progress.voiceEnabled) englishVoice.speak(npc.greeting, npc.voiceProfile);
        setModal({ type: 'side_jobs' });
        return;
      }
      const initialNpcTab =
        npc?.shopType === 'white_magic' || npc?.shopType === 'black_magic' ? 'shop' : 'talk';
      setModal({ type: 'npc', npcId, tab: initialNpcTab });
    },
    [progress.zoneId, progress.voiceEnabled, maybeCompletePrologue]
  );

  const handleInteractHouse = useCallback((houseId: string) => {
    setModal({ type: 'houses', focusHouseId: houseId });
  }, []);

  const handleHearthRest = useCallback(() => {
    setProgress((prev) => {
      const restedStats = computeDerivedStats({ ...prev, sanctuaryBuffSec: 120 });
      return maybeCompletePrologue({
        ...prev,
        hp: restedStats.maxHp,
        sp: restedStats.maxSp,
        energy: 100,
        mood: 100,
        sanctuaryBuffSec: 120,
        prologueRested: true,
      });
    });
  }, [maybeCompletePrologue]);

  const handleDummyHit = useCallback(() => {
    setProgress((prev) => {
      if (prev.prologueDummyHits >= 3) return prev;
      return maybeCompletePrologue({
        ...prev,
        prologueDummyHits: prev.prologueDummyHits + 1,
      });
    });
  }, [maybeCompletePrologue]);

  const handleClaimDambanaBadge = useCallback(() => {
    setProgress((prev) => {
      if (prev.hasDambanaBadge) return prev;
      const ownedGearIds = prev.ownedGearIds.includes('acc_dambana_badge')
        ? prev.ownedGearIds
        : [...prev.ownedGearIds, 'acc_dambana_badge'];
      return {
        ...prev,
        hasDambanaBadge: true,
        ownedGearIds,
        equippedAccessoryId: 'acc_dambana_badge',
      };
    });
  }, []);

  const handleMeetElMastermind = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      bossProgression: {
        ...prev.bossProgression,
        hasMetElMastermind: true,
      },
    }));
  }, []);

  const handleMobDefeated = useCallback(
    (pesos: number, xp: number, lootDropId?: string) => {
      setProgress((prev) => {
        const next = awardXpAndPesos(prev, pesos, xp);
        if (!lootDropId) return next;
        return {
          ...next,
          lootBag: {
            ...next.lootBag,
            [lootDropId]: (next.lootBag[lootDropId] || 0) + 1,
          },
        };
      });
    },
    [awardXpAndPesos]
  );

  const handleTownBossDefeated = useCallback(
    (
      townId: ZoneId,
      role: BossRole,
      bossProfile: BossProfile,
      pesos: number,
      xp: number,
      dropGearId?: string
    ) => {
      let triggeredProvinceUnlock = false;
      setProgress((prev) => {
        const result = applyTownBossVictory(prev.bossProgression, townId, role);
        triggeredProvinceUnlock = result.justUnlockedFinalBoss;

        const chapter = STORY_CHAPTERS.find((c) => c.targetBossId === bossProfile.id);
        const alreadyDefeated = prev.defeatedBossIds.includes(bossProfile.id);
        const bonusPesos = alreadyDefeated ? 0 : chapter?.rewardPesos || 0;
        const bonusXp = alreadyDefeated ? 0 : chapter?.rewardXp || 0;
        let next = awardXpAndPesos(prev, pesos + bonusPesos, xp + bonusXp);

        if (dropGearId && !next.ownedGearIds.includes(dropGearId)) {
          next = {
            ...next,
            ownedGearIds: [...next.ownedGearIds, dropGearId],
          };
        }

        const updatedBonds = { ...next.friendBonds };
        if (!alreadyDefeated) {
          for (const f of FRIENDS) {
            if (f.homeZoneId === townId) {
              updatedBonds[f.id] = (updatedBonds[f.id] || 0) + 60;
            }
          }
        }

        return {
          ...next,
          defeatedBossIds: result.nextState.defeatedBossIds,
          bossProgression: result.nextState,
          completedChapterIds:
            chapter && !next.completedChapterIds.includes(chapter.id)
              ? [...next.completedChapterIds, chapter.id]
              : next.completedChapterIds,
          friendBonds: updatedBonds,
        };
      });

      if (triggeredProvinceUnlock) {
        setProvinceUnlockAlert(true);
        noirAudio.playVictory();
        bridgeRef.current?.spawnBanner(
          'PROVINCE-WIDE ALERT!',
          'ALL 24 EVIDENCE FILES SECURED! El Mastermind’s Political Immunity is shattered at Balanga Provincial Capitol!'
        );
        if (progress.voiceEnabled) {
          englishVoice.speak(
            'All twenty-four evidence files are complete! El Mastermind’s political immunity is shattered! Head to the Balanga Provincial Capitol now!',
            FRIENDS[0].voiceProfile
          );
        }
      }
    },
    [awardXpAndPesos, progress.voiceEnabled]
  );

  const handleElMastermindDefeated = useCallback(
    (pesos: number, xp: number) => {
      setProgress((prev) => {
        const next = awardXpAndPesos(prev, pesos, xp);
        const completedChapterIds = next.completedChapterIds.includes('ch13_capitol')
          ? next.completedChapterIds
          : [...next.completedChapterIds, 'ch13_capitol'];
        return {
          ...next,
          completedChapterIds,
          bossProgression: {
            ...next.bossProgression,
            elMastermindDefeated: true,
          },
        };
      });
      // Roll Juan.exe's Official Victory Credits right after El Mastermind falls!
      window.setTimeout(() => {
        setModal(null);
        setScreen('CREDITS');
      }, 1150);
    },
    [awardXpAndPesos]
  );

  const handleEnterAwakenedMode = useCallback(() => {
    noirAudio.playWakeUpChime();
    setProgress((prev) => {
      const nextAwakenedCount = (prev.awakenedCount || 0) + 1;
      const ownedGearIds = prev.ownedGearIds.includes('outfit_awakened_barong')
        ? prev.ownedGearIds
        : [...prev.ownedGearIds, 'outfit_awakened_barong'];
      const unlockedBikeSkinIds = prev.unlockedBikeSkinIds.includes('bike_jeepney_gold')
        ? prev.unlockedBikeSkinIds
        : [...prev.unlockedBikeSkinIds, 'bike_jeepney_gold'];

      const baseAwakened: PlayerProgress = {
        ...prev,
        zoneId: 'defender_home',
        spawnX: ZONES.defender_home.safeSpawnX,
        visitedZones: ['defender_home'],
        bossProgression: { ...INITIAL_BOSS_STATE },
        defeatedBossIds: [],
        completedChapterIds: ['ch0_home'],
        ownedHouseIds: ['house_defender_home'],
        awakenedBossesDefeated: [],
        awakenedCount: nextAwakenedCount,
        ownedGearIds,
        unlockedBikeSkinIds,
        sanctuaryBuffSec: 120,
        energy: 100,
        mood: 100,
        timeOfDay: 7.0,
      };
      const st = computeDerivedStats(baseAwakened);
      return {
        ...baseAwakened,
        hp: st.maxHp,
        sp: st.maxSp,
      };
    });
    setModal(null);
    setScreen('PLAYING');
  }, []);

  const handleMeetHeroGhost = useCallback(
    (heroId: string) => {
      const ghost = NATIONAL_HERO_GHOSTS.find((g) => g.id === heroId);
      if (!ghost) return;
      const isNewGift = !progress.metHeroGhostIds.includes(heroId);
      setProgress((prev) => {
        const metHeroGhostIds = prev.metHeroGhostIds.includes(heroId)
          ? prev.metHeroGhostIds
          : [...prev.metHeroGhostIds, heroId];
        const ownedGearIds = prev.ownedGearIds.includes(ghost.rewardGearId)
          ? prev.ownedGearIds
          : [...prev.ownedGearIds, ghost.rewardGearId];
        return {
          ...prev,
          metHeroGhostIds,
          ownedGearIds,
        };
      });
      setModal({ type: 'hero_ghost', heroId, isNewGift });
    },
    [progress.metHeroGhostIds]
  );

  const handleAwakenedBossDefeated = useCallback(
    (bossId: string, pesos: number, xp: number, rewardGearId: string) => {
      setProgress((prev) => {
        const rewarded = awardXpAndPesos(prev, pesos, xp);
        const awakenedBossesDefeated = rewarded.awakenedBossesDefeated.includes(bossId)
          ? rewarded.awakenedBossesDefeated
          : [...rewarded.awakenedBossesDefeated, bossId];
        const ownedGearIds = rewarded.ownedGearIds.includes(rewardGearId)
          ? rewarded.ownedGearIds
          : [...rewarded.ownedGearIds, rewardGearId];
        return {
          ...rewarded,
          awakenedBossesDefeated,
          ownedGearIds,
        };
      });
    },
    [awardXpAndPesos]
  );

  const handleBulletDeflected = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      deflectedBulletsCount: (prev.deflectedBulletsCount || 0) + 1,
    }));
  }, []);

  const handleShieldBroken = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      shieldsBrokenCount: (prev.shieldsBrokenCount || 0) + 1,
    }));
  }, []);

  const handleEquipBikeSkin = useCallback((skinId: string) => {
    setProgress((prev) => {
      if (!prev.unlockedBikeSkinIds.includes(skinId)) return prev;
      noirAudio.playBikeBell();
      return { ...prev, equippedBikeSkinId: skinId };
    });
  }, []);

  const handleAllocateStat = useCallback((stat: keyof RpgStatAllocation) => {
    setProgress((prev) => {
      const avail = getAvailableStatPoints(prev.level, prev.statAllocation);
      if (avail <= 0) return prev;
      noirAudio.playPurchase();
      const curr = prev.statAllocation || createDefaultStatAllocation();
      return {
        ...prev,
        statAllocation: {
          ...curr,
          [stat]: curr[stat] + 1,
        },
      };
    });
  }, []);

  const handleResetStats = useCallback(() => {
    setProgress((prev) => {
      noirAudio.playRestChime();
      return {
        ...prev,
        statAllocation: createDefaultStatAllocation(),
      };
    });
  }, []);

  const handleLearnMagicSkill = useCallback((skillId: string) => {
    const skill = getMagicSkillById(skillId);
    if (!skill) return;
    setProgress((prev) => {
      if (prev.learnedMagicSkillIds?.includes(skill.id)) return prev;
      if (prev.level < skill.requiredLevel) {
        bridgeRef.current?.spawnBanner(
          skill.mentorName,
          `Unlocks at Level ${skill.requiredLevel}! Train in the Palayan Farming Grounds or Mt. Natib Cave.`
        );
        return prev;
      }
      noirAudio.playMagicCast(skill.school);
      bridgeRef.current?.spawnBanner(
        skill.mentorName,
        `Mastered [${skill.hotkey}] ${skill.name} (${skill.filipinoTitle})! Press [${skill.hotkey}] in battle!`
      );
      return {
        ...prev,
        learnedMagicSkillIds: [...(prev.learnedMagicSkillIds || []), skill.id],
      };
    });
  }, []);

  const handlePesosDelta = useCallback((delta: number) => {
    if (!delta) return;
    setProgress((prev) => ({
      ...prev,
      pesos: Math.max(0, prev.pesos + Math.round(delta)),
    }));
  }, []);

  const handleGainMaterial = useCallback(
    (materialId: string, qty: number, bonusXp = 0) => {
      setProgress((prev) => {
        const next = bonusXp > 0 ? awardXpAndPesos(prev, 0, bonusXp) : prev;
        return {
          ...next,
          materialsBag: {
            ...(next.materialsBag || {}),
            [materialId]: (next.materialsBag?.[materialId] || 0) + qty,
          },
        };
      });
    },
    [awardXpAndPesos]
  );

  const handleCatchFish = useCallback(
    (fishId: string, bonusXp = 35) => {
      setProgress((prev) => {
        const next = awardXpAndPesos(prev, 0, bonusXp);
        return {
          ...next,
          fishBag: {
            ...(next.fishBag || {}),
            [fishId]: (next.fishBag?.[fishId] || 0) + 1,
          },
        };
      });
    },
    [awardXpAndPesos]
  );

  const handleCompleteSideJob = useCallback(
    (pesos: number, xp: number, title: string) => {
      setProgress((prev) => awardXpAndPesos(prev, pesos, xp));
      bridgeRef.current?.spawnBanner('Side Job Complete!', `${title} paid ₱${pesos} and +${xp} EXP!`);
    },
    [awardXpAndPesos]
  );

  const handleBuyFishingRod = useCallback(() => {
    const cost = GAME_CONFIG.fishing.rodPrice;
    setProgress((prev) => {
      if (prev.hasFishingRod || prev.pesos < cost) return prev;
      noirAudio.playPurchase();
      bridgeRef.current?.spawnBanner(
        'Bamboo Fishing Rod Acquired!',
        'Visit marked coastal docks in Orani, Orion, Bagac, or Morong and press [E] to fish!'
      );
      return {
        ...prev,
        pesos: prev.pesos - cost,
        hasFishingRod: true,
      };
    });
  }, []);

  const handleSellMaterial = useCallback((materialId: string) => {
    const mat = getMaterialById(materialId);
    if (!mat) return;
    setProgress((prev) => {
      const qty = prev.materialsBag?.[materialId] || 0;
      if (qty <= 0) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos + mat.sellValue,
        materialsBag: {
          ...prev.materialsBag,
          [materialId]: qty - 1,
        },
      };
    });
  }, []);

  const handleConsumeMaterial = useCallback((materialId: string) => {
    const mat = getMaterialById(materialId);
    if (!mat || (!mat.hpRestore && !mat.spRestore)) return;
    setProgress((prev) => {
      const qty = prev.materialsBag?.[materialId] || 0;
      if (qty <= 0) return prev;
      bridgeRef.current?.applyFoodHeal(mat.hpRestore || 0, mat.spRestore || 0, 12, mat.name);
      return {
        ...prev,
        materialsBag: {
          ...prev.materialsBag,
          [materialId]: qty - 1,
        },
      };
    });
  }, []);

  const handleSellFish = useCallback((fishId: string) => {
    const fish = getFishById(fishId);
    if (!fish) return;
    setProgress((prev) => {
      const qty = prev.fishBag?.[fishId] || 0;
      if (qty <= 0) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos + fish.sellValue,
        fishBag: {
          ...prev.fishBag,
          [fishId]: qty - 1,
        },
      };
    });
  }, []);

  const handleCookRecipe = useCallback((recipeId: string) => {
    const recipe = COOKING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    setProgress((prev) => {
      const nextMaterials = { ...(prev.materialsBag || {}) };
      const nextFish = { ...(prev.fishBag || {}) };

      for (const ing of recipe.ingredients) {
        if (ing.itemId.startsWith('fish_')) {
          let remaining = ing.qty;
          const exactAvail = nextFish[ing.itemId] || 0;
          if (exactAvail >= remaining) {
            nextFish[ing.itemId] = exactAvail - remaining;
            remaining = 0;
          } else {
            // Allow substituting any owned Filipino fish for fish recipes
            if (exactAvail > 0) {
              nextFish[ing.itemId] = 0;
              remaining -= exactAvail;
            }
            for (const fid of Object.keys(nextFish)) {
              if (remaining <= 0) break;
              const avail = nextFish[fid] || 0;
              if (avail > 0) {
                const take = Math.min(avail, remaining);
                nextFish[fid] = avail - take;
                remaining -= take;
              }
            }
          }
          if (remaining > 0) return prev;
        } else {
          const avail = nextMaterials[ing.itemId] || 0;
          if (avail < ing.qty) return prev;
          nextMaterials[ing.itemId] = avail - ing.qty;
        }
      }

      noirAudio.playCookSizzle();
      bridgeRef.current?.spawnBanner(
        'Filipino Hearth',
        `Cooked ${recipe.name}! Added to your Food Pouch — eat it for HP & ${recipe.buff ? recipe.buff.label : 'vigor'}!`
      );
      return {
        ...prev,
        materialsBag: nextMaterials,
        fishBag: nextFish,
        foodPouch: {
          ...prev.foodPouch,
          [recipe.foodId]: (prev.foodPouch[recipe.foodId] || 0) + 1,
        },
        equippedFoodId: prev.equippedFoodId || recipe.foodId,
      };
    });
  }, []);

  const handleStartSideJob = useCallback((job: ActiveSideJobState) => {
    bridgeRef.current?.startSideJob?.(job);
    setModal(null);
  }, []);

  const handleCancelSideJob = useCallback(() => {
    bridgeRef.current?.cancelSideJob?.();
  }, []);

  const handleChangeSfxVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    noirAudio.setSfxVolume(clamped);
    setProgress((prev) => ({ ...prev, sfxVolume: clamped }));
  }, []);

  const handleChangeBgmVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    noirAudio.setBgmVolume(clamped);
    setProgress((prev) => ({ ...prev, bgmVolume: clamped }));
  }, []);

  const handleChangeHudLayoutMode = useCallback((mode: 'auto' | 'desktop' | 'mobile') => {
    setProgress((prev) => ({ ...prev, hudLayoutMode: mode }));
  }, []);

  const handleMastermindInstantDeath = useCallback((dialogue: string) => {
    setMastermindKillDialogue(dialogue);
    setScreen('DEFEATED');
  }, []);

  const handleSyncVitals = useCallback(
    (vitals: {
      hp: number;
      sp: number;
      energy: number;
      mood: number;
      sanctuaryBuffSec: number;
      timeOfDay: number;
    }) => {
      setProgress((prev) => ({ ...prev, ...vitals }));
    },
    []
  );

  const handleBuyHouse = (houseId: string) => {
    const house = HOUSES.find((h) => h.id === houseId);
    if (!house) return;
    setProgress((prev) => {
      if (prev.ownedHouseIds.includes(houseId) || prev.pesos < house.price) return prev;
      noirAudio.playPurchase();
      bridgeRef.current?.spawnBanner('Safe House Purchased', `${house.name} is now your Bataan Safe House!`);
      return {
        ...prev,
        pesos: prev.pesos - house.price,
        ownedHouseIds: [...prev.ownedHouseIds, houseId],
      };
    });
  };

  const handleRestInHouse = (houseId: string) => {
    const house = HOUSES.find((h) => h.id === houseId);
    if (!house) return;
    setProgress((prev) => {
      const restedStats = computeDerivedStats({ ...prev, sanctuaryBuffSec: 120 });
      return maybeCompletePrologue({
        ...prev,
        hp: restedStats.maxHp,
        sp: restedStats.maxSp,
        energy: 100,
        mood: 100,
        sanctuaryBuffSec: 120,
        prologueRested: house.zoneId === 'defender_home' ? true : prev.prologueRested,
      });
    });
    bridgeRef.current?.applyFullRest();
    setModal(null);
  };

  const handleBuyDecor = (decorId: string) => {
    const decor = DECOR_UPGRADES.find((d) => d.id === decorId);
    if (!decor) return;
    setProgress((prev) => {
      if (prev.homeDecorIds.includes(decorId) || prev.pesos < decor.price) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos - decor.price,
        homeDecorIds: [...prev.homeDecorIds, decorId],
      };
    });
  };

  const handleGiftFood = (friendId: string, foodId: string) => {
    const friend = FRIENDS.find((f) => f.id === friendId);
    const food = FOODS.find((f) => f.id === foodId);
    if (!friend || !food) return;

    setProgress((prev) => {
      const qty = prev.foodPouch[foodId] || 0;
      if (qty <= 0) return prev;
      const isFav = friend.favoriteFoodIds.includes(foodId);
      const gain = Math.round((isFav ? 42 : 20) * derivedStats.bondMult);
      noirAudio.playPurchase();
      const spoken = isFav
        ? `Thank you so much for my favorite ${food.name}, Bataan Hero Defender!`
        : `Thanks for the ${food.name}! This really helps!`;
      if (prev.voiceEnabled) englishVoice.speak(spoken, friend.voiceProfile);
      bridgeRef.current?.spawnBanner(friend.name, `${spoken} (+${gain} Bond XP)`);
      return {
        ...prev,
        foodPouch: {
          ...prev.foodPouch,
          [foodId]: qty - 1,
        },
        friendBonds: {
          ...prev.friendBonds,
          [friendId]: (prev.friendBonds[friendId] || 0) + gain,
        },
      };
    });
  };

  const handleHangOut = (friendId: string) => {
    const friend = FRIENDS.find((f) => f.id === friendId);
    if (!friend) return;
    if (progress.energy < HANGOUT_ENERGY_COST) {
      bridgeRef.current?.spawnBanner(
        'Low Energy',
        `You need ${HANGOUT_ENERGY_COST} Energy to hang out! Eat snacks or rest at a Safe House.`
      );
      return;
    }
    const gain = Math.round(14 * derivedStats.bondMult);
    setProgress((prev) => {
      if (prev.energy < HANGOUT_ENERGY_COST) return prev;
      return {
        ...prev,
        energy: Math.max(0, prev.energy - HANGOUT_ENERGY_COST),
        mood: Math.min(100, prev.mood + 10),
        friendBonds: {
          ...prev.friendBonds,
          [friendId]: (prev.friendBonds[friendId] || 0) + gain,
        },
      };
    });
    bridgeRef.current?.triggerDuetBurst(friend.name);
  };

  const handleToggleCompanion = (friendId: string) => {
    const friend = FRIENDS.find((f) => f.id === friendId);
    if (!friend) return;
    const isDismissing = progress.activeCompanionId === friendId;
    const bond = getBondRank(progress.friendBonds[friendId] || 0);
    const stipend = getAllySummonCost(friendId);

    if (!isDismissing) {
      if (bond.rank < ALLY_SUMMON_REQUIRED_RANK) {
        bridgeRef.current?.spawnBanner(
          friend.name,
          `Reach Bond Rank ${ALLY_SUMMON_REQUIRED_RANK} (150 Bond XP) to recruit ${friend.name}!`
        );
        return;
      }
      if (progress.pesos < stipend) {
        bridgeRef.current?.spawnBanner(
          'Insufficient Pesos',
          `Need ₱${stipend} rally stipend to hire ${friend.name} into combat!`
        );
        return;
      }
    }

    setProgress((prev) => {
      const dismissing = prev.activeCompanionId === friendId;
      if (!dismissing && prev.pesos < stipend) return prev;
      const nextId = dismissing ? null : friendId;
      noirAudio.playRestChime();
      const line = nextId
        ? `Rallied for ₱${stipend}! I am fighting right beside you, Bataan Hero Defender!`
        : 'I will rest at my post for now. Call whenever you need backup!';
      if (prev.voiceEnabled) englishVoice.speak(line, friend.voiceProfile);
      bridgeRef.current?.spawnBanner(friend.name, line);
      return {
        ...prev,
        pesos: dismissing ? prev.pesos : prev.pesos - stipend,
        activeCompanionId: nextId,
      };
    });
  };

  const handleBuyFood = (foodId: string) => {
    const food = FOODS.find((f) => f.id === foodId);
    if (!food) return;
    setProgress((prev) => {
      if (prev.pesos < food.price) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos - food.price,
        foodPouch: {
          ...prev.foodPouch,
          [foodId]: (prev.foodPouch[foodId] || 0) + 1,
        },
        equippedFoodId: prev.equippedFoodId || foodId,
      };
    });
  };

  const handleEatFood = useCallback((foodId: string | null) => {
    if (!foodId) return;
    const food = FOODS.find((f) => f.id === foodId);
    if (!food) return;
    setProgress((prev) => {
      const qty = prev.foodPouch[foodId] || 0;
      if (qty <= 0) return prev;
      const nenaRank = getBondRank(prev.friendBonds.friend_aling_nena || 0).rank;
      const healMult = 1 + ((prev.friendBonds.friend_aling_nena || 0) > 0 ? nenaRank * 0.1 : 0);
      const hpGain = Math.round(food.hpRestore * healMult);
      bridgeRef.current?.applyFoodHeal(hpGain, food.spRestore, food.energyRestore, food.name, food.buff);
      return {
        ...prev,
        foodPouch: {
          ...prev.foodPouch,
          [foodId]: qty - 1,
        },
      };
    });
  }, []);

  const handleEquipFood = (foodId: string) => {
    setProgress((prev) => ({ ...prev, equippedFoodId: foodId }));
  };

  const handleSellFood = (foodId: string) => {
    const food = FOODS.find((f) => f.id === foodId);
    if (!food) return;
    setProgress((prev) => {
      const qty = prev.foodPouch[foodId] || 0;
      if (qty <= 0) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos + food.sellValue,
        foodPouch: {
          ...prev.foodPouch,
          [foodId]: qty - 1,
        },
      };
    });
  };

  const handleSellLoot = (lootId: string) => {
    const loot = LOOT_ITEMS.find((l) => l.id === lootId);
    if (!loot) return;
    setProgress((prev) => {
      const qty = prev.lootBag[lootId] || 0;
      if (qty <= 0) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos + loot.sellValue,
        lootBag: {
          ...prev.lootBag,
          [lootId]: qty - 1,
        },
      };
    });
  };

  const applyGearEquip = (prev: PlayerProgress, itemId: string): PlayerProgress => {
    const item = getGearById(itemId);
    if (!item) return prev;
    if (item.slot === 'outfit') return { ...prev, equippedOutfitId: itemId };
    if (item.slot === 'hair') return { ...prev, equippedHairId: itemId };
    if (item.slot === 'headgear') return { ...prev, equippedHeadgearId: itemId };
    if (item.slot === 'back') return { ...prev, equippedBackId: itemId };
    if (item.slot === 'weapon') return { ...prev, equippedWeaponId: itemId };
    if (item.slot === 'accessory') return { ...prev, equippedAccessoryId: itemId };
    return prev;
  };

  const handleBuyGear = (itemId: string) => {
    const item = getGearById(itemId);
    if (!item) return;
    setProgress((prev) => {
      if (prev.pesos < item.price) return prev;
      noirAudio.playPurchase();
      if (item.slot === 'umbrella') {
        if (prev.hasUmbrella) return prev;
        return { ...prev, pesos: prev.pesos - item.price, hasUmbrella: true, umbrellaOpen: true };
      }
      if (item.slot === 'bike') {
        if (prev.hasBike) return prev;
        return { ...prev, pesos: prev.pesos - item.price, hasBike: true, ridingBike: true };
      }
      if (prev.ownedGearIds.includes(itemId)) return prev;
      const bought: PlayerProgress = {
        ...prev,
        pesos: prev.pesos - item.price,
        ownedGearIds: [...prev.ownedGearIds, itemId],
      };
      return applyGearEquip(bought, itemId);
    });
  };

  const handleEquipGear = (itemId: string) => {
    setProgress((prev) => {
      if (!prev.ownedGearIds.includes(itemId)) return prev;
      return applyGearEquip(prev, itemId);
    });
  };

  const handleUnequipSlot = (slot: 'headgear' | 'back' | 'weapon' | 'accessory') => {
    setProgress((prev) => {
      if (slot === 'headgear') return { ...prev, equippedHeadgearId: null };
      if (slot === 'back') return { ...prev, equippedBackId: null };
      if (slot === 'weapon') return { ...prev, equippedWeaponId: null };
      return { ...prev, equippedAccessoryId: null };
    });
  };

  const handleSellGear = (itemId: string) => {
    const item = getGearById(itemId);
    if (!item || item.sellValue <= 0) return;
    setProgress((prev) => {
      const isEquipped =
        prev.equippedOutfitId === itemId ||
        prev.equippedHairId === itemId ||
        prev.equippedHeadgearId === itemId ||
        prev.equippedBackId === itemId ||
        prev.equippedWeaponId === itemId ||
        prev.equippedAccessoryId === itemId;
      if (isEquipped || !prev.ownedGearIds.includes(itemId)) return prev;
      noirAudio.playPurchase();
      return {
        ...prev,
        pesos: prev.pesos + item.sellValue,
        ownedGearIds: prev.ownedGearIds.filter((id) => id !== itemId),
      };
    });
  };

  const handleRespawnAtSafeHouse = () => {
    const currentZoneHouse = HOUSES.find(
      (h) => h.zoneId === progress.zoneId && progress.ownedHouseIds.includes(h.id)
    );
    const targetZone: ZoneId = currentZoneHouse ? currentZoneHouse.zoneId : 'defender_home';
    setMastermindKillDialogue(null);
    setProgress((prev) => {
      const rested = computeDerivedStats({ ...prev, sanctuaryBuffSec: 90 });
      return {
        ...prev,
        zoneId: targetZone,
        spawnX: ZONES[targetZone].safeSpawnX,
        hp: rested.maxHp,
        sp: rested.maxSp,
        energy: 100,
        mood: 100,
        sanctuaryBuffSec: 90,
      };
    });
    setScreen('PLAYING');
  };

  const handleToggleBike = useCallback(() => {
    noirAudio.playBikeBell();
    setProgress((p) => ({ ...p, ridingBike: !p.ridingBike }));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING' && screen !== 'PAUSED') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Escape') {
        if (modal) {
          setModal(null);
        } else {
          setScreen((s) => (s === 'PAUSED' ? 'PLAYING' : 'PAUSED'));
        }
        return;
      }

      if (screen !== 'PLAYING') return;

      if (e.code === 'KeyQ') setModal((m) => (m?.type === 'story' ? null : { type: 'story' }));
      if (e.code === 'KeyH') setModal((m) => (m?.type === 'houses' ? null : { type: 'houses' }));
      if (e.code === 'KeyG') setModal((m) => (m?.type === 'tropa' ? null : { type: 'tropa' }));
      if (e.code === 'KeyM') setModal((m) => (m?.type === 'map' ? null : { type: 'map' }));
      if (e.code === 'KeyV') setModal((m) => (m?.type === 'achievements' ? null : { type: 'achievements' }));
      if (e.code === 'KeyI' || e.code === 'KeyB') {
        setModal((m) => (m?.type === 'inventory' ? null : { type: 'inventory' }));
      }
      if (e.code === 'KeyF' && !modal) handleEatFood(progress.equippedFoodId);
      if (e.code === 'KeyR' && !modal && progress.hasBike) {
        handleToggleBike();
      }
      if (e.code === 'KeyU' && !modal && progress.hasUmbrella) {
        setProgress((prev) => ({ ...prev, umbrellaOpen: !prev.umbrellaOpen }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, modal, progress.equippedFoodId, progress.hasBike, progress.hasUmbrella, handleEatFood, handleToggleBike]);

  if (screen === 'TITLE_MENU') {
    return (
      <TitleScreen
        hasSave={Boolean(savedSnapshot)}
        savedZoneName={savedSnapshot ? ZONES[savedSnapshot.zoneId].name : 'Defender Home'}
        savedLevel={savedSnapshot?.level || 1}
        savedAwakenedCount={savedSnapshot?.awakenedCount || 0}
        bgmEnabled={progress.bgmEnabled}
        voiceEnabled={progress.voiceEnabled}
        sfxVolume={progress.sfxVolume ?? GAME_CONFIG.audio.defaultSfxVolume}
        bgmVolume={progress.bgmVolume ?? GAME_CONFIG.audio.defaultBgmVolume}
        onToggleBgm={() => setProgress((p) => ({ ...p, bgmEnabled: !p.bgmEnabled }))}
        onToggleVoice={() => setProgress((p) => ({ ...p, voiceEnabled: !p.voiceEnabled }))}
        onChangeSfxVolume={handleChangeSfxVolume}
        onChangeBgmVolume={handleChangeBgmVolume}
        onContinue={handleContinue}
        onNewJourney={handleStartNew}
      />
    );
  }

  if (!assetsReady) {
    return <AssetLoadingScreen progress={loadProgress} />;
  }

  if (screen === 'STORY_INTRO') {
    return <StoryIntro voiceEnabled={progress.voiceEnabled} onComplete={handleFinishIntro} />;
  }

  if (screen === 'CREDITS') {
    return (
      <CreditsScreen
        progress={progress}
        onProceedToWakeup={() => setScreen('DREAM_WAKEUP')}
      />
    );
  }

  if (screen === 'DREAM_WAKEUP') {
    return (
      <DreamWakeupScreen
        progress={progress}
        onEnterAwakenedMode={handleEnterAwakenedMode}
      />
    );
  }

  const isSimulationPaused = screen !== 'PLAYING' || modal !== null || provinceUnlockAlert;
  const caseProg = getFinalBossProgress(progress.bossProgression);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#142435]">
      <GameCanvas
        progress={progress}
        derivedStats={derivedStats}
        paused={isSimulationPaused}
        bridgeRef={bridgeRef}
        onHudUpdate={setHud}
        onSyncVitals={handleSyncVitals}
        onPortalTravel={handlePortalTravel}
        onInteractNpc={handleInteractNpc}
        onInteractHouse={handleInteractHouse}
        onHearthRest={handleHearthRest}
        onDummyHit={handleDummyHit}
        onClaimDambanaBadge={handleClaimDambanaBadge}
        onMeetElMastermind={handleMeetElMastermind}
        onMeetHeroGhost={handleMeetHeroGhost}
        onMobDefeated={handleMobDefeated}
        onTownBossDefeated={handleTownBossDefeated}
        onAwakenedBossDefeated={handleAwakenedBossDefeated}
        onElMastermindDefeated={handleElMastermindDefeated}
        onMastermindInstantDeath={handleMastermindInstantDeath}
        onBulletDeflected={handleBulletDeflected}
        onShieldBroken={handleShieldBroken}
        onPesosDelta={handlePesosDelta}
        onGainMaterial={handleGainMaterial}
        onCatchFish={handleCatchFish}
        onCompleteSideJob={handleCompleteSideJob}
        onPlayerDefeated={() => {
          setMastermindKillDialogue(null);
          setScreen('DEFEATED');
        }}
      />

      <GameHud
        progress={progress}
        hud={hud}
        bridgeRef={bridgeRef}
        achievementToast={achievementToast}
        onOpenModal={setModal}
        onToggleBgm={() => {
          noirAudio.unlock();
          setProgress((p) => ({ ...p, bgmEnabled: !p.bgmEnabled }));
        }}
        onToggleVoice={() => setProgress((p) => ({ ...p, voiceEnabled: !p.voiceEnabled }))}
        onChangeSfxVolume={handleChangeSfxVolume}
        onChangeBgmVolume={handleChangeBgmVolume}
        onChangeHudLayoutMode={handleChangeHudLayoutMode}
        onCancelSideJob={handleCancelSideJob}
        onPause={() => setScreen('PAUSED')}
        onEatEquippedFood={() => handleEatFood(progress.equippedFoodId)}
        onToggleBike={handleToggleBike}
        onToggleUmbrella={() => setProgress((p) => ({ ...p, umbrellaOpen: !p.umbrellaOpen }))}
        onCastMagicSkill={(skillId) => bridgeRef.current?.castMagicSkill(skillId)}
      />

      <Modals
        modal={modal}
        progress={progress}
        derivedStats={derivedStats}
        activeSideJob={hud.activeSideJob || null}
        onClose={() => setModal(null)}
        onReplayPrologue={() => {
          setModal(null);
          setScreen('STORY_INTRO');
        }}
        onTravel={handleFastTravel}
        onOpenMap={() => setModal({ type: 'map' })}
        onOpenCooking={() => setModal({ type: 'cooking' })}
        onBuyHouse={handleBuyHouse}
        onRestInHouse={handleRestInHouse}
        onBuyDecor={handleBuyDecor}
        onGiftFood={handleGiftFood}
        onHangOut={handleHangOut}
        onToggleCompanion={handleToggleCompanion}
        onBuyFood={handleBuyFood}
        onEatFood={handleEatFood}
        onEquipFood={handleEquipFood}
        onSellFood={handleSellFood}
        onSellLoot={handleSellLoot}
        onSellMaterial={handleSellMaterial}
        onConsumeMaterial={handleConsumeMaterial}
        onSellFish={handleSellFish}
        onBuyFishingRod={handleBuyFishingRod}
        onCookRecipe={handleCookRecipe}
        onStartSideJob={handleStartSideJob}
        onCancelSideJob={handleCancelSideJob}
        onBuyGear={handleBuyGear}
        onEquipGear={handleEquipGear}
        onUnequipSlot={handleUnequipSlot}
        onSellGear={handleSellGear}
        onEquipBikeSkin={handleEquipBikeSkin}
        onToggleBike={handleToggleBike}
        onToggleUmbrella={() => setProgress((p) => ({ ...p, umbrellaOpen: !p.umbrellaOpen }))}
        onAllocateStat={handleAllocateStat}
        onResetStats={handleResetStats}
        onLearnMagicSkill={handleLearnMagicSkill}
      />

      {/* Province-Wide 24/24 Evidence Complete Alert! */}
      {provinceUnlockAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1520]/85 p-4">
          <div className="bp-panel w-full max-w-lg border-[#F4C542] p-6 text-center">
            <p className="font-mono text-xs font-bold text-[#7AE582]">
              24 / 24 EVIDENCE COLLECTED ACROSS ALL 12 BATAAN LGUs
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#F4C542]">
              ALL EVIDENCE SECURED!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#FFFFFF]">
              El Mastermind’s Political Immunity has been shattered! Travel to the Bataan Provincial Capitol in Balanga
              City and end corruption across the province once and for all!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setProvinceUnlockAlert(false);
                  handleFastTravel('balanga');
                }}
                className="cursor-pointer whitespace-nowrap border-2 border-[#FFF0B3] bg-[#F4C542] px-5 py-2.5 font-display text-sm font-bold text-[#102030]"
              >
                Fast Travel to Balanga Capitol
              </button>
              <button
                type="button"
                onClick={() => setProvinceUnlockAlert(false)}
                className="cursor-pointer whitespace-nowrap border-2 border-[#7FA4BE] bg-[#22384D] px-5 py-2.5 font-display text-sm font-bold text-[#FFFFFF]"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {screen === 'PAUSED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1520]/80 p-4">
          <div className="bp-panel w-full max-w-sm p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#F4C542]">Campaign Paused</h2>
            <p className="mt-2 font-mono text-xs text-[#C8DFEE]">
              {ZONES[progress.zoneId].name} · Lv.{progress.level} · Evidence {caseProg.collected}/{caseProg.total}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setScreen('PLAYING')}
                className="cursor-pointer whitespace-nowrap border-2 border-[#FFF0B3] bg-[#F4C542] px-5 py-2.5 font-display text-sm font-bold text-[#102030] hover:bg-[#FFD45C]"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  englishVoice.stop();
                  noirAudio.stopBgm();
                  setModal(null);
                  setScreen('TITLE_MENU');
                }}
                className="cursor-pointer whitespace-nowrap border-2 border-[#7FA4BE] bg-[#22384D] px-5 py-2.5 font-display text-sm font-bold text-[#FFFFFF] hover:border-[#F4C542]"
              >
                Return to Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defeated / El Mastermind 999,999 Instant-Death Counterattack Overlay */}
      {screen === 'DEFEATED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1520]/88 p-4">
          <div
            className={`bp-panel w-full max-w-lg p-7 text-center ${
              mastermindKillDialogue ? 'border-[#DC2626]' : ''
            }`}
          >
            <p className="font-mono text-xs font-bold text-[#FCA5A5]">
              {mastermindKillDialogue
                ? 'EL MASTERMIND COUNTERATTACK · 999,999 UNBLOCKABLE DAMAGE'
                : 'Bataan Hero Defender Knocked Out'}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#F4C542]">
              {mastermindKillDialogue ? 'POLITICAL IMMUNITY COUNTERATTACK!' : 'Stand Back Up, Defender!'}
            </h2>
            {mastermindKillDialogue ? (
              <div className="bp-card mt-4 border-[#DC2626] p-4 text-left">
                <p className="text-sm leading-relaxed text-[#FFFFFF]">{mastermindKillDialogue}</p>
                <p className="mt-3 font-mono text-xs text-[#F4C542]">
                  Tip: Open the Bataan World Map [M] to track all 12 municipalities and defeat every Vice Mayor & Mayor
                  ({caseProg.collected}/{caseProg.total} Evidence collected).
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#E4EFF7]">
                Your Inventory, Evidence ({caseProg.collected}/{caseProg.total}), Safe Houses, and Ally Bonds are safe.
                Regroup at your nearest Kap Ben / Safe House checkpoint and strike back!
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleRespawnAtSafeHouse}
                className="cursor-pointer whitespace-nowrap border-2 border-[#FFF0B3] bg-[#F4C542] px-6 py-3 font-display text-sm font-bold text-[#102030] hover:bg-[#FFD45C]"
              >
                Respawn at Nearest Checkpoint
              </button>
              {mastermindKillDialogue && (
                <button
                  type="button"
                  onClick={() => {
                    handleRespawnAtSafeHouse();
                    setModal({ type: 'map' });
                  }}
                  className="cursor-pointer whitespace-nowrap border-2 border-[#7FA4BE] bg-[#22384D] px-5 py-3 font-display text-sm font-bold text-[#FFFFFF] hover:border-[#F4C542]"
                >
                  Open 24-Boss Map [M]
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
