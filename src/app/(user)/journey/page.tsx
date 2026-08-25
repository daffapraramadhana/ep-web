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
 * 'locked' -> shake (ditangani di JourneyPath) + toast singkat.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { JourneyLessonView, JourneyView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { JourneyPath } from '@/components/journey-path';

function JourneySkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="skeleton h-11 rounded-2xl" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton h-16 w-16 shrink-0 rounded-full" />
          <div className="skeleton h-4 w-40 rounded-full" />
        </div>
      ))}
    </div>
  );
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
    setToast('Selesaikan lesson sebelumnya dulu');
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

  return (
    <div>
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
            title="Ulangi lesson ini?"
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
              <ChunkyButton variant="good" className="flex-1" onClick={confirmReplay}>
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
