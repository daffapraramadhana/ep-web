// apps/web/src/lib/play-audio.ts
import { resolveApiUrl } from './api';
import { speakEn } from './speak';

/**
 * Putar audio TTS server (/tts/{id}.mp3) — satu pemutar global: memutar yang
 * baru menghentikan yang lama. Gagal dimuat/diputar → suara browser
 * (speakEn) sebagai cadangan, supaya tombol 🔊 tidak pernah bisu.
 */
let current: HTMLAudioElement | null = null;

export function stopAudio(): void {
  if (current) {
    current.pause();
    current = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function playAudio(url: string, fallbackText: string, opts: { rate?: number } = {}): void {
  stopAudio();
  const audio = new Audio(resolveApiUrl(url));
  audio.defaultPlaybackRate = audio.playbackRate = opts.rate ?? 1;
  current = audio;
  let fellBack = false;
  const fallback = () => {
    if (fellBack || current !== audio) return;
    fellBack = true;
    speakEn(fallbackText);
  };
  audio.addEventListener('error', fallback, { once: true });
  audio.play().catch((e: unknown) => {
    // AbortError = dihentikan oleh playAudio/stopAudio berikutnya, bukan gagal.
    if ((e as { name?: string })?.name !== 'AbortError') fallback();
  });
}
