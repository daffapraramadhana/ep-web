// apps/web/src/lib/play-audio.ts
import { resolveApiUrl } from './api';
import { speakEn } from './speak';

/**
 * Putar audio TTS server (/tts/{id}.mp3) — satu pemutar global: memutar yang
 * baru menghentikan yang lama. Gagal dimuat/diputar → suara browser
 * (speakEn) sebagai cadangan, supaya tombol 🔊 tidak pernah bisu.
 *
 * `onState` memberi tahu tombol pemicu: loading (menunggu server/unduh) →
 * playing → idle (selesai, gagal total, atau digantikan pemutaran lain).
 */
export type AudioState = 'idle' | 'loading' | 'playing';

let current: { audio: HTMLAudioElement; notify: (s: AudioState) => void } | null = null;

export function stopAudio(): void {
  if (current) {
    const { audio, notify } = current;
    current = null;
    audio.pause();
    notify('idle');
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function playAudio(
  url: string,
  fallbackText: string,
  opts: { rate?: number; onState?: (s: AudioState) => void } = {},
): void {
  stopAudio();
  const notify = opts.onState ?? (() => {});
  const audio = new Audio(resolveApiUrl(url));
  audio.defaultPlaybackRate = audio.playbackRate = opts.rate ?? 1;
  const entry = { audio, notify };
  current = entry;
  const live = () => current === entry;
  const finish = () => {
    if (!live()) return;
    current = null;
    notify('idle');
  };

  let fellBack = false;
  const fallback = () => {
    if (fellBack || !live()) return;
    fellBack = true;
    notify('playing');
    speakEn(fallbackText, finish);
  };

  notify('loading');
  audio.addEventListener('waiting', () => live() && !fellBack && notify('loading'));
  audio.addEventListener('playing', () => live() && notify('playing'));
  audio.addEventListener('ended', finish);
  audio.addEventListener('error', fallback, { once: true });
  audio.play().catch((e: unknown) => {
    // AbortError = dihentikan oleh playAudio/stopAudio berikutnya, bukan gagal.
    if ((e as { name?: string })?.name !== 'AbortError') fallback();
  });
}
