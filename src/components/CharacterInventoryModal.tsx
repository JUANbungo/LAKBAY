import React, { useEffect, useRef, useState } from 'react';
import { Bike, Fish, Leaf, Lock, Plus, RotateCcw, X } from 'lucide-react';
import { BIKE_SKINS, getBikeSkinById } from '../game/expansionData';
import { FILIPINO_FISH, GATHER_AND_MATERIAL_ITEMS } from '../game/gameConfig';
import { getAvailableStatPoints } from '../game/magicSkillsData';
import { drawHeroPreview } from '../game/noirRenderer';
import { DerivedStats, GearSlot, ItemRarity, PlayerProgress, RpgStatAllocation } from '../game/types';
import { subscribeV2Loaded } from '../game/v2Sprites';
import { FOODS, getGearById, LOOT_ITEMS, RPG_GEAR } from '../game/worldData';

type InvTab = 'gear' | 'bike' | 'food' | 'loot' | 'materials' | 'fish';

interface CharacterInventoryModalProps {
  progress: PlayerProgress;
  derivedStats: DerivedStats;
  initialTab?: InvTab;
  onClose: () => void;
  onEquipGear: (itemId: string) => void;
  onUnequipSlot: (slot: 'headgear' | 'back' | 'weapon' | 'accessory') => void;
  onSellGear: (itemId: string) => void;
  onEquipBikeSkin: (skinId: string) => void;
  onEatFood: (foodId: string) => void;
  onEquipFood: (foodId: string) => void;
  onSellFood: (foodId: string) => void;
  onSellLoot: (lootId: string) => void;
  onSellMaterial: (materialId: string) => void;
  onConsumeMaterial: (materialId: string) => void;
  onSellFish: (fishId: string) => void;
  onToggleBike: () => void;
  onToggleUmbrella: () => void;
  onAllocateStat: (stat: keyof RpgStatAllocation) => void;
  onResetStats: () => void;
}

const RARITY_COLOR: Record<ItemRarity, string> = {
  Common: 'text-[#DCE8F2]',
  Uncommon: 'text-[#7AE582]',
  Rare: 'text-[#7DD3FC]',
  Epic: 'text-[#E9A8FF]',
  Relic: 'text-[#F4C542]',
};

