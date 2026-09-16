'use client';

/**
 * Perjalanan — peta belajar 1 kolom (Task 13 brief). Consumes GET /journey;
 * error/retry/skeleton MENIRU pola Beranda (home/page.tsx) persis: skeleton
 * saat loading pertama, kartu error + "Coba lagi" saat gagal.
 *
 * Tap node 'now' -> POST /session/today (sama seperti tombol MULAI di
 * Beranda) lalu push ke /session. Tap node 'done' -> konfirmasi ringan
 * ("Ulangi lesson ini? XP dihitung sebagai ulangan") -> push ke
 * `/session?replay=<lessonId>`; useSession di halaman sesi yang memanggil
 * POST /session/replay sendiri begitu melihat query param itu (lihat
 * use-session.ts) — halaman ini TIDAK memanggilnya langsung. Tap node
 * 'locked' -> penjelasan singkat tanpa membuat sesi baru.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { JourneyLessonView, JourneyView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { JourneyPath } from '@/components/journey-path';
import { LearningCompanion, LearningPageSkeleton } from '@/components/learning-companion';
import { ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

function JourneySkeleton() {
  return <LearningPageSkeleton title="Perjalanan" />;
}

export default function JourneyPage() {
  const router = useRouter();
  const [journey, setJourney] = useState<JourneyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [startingNow, setStartingNow] = useState(false);
  const [confirmLesson, setConfirmLesson] = useState<JourneyLessonView | null>(null);
  const [toast, setToast] = useState('');

  const loadJourney = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api<JourneyView>('/journey')
      .then((j) => {
        setJourney(j);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function tapNow() {
    if (startingNow) return;
    setStartingNow(true);
    try {
      await api('/session/today', { method: 'POST' });
      router.push('/session');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setStartingNow(false);
    }
  }

  function tapLocked() {
    setToast('Selesaikan materi sebelumnya untuk membuka langkah ini.');
  }

  function confirmReplay() {
    if (!confirmLesson) return;
    router.push(`/session?replay=${confirmLesson.id}`);
  }

  if (!journey && loading) {
    return <JourneySkeleton />;
  }

  if (!journey && loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Perjalanan" title="Gagal memuat data" className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">
            Periksa koneksimu, lalu coba lagi.
          </p>
          <ChunkyButton variant="ghost" onClick={loadJourney}>
            Coba lagi
          </ChunkyButton>
        </Card>
      </div>
    );
  }

  if (!journey) {
    return null;
  }

  const lessons = journey.topics.flatMap(topic => topic.lessons);
  const completed = lessons.filter(lesson => lesson.state === 'done').length;
  const next = lessons.find(lesson => lesson.state === 'now');
  const allDone = lessons.length > 0 && completed === lessons.length;

  return (
    <div className="learn-page learn-journey-page">
      <header className="learn-page-heading"><p className="learn-eyebrow">Satu langkah setiap hari</p><h1>Perjalanan belajarmu</h1><p>Ikuti ritmemu. Setiap materi membuka langkah baru.</p></header>
      <LearningCompanion
        variant={allDone ? 'achieving' : 'exploring'}
        title={next?.title ?? (allDone ? 'Lihat sejauh apa kamu melangkah.' : 'Langkah pertamamu menanti.')}
        description={next ? 'Ini materi berikutnya untukmu. Sedikit latihan hari ini, lebih percaya diri esok hari.' : allDone ? 'Semua materi di levelmu sudah selesai. Pilih materi di bawah untuk menguatkan ingatanmu.' : 'Materi untuk levelmu sedang disiapkan. Kembali ke Beranda untuk melihat latihan yang tersedia.'}
        message={allDone ? 'Bangga dengan langkahmu!' : 'Kita jelajahi bersama.'}
        footer={<div className="learn-route-progress"><span><BookOpen size={18} aria-hidden="true" /><b>{completed}</b> dari {lessons.length} materi selesai</span>{lessons.length > 0 && <progress value={completed} max={lessons.length} aria-label="Materi yang selesai di perjalanan ini" />}</div>}
      >
        {next ? <ChunkyButton onClick={tapNow} disabled={startingNow} aria-busy={startingNow}>{startingNow ? 'Menyiapkan sesi…' : 'Mulai belajar'}<ArrowRight size={18} aria-hidden="true" /></ChunkyButton> : <Link className="learn-text-link" href={allDone ? '/progress' : '/home'}>{allDone ? 'Lihat kemajuanmu' : 'Ke Beranda'}<ArrowRight size={17} aria-hidden="true" /></Link>}
      </LearningCompanion>
      <JourneyPath
        topics={journey.topics}
        nowDisabled={startingNow}
        onTapDone={setConfirmLesson}
        onTapNow={tapNow}
        onTapLocked={tapLocked}
      />

      {confirmLesson ? (
        <div className="journey-confirm-backdrop" onClick={() => setConfirmLesson(null)}>
          <Card
            className="journey-confirm-card"
            onClick={(e) => e.stopPropagation()}
            title="Ulangi materi ini?"
          >
            <p className="mb-4 text-sm font-semibold text-muted">
              XP dihitung sebagai ulangan.
            </p>
            <div className="flex gap-2">
              <ChunkyButton
                variant="ghost"
                className="flex-1"
                onClick={() => setConfirmLesson(null)}
              >
                Batal
              </ChunkyButton>
              <ChunkyButton className="flex-1" onClick={confirmReplay}>
                Ulangi
              </ChunkyButton>
            </div>
          </Card>
        </div>
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
