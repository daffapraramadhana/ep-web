'use client';

/**
 * Progress — Task 14 brief + design-system.md §2 ("Bar skill"), §5 (ikon
 * skill Lucide, strokeWidth 2.25), §7 (kontras). Consumes GET /progress
 * (ProgressView, lihat api-types.ts). Error/retry & skeleton MENIRU pola
 * Beranda (home/page.tsx) persis.
 *
 * 3 blok, atas ke bawah:
 * 1. 4 baris skill berwarna penuh (token --skill-*-deep) + ikon + ring %
 *    putih (akurasi percobaan-pertama). `accuracy === null` (belum ada
 *    attempt utk skill itu) -> baris abu netral "Belum ada data", bukan
 *    warna skill (status tidak boleh warna saja — §7).
 * 2. Kartu "Minggu Ini": 7 hari (BE mengirim Senin->Minggu terurut, lihat
 *    ProgressWeekDayView) + emoji 🔥 aktif / 🧊 diselamatkan freeze / ·
 *    kosong. Emoji dipertahankan di sini (aturan kalender streak, §5).
 * 3. Kartu ringkas total (lesson selesai · total XP · streak terpanjang).
 *
 * Kontras (§7 "Kontras teks ≥ 4.5:1" — aturan tanpa syarat, bukan cuma
 * utk amber): semua 4 baris memakai teks/ikon/Ring PUTIH di atas token
 * `--skill-*-deep` (bukan `--skill-*` biasa, yang cuma aman dipakai sbg
 * aksen di atas latar terang) — varian -700 yang tiap satunya sudah
 * diverifikasi >=4.5:1 terhadap putih (lihat fix report task-14).
 * Sebelumnya Listening (amber) memakai teks gelap sbg workaround; kini
 * tidak perlu lagi karena latarnya sendiri sudah digelapkan.
 */

import { useCallback, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { BookOpen, Pencil, Headphones, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProgressView, SkillTag } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { Ring } from '@/components/progress';
import { WeekStrip } from '@/components/week-strip';

interface SkillMeta {
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  /** Token `-deep` (bukan `--skill-*` dasar) — sudah diverifikasi >=4.5:1
   * terhadap teks putih, lihat fix report task-14. */
  color: string;
}

const SKILL_META: Record<SkillTag, SkillMeta> = {
  VOCABULARY: { label: 'Vocabulary', icon: BookOpen, color: 'var(--skill-vocabulary-deep)' },
  GRAMMAR: { label: 'Grammar', icon: Pencil, color: 'var(--skill-grammar-deep)' },
  LISTENING: { label: 'Listening', icon: Headphones, color: 'var(--skill-listening-deep)' },
  READING: { label: 'Reading', icon: FileText, color: 'var(--skill-reading-deep)' },
};

function ProgressSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <div className="skeleton h-7 w-32 rounded-full" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-[72px] rounded-[18px]" />
      ))}
      <div className="skeleton h-[150px] rounded-[22px]" />
      <div className="skeleton h-[100px] rounded-[22px]" />
    </div>
  );
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadProgress = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api<ProgressView>('/progress')
      .then((p) => {
        setProgress(p);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (!progress && loading) {
    return <ProgressSkeleton />;
  }

  if (!progress && loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Progress" title="Gagal memuat data" className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">
            Periksa koneksimu, lalu coba lagi.
          </p>
          <ChunkyButton variant="ghost" onClick={loadProgress}>
            Coba lagi
          </ChunkyButton>
        </Card>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="space-y-3.5 px-5 py-[22px]">
      <h1 className="text-[22px] font-black text-ink">Progress</h1>

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {progress.skills.map((skill) => {
          const meta = SKILL_META[skill.skill];
          const Icon = meta.icon;
          const hasData = skill.accuracy !== null;

          if (!hasData) {
            return (
              <div key={skill.skill} className="skill-row skill-row-empty">
                <span className="skill-row-icon">
                  <Icon size={22} strokeWidth={2.25} />
                </span>
                <div className="skill-row-info">
                  <div className="skill-row-title">{meta.label}</div>
                  <div className="skill-row-sub">Belum ada data</div>
                </div>
              </div>
            );
          }

          return (
            <div key={skill.skill} className="skill-row" style={{ background: meta.color }}>
              <span className="skill-row-icon">
                <Icon size={22} strokeWidth={2.25} />
              </span>
              <div className="skill-row-info">
                <div className="skill-row-title">{meta.label}</div>
                <div className="skill-row-sub">{skill.answered} soal dijawab</div>
              </div>
              <Ring
                size={52}
                stroke={6}
                pct={skill.accuracy ?? 0}
                trackClass="skill-ring-track"
                arcClass="skill-ring-arc"
              >
                <span className="skill-ring-pct">{skill.accuracy}%</span>
              </Ring>
            </div>
          );
        })}
      </div>

      <Card eyebrow="Minggu ini" title="Kalender streak" className="lg:hidden">
        <WeekStrip week={progress.week} />
        <p className="week-legend">🧊 = streak diselamatkan token pembeku</p>
      </Card>

      <Card eyebrow="Ringkasan" title="Total pencapaian" className="lg:hidden">
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
      </Card>
    </div>
  );
}
