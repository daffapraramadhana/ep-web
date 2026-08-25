'use client';

/**
 * AnswerMc — pilihan ganda (Task 11 brief Step 1). Grid 2 kolom bila semua
 * opsi <=12 karakter, else daftar 1 kolom (mockup v2 `.optgrid`/`.opt`).
 *
 * Jawaban yang dikirim ke BE adalah huruf `'A'|'B'|'C'|'D'` sesuai indeks
 * opsi (kontrak grading task ini) — BUKAN teks opsi.
 *
 * `result` (diisi hanya saat phase 'feedback') dipakai untuk menyorot:
 * opsi yang dipilih benar -> hijau; dipilih salah -> merah + opsi yang
 * TEKSnya cocok dengan `result.correctAnswer` -> hijau juga (soal punya
 * jawaban benar, terlepas dari mana yang dipilih user).
 */

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { AnswerResult, SessionItemView } from '@/lib/api-types';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export interface AnswerMcProps {
  item: SessionItemView;
  disabled: boolean;
  result: AnswerResult | null;
  onReady: (answer: string | null) => void;
}

export function AnswerMc({ item, disabled, result, onReady }: AnswerMcProps) {
  const options = item.options ?? [];
  const [selected, setSelected] = useState<number | null>(null);

  // Soal baru (parent me-remount komponen ini via `key={item.itemId}`) ->
  // PERIKSA harus mati sampai user memilih.
  useEffect(() => {
    onReady(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard desktop: tekan 1-4 untuk memilih opsi (rasa Duolingo web).
  // Tidak aktif saat disabled (submit berjalan / sheet terbuka) dan tidak
  // mencuri ketikan dari input/textarea (tak ada di tipe soal ini, tapi
  // guard tetap dipasang untuk aman).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < options.length && idx < LETTERS.length) {
        e.preventDefault();
        choose(idx);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, options.length]);

  function choose(idx: number) {
    if (disabled) return;
    setSelected(idx);
    onReady(LETTERS[idx] ?? null);
  }

  const twoCol = options.length > 0 && options.every((o) => o.length <= 12);
  const correctIdx = result && !result.correct ? options.findIndex((o) => o === result.correctAnswer) : -1;

  return (
    <div className={twoCol ? 'optgrid' : 'flex flex-col gap-2.5'}>
      {options.map((opt, idx) => {
        const isSelected = selected === idx;
        let state = '';
        if (result) {
          if (isSelected) state = result.correct ? 'opt-right' : 'opt-wrong';
          else if (idx === correctIdx) state = 'opt-right';
        } else if (isSelected) {
          state = 'opt-sel';
        }
        return (
          <button
            key={idx}
            type="button"
            className={`opt ${state}`.trim()}
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => choose(idx)}
          >
            {state === 'opt-right' ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : null}
            {state === 'opt-wrong' ? <X size={15} strokeWidth={3} aria-hidden="true" /> : null}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
