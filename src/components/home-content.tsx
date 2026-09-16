'use client';

import Link from 'next/link';
import { AlarmClock, ArrowRight, BookOpen, ChevronRight, MessagesSquare, Mic } from 'lucide-react';
import type { ProgressView, SummaryView } from '@/lib/api-types';
import { Hero } from '@/components/hero';
import { WeekStrip } from '@/components/week-strip';

export function HomeContent({ summary, week, error, starting, startingSpeaking, onStart, onSpeak }: {
  summary: SummaryView;
  week: ProgressView['week'] | null;
  error: string;
  starting: boolean;
  startingSpeaking: boolean;
  onStart: () => void;
  onSpeak: () => void;
}) {
  const busy = starting || startingSpeaking;
  return <div className="learn-home">
    {error && <p className="learn-error" role="alert">{error}</p>}
    <Hero summary={summary} starting={busy} onStart={onStart} />
    <section className="learn-practice" aria-labelledby="practice-title">
      <div className="learn-section-heading"><div><p className="learn-eyebrow">Sedikit eksplorasi</p><h2 id="practice-title">Temukan ritmemu</h2></div><Link href="/journey">Perjalanan <ArrowRight size={16} aria-hidden="true" /></Link></div>
      <div className="learn-practice-grid">
        <button className="learn-practice-card" onClick={onSpeak} disabled={busy} aria-busy={startingSpeaking}>
          <span className="learn-practice-icon"><Mic size={23} strokeWidth={1.8} /></span>
          <h3>Berani berbicara</h3><p>Latih pelafalan, satu kalimat setiap kali.</p>
          <span className="learn-practice-action">{startingSpeaking ? 'Menyiapkan…' : 'Latihan berbicara'}<ChevronRight size={17} /></span>
        </button>
        <Link className="learn-practice-card" href={summary.voiceAgentEnabled ? '/talk' : '/journey'}>
          <span className="learn-practice-icon">{summary.voiceAgentEnabled ? <MessagesSquare size={23} strokeWidth={1.8} /> : <BookOpen size={23} strokeWidth={1.8} />}</span>
          <h3>{summary.voiceAgentEnabled ? 'Mulai percakapan' : 'Langkah berikutnya'}</h3>
          <p>{summary.voiceAgentEnabled ? 'Ngobrol santai dengan tutor AI, tanpa naskah.' : 'Lihat materi dan progres perjalanan belajarmu.'}</p>
          <span className="learn-practice-action">{summary.voiceAgentEnabled ? 'Ngobrol dengan AI' : 'Jelajahi materi'}<ChevronRight size={17} /></span>
        </Link>
      </div>
      <p className="learn-practice-note">Latihan berbicara ikut dihitung ke target harianmu.</p>
    </section>
    {summary.reviewsDue > 0 && <button className="learn-review" onClick={onStart} disabled={busy}>
      <AlarmClock size={22} aria-hidden="true" /><span><b>{summary.reviewsDue} soal untuk diingat kembali</b><small>Disertakan dalam sesi belajarmu.</small></span><ChevronRight size={18} aria-hidden="true" />
    </button>}
    {week && <section className="learn-week-mobile card" aria-labelledby="week-title"><div className="learn-section-heading"><h2 id="week-title">Langkah minggu ini</h2><span>{week.filter(d => d.state === 'active').length} hari aktif</span></div><WeekStrip week={week} /></section>}
    <p className="learn-signoff">Langkah kecil. Percakapan yang lebih besar.</p>
  </div>;
}
