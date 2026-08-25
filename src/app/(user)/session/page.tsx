'use client';

/**
 * Sesi — Task 10 brief: kerangka state machine + feedback sheet +
 * resiliensi jaringan. Area jawaban di sini SENGAJA sementara (textarea
 * polos, semua tipe soal) — Task 11 mengganti dengan komponen per-tipe
 * (pilihan ganda / isian / susun kalimat). Yang final di task ini: header
 * (✕, SegmentBar, mute), queue/state machine (`useSession`), feedback
 * sheet, dan resiliensi submit.
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Volume2, VolumeX } from 'lucide-react';
import { sfx } from '@/lib/sfx';
import { Card, ChunkyButton } from '@/components/ui';
import { SegmentBar } from '@/components/progress';
import { useSession } from '@/components/session/use-session';
import { FeedbackSheet } from '@/components/session/feedback-sheet';

function SessionHeader({
  total,
  filled,
  muted,
  onToggleMute,
}: {
  total: number;
  filled: number;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 px-4 pt-[18px] pb-2.5">
      <button
        type="button"
        aria-label="Keluar dari sesi"
        className="flex h-9 w-9 items-center justify-center text-muted"
        onClick={() => router.push('/home')}
      >
        <X size={22} strokeWidth={2.5} />
      </button>
      <SegmentBar total={Math.max(total, 1)} filled={filled} />
      <button
        type="button"
        aria-label={muted ? 'Nyalakan bunyi' : 'Matikan bunyi'}
        className="flex h-9 w-9 items-center justify-center text-muted"
        onClick={onToggleMute}
      >
        {muted ? <VolumeX size={20} strokeWidth={2.25} /> : <Volume2 size={20} strokeWidth={2.25} />}
      </button>
    </div>
  );
}

function SessionBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replayLessonId = searchParams.get('replay');

  const {
    currentItem,
    total,
    filled,
    phase,
    last,
    loadError,
    submitError,
    submitting,
    submit,
    next,
    reload,
  } = useSession(replayLessonId);

  const [answer, setAnswer] = useState('');
  const [muted, setMutedState] = useState<boolean>(() => sfx.getMuted());
  const [toast, setToast] = useState('');

  // Textarea dikosongkan hanya saat pindah ke soal berikutnya (currentItem
  // berganti), TIDAK saat submit gagal jaringan — brief: "jawaban user
  // utuh" saat gagal jaringan.
  useEffect(() => {
    setAnswer('');
  }, [currentItem?.itemId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (submitError) setToast('Koneksi terputus');
  }, [submitError]);

  function toggleMute() {
    const nextMuted = !muted;
    sfx.setMuted(nextMuted);
    setMutedState(nextMuted);
  }

  function handleSubmit() {
    if (submitting || !answer.trim()) return;
    submit(answer);
  }

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <p className="text-sm font-semibold text-muted">Memuat sesi...</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Sesi" title="Gagal memuat sesi" className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">{loadError}</p>
          <ChunkyButton onClick={reload}>Coba lagi</ChunkyButton>
        </Card>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-2 text-[58px]">🎉</div>
        <p className="mb-6 text-base font-bold text-muted">(perayaan di Task 12)</p>
        <ChunkyButton variant="good" className="max-w-xs" onClick={() => router.push('/home')}>
          LANJUT
        </ChunkyButton>
      </div>
    );
  }

  // phase 'answering' | 'feedback'
  return (
    <div className="relative flex min-h-screen flex-col">
      <SessionHeader total={total} filled={filled} muted={muted} onToggleMute={toggleMute} />

      {currentItem ? (
        <div className="flex flex-1 flex-col px-5 pt-2 pb-6">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            {typeLabel(currentItem.type)}
          </div>
          {currentItem.passage ? (
            <p className="mb-3 text-sm font-semibold text-muted">{currentItem.passage}</p>
          ) : null}
          <h2 className="mb-5 text-[21px] font-black leading-snug text-ink">{currentItem.prompt}</h2>

          <textarea
            className="field-textarea mb-4 min-h-[100px] flex-1"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting}
            placeholder="Tulis jawabanmu di sini..."
          />

          <div className="flex-1" />

          <ChunkyButton
            variant="ghost"
            disabled={submitting || !answer.trim()}
            onClick={handleSubmit}
          >
            {submitError ? 'COBA LAGI' : submitting ? 'MEMERIKSA...' : 'PERIKSA'}
          </ChunkyButton>
        </div>
      ) : null}

      <FeedbackSheet
        open={phase === 'feedback'}
        result={last}
        itemId={currentItem?.itemId ?? null}
        onNext={next}
        onToast={setToast}
      />

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function typeLabel(type: string): string {
  if (type === 'PILIHAN_GANDA') return 'Pilihan ganda';
  if (type === 'ISIAN') return 'Isian';
  if (type === 'SUSUN_KALIMAT') return 'Susun kalimat';
  return type;
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionBody />
    </Suspense>
  );
}
