import React, { useEffect, useRef, useState } from 'react';
import { englishVoice, noirAudio } from '../game/audio';
import { drawStoryPlate } from '../game/noirRenderer';
import { initSpriteAtlases } from '../game/spriteAtlas';
import { STORY_INTRO_BEATS } from '../game/worldData';

interface StoryIntroProps {
  voiceEnabled: boolean;
  onComplete: () => void;
}

export const StoryIntro: React.FC<StoryIntroProps> = ({ voiceEnabled, onComplete }) => {
  const [index, setIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beat = STORY_INTRO_BEATS[index];

  useEffect(() => {
    initSpriteAtlases();
    noirAudio.playStoryChord(index);
    if (voiceEnabled && beat.voiceLine) {
      englishVoice.speak(beat.voiceLine, { pitch: 0.96, rate: 0.98, style: 'kapitan' });
    }
    return () => {
      englishVoice.stop();
    };
  }, [index, voiceEnabled, beat.voiceLine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      drawStoryPlate(ctx, canvas.width, canvas.height, beat.sceneKind, t);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [beat.sceneKind]);

  const handleNext = () => {
    englishVoice.stop();
    if (index < STORY_INTRO_BEATS.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="bp-grid-bg flex h-full w-full items-center justify-center p-4 sm:p-6">
      <div className="bp-panel w-full max-w-4xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#3C5E77] pb-3">
          <div>
            <p className="font-mono text-xs font-semibold text-[#9BC0D9]">{beat.chapterLabel}</p>
            <h1 className="font-display text-2xl font-bold text-[#F4C542] sm:text-3xl">{beat.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => englishVoice.speak(beat.voiceLine, { pitch: 0.96, rate: 0.98, style: 'kapitan' })}
              className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#22384D] px-3 py-1.5 font-mono text-xs font-semibold text-[#FFFFFF] hover:border-[#F4C542]"
            >
              Replay English Voice
            </button>
            <button
              type="button"
              onClick={() => {
                englishVoice.stop();
                onComplete();
              }}
              className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#7FA4BE] bg-[#16293B] px-3 py-1.5 font-mono text-xs font-semibold text-[#C8DFEE] hover:text-[#FFFFFF]"
            >
              Skip Intro
            </button>
          </div>
        </div>

        <div className="bp-card mt-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={840}
            height={310}
            className="pixel-canvas block h-56 w-full object-cover sm:h-72"
          />
        </div>

        <div className="mt-4 bg-[#152739] p-4 border-2 border-[#4E728D]">
          <p className="text-base leading-relaxed text-[#F1F6FA]">{beat.body}</p>
          <p className="mt-2 font-mono text-xs text-[#F4C542]">{beat.caption}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="font-mono text-xs text-[#9BC0D9] tabular-nums">
            Slide {index + 1} / {STORY_INTRO_BEATS.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="cursor-pointer whitespace-nowrap shrink-0 border-2 border-[#FFF0B3] bg-[#F4C542] px-6 py-2.5 font-display text-sm font-bold text-[#102030] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#FFD45C]"
          >
            {index < STORY_INTRO_BEATS.length - 1 ? 'Next Chapter' : 'Enter Defender Home'}
          </button>
        </div>
      </div>
    </div>
  );
};
