'use client';

/**
 * AnswerChips — susun kalimat (Task 11 brief Step 3), diport dari mockup v2
 * (`#bank`/`#zone`, `buildChips()`/`upd2()`). Bank chip berasal dari
 * `item.chips` (sudah di-shuffle BE); tap chip bank -> pindah ke zona
 * (bank chip jadi ghost, bukan dihapus, supaya posisi bank stabil saat
 * dikembalikan); tap chip zona -> kembali ke bank. PERIKSA aktif hanya saat
 * semua chip terpasang di zona.
 *
 * Chip dirender sebagai elemen `<button>` sungguhan supaya "fokusable +
 * Enter/Space memindah" (brief) didapat gratis dari semantik native, tanpa
 * key handler tambahan.
 *
 * Jawaban dikirim ke BE = kata-kata zona di-join spasi (kontrak grading).
 *
 * `place`/`unplace` PAKAI functional `setZone(prev => ...)`, bukan
 * `[...zone, idx]` yang menutup atas `zone` dari render saat ini: dua
 * pemanggilan `place()` yang di-batch React dalam tick yang sama (mis. dua
 * event sintetis back-to-back — ditemukan lewat pengujian terskrip di task
 * ini) akan sama-sama membaca `zone` LAMA kalau tidak functional, membuat
 * hanya chip TERAKHIR yang benar-benar masuk zona. `onReady` disinkronkan
 * lewat effect on `[zone]`, bukan dipanggil manual di tiap handler, supaya
 * selalu menghitung dari state ter-commit (bukan closure) juga.
 */

import { useEffect, useState } from 'react';
import type { AnswerResult, SessionItemView } from '@/lib/api-types';

export interface AnswerChipsProps {
  item: SessionItemView;
  disabled: boolean;
  result: AnswerResult | null;
  onReady: (answer: string | null) => void;
}

export function AnswerChips({ item, disabled, result, onReady }: AnswerChipsProps) {
  const chips = item.chips ?? [];
  // Indeks ke `chips`, urut sesuai penempatan user di zona.
  const [zone, setZone] = useState<number[]>([]);

  useEffect(() => {
    const ready = chips.length > 0 && zone.length === chips.length;
    onReady(ready ? zone.map((i) => chips[i]).join(' ') : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);

  function place(idx: number) {
    if (disabled) return;
    setZone((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  }

  function unplace(pos: number) {
    if (disabled) return;
    setZone((prev) => prev.filter((_, i) => i !== pos));
  }

  const resultClass = result ? (result.correct ? 'chip-right' : 'chip-wrong') : '';

  return (
    <div>
      <div className="answer-zone" role="list" aria-label="Zona jawaban">
        {zone.map((idx, pos) => (
          <button
            key={`z-${idx}`}
            type="button"
            className={`chip chip-inzone ${resultClass}`.trim()}
            disabled={disabled}
            onClick={() => unplace(pos)}
          >
            {chips[idx]}
          </button>
        ))}
      </div>
      <div className="chipbank" role="list" aria-label="Bank kata">
        {chips.map((word, idx) => (
          <button
            key={`b-${idx}`}
            type="button"
            className={`chip ${zone.includes(idx) ? 'chip-used' : ''}`.trim()}
            disabled={disabled || zone.includes(idx)}
            onClick={() => place(idx)}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
