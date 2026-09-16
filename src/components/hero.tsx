'use client';

import { ArrowRight, Check, Clock3, Flame, Snowflake, Star, Target } from 'lucide-react';
import Link from 'next/link';
import { Mascot } from '@/components/mascot';
import { ChunkyButton } from '@/components/ui';
import type { SummaryView } from '@/lib/api-types';

export interface HeroProps {
  summary: SummaryView;
  starting: boolean;
  onStart: () => void;
}

function greetingWIB() {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta',
  }).format(new Date()));
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export function Hero({ summary: s, starting, onStart }: HeroProps) {
  const target = Math.max(1, s.dailyTarget);
  const met = s.sessionsCompletedToday >= target;
  const lesson = s.nextLesson;
  const canStart = !!(s.openSession || lesson || s.contentExhausted);
  const title = s.openSession
    ? s.openSession.lessonTitle ?? 'Sesi penguatan'
    : lesson?.title ?? (s.contentExhausted ? 'Perkuat yang sudah kamu pelajari' : 'Perjalananmu segera dimulai');

  return (
    <header className="learn-hero">
      <div className="learn-heading">
        <div>
          <p className="learn-eyebrow">Ruang belajarmu</p>
          <h1>{greetingWIB()}, {s.name}.</h1>
        </div>
        <div className="learn-stats" aria-label="Pencapaian kamu">
          <span><Flame aria-hidden="true" size={17} /><b>{s.streak}</b><span>hari</span></span>
          <span><Star aria-hidden="true" size={17} /><b>{s.xpTotal.toLocaleString('id-ID')}</b><span>XP</span></span>
          {s.freezeAvailableThisWeek && <span title="1 token pembeku tersedia" aria-label="1 token pembeku tersedia"><Snowflake aria-hidden="true" size={17} /><b>1</b></span>}
        </div>
      </div>

      <section className={`learn-spotlight${met ? ' learn-spotlight-met' : ''}`} aria-labelledby="daily-lesson-title">
        <div className="learn-stage">
          <p className="learn-bubble">{met ? 'Hebat. Kamu hadir untuk dirimu hari ini!' : s.openSession ? 'Yuk, lanjutkan langkah kecilmu.' : 'Sedikit latihan, lebih percaya diri.'}</p>
          <div className="learn-mascot-ground" aria-hidden="true" />
          <Mascot className="learn-mascot" priority sizes="(min-width: 600px) 260px, 216px" />
        </div>
        <div className="learn-lesson">
          <span className="learn-lesson-label">{s.openSession ? 'Lanjutkan sesimu' : met ? 'Target tercapai · lanjut jika kamu mau' : 'Langkah hari ini'}</span>
          <h2 id="daily-lesson-title">{title}</h2>
          <p className="learn-lesson-description">
            {s.openSession
              ? `${s.openSession.answered} dari ${s.openSession.total} soal selesai. Kita lanjut dari tempatmu berhenti.`
              : lesson ? lesson.topic
                : s.contentExhausted ? 'Semua materi di levelmu sudah selesai. Jaga kemampuanmu dengan latihan penguatan.'
                  : 'Materi untuk levelmu sedang disiapkan. Kamu bisa melihat perjalanan belajarmu.'}
          </p>
          {lesson && !s.openSession && <div className="learn-lesson-meta">
            <span><Clock3 size={15} aria-hidden="true" />±{lesson.estMinutes} menit</span>
            <span><Star size={15} aria-hidden="true" />+{lesson.xpEstimate} XP</span>
            <span>{lesson.itemCount} soal</span>
          </div>}
          {canStart ? <ChunkyButton onClick={onStart} disabled={starting} aria-busy={starting}>
            {starting ? 'Menyiapkan sesi…' : s.openSession ? 'Lanjutkan belajar' : met ? 'Latihan lagi' : 'Mulai belajar'}
            {!starting && <ArrowRight size={19} aria-hidden="true" />}
          </ChunkyButton> : <Link className="btn" href="/journey">Lihat perjalanan <ArrowRight size={19} aria-hidden="true" /></Link>}
        </div>
        <div className={`learn-daily${met ? ' learn-daily-met' : ''}`}>
          <span className="learn-daily-icon" aria-hidden="true">{met ? <Check size={19} /> : <Target size={19} />}</span>
          <div className="learn-daily-copy"><b>{met ? 'Target hari ini tercapai' : 'Target harian'}</b><span>{met ? 'Satu kebiasaan baik lagi terjaga.' : `${target - s.sessionsCompletedToday} sesi lagi. Kamu bisa!`}</span></div>
          <div className="learn-daily-progress">
            <span><b>{s.sessionsCompletedToday}</b> / {target} sesi</span>
            <progress aria-label="Progres target harian" value={Math.min(s.sessionsCompletedToday, target)} max={target} />
          </div>
        </div>
      </section>
    </header>
  );
}

export function HeroSkeleton() {
  return <div className="learn-hero" aria-busy="true" aria-label="Memuat beranda">
    <div className="learn-heading"><div className="skeleton h-12 w-64 max-w-full" /></div>
    <div className="learn-spotlight learn-loading"><div className="skeleton h-48 w-48 rounded-full" /><div className="skeleton h-32 w-64 max-w-full" /></div>
  </div>;
}
