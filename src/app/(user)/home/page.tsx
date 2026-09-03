'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClock, Mic, MessagesSquare } from 'lucide-react';
import { api } from '@/lib/api';
import type { SummaryView, SessionView, ProgressView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { Hero, HeroSkeleton } from '@/components/hero';
import { WeekStrip } from '@/components/week-strip';

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

  async function startSpeaking() {
    if (startingSpeaking) return;
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
      <div>
        <HeroSkeleton />
        <div className="space-y-3 p-5">
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

  const targetMet = summary.sessionsCompletedToday >= summary.dailyTarget;

  return (
    <div>
      <Hero
        name={summary.name}
        streak={summary.streak}
        xpTotal={summary.xpTotal}
        freezeAvailableThisWeek={summary.freezeAvailableThisWeek}
        sessionsCompletedToday={summary.sessionsCompletedToday}
        dailyTarget={summary.dailyTarget}
        nextLabel={
          summary.openSession
            ? `Lanjutkan ${summary.openSession.lessonTitle ?? 'Sesi Penguatan'} · tersisa ${summary.openSession.total - summary.openSession.answered} soal`
            : summary.nextLesson
              ? `${summary.nextLesson.title} · ±${summary.nextLesson.estMinutes} mnt`
              : summary.contentExhausted
                ? 'Sesi Penguatan'
                : null
        }
      />

      <div className="home-body space-y-3.5 px-5 pt-[18px] pb-6 lg:px-0">
        {error ? <p className="text-sm font-semibold text-bad">{error}</p> : null}

        {summary.openSession ? (
          <Card
            eyebrow="Sesi berjalan"
            title={summary.openSession.lessonTitle ?? 'Sesi Penguatan'}
          >
            <p className="card-meta">
              {summary.openSession.answered}/{summary.openSession.total} soal terjawab
              {' · '}tersisa {summary.openSession.total - summary.openSession.answered}
            </p>
            {/* Melanjutkan sesi menggantung selalu aksi utama — brand walau
                target sudah tercapai. */}
            <ChunkyButton onClick={startSession} disabled={starting}>
              {starting ? 'MEMUAT...' : 'LANJUTKAN'}
            </ChunkyButton>
          </Card>
        ) : summary.nextLesson ? (
          <Card eyebrow="Lanjutkan belajar" title={summary.nextLesson.title}>
            {/* Meta sebagai satu baris teks tenang (bukan deretan chip warna) —
                quiet pass: aksen warna disimpan untuk aksi & ring saja. */}
            <p className="card-meta">
              {summary.nextLesson.topic} · ±{summary.nextLesson.estMinutes} mnt · +
              {summary.nextLesson.xpEstimate} XP
            </p>
            <ChunkyButton
              variant={targetMet ? 'ghost' : 'brand'}
              onClick={startSession}
              disabled={starting}
            >
              {starting ? 'MEMUAT...' : 'MULAI'}
            </ChunkyButton>
            {targetMet ? (
              <p className="mt-2 text-center text-xs font-bold text-muted">
                Sesi tambahan = XP ekstra
              </p>
            ) : null}
          </Card>
        ) : summary.contentExhausted ? (
          <Card eyebrow="Penguatan" title="Sesi Penguatan">
            <p className="mb-3.5 text-sm font-semibold text-muted">
              Kamu sudah menyelesaikan semua materi di levelmu. Yuk perkuat lagi soal-soal yang
              pernah kamu lewati.
            </p>
            <ChunkyButton
              variant={targetMet ? 'ghost' : 'brand'}
              onClick={startSession}
              disabled={starting}
            >
              {starting ? 'MEMUAT...' : 'MULAI'}
            </ChunkyButton>
            {targetMet ? (
              <p className="mt-2 text-center text-xs font-bold text-muted">
                Sesi tambahan = XP ekstra
              </p>
            ) : null}
          </Card>
        ) : null}

        {/* Menu khusus speaking — kartu selalu tampil; bila materi habis,
            POST /session/speaking menolak 409 dan pesannya tampil di `error`. */}
        <Card eyebrow="Latihan" title="Latihan Berbicara">
          <p className="card-meta">
            Latih pelafalan dengan soal ucapan. Sesi ini dihitung ke target harian dan
            streak-mu.
          </p>
          <ChunkyButton
            variant="ghost"
            onClick={startSpeaking}
            disabled={startingSpeaking}
          >
            <span className="inline-flex items-center gap-2">
              <Mic size={18} strokeWidth={2.25} />
              {startingSpeaking ? 'MEMUAT...' : 'BERBICARA'}
            </span>
          </ChunkyButton>
        </Card>

        {/* Talking agent — kartu TERPISAH (keputusan desain §5 plan): bukan
            latihan soal, percakapan bebas dua arah. Hanya tampil bila flag
            VOICE_AGENT_ENABLED nyala di config BE (soft-launch tanpa deploy). */}
        {summary.voiceAgentEnabled ? (
          <Card eyebrow="Ngobrol" title="Ngobrol dengan AI">
            <p className="card-meta">
              Percakapan suara langsung dengan AI tutor. Bedanya dari Latihan
              Berbicara: ini ngobrol bebas, bukan menjawab soal. XP didapat
              saat percakapan cukup panjang.
            </p>
            <ChunkyButton
              variant="ghost"
              onClick={() => router.push('/talk')}
            >
              <span className="inline-flex items-center gap-2">
                <MessagesSquare size={18} strokeWidth={2.25} />
                NGROBOL
              </span>
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

        {/* Mobile-only: di desktop kartu yang sama sudah hidup di rail
            kanan (desktop-rail.tsx) — jangan dobel. */}
        {week ? (
          <Card eyebrow="Minggu ini" title="Kalender streak" className="lg:hidden">
            <WeekStrip week={week} />
            {week.some((d) => d.state === 'frozen') ? (
              <p className="week-legend">🧊 = streak diselamatkan token pembeku</p>
            ) : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
