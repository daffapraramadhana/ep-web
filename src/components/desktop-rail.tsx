'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Flame, Snowflake, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProgressView } from '@/lib/api-types';
import { Card } from '@/components/ui';
import { WeekStrip } from '@/components/week-strip';
import { useSummary } from '@/lib/use-summary';

export function DesktopRail() {
  const { summary } = useSummary();
  const [progress, setProgress] = useState<ProgressView | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<ProgressView>('/progress').then(p => {
      if (!cancelled) { setProgress(p); setFailed(false); }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [attempt]);

  const streak = summary?.streak ?? 0;
  const milestone = [7, 30, 100].find(n => n > streak);
  return (
    <aside className="desktop-rail" aria-label="Ringkasan belajar">
      <Card className="learn-streak-card">
        <span className="learn-streak-symbol"><Flame size={26} strokeWidth={1.8} aria-hidden="true" /></span>
        {summary ? <>
          <div className="learn-streak-number">{streak}<span>hari beruntun</span></div>
          <p>{streak === 0 ? 'Setiap kebiasaan dimulai dari hari pertama.' : 'Konsistensi kecil, kemajuan nyata.'}</p>
          {milestone ? <div className="learn-milestone"><span><Trophy size={14} aria-hidden="true" />Menuju {milestone} hari <b>{streak}/{milestone}</b></span><progress value={streak} max={milestone} aria-label={`Menuju streak ${milestone} hari`} /></div> : <p className="learn-milestone-complete"><Trophy size={16} />100 hari terlewati. Terus bertumbuh!</p>}
        </> : <div className="learn-rail-placeholder">Statistik belum tersedia.</div>}
        {summary?.freezeAvailableThisWeek && <div className="learn-freeze"><Snowflake size={15} aria-hidden="true" />1 pembeku streak tersedia</div>}
      </Card>

      <Card eyebrow="Kebiasaan baik" title="Langkah minggu ini">
        {progress ? <WeekStrip week={progress.week} /> : failed
          ? <div className="learn-rail-placeholder"><p>Progres belum bisa dimuat.</p><button onClick={() => { setFailed(false); setAttempt(n => n + 1); }}>Coba lagi</button></div>
          : <div className="skeleton h-[84px] rounded-[14px]" />}
      </Card>

      {progress && <Card className="learn-progress-card">
        <div className="learn-section-heading"><h2>Sudah sejauh ini</h2><Trophy size={18} aria-hidden="true" /></div>
        <div className="learn-progress-row"><span>Materi selesai</span><b>{progress.totals.lessonsDone}</b></div>
        <div className="learn-progress-row"><span>Soal dijawab</span><b>{progress.skills.reduce((n, s) => n + s.answered, 0).toLocaleString('id-ID')}</b></div>
        <div className="learn-progress-row"><span>Streak terpanjang</span><b>{progress.totals.longestStreak} hari</b></div>
        <Link href="/progress">Lihat progresmu <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </Card>}
    </aside>
  );
}