export const CharacterInventoryModal: React.FC<CharacterInventoryModalProps> = ({
  progress,
  derivedStats,
  initialTab = 'gear',
  onClose,
  onEquipGear,
  onUnequipSlot,
  onSellGear,
  onEquipBikeSkin,
  onEatFood,
  onEquipFood,
  onSellFood,
  onSellLoot,
  onSellMaterial,
  onConsumeMaterial,
  onSellFish,
  onToggleBike,
  onToggleUmbrella,
  onAllocateStat,
  onResetStats,
}) => {
  const [tab, setTab] = useState<InvTab>(initialTab);
  const [slotFilter, setSlotFilter] = useState<'all' | GearSlot>('all');
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const availStatPoints = getAvailableStatPoints(progress.level, progress.statAllocation);
  const alloc = progress.statAllocation || { str: 0, vit: 0, agi: 0, int: 0 };
  const totalSpentStats = alloc.str + alloc.vit + alloc.agi + alloc.int;

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();
    const render = (now: number) => {
      drawHeroPreview(ctx, canvas.width, canvas.height, progress, (now - start) / 1000);
      rafId = requestAnimationFrame(render);
    };
    const unsub = subscribeV2Loaded(() => {
      drawHeroPreview(ctx, canvas.width, canvas.height, progress, (performance.now() - start) / 1000);
    });
    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      unsub();
    };
  }, [progress]);

  const ownedGear = RPG_GEAR.filter((item) => progress.ownedGearIds.includes(item.id));
  const filteredGear = slotFilter === 'all' ? ownedGear : ownedGear.filter((i) => i.slot === slotFilter);
  const ownedFoods = FOODS.filter((f) => (progress.foodPouch[f.id] || 0) > 0);
  const ownedLoot = LOOT_ITEMS.filter((l) => (progress.lootBag[l.id] || 0) > 0);
  const ownedMaterials = GATHER_AND_MATERIAL_ITEMS.filter((m) => (progress.materialsBag?.[m.id] || 0) > 0);
  const ownedFish = FILIPINO_FISH.filter((f) => (progress.fishBag?.[f.id] || 0) > 0);
  const totalMaterialsCount = ownedMaterials.reduce((s, m) => s + (progress.materialsBag?.[m.id] || 0), 0);
  const totalFishCount = ownedFish.reduce((s, f) => s + (progress.fishBag?.[f.id] || 0), 0);

  const equippedSlots: {
    key: 'outfit' | 'headgear' | 'back' | 'weapon' | 'accessory' | 'hair';
    label: string;
    itemId: string | null;
    canUnequip: boolean;
  }[] = [
    { key: 'outfit', label: 'Outfit', itemId: progress.equippedOutfitId, canUnequip: false },
    { key: 'headgear', label: 'Headgear', itemId: progress.equippedHeadgearId, canUnequip: true },
    { key: 'back', label: 'Back / Satchel', itemId: progress.equippedBackId, canUnequip: true },
    { key: 'weapon', label: 'Weapon', itemId: progress.equippedWeaponId, canUnequip: true },
    { key: 'accessory', label: 'Accessory', itemId: progress.equippedAccessoryId, canUnequip: true },
    { key: 'hair', label: 'Hairstyle', itemId: progress.equippedHairId, canUnequip: false },
  ];

  const isEquipped = (id: string) =>
    progress.equippedOutfitId === id ||
    progress.equippedHairId === id ||
    progress.equippedHeadgearId === id ||
    progress.equippedBackId === id ||
    progress.equippedWeaponId === id ||
    progress.equippedAccessoryId === id;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1520]/80 p-3 sm:p-5">
      <div className="bp-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden">
        {/* Blueprint Header */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#4E728D] bg-[#152739] px-5 py-3.5">
          <div>
            <p className="font-mono text-xs text-[#9BC0D9]">CHARACTER INVENTORY & COSMETICS</p>
            <h2 className="font-display text-xl font-bold text-[#F4C542]">
              Bataan Hero Defender · Lv.{progress.level} · ₱{progress.pesos.toLocaleString()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-display text-xs font-bold text-[#FFFFFF] hover:border-[#F4C542]"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        {/* Two-Column Body: Live Paper-Doll Left + Inventory Tabs Right */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 bp-scroll md:grid-cols-12">
          {/* Left Paper-Doll & Derived Stats */}
          <div className="flex flex-col gap-3 md:col-span-5">
            <div className="bp-card overflow-hidden">
              <canvas
                ref={previewRef}
                width={340}
                height={240}
                className="pixel-canvas block h-56 w-full object-contain"
              />
            </div>

            {/* Derived Stats Grid */}
            <div className="bp-header-plate grid grid-cols-3 gap-2 p-3 font-mono text-xs tabular-nums">
              <div>
                <p className="text-[10px] text-[#9BC0D9]">ATK</p>
                <p className="font-bold text-[#F4C542]">{derivedStats.atk}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9BC0D9]">DEF</p>
                <p className="font-bold text-[#FFFFFF]">{derivedStats.def}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9BC0D9]">CRIT</p>
                <p className="font-bold text-[#7AE582]">
                  {Math.round(derivedStats.critChance * 100)}% ({Math.round((derivedStats.critDamageMult || 1.55) * 100)}%)
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#9BC0D9]">MAX HP</p>
                <p className="font-bold text-[#FCA5A5]">{derivedStats.maxHp}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9BC0D9]">MAX SP</p>
                <p className="font-bold text-[#7DD3FC]">{derivedStats.maxSp}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9BC0D9]">SPEED / MAG</p>
                <p className="font-bold text-[#C084FC]">
                  {Math.round(derivedStats.moveSpeed)} · {Math.round((derivedStats.magicPowerMult || 1) * 100)}%
                </p>
              </div>
            </div>

            {/* Interactive RPG Stat Allocation (STR / VIT / AGI / INT — 3 Points Per Level!) */}
            <div className="bp-header-plate flex flex-col gap-1.5 border-[#F4C542]/70 p-3">
              <div className="flex items-center justify-between gap-2 border-b border-[#2B4861] pb-1.5">
                <div>
                  <p className="font-display text-xs font-bold text-[#F4C542]">RPG STAT ALLOCATION</p>
                  <p className="font-mono text-[10px] text-[#9BC0D9]">+3 Points per Level Up</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                      availStatPoints > 0
                        ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                        : 'border-[#56748B] bg-[#16293B] text-[#9BC0D9]'
                    }`}
                  >
                    PTS: {availStatPoints}
                  </span>
                  {totalSpentStats > 0 && (
                    <button
                      type="button"
                      onClick={onResetStats}
                      title="Reset allocated stat points"
                      className="flex cursor-pointer items-center gap-1 border border-[#7FA4BE] bg-[#22384D] px-2 py-0.5 font-mono text-[10px] text-[#FFFFFF] hover:border-[#F4C542]"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
              {(
                [
                  { key: 'str', label: 'STR', color: 'text-[#F4C542]', bonus: '+3 ATK · +1% Crit DMG' },
                  { key: 'vit', label: 'VIT', color: 'text-[#FCA5A5]', bonus: '+22 Max HP · +1 DEF' },
                  { key: 'agi', label: 'AGI', color: 'text-[#7AE582]', bonus: '+0.6% Crit · +3 Speed' },
                  { key: 'int', label: 'INT', color: 'text-[#C084FC]', bonus: '+15 Max SP · +4% Magic' },
                ] as const
              ).map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-2 py-0.5 font-mono text-xs">
                  <div className="min-w-0">
                    <span className={`font-bold ${row.color}`}>{row.label}</span>
                    <span className="ml-2 font-bold text-[#FFFFFF] tabular-nums">{alloc[row.key]}</span>
                    <span className="ml-2 text-[10px] text-[#9BC0D9]">{row.bonus}</span>
                  </div>
                  <button
                    type="button"
                    disabled={availStatPoints <= 0}
                    onClick={() => onAllocateStat(row.key)}
                    className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border-2 border-[#FFF0B3] bg-[#F4C542] text-[#102030] hover:bg-[#FFD45C] disabled:cursor-not-allowed disabled:border-[#56748B] disabled:bg-[#16293B] disabled:text-[#6B8599]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* 6 Equipped Slots Summary */}
            <div className="bp-header-plate flex flex-col divide-y divide-[#2B4861] p-3">
              {equippedSlots.map((s) => {
                const item = getGearById(s.itemId);
                return (
                  <div key={s.key} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] text-[#9BC0D9]">{s.label}: </span>
                      <span className={`font-semibold ${item ? RARITY_COLOR[item.rarity] : 'text-[#7F9AB0]'}`}>
                        {item ? item.name : 'Empty (None)'}
                      </span>
                    </div>
                    {s.canUnequip && item && (
                      <button
                        type="button"
                        onClick={() => onUnequipSlot(s.key as 'headgear' | 'back' | 'weapon' | 'accessory')}
                        className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#22384D] px-2 py-0.5 font-mono text-[10px] text-[#FFFFFF] hover:border-[#F4C542]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Signature Tools: Defender Umbrella & Green Bicycle */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!progress.hasUmbrella}
                onClick={onToggleUmbrella}
                className="flex-1 cursor-pointer whitespace-nowrap border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-2 font-mono text-xs font-semibold text-[#FFFFFF] hover:border-[#F4C542] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Defender Umbrella: {progress.hasUmbrella ? (progress.umbrellaOpen ? 'Open [U]' : 'Closed [U]') : 'Locked'}
              </button>
              <button
                type="button"
                disabled={!progress.hasBike}
                onClick={onToggleBike}
                className="flex-1 cursor-pointer whitespace-nowrap border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-2 font-mono text-xs font-semibold text-[#FFFFFF] hover:border-[#F4C542] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Green Bicycle: {progress.hasBike ? (progress.ridingBike ? 'Riding [R]' : 'Parked [R]') : 'Locked'}
              </button>
            </div>
          </div>

          {/* Right Inventory Tabs */}
          <div className="flex flex-col gap-3 md:col-span-7">
            <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#3C5E77] pb-3">
              <button
                type="button"
                onClick={() => setTab('gear')}
                className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-1.5 font-display text-xs font-bold ${
                  tab === 'gear'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                Gear & Cosmetics ({ownedGear.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('bike')}
                className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 border-2 px-3.5 py-1.5 font-display text-xs font-bold ${
                  tab === 'bike'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                <Bike className="h-3.5 w-3.5" />
                Bike Skins ({progress.unlockedBikeSkinIds.length}/{BIKE_SKINS.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('food')}
                className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-1.5 font-display text-xs font-bold ${
                  tab === 'food'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                Snacks & Drinks ({ownedFoods.reduce((sum, f) => sum + (progress.foodPouch[f.id] || 0), 0)})
              </button>
              <button
                type="button"
                onClick={() => setTab('loot')}
                className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3 py-1.5 font-display text-xs font-bold ${
                  tab === 'loot'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                Loot ({ownedLoot.reduce((sum, l) => sum + (progress.lootBag[l.id] || 0), 0)})
              </button>
              <button
                type="button"
                onClick={() => setTab('materials')}
                className={`flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 px-3 py-1.5 font-display text-xs font-bold ${
                  tab === 'materials'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                <Leaf className="h-3.5 w-3.5" />
                Materials ({totalMaterialsCount})
              </button>
              <button
                type="button"
                onClick={() => setTab('fish')}
                className={`flex cursor-pointer items-center gap-1 whitespace-nowrap shrink-0 border-2 px-3 py-1.5 font-display text-xs font-bold ${
                  tab === 'fish'
                    ? 'border-[#FFF0B3] bg-[#F4C542] text-[#102030]'
                    : 'border-[#7FA4BE] bg-[#22384D] text-[#FFFFFF]'
                }`}
              >
                <Fish className="h-3.5 w-3.5" />
                Fish ({totalFishCount})
              </button>
            </div>

            {tab === 'bike' && (
              <div className="flex flex-col gap-2.5">
                <div className="bp-header-plate flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="font-display text-sm font-bold text-[#F4C542]">
                      Active Bicycle Paint: {getBikeSkinById(progress.equippedBikeSkinId).name}
                    </p>
                    <p className="font-mono text-[11px] text-[#C8DFEE]">
                      {progress.hasBike
                        ? 'Tip: Toggle "Riding [R]" on the left to preview your customized bicycle live!'
                        : 'Buy the Green Bicycle from Kuya Rico’s Talyer in Orani or unlock skins via Trophies [V]!'}
                    </p>
                  </div>
                </div>
                {BIKE_SKINS.map((skin) => {
                  const unlocked = progress.unlockedBikeSkinIds.includes(skin.id);
                  const equipped = progress.equippedBikeSkinId === skin.id;
                  return (
                    <div key={skin.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#09121B]"
                          style={{
                            background: `linear-gradient(135deg, ${skin.frameColor} 0%, ${skin.frameHighlight} 100%)`,
                          }}
                        >
                          <Bike className="h-5 w-5 text-[#09121B]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-display text-sm font-bold ${RARITY_COLOR[skin.rarity]}`}>
                              {skin.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#9BC0D9]">{skin.rarity}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#E4EFF7]">{skin.description}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#5EEAD4]">
                            {unlocked ? '✓ Unlocked · Persistent Across Awakened Cycles' : skin.unlockHint}
                          </p>
                        </div>
                      </div>
                      {unlocked ? (
                        <button
                          type="button"
                          disabled={equipped}
                          onClick={() => onEquipBikeSkin(skin.id)}
                          className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3.5 py-1.5 font-display text-xs font-bold ${
                            equipped
                              ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                              : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] hover:bg-[#FFD45C]'
                          }`}
                        >
                          {equipped ? 'Equipped' : 'Apply Skin'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-[#56748B] bg-[#142332] px-3 py-1.5 font-mono text-[11px] text-[#8CA8BE]">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'gear' && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'outfit', 'headgear', 'back', 'weapon', 'accessory', 'hair'] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSlotFilter(slot)}
                      className={`cursor-pointer whitespace-nowrap shrink-0 border px-2.5 py-1 font-mono text-[11px] font-semibold capitalize ${
                        slotFilter === slot
                          ? 'border-[#F4C542] bg-[#36566E] text-[#F4C542]'
                          : 'border-[#56748B] bg-[#16293B] text-[#C8DFEE]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5">
                  {filteredGear.map((item) => {
                    const equipped = isEquipped(item.id);
                    return (
                      <div key={item.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`font-display text-sm font-bold ${RARITY_COLOR[item.rarity]}`}>
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#C8DFEE]">
                              {item.rarity} · {item.slot}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#E4EFF7]">{item.description}</p>
                          <p className="mt-1 font-mono text-[11px] text-[#F4C542]">{item.statNote}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={equipped}
                            onClick={() => onEquipGear(item.id)}
                            className={`cursor-pointer whitespace-nowrap shrink-0 border-2 px-3 py-1.5 font-display text-xs font-bold ${
                              equipped
                                ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                                : 'border-[#FFF0B3] bg-[#F4C542] text-[#102030] hover:bg-[#FFD45C]'
                            }`}
                          >
                            {equipped ? 'Equipped' : 'Equip'}
                          </button>
                          {!equipped && item.sellValue > 0 && (
                            <button
                              type="button"
                              onClick={() => onSellGear(item.id)}
                              className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#16293B] px-2.5 py-1.5 font-mono text-xs text-[#E4EFF7] hover:border-[#F4C542]"
                            >
                              Sell ₱{item.sellValue}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {tab === 'food' && (
              <div className="flex flex-col gap-2.5">
                {ownedFoods.length === 0 ? (
                  <div className="bp-header-plate p-6 text-center text-sm text-[#C8DFEE]">
                    Your snack pouch is empty. Visit 7-Elevate, O!Sulit, Mamang Sorbetero, or Ate Linda to buy Bataan Cashew and Arid Bottles!
                  </div>
                ) : (
                  ownedFoods.map((food) => {
                    const qty = progress.foodPouch[food.id] || 0;
                    const quick = progress.equippedFoodId === food.id;
                    return (
                      <div key={food.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold text-[#F4C542]">
                            {food.name} · x{qty}
                          </p>
                          <p className="mt-1 text-xs text-[#E4EFF7]">{food.description}</p>
                          <p className="mt-1 font-mono text-[11px] text-[#7AE582]">
                            +{food.hpRestore} HP · +{food.spRestore} SP · +{food.energyRestore} Energy
                            {food.buff ? ` · ★ ${food.buff.label} (${Math.round(food.buff.durationSec / 60)}m)` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEatFood(food.id)}
                            className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-3 py-1.5 font-display text-xs font-bold text-[#102030]"
                          >
                            Use Now
                          </button>
                          <button
                            type="button"
                            onClick={() => onEquipFood(food.id)}
                            className={`cursor-pointer whitespace-nowrap shrink-0 border px-2.5 py-1.5 font-mono text-xs ${
                              quick
                                ? 'border-[#7AE582] bg-[#1D3E2E] text-[#7AE582]'
                                : 'border-[#7FA4BE] bg-[#16293B] text-[#FFFFFF]'
                            }`}
                          >
                            {quick ? 'Quick [F]' : 'Set [F]'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSellFood(food.id)}
                            className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7FA4BE] bg-[#16293B] px-2.5 py-1.5 font-mono text-xs text-[#E4EFF7]"
                          >
                            Sell ₱{food.sellValue}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'loot' && (
              <div className="flex flex-col gap-2.5">
                {ownedLoot.length === 0 ? (
                  <div className="bp-header-plate p-6 text-center text-sm text-[#C8DFEE]">
                    No Evidence Folders or Corrupt Ledgers collected yet. Defeat thugs, corrupt officials, and folklore foes across Bataan!
                  </div>
                ) : (
                  ownedLoot.map((loot) => {
                    const qty = progress.lootBag[loot.id] || 0;
                    return (
                      <div key={loot.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className={`font-display text-sm font-bold ${RARITY_COLOR[loot.rarity]}`}>
                            {loot.name} · x{qty}
                          </p>
                          <p className="mt-1 text-xs text-[#E4EFF7]">{loot.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSellLoot(loot.id)}
                          className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-3.5 py-1.5 font-mono text-xs font-bold text-[#102030]"
                        >
                          Turn In · +₱{loot.sellValue}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'materials' && (
              <div className="flex flex-col gap-2.5">
                {ownedMaterials.length === 0 ? (
                  <div className="bp-header-plate p-6 text-center text-sm text-[#C8DFEE]">
                    No Herbs, Vegetables, Fruits, Ores, or Monster Materials yet. Gather wild plants across Bataan, hunt rodents in Palayan Farming Grounds, or mine ores in Mt. Natib Cave!
                  </div>
                ) : (
                  ownedMaterials.map((mat) => {
                    const qty = progress.materialsBag?.[mat.id] || 0;
                    const edible = Boolean(mat.hpRestore || mat.spRestore);
                    return (
                      <div key={mat.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className="h-8 w-8 shrink-0 border-2 border-[#09121B]"
                            style={{ background: `linear-gradient(135deg, ${mat.color}, ${mat.accentColor})` }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`font-display text-sm font-bold ${RARITY_COLOR[mat.rarity]}`}>
                                {mat.name} · x{qty}
                              </p>
                              <span className="font-mono text-[10px] uppercase text-[#9BC0D9]">
                                {mat.category.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#E4EFF7]">{mat.description}</p>
                            {edible && (
                              <p className="mt-0.5 font-mono text-[11px] text-[#7AE582]">
                                Raw Eat: {mat.hpRestore ? `+${mat.hpRestore} HP` : ''}{' '}
                                {mat.spRestore ? `+${mat.spRestore} SP` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {edible && (
                            <button
                              type="button"
                              onClick={() => onConsumeMaterial(mat.id)}
                              className="cursor-pointer whitespace-nowrap shrink-0 border border-[#7AE582] bg-[#1D3E2E] px-2.5 py-1.5 font-mono text-xs font-bold text-[#7AE582] hover:bg-[#25523D]"
                            >
                              Eat Raw
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSellMaterial(mat.id)}
                            className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-3 py-1.5 font-mono text-xs font-bold text-[#102030]"
                          >
                            Sell · +₱{mat.sellValue}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'fish' && (
              <div className="flex flex-col gap-2.5">
                <div className="bp-header-plate flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="font-display text-sm font-bold text-[#7DD3FC]">
                      Bamboo Fishing Rod: {progress.hasFishingRod ? 'Owned ✓' : 'Not Owned (Buy at Town Shops · ₱120)'}
                    </p>
                    <p className="font-mono text-[11px] text-[#C8DFEE]">
                      Fish at marked docks in Orani, Orion, Bagac, or Morong. Cook your catch into Sinigang, Inihaw, Paksiw, Adobo, or Kinilaw!
                    </p>
                  </div>
                </div>
                {ownedFish.length === 0 ? (
                  <div className="bp-header-plate p-6 text-center text-sm text-[#C8DFEE]">
                    Your fish basket is empty. Cast your Bamboo Fishing Rod at coastal Bataan docks!
                  </div>
                ) : (
                  ownedFish.map((fish) => {
                    const qty = progress.fishBag?.[fish.id] || 0;
                    return (
                      <div key={fish.id} className="bp-card flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#09121B]"
                            style={{ background: `linear-gradient(135deg, ${fish.color}, ${fish.accentColor})` }}
                          >
                            <Fish className="h-4 w-4 text-[#09121B]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`font-display text-sm font-bold ${RARITY_COLOR[fish.rarity]}`}>
                              {fish.name} · x{qty}
                            </p>
                            <p className="mt-0.5 text-xs text-[#E4EFF7]">{fish.filipinoNote}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-[#5EEAD4]">
                              {fish.rarity} · Ideal for {fish.cookingTag.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSellFish(fish.id)}
                          className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-3.5 py-1.5 font-mono text-xs font-bold text-[#102030]"
                        >
                          Sell · +₱{fish.sellValue}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
