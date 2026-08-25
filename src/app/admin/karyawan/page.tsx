'use client';

/**
 * /admin/karyawan — tabel monitoring karyawan (Task 5, spec §5). Consumes
 * GET /admin/monitoring/employees (EmployeeListItemView[], lihat
 * api-types.ts). Pola loading/error meniru admin/ringkasan/page.tsx (Task 4);
 * pola tabel + row-click meniru admin/content/page.tsx.
 *
 * `useSearchParams()` dipakai utk init filter status dari `?status=` (link
 * dari kartu "Butuh Perhatian" di Ringkasan) — Next.js mewajibkan boundary
 * Suspense di sekitar client component yang memakainya (pola sama dengan
 * (user)/session/page.tsx), jadi komponen utama dipecah jadi
 * `KaryawanPage` (default export, bungkus Suspense) + `KaryawanBody`.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import type { EmployeeListItemView, EmployeeStatus } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';

const STATUS_FILTERS: { value: EmployeeStatus | ''; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'butuh_perhatian', label: 'Butuh Perhatian' },
  { value: 'on_track', label: 'On-track' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'belum_mulai', label: 'Belum Mulai' },
];

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  aktif: 'Aktif',
  on_track: 'On-track',
  butuh_perhatian: 'Butuh Perhatian',
  belum_mulai: 'Belum Mulai',
};

const STATUS_PILL_CLASS: Record<EmployeeStatus, string> = {
  aktif: 'status-pill-employee-aktif',
  on_track: 'status-pill-employee-on-track',
  butuh_perhatian: 'status-pill-employee-butuh-perhatian',
  belum_mulai: 'status-pill-employee-belum-mulai',
};

// Sort default (spec §5, literal): "butuh_perhatian dulu, lalu nama" — HANYA
// dua tingkat (butuh_perhatian sbg satu grup di atas, sisanya dicampur murni
// oleh nama asc). BUKAN 4 grup per status — status lain (aktif/on_track/
// belum_mulai) tidak disebutkan urutannya di spec, jadi tidak dibucket lagi
// supaya tidak menambah aturan yang tidak diminta.
function isNeedsAttention(status: EmployeeStatus): 0 | 1 {
  return status === 'butuh_perhatian' ? 0 : 1;
}

function TrendIcon({ trend }: { trend: EmployeeListItemView['trend'] }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center text-good">
        <TrendingUp size={18} strokeWidth={2.25} />
        <span className="sr-only">Tren naik</span>
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center text-bad">
        <TrendingDown size={18} strokeWidth={2.25} />
        <span className="sr-only">Tren turun</span>
      </span>
    );
  }
  if (trend === 'flat') {
    return (
      <span className="inline-flex items-center text-muted">
        <Minus size={18} strokeWidth={2.25} />
        <span className="sr-only">Tren stabil</span>
      </span>
    );
  }
  return <span className="text-muted">—</span>;
}

function KaryawanBody() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [employees, setEmployees] = useState<EmployeeListItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<EmployeeStatus | ''>('');
  const [search, setSearch] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Init filter dari ?status= sekali di awal (link kartu ringkasan Task 4).
  useEffect(() => {
    const fromQuery = searchParams.get('status');
    if (fromQuery === 'aktif' || fromQuery === 'on_track' || fromQuery === 'butuh_perhatian' || fromQuery === 'belum_mulai') {
      setStatus(fromQuery);
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<EmployeeListItemView[]>('/admin/monitoring/employees');
      setEmployees(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleStatusChange(next: EmployeeStatus | '') {
    setStatus(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('status', next);
    else params.delete('status');
    const qs = params.toString();
    router.replace(`/admin/karyawan${qs ? `?${qs}` : ''}`);
  }

  const filtered = useMemo(() => {
    let rows = employees;
    if (status) rows = rows.filter((e) => e.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((e) => e.name.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const diff = isNeedsAttention(a.status) - isNeedsAttention(b.status);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [employees, status, search]);

  function handleDownloadCsv() {
    downloadCsv(
      'karyawan-monitoring.csv',
      filtered.map((e) => ({
        nama: e.name,
        email: e.email,
        status: STATUS_LABEL[e.status],
        hariAktif7: `${e.activeDays7}/7`,
        sesiMingguIni: e.sessionsThisWeek,
        streak: e.streak,
        lessonSelesai: e.lessonsDone,
        tren: e.trend ?? '',
        terakhirAktif: e.lastActiveAt ?? '',
      }))
    );
  }

  if (!initialized) return null;

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-ink">Karyawan</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Pantau aktivitas dan status setiap karyawan.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'semua'}
              type="button"
              onClick={() => handleStatusChange(f.value)}
              className={`filter-pill${status === f.value ? ' filter-pill-active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama..."
            className="w-44 rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
          />
          <ChunkyButton
            type="button"
            variant="ghost"
            className="btn-sm"
            onClick={handleDownloadCsv}
            disabled={filtered.length === 0}
          >
            Unduh CSV
          </ChunkyButton>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm font-semibold text-bad">{error}</p>
          <button type="button" onClick={load} className="btn-outline-sm">
            Coba lagi
          </button>
        </div>
      )}

      {loading && !error && employees.length === 0 && <TableSkeleton />}

      {!loading && employees.length === 0 && !error && (
        <Card>
          <p className="text-sm font-semibold text-muted">
            Belum ada karyawan.{' '}
            <a href="/admin/users" className="font-bold text-brand hover:underline">
              Undang karyawan
            </a>{' '}
            untuk mulai memantau aktivitas.
          </p>
        </Card>
      )}

      {employees.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Hari aktif</th>
                <th>Sesi minggu ini</th>
                <th>Streak</th>
                <th>Lesson selesai</th>
                <th>Tren</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    Tidak ada karyawan yang cocok.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => router.push(`/admin/karyawan/${e.id}`)}
                  className="admin-table-row-clickable"
                >
                  <td className="font-bold">{e.name}</td>
                  <td className="text-muted">{e.activeDays7}/7</td>
                  <td className="text-muted">{e.sessionsThisWeek}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 font-bold text-ink">
                      <Flame size={16} strokeWidth={2.25} className="text-warn" />
                      {e.streak}
                    </span>
                  </td>
                  <td className="text-muted">{e.lessonsDone}</td>
                  <td>
                    <TrendIcon trend={e.trend} />
                  </td>
                  <td>
                    <span className={`status-pill ${STATUS_PILL_CLASS[e.status]}`}>
                      {STATUS_LABEL[e.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="admin-table-wrap">
      <div className="p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton mb-2 h-9 w-full rounded-lg last:mb-0" />
        ))}
      </div>
    </div>
  );
}

export default function KaryawanPage() {
  return (
    <Suspense fallback={null}>
      <KaryawanBody />
    </Suspense>
  );
}
