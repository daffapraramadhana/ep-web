'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SummaryView, SessionView, ProgressView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { HeroSkeleton } from '@/components/hero';
import { HomeContent } from '@/components/home-content';

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [startingSpeaking, setStartingSpeaking] = useState(false);
  // Strip "Minggu ini" — non-blocking: beranda tetap tampil utuh bila
  // GET /progress gagal, kartunya saja yang tidak muncul.
  const [week, setWeek] = useState<ProgressView['week'] | null>(null);
  useEffect(() => {
    api<ProgressView>('/progress')
      .then((p) => setWeek(p.week))
      .catch(() => setWeek(null));
  }, []);

  const loadSummary = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api<SummaryView>('/me/summary')
      .then((s) => {
        setSummary(s);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function startSession() {
    if (starting || startingSpeaking) return;
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

  async function startSpeaking() {
    if (starting || startingSpeaking) return;
    setError('');
    setStartingSpeaking(true);
    try {
      // Menu "Latihan Berbicara" (kind SPEAKING di BE): sesi berisi soal
      // UCAPAN dari materi yang belum tuntas. 409 ("Belum ada latihan
      // berbicara baru untuk levelmu") muncul inline di `error` — kartu
      // selalu tampil, tidak disembunyikan (butuh flag tambahan di summary).
      await api<SessionView>('/session/speaking', { method: 'POST' });
      router.push('/session?speaking=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setStartingSpeaking(false);
    }
  }

  if (!summary && loading) {
    return (
      <div className="learn-home">
        <HeroSkeleton />
        <div className="mt-6 space-y-3">
          <div className="skeleton h-[150px] rounded-[22px]" />
          <div className="skeleton h-[70px] rounded-[18px]" />
        </div>
      </div>
    );
  }

  if (!summary && loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Beranda" title="Gagal memuat data" className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">
            Periksa koneksimu, lalu coba lagi.
          </p>
          <ChunkyButton variant="ghost" onClick={loadSummary}>
            Coba lagi
          </ChunkyButton>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <HomeContent
      summary={summary}
      week={week}
      error={error}
      starting={starting}
      startingSpeaking={startingSpeaking}
      onStart={startSession}
      onSpeak={startSpeaking}
    />
  );
}
