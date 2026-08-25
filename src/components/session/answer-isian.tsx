'use client';

/**
 * AnswerIsian — isian (Task 11 brief Step 2). Render `item.prompt` sendiri
 * (menggantikan `<h2>` generik di halaman sesi) dengan `___` diganti input
 * inline auto-width (min 80px, `size` mengikuti panjang teks). Enter =
 * trigger PERIKSA (lewat `onSubmit`, disediakan parent — flow yang sama
 * dengan tombol PERIKSA).
 *
 * Jawaban yang dikirim ke BE adalah teks input mentah (kontrak grading).
 */

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { AnswerResult, SessionItemView } from '@/lib/api-types';

const BLANK = '___';

export interface AnswerIsianProps {
  item: SessionItemView;
  disabled: boolean;
  result: AnswerResult | null;
  onReady: (answer: string | null) => void;
  onSubmit: () => void;
}

export function AnswerIsian({ item, disabled, result, onReady, onSubmit }: AnswerIsianProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    onReady(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function change(next: string) {
    setValue(next);
    onReady(next.trim() ? next : null);
  }

  const blankIdx = item.prompt.indexOf(BLANK);
  const before = blankIdx === -1 ? item.prompt : item.prompt.slice(0, blankIdx);
  const after = blankIdx === -1 ? '' : item.prompt.slice(blankIdx + BLANK.length);

  const state = result ? (result.correct ? 'right' : 'wrong') : '';

  return (
    <h2 className="mb-5 text-[21px] font-black leading-snug text-ink">
      {before}
      <span className="isian-wrap">
        <input
          type="text"
          className={`isian-input ${state ? `isian-input-${state}` : ''}`.trim()}
          value={value}
          disabled={disabled}
          size={Math.max(value.length + 1, 6)}
          aria-label="Jawaban isian"
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        {state ? (
          <span className={`isian-badge isian-badge-${state}`} aria-hidden="true">
            {state === 'right' ? <Check size={12} strokeWidth={3.5} /> : <X size={12} strokeWidth={3.5} />}
          </span>
        ) : null}
      </span>
      {after}
    </h2>
  );
}
