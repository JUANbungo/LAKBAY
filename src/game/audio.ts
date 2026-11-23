import { GAME_CONFIG } from './gameConfig';
import { BgmTrackId, VoiceProfile } from './types';

// Musical note frequency table (Hz) for 8-bit Filipino folk song chiptune sequencer
const N: Record<string, number> = {
  R: 0,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.0, G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, A5: 880.0, B5: 987.77,
};

interface ChiptuneTrack {
  id: BgmTrackId;
  label: string;
  stepMs: number;
  lead: string[];
  bass: string[];
  harmony: string[];
  percussion: number[];
}

export const BGM_TRACK_LABELS: Record<BgmTrackId, string> = {
  title_march: '8-Bit Bataan March',
  bahay_kubo: '8-Bit Bahay Kubo',
  leron_leron: '8-Bit Leron Leron',
  sitsiritsit: '8-Bit Sitsiritsit',
  haunted_kundiman: '8-Bit Haunted Folk',
  boss_battle: '8-Bit Boss Battle',
};

const TRACKS: Record<BgmTrackId, ChiptuneTrack> = {
  bahay_kubo: {
    id: 'bahay_kubo',
    label: BGM_TRACK_LABELS.bahay_kubo,
    stepMs: 215,
    lead: [
      'G4', 'C5', 'C5', 'D5', 'C5', 'B4',
      'A4', 'A4', 'G4', 'E4', 'G4', 'R',
      'A4', 'B4', 'C5', 'B4', 'A4', 'G4',
      'F4', 'E4', 'D4', 'D4', 'R', 'G4',
      'G4', 'C5', 'C5', 'D5', 'E5', 'D5',
      'C5', 'A4', 'G4', 'E4', 'G4', 'R',
      'A4', 'G4', 'F4', 'E4', 'D4', 'G4',
      'C5', 'C5', 'R', 'E5', 'D5', 'C5',
    ],
    bass: [
      'C3', 'G3', 'G3', 'C3', 'G3', 'G3',
      'F3', 'C4', 'C4', 'C3', 'G3', 'G3',
      'F3', 'C4', 'C4', 'C3', 'G3', 'G3',
      'G3', 'D3', 'D3', 'G3', 'D3', 'G3',
      'C3', 'G3', 'G3', 'C3', 'G3', 'G3',
      'F3', 'C4', 'C4', 'C3', 'G3', 'G3',
      'F3', 'C4', 'G3', 'G3', 'D3', 'G3',
      'C3', 'G3', 'C3', 'G3', 'G3', 'C3',
    ],
    harmony: [
      'R', 'E4', 'E4', 'R', 'E4', 'R',
      'R', 'F4', 'E4', 'R', 'E4', 'R',
      'R', 'F4', 'A4', 'R', 'E4', 'R',
      'R', 'D4', 'B3', 'B3', 'R', 'R',
      'R', 'E4', 'E4', 'R', 'G4', 'R',
      'R', 'F4', 'E4', 'R', 'E4', 'R',
      'R', 'C4', 'B3', 'R', 'B3', 'R',
      'E4', 'E4', 'R', 'G4', 'F4', 'E4',
    ],
    percussion: [
      1, 0, 2, 1, 0, 2,
      1, 0, 2, 1, 0, 2,
      1, 0, 2, 1, 0, 2,
      1, 0, 2, 1, 2, 2,
      1, 0, 2, 1, 0, 2,
      1, 0, 2, 1, 0, 2,
      1, 0, 2, 1, 0, 2,
      1, 2, 0, 1, 0, 2,
    ],
  },
  leron_leron: {
    id: 'leron_leron',
    label: BGM_TRACK_LABELS.leron_leron,
    stepMs: 175,
    lead: [
      'G4', 'A4', 'G4', 'F4', 'E4', 'C4', 'E4', 'G4',
      'C5', 'C5', 'B4', 'A4', 'G4', 'R', 'G4', 'R',
      'F4', 'G4', 'A4', 'F4', 'E4', 'F4', 'G4', 'E4',
      'D4', 'E4', 'F4', 'D4', 'C4', 'R', 'G4', 'R',
      'E5', 'E5', 'D5', 'C5', 'D5', 'C5', 'B4', 'A4',
      'G4', 'C5', 'E5', 'D5', 'C5', 'R', 'G4', 'A4',
      'F4', 'A4', 'G4', 'E4', 'D4', 'G4', 'B4', 'D5',
      'C5', 'R', 'E5', 'G5', 'C5', 'R', 'R', 'R',
    ],
    bass: [
      'C3', 'G3', 'C3', 'G3', 'C3', 'G3', 'C3', 'G3',
      'F3', 'C4', 'F3', 'C4', 'C3', 'G3', 'C3', 'G3',
      'F3', 'C4', 'F3', 'C4', 'C3', 'G3', 'C3', 'G3',
      'G3', 'D3', 'G3', 'D3', 'C3', 'G3', 'C3', 'G3',
      'C3', 'G3', 'C3', 'G3', 'F3', 'C4', 'F3', 'C4',
      'C3', 'G3', 'G3', 'D3', 'C3', 'G3', 'C3', 'G3',
      'F3', 'C4', 'C3', 'G3', 'G3', 'D3', 'G3', 'D3',
      'C3', 'G3', 'C3', 'G3', 'C3', 'G3', 'C3', 'R',
    ],
    harmony: [
      'E4', 'R', 'E4', 'R', 'C4', 'R', 'C4', 'E4',
      'A4', 'A4', 'R', 'F4', 'E4', 'R', 'E4', 'R',
      'A4', 'R', 'F4', 'R', 'G4', 'R', 'E4', 'R',
      'B3', 'R', 'D4', 'R', 'E4', 'R', 'E4', 'R',
      'G4', 'G4', 'R', 'E4', 'F4', 'R', 'D4', 'R',
      'E4', 'R', 'G4', 'F4', 'E4', 'R', 'E4', 'R',
      'C4', 'F4', 'E4', 'C4', 'B3', 'D4', 'G4', 'F4',
      'E4', 'R', 'G4', 'E5', 'E4', 'R', 'R', 'R',
    ],
    percussion: [
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 0, 2, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 0, 2, 0,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 0, 2, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 0, 0, 0,
    ],
  },
  sitsiritsit: {
    id: 'sitsiritsit',
    label: BGM_TRACK_LABELS.sitsiritsit,
    stepMs: 165,
    lead: [
      'D4', 'G4', 'G4', 'G4', 'A4', 'B4', 'B4', 'R',
      'A4', 'B4', 'C5', 'A4', 'B4', 'G4', 'G4', 'R',
      'D5', 'D5', 'C5', 'B4', 'C5', 'B4', 'A4', 'R',
      'A4', 'B4', 'C5', 'A4', 'G4', 'R', 'D4', 'R',
      'B4', 'B4', 'C5', 'D5', 'E5', 'D5', 'C5', 'B4',
      'A4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4',
      'G4', 'A4', 'B4', 'G4', 'A4', 'Fs4', 'D4', 'Fs4',
      'G4', 'B4', 'D5', 'G5', 'G4', 'R', 'R', 'R',
    ],
    bass: [
      'G3', 'D3', 'G3', 'D3', 'G3', 'D3', 'G3', 'D3',
      'D3', 'A3', 'D3', 'A3', 'G3', 'D3', 'G3', 'D3',
      'G3', 'D3', 'G3', 'D3', 'C3', 'G3', 'D3', 'A3',
      'D3', 'A3', 'D3', 'A3', 'G3', 'D3', 'G3', 'D3',
      'G3', 'D3', 'G3', 'D3', 'C3', 'G3', 'C3', 'G3',
      'D3', 'A3', 'D3', 'A3', 'D3', 'A3', 'D3', 'A3',
      'G3', 'D3', 'G3', 'D3', 'D3', 'A3', 'D3', 'A3',
      'G3', 'D3', 'G3', 'D3', 'G3', 'R', 'R', 'R',
    ],
    harmony: [
      'R', 'B3', 'D4', 'B3', 'R', 'D4', 'G4', 'R',
      'Fs4', 'R', 'A4', 'Fs4', 'G4', 'D4', 'B3', 'R',
      'G4', 'G4', 'R', 'D4', 'E4', 'R', 'Fs4', 'R',
      'Fs4', 'R', 'A4', 'Fs4', 'B3', 'R', 'R', 'R',
      'D4', 'D4', 'E4', 'G4', 'G4', 'R', 'E4', 'D4',
      'Fs4', 'Fs4', 'G4', 'A4', 'Fs4', 'R', 'D4', 'C4',
      'B3', 'R', 'D4', 'B3', 'C4', 'A3', 'Fs3', 'A3',
      'B3', 'D4', 'G4', 'B4', 'B3', 'R', 'R', 'R',
    ],
    percussion: [
      1, 0, 2, 0, 1, 2, 2, 0,
      1, 0, 2, 0, 1, 2, 2, 0,
      1, 0, 2, 0, 1, 0, 2, 2,
      1, 0, 2, 0, 1, 2, 0, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 0, 2, 0, 1, 0, 2, 2,
      1, 2, 1, 2, 1, 0, 0, 0,
    ],
  },
  haunted_kundiman: {
    id: 'haunted_kundiman',
    label: BGM_TRACK_LABELS.haunted_kundiman,
    stepMs: 240,
    lead: [
      'A4', 'F4', 'D4', 'A4', 'Bb4', 'A4', 'G4', 'R',
      'G4', 'E4', 'Cs4', 'A4', 'G4', 'F4', 'E4', 'R',
      'D4', 'F4', 'A4', 'D5', 'C5', 'Bb4', 'A4', 'G4',
      'F4', 'E4', 'D4', 'Cs4', 'D4', 'R', 'R', 'R',
    ],
    bass: [
      'D3', 'A3', 'D3', 'A3', 'Bb3', 'F3', 'G3', 'D3',
      'A3', 'E3', 'A3', 'E3', 'A3', 'E3', 'A3', 'E3',
      'D3', 'A3', 'F3', 'C4', 'G3', 'D3', 'A3', 'E3',
      'Bb3', 'G3', 'A3', 'E3', 'D3', 'A3', 'D3', 'R',
    ],
    harmony: [
      'F4', 'R', 'A3', 'R', 'D4', 'R', 'Bb3', 'R',
      'E4', 'R', 'A3', 'R', 'Cs4', 'R', 'A3', 'R',
      'A3', 'D4', 'F4', 'A4', 'G4', 'R', 'E4', 'R',
      'D4', 'Bb3', 'A3', 'G3', 'F3', 'R', 'R', 'R',
    ],
    percussion: [
      1, 0, 0, 2, 0, 0, 1, 0,
      0, 2, 0, 0, 1, 0, 2, 0,
      1, 0, 0, 2, 1, 0, 2, 0,
      1, 0, 2, 0, 1, 0, 0, 0,
    ],
  },
  boss_battle: {
    id: 'boss_battle',
    label: BGM_TRACK_LABELS.boss_battle,
    stepMs: 128,
    lead: [
      'A4', 'A4', 'C5', 'A4', 'E5', 'R', 'D5', 'C5',
      'B4', 'C5', 'D5', 'B4', 'E5', 'R', 'E4', 'R',
      'A4', 'A4', 'C5', 'D5', 'E5', 'G5', 'Fs5', 'E5',
      'D5', 'C5', 'B4', 'G4', 'A4', 'R', 'A4', 'R',
      'F5', 'E5', 'D5', 'C5', 'D5', 'E5', 'F5', 'D5',
      'E5', 'D5', 'C5', 'B4', 'C5', 'D5', 'E5', 'C5',
      'D5', 'C5', 'B4', 'A4', 'G4', 'A4', 'B4', 'E5',
      'A5', 'R', 'G5', 'E5', 'A5', 'R', 'E5', 'R',
    ],
    bass: [
      'A3', 'A3', 'E3', 'A3', 'A3', 'A3', 'G3', 'E3',
      'E3', 'E3', 'B3', 'E3', 'E3', 'G3', 'Ab3', 'B3',
      'A3', 'A3', 'E3', 'A3', 'C3', 'C3', 'G3', 'C3',
      'D3', 'D3', 'E3', 'E3', 'A3', 'E3', 'A3', 'E3',
      'F3', 'F3', 'C3', 'F3', 'D3', 'D3', 'A3', 'D3',
      'E3', 'E3', 'B3', 'E3', 'C3', 'C3', 'G3', 'C3',
      'D3', 'D3', 'F3', 'F3', 'E3', 'E3', 'Ab3', 'B3',
      'A3', 'E3', 'A3', 'E3', 'A3', 'E3', 'A3', 'E3',
    ],
    harmony: [
      'E4', 'R', 'A4', 'R', 'C5', 'R', 'B4', 'A4',
      'Ab4', 'R', 'B4', 'R', 'B4', 'R', 'R', 'R',
      'E4', 'R', 'A4', 'B4', 'C5', 'E5', 'D5', 'C5',
      'B4', 'A4', 'Ab4', 'E4', 'E4', 'R', 'E4', 'R',
      'C5', 'R', 'A4', 'R', 'A4', 'R', 'C5', 'A4',
      'B4', 'R', 'Ab4', 'R', 'A4', 'R', 'C5', 'A4',
      'A4', 'R', 'F4', 'R', 'E4', 'R', 'Ab4', 'B4',
      'E5', 'R', 'D5', 'C5', 'E5', 'R', 'B4', 'R',
    ],
    percussion: [
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 2, 2, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 1, 2, 2,
    ],
  },
  title_march: {
    id: 'title_march',
    label: BGM_TRACK_LABELS.title_march,
    stepMs: 170,
    lead: [
      'C5', 'R', 'G4', 'C5', 'E5', 'D5', 'C5', 'R',
      'F5', 'E5', 'D5', 'C5', 'D5', 'R', 'G4', 'R',
      'E5', 'R', 'C5', 'E5', 'G5', 'F5', 'E5', 'D5',
      'C5', 'D5', 'E5', 'D5', 'C5', 'R', 'R', 'R',
    ],
    bass: [
      'C3', 'G3', 'C3', 'G3', 'C3', 'G3', 'C3', 'G3',
      'F3', 'C4', 'F3', 'C4', 'G3', 'D3', 'G3', 'D3',
      'C3', 'G3', 'C3', 'G3', 'F3', 'C4', 'G3', 'D3',
      'C3', 'G3', 'G3', 'D3', 'C3', 'G3', 'C3', 'R',
    ],
    harmony: [
      'E4', 'R', 'E4', 'G4', 'C5', 'B4', 'G4', 'R',
      'A4', 'G4', 'F4', 'A4', 'B4', 'R', 'D4', 'R',
      'G4', 'R', 'G4', 'C5', 'E5', 'D5', 'C5', 'B4',
      'G4', 'B4', 'C5', 'B4', 'E4', 'R', 'R', 'R',
    ],
    percussion: [
      1, 0, 2, 1, 1, 2, 1, 0,
      1, 2, 1, 2, 1, 0, 2, 2,
      1, 0, 2, 1, 1, 2, 1, 2,
      1, 2, 1, 2, 1, 0, 0, 0,
    ],
  },
};

class BataanAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public bgmEnabled = true;
  public sfxVolume = GAME_CONFIG.audio.defaultSfxVolume;
  public bgmVolume = GAME_CONFIG.audio.defaultBgmVolume;

  private activeTrackId: BgmTrackId | null = null;
  private stepIndex = 0;
  private timerId: number | null = null;

  constructor() {
    this.loadVolumes();
  }

  private loadVolumes() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(GAME_CONFIG.audio.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sfxVolume?: number; bgmVolume?: number };
      if (typeof parsed.sfxVolume === 'number') {
        this.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
      }
      if (typeof parsed.bgmVolume === 'number') {
        this.bgmVolume = Math.max(0, Math.min(1, parsed.bgmVolume));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveVolumes() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        GAME_CONFIG.audio.storageKey,
        JSON.stringify({ sfxVolume: this.sfxVolume, bgmVolume: this.bgmVolume })
      );
    } catch {
      // Ignore storage errors
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveVolumes();
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    this.saveVolumes();
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.06,
    delay = 0,
    slideTo?: number
  ) {
    if (!this.enabled || this.sfxVolume <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.scheduleOsc(ctx, freq, duration, type, volume * this.sfxVolume, delay, slideTo);
  }

  private scheduleOsc(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    slideTo?: number
  ) {
    if (freq <= 0) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private schedulePercussion(ctx: AudioContext, hitType: number) {
    if (this.bgmVolume <= 0.001) return;
    if (hitType === 1) {
      this.scheduleOsc(ctx, 130, 0.075, 'triangle', 0.045 * this.bgmVolume, 0, 42);
    } else if (hitType === 2) {
      this.scheduleOsc(ctx, 1480, 0.028, 'square', 0.012 * this.bgmVolume, 0, 620);
    }
  }

  public setBgmEnabled(on: boolean) {
    this.bgmEnabled = on;
    if (!on) {
      this.stopTimerOnly();
    } else if (this.activeTrackId) {
      const target = this.activeTrackId;
      this.activeTrackId = null;
      this.playBgm(target);
    }
  }

  public getActiveTrackLabel(): string {
    if (!this.bgmEnabled) return 'BGM Off';
    return this.activeTrackId ? BGM_TRACK_LABELS[this.activeTrackId] : BGM_TRACK_LABELS.bahay_kubo;
  }

  public playBgm(trackId: BgmTrackId) {
    if (this.activeTrackId === trackId && this.timerId !== null) return;
    this.activeTrackId = trackId;
    this.stopTimerOnly();
    if (!this.bgmEnabled) return;

    const track = TRACKS[trackId];
    if (!track) return;
    this.stepIndex = 0;

    const playStep = () => {
      if (!this.bgmEnabled || !this.activeTrackId) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const t = TRACKS[this.activeTrackId];
      const idx = this.stepIndex % t.lead.length;
      const sec = (t.stepMs / 1000) * 0.85;

      const leadFreq = N[t.lead[idx]] || 0;
      const bassFreq = N[t.bass[idx]] || 0;
      const harmFreq = N[t.harmony[idx]] || 0;
      const perc = t.percussion[idx] || 0;

      const bVol = this.bgmVolume;
      if (bVol > 0.001) {
        if (leadFreq > 0) this.scheduleOsc(ctx, leadFreq, sec, 'square', 0.024 * bVol);
        if (bassFreq > 0) this.scheduleOsc(ctx, bassFreq, sec * 1.1, 'triangle', 0.036 * bVol);
        if (harmFreq > 0) this.scheduleOsc(ctx, harmFreq, sec * 0.75, 'square', 0.011 * bVol);
        if (perc > 0) this.schedulePercussion(ctx, perc);
      }

      this.stepIndex = (this.stepIndex + 1) % t.lead.length;
    };

    playStep();
    this.timerId = window.setInterval(playStep, track.stepMs);
  }

  private stopTimerOnly() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public stopBgm() {
    this.stopTimerOnly();
    this.activeTrackId = null;
  }

  public playBikeBell() {
    this.playTone(1320, 0.14, 'triangle', 0.055, 0);
    this.playTone(1760, 0.22, 'triangle', 0.055, 0.09);
  }

  public playUmbrellaBlock() {
    this.playTone(460, 0.09, 'square', 0.05, 0, 880);
    this.playTone(920, 0.11, 'triangle', 0.04, 0.04, 620);
  }

  public playWhistle() {
    this.playTone(2100, 0.09, 'sine', 0.045, 0, 2650);
    this.playTone(2550, 0.14, 'sine', 0.045, 0.09, 1950);
  }

  public playMastermindFlash() {
    this.playTone(120, 0.48, 'sawtooth', 0.085, 0, 42);
    this.playTone(880, 0.32, 'square', 0.055, 0.04, 160);
  }

  public playVoiceBlip(pitch = 1.0) {
    if (!this.enabled) return;
    const base = 310 * Math.max(0.65, Math.min(1.5, pitch));
    this.playTone(base, 0.055, 'square', 0.028, 0, base * 1.12);
    this.playTone(base * 1.18, 0.05, 'triangle', 0.022, 0.07, base * 0.96);
    this.playTone(base * 1.05, 0.06, 'square', 0.024, 0.14);
  }

  public playGuitarChord(notes: number[], spread = 0.055, volume = 0.05) {
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.45, 'triangle', volume, idx * spread);
      this.playTone(freq * 2, 0.22, 'square', volume * 0.22, idx * spread + 0.01);
    });
  }

  public playStoryChord(beatIndex: number) {
    const chords = [
      [261.63, 329.63, 392.0, 523.25],
      [220.0, 261.63, 329.63, 440.0],
      [146.83, 220.0, 293.66, 349.23],
      [196.0, 246.94, 293.66, 392.0],
    ];
    this.playGuitarChord(chords[beatIndex % chords.length], 0.065, 0.05);
  }

  public playSlash(comboStep: number) {
    const base = 260 + comboStep * 65;
    this.playTone(base, 0.1, 'square', 0.04, 0, base * 0.45);
    this.playTone(base * 1.8, 0.07, 'triangle', 0.03, 0.01, base * 0.95);
  }

  public playHit(isCrit = false) {
    this.playTone(isCrit ? 220 : 140, 0.12, 'square', isCrit ? 0.058 : 0.045, 0, 55);
    if (isCrit) {
      this.playTone(659.25, 0.14, 'square', 0.04, 0.02);
    }
  }

  public playHaranaWave() {
    this.playTone(523.25, 0.14, 'square', 0.045, 0, 783.99);
    this.playTone(659.25, 0.18, 'triangle', 0.045, 0.06, 987.77);
  }

  public playDash() {
    this.playTone(360, 0.09, 'square', 0.035, 0, 150);
  }

  public playJump() {
    this.playTone(220, 0.11, 'square', 0.036, 0, 440);
  }

  public playHurt() {
    this.playTone(155, 0.16, 'sawtooth', 0.055, 0, 65);
  }

  public playRestChime() {
    this.playGuitarChord([261.63, 329.63, 392.0, 523.25, 659.25], 0.075, 0.05);
  }

  public playDuet() {
    this.playGuitarChord([261.63, 329.63, 392.0, 523.25], 0.06, 0.05);
    window.setTimeout(() => {
      this.playGuitarChord([293.66, 369.99, 440.0, 587.33], 0.06, 0.05);
    }, 320);
  }

  public playPurchase() {
    this.playTone(587.33, 0.09, 'square', 0.045, 0);
    this.playTone(880.0, 0.15, 'square', 0.045, 0.08);
  }

  public playVictory() {
    const fanfare = [392.0, 523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((f, i) => {
      this.playTone(f, i === fanfare.length - 1 ? 0.42 : 0.12, 'square', 0.045, i * 0.095);
    });
  }

  public playGunshot() {
    this.playTone(190, 0.08, 'sawtooth', 0.065, 0, 58);
    this.playTone(620, 0.045, 'square', 0.04, 0, 140);
  }

  public playRicochet() {
    this.playTone(1450, 0.11, 'square', 0.055, 0, 680);
    this.playTone(980, 0.09, 'triangle', 0.045, 0.04, 1780);
  }

  public playShieldBreak() {
    this.playTone(520, 0.12, 'sawtooth', 0.06, 0, 140);
    this.playTone(880, 0.15, 'square', 0.05, 0.05, 220);
  }

  public playGhostChime() {
    this.playGuitarChord([329.63, 493.88, 659.25, 987.77], 0.09, 0.045);
  }

  public playAchievementFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === 3 ? 0.34 : 0.09, 'square', 0.045, idx * 0.075);
    });
  }

  public playWakeUpChime() {
    const notes = [293.66, 369.99, 440.0, 587.33, 739.99];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.28, 'triangle', 0.05, idx * 0.13);
    });
  }

  public playMagicCast(school: 'white_magic' | 'black_magic') {
    if (school === 'white_magic') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((n, idx) => {
        this.playTone(n, 0.2, 'triangle', 0.048, idx * 0.045);
      });
    } else {
      const notes = [246.94, 207.65, 164.81, 130.81];
      notes.forEach((n, idx) => {
        this.playTone(n, 0.24, 'sawtooth', 0.046, idx * 0.055, n * 0.72);
      });
      this.playTone(622.25, 0.28, 'square', 0.032, 0.09, 185.0);
    }
  }

  public playLevelUpFanfare() {
    // Celebratory JRPG golden brass/chime arpeggio + octave sustain
    const brass = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66];
    brass.forEach((f, idx) => {
      const isLast = idx === brass.length - 1;
      this.playTone(f, isLast ? 0.55 : 0.11, 'square', 0.048, idx * 0.075);
      this.playTone(f * 0.5, isLast ? 0.55 : 0.11, 'triangle', 0.042, idx * 0.075);
    });
    // Shimmering chime tail
    this.playTone(1567.98, 0.42, 'sine', 0.035, 0.42);
  }

  public playDeathCollapse(style: 'sprite_collapse' | 'spirit_banish' | 'knockout_tumble' | 'hero_down' = 'knockout_tumble') {
    if (style === 'spirit_banish') {
      this.playTone(740, 0.34, 'sine', 0.045, 0, 1480);
      this.playTone(554.37, 0.28, 'triangle', 0.04, 0.08, 1108.73);
    } else if (style === 'hero_down') {
      const desc = [392.0, 349.23, 311.13, 261.63];
      desc.forEach((n, idx) => {
        this.playTone(n, 0.26, 'sawtooth', 0.048, idx * 0.14, n * 0.85);
      });
    } else {
      this.playTone(180, 0.24, 'sawtooth', 0.06, 0, 48);
      this.playTone(110, 0.18, 'square', 0.042, 0.06, 42);
    }
  }

  public playSfxPreview() {
    this.playTone(659.25, 0.09, 'triangle', 0.055, 0, 880);
  }

  public playBuffChime() {
    this.playTone(523.25, 0.1, 'triangle', 0.05, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.05, 0.06);
    this.playTone(1046.5, 0.2, 'sine', 0.045, 0.12);
  }

  public playDebuffAlert() {
    this.playTone(260, 0.14, 'sawtooth', 0.05, 0, 140);
    this.playTone(195, 0.18, 'square', 0.04, 0.07, 110);
  }

  public playStealAlert() {
    this.playTone(980, 0.08, 'square', 0.055, 0, 520);
    this.playTone(620, 0.12, 'sawtooth', 0.055, 0.07, 320);
  }

  public playMissWhoosh() {
    this.playTone(340, 0.08, 'sine', 0.035, 0, 180);
  }

  public playFishingCast() {
    this.playTone(280, 0.14, 'sine', 0.045, 0, 740);
    this.playTone(180, 0.1, 'triangle', 0.04, 0.14, 120);
  }

  public playFishingBite() {
    this.playTone(880, 0.08, 'square', 0.06, 0);
    this.playTone(1174.66, 0.12, 'square', 0.06, 0.07);
  }

  public playFishingCatch() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playTone(f, idx === 3 ? 0.26 : 0.08, 'triangle', 0.055, idx * 0.06);
    });
  }

  public playMineHit() {
    this.playTone(920, 0.07, 'square', 0.055, 0, 420);
    this.playTone(240, 0.09, 'triangle', 0.05, 0.02, 110);
  }

  public playGatherChime() {
    this.playTone(698.46, 0.08, 'triangle', 0.048, 0);
    this.playTone(880.0, 0.12, 'sine', 0.048, 0.05);
  }

  public playCookSizzle() {
    this.playTone(440, 0.09, 'triangle', 0.045, 0, 660);
    this.playTone(660, 0.12, 'triangle', 0.045, 0.08, 880);
    this.playTone(880, 0.18, 'sine', 0.05, 0.16);
  }

  public playJobComplete() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      this.playTone(f, i === 3 ? 0.3 : 0.09, 'square', 0.05, i * 0.07);
    });
  }
}

