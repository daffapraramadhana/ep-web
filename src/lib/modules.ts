// apps/web/src/lib/modules.ts
/** Pesan 404 BE untuk modul/bab (modules.service MODULE_NOT_FOUND). */
export const MODULE_NOT_FOUND = 'Modul atau bab tidak ditemukan';

export const LEVEL_LABEL: Record<string, string> = { DASAR: 'Dasar', MENENGAH: 'Menengah', MAHIR: 'Mahir' };

/** Warna cover tanpa gambar: siklus varian -deep skill (kontras teks putih ≥4.5:1). */
const TONES = ['#4F46E5', '#0369A1', '#BE185D', '#B45309'];
export function coverTone(i: number): string {
  return TONES[((i % TONES.length) + TONES.length) % TONES.length];
}
