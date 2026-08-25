'use client';

/**
 * MediaBlock — lapisan media di atas prompt (Task 11 brief Step 4).
 * `item.mediaUrl` bisa berupa path relatif (`/media/...`, dari
 * `LocalStorageService.getUrl` di BE — lihat apps/api/src/storage/local.storage.ts)
 * atau URL absolut (S3, `S3_PUBLIC_URL`) — hanya di-prefix
 * `NEXT_PUBLIC_API_URL` bila relatif.
 *
 * Tipe media (audio vs gambar) ditentukan dari ekstensi file, konsisten
 * dengan whitelist upload admin (apps/api/src/media/media.controller.ts
 * `ALLOWED`: .mp3/.m4a = audio, .png/.jpg/.jpeg/.webp = gambar).
 *
 * Parent (session page) me-remount komponen ini per soal via
 * `key={item.itemId}` — itulah yang mereset state `playing`/autoplay guard
 * di bawah tanpa effect ekstra untuk itu.
 */

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { sfx } from '@/lib/sfx';
import type { SessionItemView } from '@/lib/api-types';

const AUDIO_EXT = new Set(['.mp3', '.m4a']);
// Bar tinggi statis (dekoratif, bukan visualizer real) — pola naik-turun
// supaya terlihat seperti gelombang tanpa animasi.
const WAVE_HEIGHTS = [40, 70, 50, 90, 60, 100, 55, 80, 45, 65, 35, 75, 50, 90, 40, 60];

function extOf(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  return dot === -1 ? '' : clean.slice(dot).toLowerCase();
}

function resolveUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ''}${url}`;
}

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Autoplay sekali per soal, kecuali bunyi di-mute (mengikuti preferensi
  // global sfx, tombol yang sama dengan header sesi).
  useEffect(() => {
    if (sfx.getMuted()) return;
    audioRef.current?.play().catch(() => {
      // Autoplay diblok browser (butuh gestur user) — abaikan, tombol
      // play tetap tersedia untuk diputar manual.
    });
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  return (
    <div className="media-audio">
      <button
        type="button"
        className="media-audio-play"
        aria-label={playing ? 'Jeda audio soal' : 'Putar audio soal'}
        onClick={toggle}
      >
        {playing ? <Pause size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} />}
      </button>
      <div className="media-audio-wave" aria-hidden="true">
        {WAVE_HEIGHTS.map((h, i) => (
          <span key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        aria-label="Audio soal"
        className="sr-only"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
      />
    </div>
  );
}

function ImageBlock({ url }: { url: string }) {
  return (
    <div className="media-image">
      {/* Sumber bisa dari domain manapun (S3_PUBLIC_URL) -> next/image
          butuh remotePatterns statis; <img> polos lebih sesuai di sini. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Ilustrasi soal" />
    </div>
  );
}

function PassageBlock({ text }: { text: string }) {
  return (
    <div className="media-passage" tabIndex={0}>
      {text}
    </div>
  );
}

export function MediaBlock({ item }: { item: SessionItemView }) {
  if (!item.mediaUrl && !item.passage) return null;
  const isAudio = item.mediaUrl ? AUDIO_EXT.has(extOf(item.mediaUrl)) : false;
  return (
    <div>
      {item.mediaUrl ? (
        isAudio ? <AudioPlayer url={resolveUrl(item.mediaUrl)} /> : <ImageBlock url={resolveUrl(item.mediaUrl)} />
      ) : null}
      {item.passage ? <PassageBlock text={item.passage} /> : null}
    </div>
  );
}
