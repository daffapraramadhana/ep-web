// apps/web/src/lib/speak.ts
/** TTS cadangan — Web Speech API browser, dipakai bila audio server (/tts) tak tersedia. */
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Suara terbaik yang tersedia di perangkat (bukan default yang sering robotik).
const PREFERRED = ['Natural', 'Premium', 'Enhanced', 'Google', 'Samantha'];
let chosen: SpeechSynthesisVoice | null = null;

function bestVoice(): SpeechSynthesisVoice | null {
  if (chosen) return chosen;
  // getVoices() bisa kosong sebelum event voiceschanged — jangan cache null.
  const voices = window.speechSynthesis.getVoices().filter((v) => /^en[-_](US|GB)/i.test(v.lang));
  for (const key of PREFERRED) {
    const v = voices.find((x) => x.name.includes(key));
    if (v) return (chosen = v);
  }
  return null;
}

export function speakEn(text: string, onEnd?: () => void) {
  if (!canSpeak()) {
    onEnd?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  const voice = bestVoice();
  u.voice = voice;
  u.lang = voice?.lang ?? 'en-US';
  u.rate = 0.85;
  if (onEnd) u.onend = u.onerror = () => onEnd();
  window.speechSynthesis.cancel(); // hentikan yang sedang berjalan, ganti yang baru
  window.speechSynthesis.speak(u);
}
