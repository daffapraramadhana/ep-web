'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChunkyButton, StatusPill } from '@/components/ui';

interface LessonListItem {
  id: string;
  code: string;
  title: string;
  topic: string;
  level: string;
  cefr: string;
  skill: string;
  order: number;
  status: string;
  itemCount: number;
  liveItemCount: number;
}

const LEVELS = ['DASAR', 'MENENGAH', 'MAHIR'];
const STATUSES = ['DRAFT', 'LIVE', 'RETIRED'];

export default function ContentPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [pendingId, setPendingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (level) params.set('level', level);
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await api<LessonListItem[]>(`/admin/lessons${qs ? `?${qs}` : ''}`);
      setLessons(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [level, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTransition(lesson: LessonListItem, next: string) {
    if (next === 'RETIRED' && !confirm('Soal pensiun tidak bisa dihidupkan lagi. Lanjut?')) {
      return;
    }
    setPendingId(lesson.id);
    setError('');
    try {
      await api(`/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setPendingId('');
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-ink">Soal & Lesson</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Kelola lesson, lihat jumlah soal, dan atur status penerbitan.
      </p>

      <div className="mb-4 flex items-center gap-3">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
        >
          <option value="">Semua level</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
        >
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="button" onClick={load} disabled={loading} className="btn-outline-sm">
          {loading ? 'Memuat...' : 'Muat ulang'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-bad">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Judul</th>
              <th>Topic</th>
              <th>Level/CEFR</th>
              <th>Skill</th>
              <th>Jumlah Soal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="text-center text-muted">
                  Belum ada lesson.
                </td>
              </tr>
            )}
            {lessons.map((l) => (
              <tr
                key={l.id}
                onClick={() => router.push(`/admin/content/${l.id}`)}
                className="admin-table-row-clickable"
              >
                <td className="font-bold">{l.code}</td>
                <td>{l.title}</td>
                <td className="text-muted">{l.topic}</td>
                <td className="text-muted">
                  {l.level} / {l.cefr}
                </td>
                <td className="text-muted">{l.skill}</td>
                <td className="text-muted">
                  {l.liveItemCount}/{l.itemCount}
                </td>
                <td>
                  <StatusPill status={l.status} />
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <LessonActions
                    lesson={l}
                    pending={pendingId === l.id}
                    onTransition={handleTransition}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LessonActions({
  lesson,
  pending,
  onTransition,
}: {
  lesson: LessonListItem;
  pending: boolean;
  onTransition: (lesson: LessonListItem, next: string) => void;
}) {
  const buttons: { label: string; next: string; variant: 'good' | 'ghost' | 'danger' }[] = [];
  if (lesson.status === 'DRAFT') {
    buttons.push({ label: 'Terbitkan', next: 'LIVE', variant: 'good' });
  } else if (lesson.status === 'LIVE') {
    buttons.push({ label: 'Tarik', next: 'DRAFT', variant: 'ghost' });
    buttons.push({ label: 'Pensiunkan', next: 'RETIRED', variant: 'danger' });
  }

  if (buttons.length === 0) {
    return <span className="text-xs text-muted">-</span>;
  }

  return (
    <div className="flex gap-2">
      {buttons.map((b) => (
        <ChunkyButton
          key={b.next}
          type="button"
          variant={b.variant}
          disabled={pending}
          className="btn-sm"
          onClick={() => onTransition(lesson, b.next)}
        >
          {pending ? '...' : b.label}
        </ChunkyButton>
      ))}
    </div>
  );
}
