'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Pencil, Headphones, FileText, Mic, Snowflake, Star, Flame, MessagesSquare } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProgressView, SkillTag } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { WeekStrip } from '@/components/week-strip';
import { LearningCompanion, LearningPageSkeleton } from '@/components/learning-companion';

const SKILL_META: Record<SkillTag, { label: string; description: string; icon: ComponentType<{ size?: number }> }> = {
  VOCABULARY: { label: 'Vocabulary', description: 'Kosakata', icon: BookOpen },
  GRAMMAR: { label: 'Grammar', description: 'Tata bahasa', icon: Pencil },
  LISTENING: { label: 'Listening', description: 'Menyimak', icon: Headphones },
  READING: { label: 'Reading', description: 'Membaca', icon: FileText },
  SPEAKING: { label: 'Speaking', description: 'Berbicara', icon: Mic },
};

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadProgress = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api<ProgressView>('/progress')
      .then(p => { setProgress(p); setLoading(false); })
      .catch(err => { setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan'); setLoading(false); });
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  if (!progress && loading) return <LearningPageSkeleton title="Progress" />;
  if (!progress && loadError) return <div className="flex min-h-screen items-center justify-center px-5">
    <Card eyebrow="Progress" title="Gagal memuat data" className="w-full max-w-sm text-center">
      <p className="mb-4 text-sm font-semibold text-muted">Periksa koneksimu, lalu coba lagi.</p>
      <ChunkyButton variant="ghost" onClick={loadProgress}>Coba lagi</ChunkyButton>
    </Card>
  </div>;
  if (!progress) return null;

  const answered = progress.skills.reduce((sum, skill) => sum + skill.answered, 0);
  const activeDays = progress.week.filter(day => day.state === 'active').length;
  const format = (n: number) => n.toLocaleString('id-ID');

  return <div className="learn-page learn-progress-page">
    <header className="learn-page-heading"><p className="learn-eyebrow">Jejak langkahmu</p><h1>Kemajuan belajarmu</h1><p>Bukan soal paling cepat. Ini tentang terus bertumbuh.</p></header>
    <LearningCompanion
      variant={answered > 0 ? 'proud' : 'welcome'}
      title={answered > 0 ? 'Setiap latihan meninggalkan jejak.' : 'Kemajuanmu dimulai di sini.'}
      description={answered > 0 ? `${format(answered)} soal sudah kamu jawab. Terus beri dirimu ruang untuk mencoba dan belajar.` : 'Selesaikan latihan pertamamu, lalu lihat kemampuan dan kebiasaanmu tumbuh di sini.'}
      message={answered > 0 ? 'Langkah kecilmu berarti.' : 'Aku siap menemanimu.'}
      footer={<dl className="learn-achievements">
        <div><dt><Star size={15} aria-hidden="true" />Total XP</dt><dd>{format(progress.totals.xpTotal)}</dd></div>
        <div><dt><BookOpen size={15} aria-hidden="true" />Materi selesai</dt><dd>{format(progress.totals.lessonsDone)}</dd></div>
        <div><dt><Flame size={15} aria-hidden="true" />Streak terbaik</dt><dd>{format(progress.totals.longestStreak)} <small>hari</small></dd></div>
      </dl>}
    ><Link href="/home" className="learn-text-link">Lanjut belajar <ArrowRight size={17} aria-hidden="true" /></Link></LearningCompanion>

    <section className="learn-progress-skills" aria-labelledby="skills-heading">
      <div className="learn-section-heading"><div><p className="learn-eyebrow">Sedikit demi sedikit</p><h2 id="skills-heading">Kemampuanmu</h2></div></div>
      <p className="learn-section-description">Akurasi jawaban pertama, bukan persentase materi yang selesai.</p>
      <div className="learn-skill-grid">
        {progress.skills.map(skill => {
          const meta = SKILL_META[skill.skill];
          const Icon = meta.icon;
          return <article className="learn-skill-card" key={skill.skill}>
            <div className="learn-skill-heading"><span className="learn-skill-icon"><Icon size={21} aria-hidden="true" /></span><div><h3>{meta.label}</h3><p>{meta.description}</p></div></div>
            <div className="learn-skill-score"><b>{skill.accuracy == null ? 'Belum ada data' : `${skill.accuracy}%`}</b><span>{format(skill.answered)} soal dijawab</span></div>
            {skill.accuracy == null ? <p className="learn-skill-empty">Datanya muncul setelah kamu berlatih.</p> : <progress value={skill.accuracy} max={100} aria-label={`Akurasi ${meta.label}`} />}
          </article>;
        })}
      </div>
      {progress.skills.length === 0 && <p className="card learn-section-description">Belum ada data kemampuan. Mulai belajar untuk mengisi jejak pertamamu.</p>}
    </section>

    <section className="card learn-consistency" aria-labelledby="consistency-heading">
      <div className="learn-section-heading"><div><p className="learn-eyebrow">Kebiasaan baik</p><h2 id="consistency-heading">Langkah minggu ini</h2></div><span>{activeDays} hari aktif</span></div>
      <WeekStrip week={progress.week} />
      <p className="learn-week-caption">{activeDays === 0 ? 'Minggu ini masih punya ruang untuk satu langkah kecil.' : `Target harian tercapai di ${activeDays} hari minggu ini.`}</p>
      <p className="learn-freeze-legend"><Snowflake size={14} aria-hidden="true" />Pembeku menjaga streak saat kamu melewatkan sehari.</p>
    </section>

    <section className="card learn-conversation-summary" aria-labelledby="conversation-heading">
      <span className="learn-skill-icon"><MessagesSquare size={22} aria-hidden="true" /></span>
      <div><h2 id="conversation-heading">Keberanian untuk berbicara</h2><p>Ringkasan percakapan AI yang sudah dinilai.</p></div>
      <dl><div><dt>Percakapan</dt><dd>{format(progress.totals.voiceConversations)}</dd></div><div><dt>Menit ngobrol</dt><dd>{format(progress.totals.voiceMinutes)}</dd></div></dl>
    </section>
    <p className="learn-signoff">Bandingkan langkahmu dengan dirimu yang kemarin.</p>
  </div>;
}
