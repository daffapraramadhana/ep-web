'use client';

/**
 * Celebrate — layar perayaan selesai-sesi (Task 12 brief, mockup v2
 * `#celebrate`/`.done-scr` + design-system.md §3 motion).
 *
 * `summary` datang dari `AnswerResult.summary` milik jawaban terakhir yang
 * menyelesaikan sesi (`useSession().last`, TIDAK di-null-kan oleh `next()`
 * begitu queue habis — lihat komentar di use-session.ts). Bisa `null` pada
 * edge case sesi yang diresume padahal sudah COMPLETED sebelumnya (BE tidak
 * mengembalikan attempt lama) — fallback tampil generik tanpa angka, tanpa
 * confetti/count-up (tidak ada apa pun untuk dirayakan secara spesifik).
 *
 * `prefers-reduced-motion` dibaca sekali saat mount (layar ini transient,
 * tidak perlu bereaksi ke perubahan setting di tengah tampil) dan mematikan
 * confetti + count-up sekaligus, menampilkan nilai akhir XP langsung
 * (design-system.md §3: "matikan confetti, pulse, dan count-up (tampilkan
 * nilai akhir langsung)"). Milestone 7/30/100 melipatgandakan jumlah
 * partikel confetti (26 -> 52) dan mengganti judul dengan copy khusus.
 */

import { useEffect, useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { useMe } from '@/lib/use-me';
import { ChunkyButton } from '@/components/ui';
import type { AnswerResult } from '@/lib/api-types';

type Summary = NonNullable<AnswerResult['summary']>;

export interface CelebrateProps {
  summary: Summary | null;
  /** Dipanggil setelah LANJUT ditekan (mutate() useMe sudah dijalankan). */
  onContinue: () => void;
}

const CONFETTI_COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EC4899'];
const COUNT_UP_MS = 700;
const COUNT_UP_STEP_MS = 28;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function milestoneCopy(milestone: 7 | 30 | 100): string {
  if (milestone === 7) return 'Seminggu penuh! 🎉';
  if (milestone === 30) return 'Sebulan penuh — luar biasa!';
  return '100 hari. Legenda. 🏆';
}

interface ConfettiPiece {
  left: number;
  color: string;
  delay: number;
}

export function Celebrate({ summary, onContinue }: CelebrateProps) {
  const { mutate } = useMe();
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const [xp, setXp] = useState<number>(() =>
    reducedMotion || !summary ? (summary?.xpSession ?? 0) : 0,
  );

  // Bunyi "sesi selesai" (arpeggio) — sekali per tampil, bukan per re-render.
  useEffect(() => {
    sfx.play('win');
  }, []);

  // XP count-up ~700ms menuju xpSession — di-skip total (nilai akhir
  // langsung) bila reduced-motion atau tidak ada summary untuk dihitung.
  useEffect(() => {
    if (!summary || reducedMotion) return;
    const target = summary.xpSession;
    if (target <= 0) {
      setXp(0);
      return;
    }
    const steps = Math.max(Math.round(COUNT_UP_MS / COUNT_UP_STEP_MS), 1);
    const increment = target / steps;
    let current = 0;
    const id = setInterval(() => {
      current += increment;
      if (current >= target) {
        setXp(target);
        clearInterval(id);
      } else {
        setXp(Math.round(current));
      }
    }, COUNT_UP_STEP_MS);
    return () => clearInterval(id);
  }, [summary, reducedMotion]);

  // Confetti: 26 partikel normal, 52 saat milestone tercapai; array kosong
  // (tidak ada DOM node sama sekali) bila reduced-motion — bukan hanya
  // animasi CSS yang dimatikan, supaya benar-benar tidak ada gerak.
  const confetti = useMemo<ConfettiPiece[]>(() => {
    if (reducedMotion) return [];
    const count = summary?.milestone ? 52 : 26;
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 1.2,
    }));
  }, [reducedMotion, summary?.milestone]);

  function handleContinue() {
    mutate();
    onContinue();
  }

  return (
    <div className="celebrate">
      {confetti.map((piece, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="celebrate-confetti"
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}

      <div className="celebrate-emoji">🎉</div>

      {summary ? (
        <>
          <h2 className="celebrate-title">
            {summary.milestone ? milestoneCopy(summary.milestone) : 'Kerja bagus!'}
          </h2>
          <div className="celebrate-cards">
            <div className="celebrate-card">
              <div className="celebrate-card-value">{xp}</div>
              <div className="celebrate-card-label">XP</div>
            </div>
            <div className="celebrate-card">
              <div className="celebrate-card-value celebrate-card-value-good">
                {summary.accuracyFirstTry}%
              </div>
              <div className="celebrate-card-label">AKURASI</div>
            </div>
          </div>
          {summary.streakChanged ? (
            <div className="celebrate-streak">🔥 Streak jadi {summary.streak} hari!</div>
          ) : null}
        </>
      ) : (
        <h2 className="celebrate-title">Sesi selesai!</h2>
      )}

      <ChunkyButton variant="good" className="max-w-xs" onClick={handleContinue}>
        LANJUT
      </ChunkyButton>
    </div>
  );
}
