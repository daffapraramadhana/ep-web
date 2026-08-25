'use client';

/**
 * /admin/karyawan/[id] — detail karyawan (Task 5, spec §5). Consumes GET
 * /admin/monitoring/employees/:id (EmployeeDetailView, api-types.ts).
 *
 * 4 blok, atas ke bawah:
 * 1. Header identitas (nama · email · level · bergabung) + 3 stat mini-card
 *    (streak · streak terpanjang · total XP), pola `.admin-stat-value`
 *    (Card eyebrow) yang sama dgn Ringkasan (Task 4).
 * 2. Kalender aktivitas 56 hari, grid 8x7 (§5: met=brand, partial=brand-soft,
 *    frozen=sky, empty=abu; tooltip tanggal per sel via `title`; legend).
 * 3. 4 bar skill — markup PERSIS meniru (user)/progress/page.tsx
 *    (`.skill-row`, token `--skill-*-deep`, Ring akurasi putih); baris tanpa
 *    data (`accuracy === null`) pakai varian `.skill-row-empty` "Belum ada
 *    data" (sudah begitu di progress.tsx, bukan style baru).
 * 4. Riwayat lesson (judul · topic · tanggal · akurasi%); array kosong ->
 *    teks "Belum ada data".
 */

import { useCallback, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Pencil, Headphones, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import type { EmployeeDetailView, EmployeeSkillView, SkillTag } from '@/lib/api-types';
import { Card } from '@/components/ui';
import { Ring } from '@/components/progress';

interface SkillMeta {
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
}

const SKILL_META: Record<SkillTag, SkillMeta> = {
  VOCABULARY: { label: 'Vocabulary', icon: BookOpen, color: 'var(--skill-vocabulary-deep)' },
  GRAMMAR: { label: 'Grammar', icon: Pencil, color: 'var(--skill-grammar-deep)' },
  LISTENING: { label: 'Listening', icon: Headphones, color: 'var(--skill-listening-deep)' },
  READING: { label: 'Reading', icon: FileText, color: 'var(--skill-reading-deep)' },
};

const CALENDAR_STATE_LABEL: Record<string, string> = {
  met: 'Target tercapai',
  partial: 'Sebagian sesi',
  frozen: 'Streak diselamatkan',
  empty: 'Tidak ada aktivitas',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl">
      <div className="skeleton mb-4 h-5 w-40 rounded-md" />
      <div className="skeleton mb-6 h-20 w-full rounded-2xl" />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card">
            <div className="skeleton h-[60px] w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="skeleton mb-6 h-[220px] w-full rounded-2xl" />
      <div className="skeleton h-[300px] w-full rounded-2xl" />
    </div>
  );
}

export default function KaryawanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<EmployeeDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<EmployeeDetailView>(`/admin/monitoring/employees/${id}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/karyawan" className="mb-3 inline-block text-sm font-bold text-brand hover:underline">
        ← Kembali ke daftar karyawan
      </Link>

      {loading && !data && <DetailSkeleton />}

      {error && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm font-semibold text-bad">{error}</p>
          <button type="button" onClick={load} className="btn-outline-sm">
            Coba lagi
          </button>
        </div>
      )}

      {data && (
        <>
          <h1 className="mb-1 text-xl font-black text-ink">{data.name}</h1>
          <p className="mb-6 text-sm font-semibold text-muted">
            {data.email} &middot; {data.level ?? 'Level belum dipilih'} &middot; Bergabung{' '}
            {formatDate(data.joinedAt)}
          </p>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <Card eyebrow="Streak">
              <div className="admin-stat-value">{data.streak}</div>
            </Card>
            <Card eyebrow="Streak terpanjang">
              <div className="admin-stat-value">{data.longestStreak}</div>
            </Card>
            <Card eyebrow="Total XP">
              <div className="admin-stat-value">{data.xpTotal}</div>
            </Card>
          </div>

          <Card title="Kalender aktivitas (56 hari)" className="mb-6">
            <div className="cal-grid">
              {data.calendar.map((day) => (
                <div
                  key={day.date}
                  className={`cal-cell cal-cell-${day.state}`}
                  title={`${day.date} — ${CALENDAR_STATE_LABEL[day.state] ?? day.state}`}
                >
                  <span className="sr-only">
                    {day.date}: {CALENDAR_STATE_LABEL[day.state] ?? day.state}
                  </span>
                </div>
              ))}
            </div>
            <div className="cal-legend">
              <span className="cal-legend-item">
                <span className="cal-legend-swatch cal-cell-met" /> Target tercapai
              </span>
              <span className="cal-legend-item">
                <span className="cal-legend-swatch cal-cell-partial" /> Sebagian sesi
              </span>
              <span className="cal-legend-item">
                <span className="cal-legend-swatch cal-cell-frozen" /> Streak diselamatkan
              </span>
              <span className="cal-legend-item">
                <span className="cal-legend-swatch cal-cell-empty" /> Tidak ada aktivitas
              </span>
            </div>
          </Card>

          <Card title="Kemampuan per skill" className="mb-6">
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {data.skills.map((skill) => (
                <SkillRow key={skill.skill} skill={skill} />
              ))}
            </div>
          </Card>

          <Card title="Riwayat lesson">
            {data.lessonHistory.length === 0 ? (
              <p className="text-sm font-semibold text-muted">Belum ada data.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Topic</th>
                      <th>Tanggal</th>
                      <th>Akurasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lessonHistory.map((l) => (
                      <tr key={l.lessonId}>
                        <td className="font-bold">{l.title}</td>
                        <td className="text-muted">{l.topic}</td>
                        <td className="text-muted">{formatDate(l.completedAt)}</td>
                        <td className="text-muted">{l.accuracy !== null ? `${l.accuracy}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function SkillRow({ skill }: { skill: EmployeeSkillView }) {
  const meta = SKILL_META[skill.skill];
  const Icon = meta.icon;
  const hasData = skill.accuracy !== null;

  if (!hasData) {
    return (
      <div className="skill-row skill-row-empty">
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
    <div className="skill-row" style={{ background: meta.color }}>
      <span className="skill-row-icon">
        <Icon size={22} strokeWidth={2.25} />
      </span>
      <div className="skill-row-info">
        <div className="skill-row-title">{meta.label}</div>
        <div className="skill-row-sub">{skill.answered} soal dijawab</div>
      </div>
      <Ring size={52} stroke={6} pct={skill.accuracy ?? 0} trackClass="skill-ring-track" arcClass="skill-ring-arc">
        <span className="skill-ring-pct">{skill.accuracy}%</span>
      </Ring>
    </div>
  );
}
