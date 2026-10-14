// apps/web/src/lib/speak.ts
/** TTS contoh ucapan — Web Speech API browser, tanpa asset audio. */
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakEn(text: string) {
  if (!canSpeak()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  window.speechSynthesis.cancel(); // hentikan yang sedang berjalan, ganti yang baru
  window.speechSynthesis.speak(u);
}
