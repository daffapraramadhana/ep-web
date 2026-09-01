'use client';

/**
 * AnswerSpeak — ucapan (Task 5 speaking drill). Render `item.targetText`
 * (kalimat yang harus diucapkan) + tombol rekam. Hasil: `onReady(Blob)`
 * saat rekaman siap, `onReady(null)` saat belum / dibatalkan (Rekam Ulang).
 *
 * MediaRecorder: MIME dipilih dari dukungan browser — `audio/webm` (Chrome/
 * Firefox/Edge), fallback `audio/mp4` (iOS Safari), selain itu dua-duanya →
 * pesan "tidak mendukung" + `onReady(null)`.
 *
 * `result?.transcript` (dari BE setelah submit) ditampilkan sebagai "Yang
 * terdeteksi: ..." — umpan balik utama untuk latihan berbicara.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Play, RotateCcw } from 'lucide-react';
import type { AnswerResult, SessionItemView } from '@/lib/api-types';

type RecState = 'idle' | 'recording' | 'recorded';

export interface AnswerSpeakProps {
  item: SessionItemView;
  disabled: boolean;
  result: AnswerResult | null;
  onReady: (answer: string | Blob | null) => void;
}

function pickMime(): string | null {
  if (typeof window === 'undefined' || !('MediaRecorder' in window)) return null;
  if (window.MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  if (window.MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  return null;
}

export function AnswerSpeak({ item, disabled, result, onReady }: AnswerSpeakProps) {
  const [recState, setRecState] = useState<RecState>('idle');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Awal belum siap — parent remount per soal (`key={item.itemId}`), jadi
  // tidak ada effect-reset tambahan.
  useEffect(() => {
    onReady(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Cleanup saat unmount / pindah soal: hentikan stream, jangan bocorkan
  // mikrofon. (Blob yang sudah jadi tidak perlu di-revoke — pendek singkat.)
  useEffect(() => stopTracks, []);

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }

  async function startRecording() {
    setError('');
    setBlob(null);
    onReady(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      if (!mime) {
        stopTracks();
        setError('Perangkat ini tidak mendukung perekaman suara');
        return;
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        stopTracks();
        setBlob(audio);
        setRecState('recorded');
        onReady(audio);
      };
      recorder.start();
      setRecState('recording');
    } catch {
      stopTracks();
      setError('Mikrofon tidak tersedia — izinkan akses mikrofon lalu coba lagi');
    }
  }

  function cancelRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    chunksRef.current = [];
    stopTracks();
    setBlob(null);
    setRecState('idle');
    onReady(null);
  }

  function togglePreview() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  // Satu object URL per blob (bukan per render — yang di-render ulang tiap
  // kali parent meng-update state). Tanpa revoke: dipakai jangka pendek per
  // soal, URL dikeluarkan saat audio element ter-remount.
  const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);
  const transcript = result?.transcript ?? null;
  const locked = disabled || !!result; // saat feedback/sedang submit: kunci rekam

  return (
    <div className="mb-5">
      <div className="speak-target" aria-hidden="true">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted">
          Baca dengan lantang
        </p>
        <p className="text-[19px] font-bold leading-snug text-ink">{item.targetText}</p>
      </div>

      <div className="speak-rec" data-recording={recState === 'recording' || undefined}>
        {recState === 'recording' ? (
          <button
            type="button"
            className="media-audio-play speak-rec-btn"
            aria-label="Hentikan rekaman"
            onClick={stopRecording}
          >
            <Pause size={24} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            className="media-audio-play speak-rec-btn"
            aria-label={blob ? 'Rekam ulang' : 'Mulai merekam'}
            disabled={locked}
            onClick={startRecording}
          >
            {blob ? <RotateCcw size={24} strokeWidth={2.5} /> : <Mic size={24} strokeWidth={2.5} />}
          </button>
        )}
        <div className="speak-wave" aria-hidden="true">
          {recState === 'recording' ? (
            <>
              {[40, 70, 50, 90, 60, 100, 55, 80, 45, 65, 35, 75, 50, 90, 40, 60].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </>
          ) : (
            <span className="speak-wave-placeholder">
              {blob ? 'Rekaman siap' : 'Ketuk untuk mulai merekam'}
            </span>
          )}
        </div>
        <audio
          ref={audioRef}
          src={previewUrl}
          className="sr-only"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      </div>

      {blob && recState === 'recorded' && (
        <div className="speak-actions">
          <button type="button" className="speak-action" onClick={togglePreview}>
            {playing ? <Pause size={16} strokeWidth={2.5} /> : <Play size={16} strokeWidth={2.5} />}
            {playing ? 'Jeda' : 'Putar'}
          </button>
          <button type="button" className="speak-action" onClick={cancelRecording} disabled={locked}>
            <RotateCcw size={16} strokeWidth={2.5} />
            Rekam ulang
          </button>
        </div>
      )}

      {error ? <p className="mt-2 text-[12.5px] font-bold text-bad">{error}</p> : null}

      {transcript ? (
        <div className="speak-transcript">
          <span className="speak-transcript-label">Yang terdeteksi:</span>{' '}
          <span className="speak-transcript-text">“{transcript}”</span>
        </div>
      ) : null}
    </div>
  );
}
