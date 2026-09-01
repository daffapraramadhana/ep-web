'use client';

/**
 * FeedbackSheet — design-system.md §2 "Feedback sheet" + §3 (naik 280ms,
 * cubic-bezier(.3,1.3,.5,1)). Selalu ter-mount (supaya transisi CSS jalan
 * dua arah, naik & turun); posisi/visibilitas dikendalikan lewat `open`.
 *
 * Isi tetap ditampilkan (via `shown`, bukan langsung `result`) selama
 * animasi turun berlangsung, supaya tidak ada flash konten kosong saat
 * sheet meluncur turun setelah tombol LANJUT ditekan.
 *
 * `inert` (bukan `aria-disabled`/`aria-hidden`) dipakai saat tertutup —
 * ini benar-benar mengeluarkan tombol LANJUT/Laporkan dari fokus keyboard
 * & pohon aksesibilitas selagi sheet berada di luar layar, tanpa
 * melanggar aturan "tidak boleh ada descendant fokusabel di dalam
 * aria-hidden".
 */

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChunkyButton } from '@/components/ui';
import type { AnswerResult } from '@/lib/api-types';

export interface FeedbackSheetProps {
  open: boolean;
  result: AnswerResult | null;
  /** itemId dari soal yang baru dijawab — target POST /items/:id/report. */
  itemId: string | null;
  onNext: () => void;
  onToast: (message: string) => void;
}

export function FeedbackSheet({ open, result, itemId, onNext, onToast }: FeedbackSheetProps) {
  const [shown, setShown] = useState<AnswerResult | null>(result);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (result) setShown(result);
  }, [result]);

  useEffect(() => {
    if (!open) {
      setReportOpen(false);
      setReportNote('');
      setReportError('');
    }
  }, [open]);

  if (!shown) return null;

  const correct = shown.correct;

  async function submitReport() {
    const note = reportNote.trim();
    if (!itemId || note.length < 3 || reportSubmitting) return;
    setReportSubmitting(true);
    setReportError('');
    try {
      await api(`/items/${itemId}/report`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      setReportOpen(false);
      setReportNote('');
      onToast('Terima kasih, laporan terkirim');
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Gagal mengirim laporan');
    } finally {
      setReportSubmitting(false);
    }
  }

  return (
    <div
      className={`feedback-sheet ${correct ? '' : 'feedback-sheet-bad'} ${open ? 'feedback-sheet-up' : ''}`}
      role="status"
      inert={!open}
    >
      {reportOpen ? (
        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-ink" htmlFor="report-note">
            Apa yang salah dari soal ini?
          </label>
          <textarea
            id="report-note"
            className="field-textarea"
            rows={3}
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Ceritakan singkat masalahnya..."
          />
          {reportError ? <p className="mt-1.5 text-[12.5px] font-bold text-bad">{reportError}</p> : null}
          <div className="mt-3 flex gap-2">
            <ChunkyButton type="button" variant="ghost" onClick={() => setReportOpen(false)}>
              Batal
            </ChunkyButton>
            <ChunkyButton
              type="button"
              onClick={submitReport}
              disabled={reportSubmitting || note3(reportNote)}
            >
              {reportSubmitting ? 'Mengirim...' : 'Kirim'}
            </ChunkyButton>
          </div>
        </div>
      ) : (
        <>
          <h4 className="feedback-sheet-title">{correct ? 'Benar! 🎯' : 'Belum tepat'}</h4>
          <p className="feedback-sheet-body">
            {shown.explanation}
            {!correct && shown.correctAnswer ? (
              <>
                {' '}
                Jawaban benar: <strong>{shown.correctAnswer}</strong>
              </>
            ) : null}
          </p>
          {shown.transcript ? (
            <p className="feedback-sheet-transcript">
              Yang terdeteksi: <strong>“{shown.transcript}”</strong>
            </p>
          ) : null}
          <ChunkyButton type="button" variant={correct ? 'good' : 'danger'} onClick={onNext}>
            LANJUT
          </ChunkyButton>
          <button
            type="button"
            className="feedback-sheet-report"
            onClick={() => setReportOpen(true)}
          >
            Laporkan soal
          </button>
        </>
      )}
    </div>
  );
}

function note3(note: string): boolean {
  return note.trim().length < 3;
}
