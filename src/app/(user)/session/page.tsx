'use client';

/**
 * Sesi — Task 10 (kerangka state machine + feedback sheet + resiliensi
 * jaringan) + Task 11 (komponen jawaban per-tipe + lapisan media). Yang
 * final sejak Task 10 dan TIDAK direstruktur di sini: header (✕,
 * SegmentBar, mute), queue/state machine (`useSession`), feedback sheet,
 * dan resiliensi submit — Task 11 hanya mengganti area jawaban (textarea
 * placeholder -> AnswerMc/AnswerIsian/AnswerChips) dan menambah MediaBlock.
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Volume2, VolumeX } from 'lucide-react';
import { sfx } from '@/lib/sfx';
import { api } from '@/lib/api';
import { Card, ChunkyButton } from '@/components/ui';
import { SegmentBar } from '@/components/progress';
import { useSession } from '@/components/session/use-session';
import { Celebrate } from '@/components/session/celebrate';
import { FeedbackSheet } from '@/components/session/feedback-sheet';
import { MediaBlock } from '@/components/session/media-block';
import { AnswerMc } from '@/components/session/answer-mc';
import { AnswerIsian } from '@/components/session/answer-isian';
import { AnswerChips } from '@/components/session/answer-chips';
import { AnswerSpeak } from '@/components/session/answer-speak';

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
  const speaking = searchParams.get('speaking') === '1';

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
  } = useSession(replayLessonId, speaking);

  // `null` = belum siap (PERIKSA mati) — kontrak `onReady` komponen jawaban
  // per-tipe (Task 11 brief). Direset lewat remount (`key={item.itemId}`
  // di bawah), BUKAN effect ini, supaya state internal komponen (opsi
  // terpilih, chip di zona, dst) ikut ter-reset bersih tiap ganti soal.
  const [answer, setAnswer] = useState<string | Blob | null>(null);
  const [muted, setMutedState] = useState<boolean>(() => sfx.getMuted());
  const [toast, setToast] = useState('');

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
    // I4 fix: keep the account's soundOn preference in sync too — fire-and-
    // forget (localStorage stays authoritative for playback either way, so
    // a failed PATCH here is silently ignored, same as profile/page.tsx).
    api('/me', { method: 'PATCH', body: JSON.stringify({ soundOn: !nextMuted }) }).catch(() => {});
  }

  function handleSubmit() {
    if (submitting || answer === null) return;
    submit(answer);
  }

  // Keyboard desktop: Enter = PERIKSA (saat jawaban siap) / LANJUT (saat
  // sheet feedback terbuka). Enter di dalam input isian sudah ditangani
  // komponennya sendiri — di-skip di sini supaya tidak dobel.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (phase === 'feedback') {
        e.preventDefault();
        next();
      } else if (phase === 'answering' && answer !== null && !submitting) {
        e.preventDefault();
        submit(answer);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer, submitting, submit, next]);

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
    return <Celebrate summary={last?.summary ?? null} onContinue={() => router.push('/home')} />;
  }

  // phase 'answering' | 'feedback'
  return (
    <div className="relative flex min-h-screen flex-col">
      <SessionHeader total={total} filled={filled} muted={muted} onToggleMute={toggleMute} />

      {currentItem ? (
        <div className="flex flex-1 flex-col px-5 pt-2 pb-6" key={currentItem.itemId}>
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            {typeLabel(currentItem.type)}
          </div>

          <MediaBlock item={currentItem} />

          {/* ISIAN merender prompt-nya sendiri (blank `___` -> input inline);
              tipe lain memakai heading generik di sini. */}
          {currentItem.type === 'ISIAN' ? (
            <AnswerIsian
              item={currentItem}
              disabled={submitting || phase === 'feedback'}
              result={phase === 'feedback' ? last : null}
              onReady={setAnswer}
              onSubmit={handleSubmit}
            />
          ) : (
            <h2 className="mb-5 text-[21px] font-black leading-snug text-ink">{currentItem.prompt}</h2>
          )}

          {currentItem.type === 'PILIHAN_GANDA' ? (
            <AnswerMc
              item={currentItem}
              disabled={submitting || phase === 'feedback'}
              result={phase === 'feedback' ? last : null}
              onReady={setAnswer}
            />
          ) : null}

          {currentItem.type === 'SUSUN_KALIMAT' ? (
            <AnswerChips
              item={currentItem}
              disabled={submitting || phase === 'feedback'}
              result={phase === 'feedback' ? last : null}
              onReady={setAnswer}
            />
          ) : null}

          {currentItem.type === 'UCAPAN' ? (
            <AnswerSpeak
              item={currentItem}
              disabled={submitting || phase === 'feedback'}
              result={phase === 'feedback' ? last : null}
              onReady={setAnswer}
            />
          ) : null}

          <div className="flex-1" />

          <ChunkyButton
            variant="ghost"
            // I3 fix: also disabled while the feedback sheet is open —
            // without this, PERIKSA stayed reachable underneath the open
            // sheet (e.g. via keyboard) and a resubmit while `phase ===
            // 'feedback'` could corrupt the queue (use-session.ts's
            // `submit()` assumes it's only ever called for the CURRENT
            // queue[0] item).
            disabled={submitting || answer === null || phase === 'feedback'}
            onClick={handleSubmit}
          >
            {submitError ? 'COBA LAGI' : submitting ? 'MEMERIKSA...' : 'PERIKSA'}
          </ChunkyButton>
          <span className="kbd-hint" aria-hidden="true">
            {currentItem.type === 'PILIHAN_GANDA' ? '1–4 pilih · ' : ''}Enter{' '}
            {phase === 'feedback' ? 'lanjut' : 'periksa'}
          </span>
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
  if (type === 'UCAPAN') return 'Ucapan';
  return type;
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionBody />
    </Suspense>
  );
}
