'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  LIVE: 'bg-green-100 text-green-700',
  RETIRED: 'bg-red-100 text-red-700',
};

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
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Soal & Lesson</h1>
      <p className="mb-6 text-sm text-gray-500">
        Kelola lesson, lihat jumlah soal, dan atur status penerbitan.
      </p>

      <div className="mb-4 flex items-center gap-3">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
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
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? 'Memuat...' : 'Muat ulang'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Kode</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Judul</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Topic</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Level/CEFR</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Skill</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Jumlah Soal</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lessons.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-400">
                  Belum ada lesson.
                </td>
              </tr>
            )}
            {lessons.map((l) => (
              <tr
                key={l.id}
                onClick={() => router.push(`/admin/content/${l.id}`)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-3 py-2 font-medium text-gray-900">{l.code}</td>
                <td className="px-3 py-2 text-gray-900">{l.title}</td>
                <td className="px-3 py-2 text-gray-700">{l.topic}</td>
                <td className="px-3 py-2 text-gray-700">
                  {l.level} / {l.cefr}
                </td>
                <td className="px-3 py-2 text-gray-700">{l.skill}</td>
                <td className="px-3 py-2 text-gray-700">
                  {l.liveItemCount}/{l.itemCount}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
  const buttons: { label: string; next: string; className: string }[] = [];
  if (lesson.status === 'DRAFT') {
    buttons.push({
      label: 'Terbitkan',
      next: 'LIVE',
      className: 'border-green-300 text-green-700 hover:bg-green-50',
    });
  } else if (lesson.status === 'LIVE') {
    buttons.push({
      label: 'Tarik',
      next: 'DRAFT',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50',
    });
    buttons.push({
      label: 'Pensiunkan',
      next: 'RETIRED',
      className: 'border-red-300 text-red-700 hover:bg-red-50',
    });
  }

  if (buttons.length === 0) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  return (
    <div className="flex gap-2">
      {buttons.map((b) => (
        <button
          key={b.next}
          disabled={pending}
          onClick={() => onTransition(lesson, b.next)}
          className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60 ${b.className}`}
        >
          {pending ? '...' : b.label}
        </button>
      ))}
    </div>
  );
}
