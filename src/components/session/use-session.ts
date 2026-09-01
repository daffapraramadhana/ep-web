'use client';

/**
 * useSession — state machine sesi (Task 10 brief). Dipakai oleh
 * `(user)/session/page.tsx` sekarang, dan oleh per-type answer components
 * (Task 11) + celebration screen (Task 12) nanti.
 *
 * Sumber kebenaran untuk progres adalah `queue`, BUKAN `view.progress`:
 * `view.progress.answered` di BE berarti "pernah dijawab (attempt apa
 * pun)", sedangkan SegmentBar harus terisi hanya untuk soal yang sudah
 * BENAR (ruling koordinator Task 10). `queue` berisi indeks-indeks
 * (posisi di `view.items`) yang belum benar, urut tampil; item yang
 * dijawab salah didorong ke belakang queue supaya muncul lagi nanti,
 * item yang benar dikeluarkan dari queue dan tidak pernah kembali.
 *
 * `filled = total - queue.length` mengikuti ruling itu secara langsung.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { sfx } from '@/lib/sfx';
import type { AnswerResult, SessionItemView, SessionView } from '@/lib/api-types';

export type SessionPhase = 'loading' | 'answering' | 'feedback' | 'done' | 'error';

export interface UseSessionResult {
  view: SessionView | null;
  queue: number[];
  currentIdx: number | null;
  /** Convenience derived dari view+currentIdx — item yang sedang ditampilkan. */
  currentItem: SessionItemView | null;
  total: number;
  /** total - queue.length — dipakai SegmentBar, BUKAN view.progress. */
  filled: number;
  phase: SessionPhase;
  last: AnswerResult | null;
  /** Non-kosong hanya saat phase === 'error' (gagal memuat sesi). */
  loadError: string;
  /** Non-kosong saat submit gagal jaringan; phase TETAP 'answering'. */
  submitError: string;
  /** true selama request submit in-flight — dipakai untuk disable PERIKSA. */
  submitting: boolean;
  submit(answer: string | Blob): Promise<void>;
  next(): void;
  /** Muat ulang sesi (retry awal saat phase 'error'). */
  reload(): void;
}

function buildQueue(view: SessionView): number[] {
  return view.items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => !item.answeredCorrect)
    .sort((a, b) => a.item.order - b.item.order)
    .map(({ idx }) => idx);
}

export function useSession(
  replayLessonId: string | null,
  speaking = false,
): UseSessionResult {
  const [view, setView] = useState<SessionView | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [last, setLast] = useState<AnswerResult | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard sinkron terhadap submit ganda (klik cepat sebelum re-render
  // mengunci tombol) — pelengkap `submitting` state yang dipakai untuk UI.
  // BE tidak punya concurrency lock (lihat brief); ini penjaga praktis di FE.
  const submittingRef = useRef(false);

  const load = useCallback(async () => {
    setPhase('loading');
    setLoadError('');
    try {
      const path = replayLessonId
        ? '/session/replay'
        : speaking
          ? '/session/speaking'
          : '/session/today';
      const nextView = await api<SessionView>(path, {
        method: 'POST',
        body: replayLessonId ? JSON.stringify({ lessonId: replayLessonId }) : undefined,
      });
      const q = buildQueue(nextView);
      setView(nextView);
      setQueue(q);
      setCurrentIdx(q[0] ?? null);
      setLast(null);
      setSubmitError('');
      setPhase(q.length ? 'answering' : 'done');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setPhase('error');
    }
  }, [replayLessonId, speaking]);

  // Guard terhadap React StrictMode dev double-invoke (mount -> cleanup ->
  // mount lagi memanggil effect ini dua kali secara sinkron): tanpa ini,
  // dua POST /session/today nyaris bersamaan bisa lolos race condition di
  // BE (getOrCreateToday belum atomic — find-then-create, bukan
  // find-or-create dalam satu transaksi terkunci) dan membuat dua sesi
  // IN_PROGRESS di hari yang sama (diverifikasi terjadi saat manual testing
  // task ini). `reload()` (retry manual dari layar error) sengaja memanggil
  // `load()` langsung, bukan lewat effect ini, jadi tidak terkena guard ini.
  const loadedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = replayLessonId ?? (speaking ? 'speaking' : '');
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    load();
  }, [replayLessonId, speaking, load]);

  const submit = useCallback(
    async (answer: string | Blob) => {
      // I3 fix: assert the invariant the `slice(1)` math below assumes —
      // `currentIdx` must be the queue's own head. The FE's PERIKSA button
      // is now also disabled during `phase === 'feedback'`, but this guard
      // is the actual safety net: if submit() were ever reachable while
      // stale (e.g. a queued click landing after `next()` already advanced
      // `currentIdx`), submitting for the wrong index would desync `queue`
      // from what's actually being displayed and silently drop an item.
      if (
        !view ||
        currentIdx === null ||
        submittingRef.current ||
        currentIdx !== queue[0]
      )
        return;
      const item = view.items[currentIdx];
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError('');
      try {
        // UCAPAN mengirim Blob rekaman ke endpoint speak (STT di BE);
        // tipe lain mengirim string jawaban ke endpoint answer.
        const result =
          typeof answer === 'string'
            ? await api<AnswerResult>(`/session/${view.id}/answer`, {
                method: 'POST',
                body: JSON.stringify({ itemId: item.itemId, answer }),
              })
            : await (() => {
                const fd = new FormData();
                fd.append('itemId', item.itemId);
                fd.append(
                  'file',
                  answer,
                  answer.type === 'audio/mp4' ? 'record.m4a' : 'record.webm',
                );
                return api<AnswerResult>(`/session/${view.id}/speak`, {
                  method: 'POST',
                  body: fd,
                });
              })();
        // Benar -> keluar dari queue (tidak kembali). Salah -> tetap di
        // queue, didorong ke belakang supaya muncul lagi.
        setQueue((prev) => (result.correct ? prev.slice(1) : [...prev.slice(1), currentIdx]));
        setLast(result);
        setPhase('feedback');
        sfx.play(result.correct ? 'good' : 'bad');
      } catch {
        // Gagal jaringan: phase tetap 'answering', jawaban user (dikelola
        // pemanggil, bukan hook ini) tidak disentuh sama sekali.
        setSubmitError('Koneksi terputus');
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [view, currentIdx, queue],
  );

  const next = useCallback(() => {
    if (queue.length === 0) {
      setPhase('done');
      setCurrentIdx(null);
      // `last` sengaja TIDAK di-null-kan di sini: berisi AnswerResult
      // terakhir (summary, xpAwarded) yang jadi bahan layar perayaan
      // Task 12.
      return;
    }
    setLast(null);
    setSubmitError('');
    setCurrentIdx(queue[0]);
    setPhase('answering');
  }, [queue]);

  const total = view?.items.length ?? 0;
  const filled = total - queue.length;
  const currentItem = view && currentIdx !== null ? (view.items[currentIdx] ?? null) : null;

  return {
    view,
    queue,
    currentIdx,
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
    reload: load,
  };
}
