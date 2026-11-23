import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Sun, Trophy } from 'lucide-react';
import { englishVoice, noirAudio } from '../game/audio';
import { COVER_ART_URL } from '../game/spriteAtlas';
import { PlayerProgress } from '../game/types';

interface CreditsScreenProps {
  progress: PlayerProgress;
  onProceedToWakeup: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ progress, onProceedToWakeup }) => {
  const [revealReady, setRevealReady] = useState(false);

  useEffect(() => {
    noirAudio.playVictory();
    if (progress.voiceEnabled) {
      englishVoice.speak(
        'Congratulations, Bataan Hero Defender! You shattered El Mastermind and liberated all two hundred thirty-seven barangays of Bataan! Game created by Juan dot E X E.',
        { pitch: 1.0, rate: 0.96, style: 'kapitan' }
      );
    }
    const timer = window.setTimeout(() => setRevealReady(true), 1200);
    return () => {
      window.clearTimeout(timer);
      englishVoice.stop();
    };
  }, [progress.voiceEnabled]);

  return (
    <div className="bp-grid-bg relative flex h-full w-full items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="bp-panel relative w-full max-w-4xl overflow-hidden">
        {/* Heroic Cover Art Header Banner */}
        <div className="relative h-56 w-full overflow-hidden border-b-2 border-[#7FA4BE] bg-[#0F1E2C] sm:h-64">
          <img
            src={COVER_ART_URL}
            alt="Bataan: Stand Against Corruption Cover Art"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#132334] via-[#132334]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-center">
            <p className="font-mono text-xs font-bold tracking-widest text-[#7AE582]">
              EL MASTERMIND DEFEATED · PROVINCE OF BATAAN LIBERATED
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-[#F4C542] sm:text-5xl">
              VICTORY CREDITS
            </h1>
          </div>
        </div>

        {/* Credits Roll & Maker Spotlight */}
        <div className="space-y-5 p-6 text-center">
          <div className="arcade-gold-plate mx-auto max-w-xl px-6 py-4">
            <p className="font-mono text-xs font-semibold tracking-wider text-[#9BC0D9]">GAME MAKER & CREATOR</p>
            <p className="mt-1 font-display text-3xl font-bold tracking-wider text-[#F4C542] sm:text-4xl">
              Juan.exe
            </p>
            <p className="mt-1.5 text-xs text-[#E4EFF7]">
              Creator, Vision, Bataan Worldbuilding & Anti-Corruption Action-RPG Direction
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <div className="bp-card p-3.5">
              <p className="font-mono text-[11px] font-bold text-[#F4C542]">THE DEFENDER’S JOURNEY</p>
              <p className="mt-1 text-xs leading-relaxed text-[#FFFFFF]">
                12 Bataan Municipalities · 237 Official Barangays · 24 Corrupt Officials · El Mastermind Shattered.
              </p>
            </div>
            <div className="bp-card p-3.5">
              <p className="font-mono text-[11px] font-bold text-[#F4C542]">CAMPAIGN RECORD</p>
              <p className="mt-1 font-mono text-xs text-[#FFFFFF] tabular-nums">
                Level {progress.level} · {progress.bossProgression.collectedDrops.length}/24 Evidence ·{' '}
                {progress.metHeroGhostIds.length}/5 Hero Spirits · {progress.unlockedAchievementIds.length} Trophies
              </p>
            </div>
            <div className="bp-card p-3.5">
              <p className="font-mono text-[11px] font-bold text-[#F4C542]">SPECIAL THANKS</p>
              <p className="mt-1 text-xs leading-relaxed text-[#FFFFFF]">
                To every honest citizen of Bataan, the brave spirits of our National Heroes, and every player standing
                against corruption.
              </p>
            </div>
          </div>

          <div className="border-t-2 border-[#3C5E77] pt-5">
            <p className="font-mono text-xs text-[#C8DFEE]">
              Wait... why is the Balanga morning sunlight suddenly glowing so brightly?
            </p>
            <button
              type="button"
              onClick={() => {
                englishVoice.stop();
                noirAudio.playWakeUpChime();
                onProceedToWakeup();
              }}
              className={`mt-4 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border-2 border-[#FFF0B3] bg-[#F4C542] px-7 py-3 font-display text-sm font-bold text-[#102030] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#FFD45C] ${
                revealReady ? 'opacity-100' : 'opacity-90'
              }`}
            >
              <Sun className="h-4 w-4" />
              Continue After Credits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DreamWakeupScreenProps {
  progress: PlayerProgress;
  onEnterAwakenedMode: () => void;
}

export const DreamWakeupScreen: React.FC<DreamWakeupScreenProps> = ({ progress, onEnterAwakenedMode }) => {
  const nextCycle = progress.awakenedCount + 1;

  useEffect(() => {
    noirAudio.playWakeUpChime();
    if (progress.voiceEnabled) {
      englishVoice.speak(
        'Ahh... it is time to wake up! Wait—was the whole battle against El Mastermind just a dream? No... my gear, my cosmetics, and my bicycle skins are still here! The real fight in Awakened Bataan starts now!',
        { pitch: 1.04, rate: 0.98, style: 'kapitan' }
      );
    }
    return () => englishVoice.stop();
  }, [progress.voiceEnabled]);

  return (
    <div className="bp-grid-bg flex h-full w-full items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="bp-panel w-full max-w-3xl border-[#F4C542] p-6 sm:p-8">
        <div className="bp-header-plate px-5 py-4 text-center">
          <p className="font-mono text-xs font-bold tracking-widest text-[#5EEAD4]">
            DEFENDER HOME · EARLY MORNING DAWN
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-bold text-[#F4C542] sm:text-4xl">
            “Ahh... it’s time to wake up!”
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#F1F6FA]">
            You jolt awake in your bed at Defender Home as roosters crow outside. The victory over El Mastermind was a
            vivid prophetic dream—yet the corruption across Bataan is very real, and now every enemy is smarter,
            stronger, and armed with tactical shields and gunfire!
          </p>
        </div>

        {/* What Carries Over + What Unlocks in Awakened Mode */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="bp-card p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-[#7AE582]">
              <Trophy className="h-4 w-4" />
              Carried Over from Your Dream
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-[#FFFFFF]">
              <li>· All Unlocked Gear, Special Cosmetics & Cultural Relics ({progress.ownedGearIds.length})</li>
              <li>· All Unlocked Bicycle Cosmetics & Skins ({progress.unlockedBikeSkinIds.length})</li>
              <li>· All Earned Trophies & Achievements ({progress.unlockedAchievementIds.length})</li>
              <li>· Unlocked Reward: Awakened Golden Barong + Jeepney Chrome Bike Skin!</li>
            </ul>
          </div>

          <div className="bp-card p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-[#F4C542]">
              <Sparkles className="h-4 w-4" />
              New in Awakened Mode (Cycle {nextCycle})
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-[#FFFFFF]">
              <li>· New Boss: Corrupt Barangay Captain (Dinalupihan Checkpoint)</li>
              <li>· New Boss: Corrupt Congressman (Balanga Capitol Approach)</li>
              <li>· Stronger Tactical Enemies: Break Shields [L] & Deflect Gunfire [K]!</li>
              <li>· Spectral National Hero Ghosts & New Achievement Unlocks!</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#3C5E77] pt-5">
          <div className="flex items-center gap-2 font-mono text-xs text-[#9BC0D9]">
            <Award className="h-4 w-4 text-[#F4C542]" />
            <span>Awakened Cycle {nextCycle} · Tactical Combat Active</span>
          </div>
          <button
            type="button"
            onClick={() => {
              englishVoice.stop();
              noirAudio.playVictory();
              onEnterAwakenedMode();
            }}
            className="cursor-pointer whitespace-nowrap border-2 border-[#FFF0B3] bg-[#F4C542] px-6 py-3 font-display text-sm font-bold text-[#102030] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#FFD45C]"
          >
            Wake Up into Awakened Mode
          </button>
        </div>
      </div>
    </div>
  );
};
