'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClock } from 'lucide-react';
import { api } from '@/lib/api';
import type { SummaryView, SessionView } from '@/lib/api-types';
import { Card, ChunkyButton, MetaChip } from '@/components/ui';
import { Hero, HeroSkeleton } from '@/components/hero';

/**
 * Beranda (Task 9 brief §Step 2) — hero + kartu Lanjutkan/Review/Penguatan.
 * Consumes GET /me/summary (fetched locally here, terpisah dari useMe()
 * yang meng-cover GET /me — summary punya bentuk & siklus refresh berbeda,
 * lihat api-types.ts). POST /session/today hanya dipicu oleh tombol MULAI,
 * navigasi ke /session (placeholder Task 10) begitu sukses.
 */

export default function HomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryView | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api<SummaryView>('/me/summary')
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Terjadi kesalahan'));
  }, []);

  async function startSession() {
    if (starting) return;
    setError('');
    setStarting(true);
    try {
      await api<SessionView>('/session/today', { method: 'POST' });
      router.push('/session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setStarting(false);
    }
  }

  if (!summary) {
    return (
      <div>
        <HeroSkeleton />
        <div className="space-y-3 p-5">
          <div className="skeleton h-[150px] rounded-[22px]" />
          <div className="skeleton h-[70px] rounded-[18px]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Hero
        name={summary.name}
        streak={summary.streak}
        xpTotal={summary.xpTotal}
        freezeAvailableThisWeek={summary.freezeAvailableThisWeek}
        sessionsCompletedToday={summary.sessionsCompletedToday}
        dailyTarget={summary.dailyTarget}
      />

      <div className="home-body space-y-3.5 px-5 pt-[18px] pb-6">
        {error ? <p className="text-sm font-semibold text-bad">{error}</p> : null}

        {summary.nextLesson ? (
          <Card eyebrow="Lanjutkan belajar" title={summary.nextLesson.title}>
            <div className="mb-3.5 flex flex-wrap gap-2">
              <MetaChip>{summary.nextLesson.topic}</MetaChip>
              <MetaChip tone="amber">±{summary.nextLesson.estMinutes} mnt</MetaChip>
              <MetaChip tone="amber">+{summary.nextLesson.xpEstimate} XP</MetaChip>
            </div>
            <ChunkyButton onClick={startSession} disabled={starting}>
              {starting ? 'MEMUAT...' : 'MULAI'}
            </ChunkyButton>
          </Card>
        ) : summary.contentExhausted ? (
          <Card eyebrow="Penguatan" title="Sesi Penguatan">
            <p className="mb-3.5 text-sm font-semibold text-muted">
              Kamu sudah menyelesaikan semua materi di levelmu. Yuk perkuat lagi soal-soal yang
              pernah kamu lewati.
            </p>
            <ChunkyButton onClick={startSession} disabled={starting}>
              {starting ? 'MEMUAT...' : 'MULAI'}
            </ChunkyButton>
          </Card>
        ) : null}

        {summary.reviewsDue > 0 ? (
          <button
            type="button"
            className="review-card w-full text-left"
            onClick={startSession}
            disabled={starting}
          >
            <div className="review-card-icon">
              <AlarmClock size={20} strokeWidth={2.25} />
            </div>
            <div>
              <b>{summary.reviewsDue} soal menunggu diulang</b>
              <small>dari jawaban yang pernah salah</small>
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
}
