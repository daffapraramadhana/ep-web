/**
 * sfx.ts — WebAudio synthesis, ported from the design mockup's `snd()`
 * (.superpowers/brainstorm/.../content/user-app-mockup-v2.html). No React
 * dependency: plain module, lazy AudioContext (created on first play so the
 * page never needs a user gesture up front just to import this module).
 *
 * `prefers-reduced-motion` governs *motion* only (design-system.md §3) — it
 * does NOT apply to sound, so it is intentionally not checked here. Sound
 * has its own independent on/off switch (`muted`), persisted in
 * localStorage under `soundOn` ('1' = on, '0' = off; default on), and is
 * meant to also sync with the user's `/me` `soundOn` preference from
 * whichever screen owns the mute toggle (Task 8+ — this module only owns
 * local persistence + playback).
 */

const STORAGE_KEY = 'soundOn';

export type SfxKind = 'good' | 'bad' | 'win';

let ctx: AudioContext | null = null;
let mutedCache: boolean | null = null;

function readMutedFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  // Default on: anything except an explicit '0' means sound is enabled.
  return raw === '0';
}

export function getMuted(): boolean {
  if (mutedCache === null) {
    mutedCache = readMutedFromStorage();
  }
  return mutedCache;
}

export function setMuted(muted: boolean): void {
  mutedCache = muted;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, muted ? '0' : '1');
  }
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function playGood(ac: AudioContext, t: number): void {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g);
  g.connect(ac.destination);
  o.frequency.setValueAtTime(660, t);
  o.frequency.setValueAtTime(880, t + 0.09);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.start(t);
  o.stop(t + 0.3);
}

function playBad(ac: AudioContext, t: number): void {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g);
  g.connect(ac.destination);
  o.frequency.setValueAtTime(220, t);
  o.type = 'square';
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.start(t);
  o.stop(t + 0.25);
}

function playWin(ac: AudioContext, t: number): void {
  // Arpeggio C-E-G-C.
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g);
    g.connect(ac.destination);
    o.frequency.value = freq;
    const start = t + i * 0.12;
    g.gain.setValueAtTime(0.12, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    o.start(start);
    o.stop(start + 0.3);
  });
}

export function play(kind: SfxKind): void {
  if (getMuted()) return;
  const ac = getContext();
  if (!ac) return;
  const t = ac.currentTime;
  if (kind === 'good') playGood(ac, t);
  else if (kind === 'bad') playBad(ac, t);
  else playWin(ac, t);
}

export const sfx = { play, getMuted, setMuted };
export default sfx;
