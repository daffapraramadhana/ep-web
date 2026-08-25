'use client';

import { useEffect, useState } from 'react';
import { Flame, Star, Snowflake } from 'lucide-react';
import { api } from '@/lib/api';
import type { SummaryView, ProgressView } from '@/lib/api-types';
import { Card } from '@/components/ui';

/**
 * Rail kanan desktop (>=1024px) — rumah widget statistik yang di mobile
 * hidup di hero/halaman Progress: statistik (streak/XP/freeze), kalender
 * minggu ini, dan total pencapaian. Data dari endpoint yang sudah ada
 * (/me/summary + /progress), di-fetch sekali per mount; gagal fetch →
 * rail diam (tidak mengganggu konten utama). Disembunyikan di mobile
 * lewat kelas `desktop-rail` (display:none di bawah lg).
 */

const WEEKDAY_LABELS = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

function weekEmoji(state: ProgressView['week'][number]['state']): string {
  if (state === 'active') return '🔥';
  if (state === 'frozen') return '🧊';
  return '·';
}

export function DesktopRail() {
  const [summary, setSummary] = useState<SummaryView | null>(null);
  const [progress, setProgress] = useState<ProgressView | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<SummaryView>('/me/summary')
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {});
    api<ProgressView>('/progress')
      .then((p) => {
        if (!cancelled) setProgress(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="desktop-rail" aria-label="Ringkasan belajar">
      <Card eyebrow="Statistik" title="Minggu berjalan">
        {summary ? (
          <div className="rail-stats">
            <div className="rail-stat">
              <span className="rail-stat-icon rail-stat-amber">
                <Flame size={18} strokeWidth={2.25} />
              </span>
              <div>
                <div className="rail-stat-value">{summary.streak}</div>
                <div className="rail-stat-label">Hari beruntun</div>
              </div>
            </div>
            <div className="rail-stat">
              <span className="rail-stat-icon rail-stat-brand">
                <Star size={18} strokeWidth={2.25} />
              </span>
              <div>
                <div className="rail-stat-value">{summary.xpTotal.toLocaleString('id-ID')}</div>
                <div className="rail-stat-label">Total XP</div>
              </div>
            </div>
            <div className="rail-stat">
              <span className="rail-stat-icon rail-stat-sky">
                <Snowflake size={18} strokeWidth={2.25} />
              </span>
              <div>
                <div className="rail-stat-value">{summary.freezeAvailableThisWeek ? 1 : 0}</div>
                <div className="rail-stat-label">Token pembeku</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="skeleton h-[120px] rounded-[14px]" />
        )}
      </Card>

      <Card eyebrow="Minggu ini" title="Kalender streak">
        {progress ? (
          <>
            <div className="week-grid">
              {progress.week.map((day, i) => (
                <div key={day.date} className={`week-day week-day-${day.state}`}>
                  <span className="week-day-label">{WEEKDAY_LABELS[i] ?? ''}</span>
                  <span className="week-day-emoji">{weekEmoji(day.state)}</span>
                </div>
              ))}
            </div>
            <p className="week-legend">🧊 = streak diselamatkan token pembeku</p>
          </>
        ) : (
          <div className="skeleton h-[84px] rounded-[14px]" />
        )}
      </Card>

      <Card eyebrow="Ringkasan" title="Total pencapaian">
        {progress ? (
          <div className="totals-grid">
            <div className="totals-item">
              <div className="totals-value">{progress.totals.lessonsDone}</div>
              <div className="totals-label">Lesson selesai</div>
            </div>
            <div className="totals-item">
              <div className="totals-value">{progress.totals.xpTotal}</div>
              <div className="totals-label">Total XP</div>
            </div>
            <div className="totals-item">
              <div className="totals-value">{progress.totals.longestStreak}</div>
              <div className="totals-label">Streak terpanjang</div>
            </div>
          </div>
        ) : (
          <div className="skeleton h-[64px] rounded-[14px]" />
        )}
      </Card>
    </aside>
  );
}