class FilipinoAccentEnglishVoiceEngine {
  public enabled = true;
  private maleVoice: SpeechSynthesisVoice | null = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private fallbackVoice: SpeechSynthesisVoice | null = null;
  private usingNativeEnPh = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.pickVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.pickVoices();
      };
    }
  }

  private pickVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    const femaleHints = [
      'rosa',
      'blessica',
      'samantha',
      'zira',
      'victoria',
      'karen',
      'jenny',
      'aria',
      'susan',
      'female',
      'serena',
      'moira',
      'tessa',
      'fiona',
      'hazel',
      'heera',
      'veena',
    ];
    const maleHints = [
      'james',
      'angelo',
      'david',
      'daniel',
      'alex',
      'mark',
      'guy',
      'matthew',
      'male',
      'arthur',
      'oliver',
      'aaron',
      'ravi',
      'fred',
    ];

    // 1. Prioritize authentic Filipino-English (en-PH) voices first!
    const enPhVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase() === 'en-ph' ||
        v.name.toLowerCase().includes('philippines') ||
        v.name.toLowerCase().includes('filipino english')
    );

    // 2. Fallback to Southeast Asian / clear syllable-timed English (en-SG / en-IN / en-US)
    const seaEnglish = voices.filter((v) => {
      const l = v.lang.toLowerCase();
      return l === 'en-sg' || l === 'en-in' || l === 'en-us' || l === 'en-gb' || l.startsWith('en');
    });

    this.usingNativeEnPh = enPhVoices.length > 0;
    const primaryPool = enPhVoices.length > 0 ? enPhVoices : seaEnglish;
    const secondaryPool = seaEnglish.length > 0 ? seaEnglish : voices;

    const findFemale = (list: SpeechSynthesisVoice[]) =>
      list.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h))) || null;
    const findMale = (list: SpeechSynthesisVoice[]) =>
      list.find((v) => maleHints.some((h) => v.name.toLowerCase().includes(h))) || null;

    this.femaleVoice = findFemale(primaryPool) || findFemale(secondaryPool) || primaryPool[0] || secondaryPool[0] || null;
    this.maleVoice =
      findMale(primaryPool) ||
      findMale(secondaryPool) ||
      primaryPool.find((v) => v !== this.femaleVoice) ||
      secondaryPool.find((v) => v !== this.femaleVoice) ||
      primaryPool[0] ||
      null;
    this.fallbackVoice = primaryPool[0] || secondaryPool[0] || null;
  }

  private isFemaleStyle(style?: VoiceProfile['style']): boolean {
    return (
      style === 'boss_female' ||
      style === 'payong_seller' ||
      style === 'street_vendor' ||
      style === 'teacher' ||
      style === 'girl_npc' ||
      style === 'police_female' ||
      style === 'hero_ghost_female' ||
      style === 'mangkukulam'
    );
  }

  private selectVoiceForStyle(profile?: VoiceProfile): SpeechSynthesisVoice | null {
    if (!this.fallbackVoice) this.pickVoices();
    if (this.isFemaleStyle(profile?.style) && this.femaleVoice) return this.femaleVoice;
    if (!this.isFemaleStyle(profile?.style) && this.maleVoice) return this.maleVoice;
    return this.fallbackVoice;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  public speak(text: string, profile?: VoiceProfile) {
    if (!this.enabled || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      noirAudio.playVoiceBlip(profile?.pitch ?? 1.0);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.selectVoiceForStyle(profile);
      const female = this.isFemaleStyle(profile?.style);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = this.usingNativeEnPh ? 'en-PH' : voice.lang || 'en-PH';
      } else {
        utterance.lang = 'en-PH';
      }

      // Calibrated Filipino-English syllable cadence & clear Girl vs Male pitch tuning
      const basePitch = profile?.pitch ?? (female ? 1.18 : 0.94);
      const baseRate = profile?.rate ?? 0.98;
      utterance.pitch = Math.max(0.65, Math.min(1.55, female ? Math.max(basePitch, 1.12) : basePitch));
      utterance.rate = Math.max(0.82, Math.min(1.16, this.usingNativeEnPh ? baseRate : baseRate * 0.97));
      utterance.volume = 0.92;

      let started = false;
      utterance.onstart = () => {
        started = true;
      };
      utterance.onerror = () => {
        if (!started) noirAudio.playVoiceBlip(utterance.pitch);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      noirAudio.playVoiceBlip(profile?.pitch ?? 1.0);
    }
  }
}

export const noirAudio = new BataanAudioEngine();
export const englishVoice = new FilipinoAccentEnglishVoiceEngine();
export const filipinoVoice = englishVoice;
