'use client';

/**
 * /admin/laporan — antrean laporan soal (Task 6, spec §5). Consumes
 * GET /admin/reports?status=OPEN|RESOLVED dan PATCH /admin/reports/:id
 * (lihat api-types.ts: ItemReportView). Pola loading/error meniru
 * admin/ringkasan (Task 4); pola tab pill meniru filter status
 * admin/karyawan (Task 5, aria-pressed).
 *
 * "Tandai selesai" bersifat optimistic: baris dihapus dari daftar dulu,
 * baru PATCH dikirim. Kalau gagal, baris dikembalikan + pesan error inline
 * ditampilkan di baris tsb (bukan toast global, supaya jelas laporan MANA
 * yang gagal saat ada beberapa aksi cepat berurutan).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ItemReportView, ItemType, ReportStatus } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';

const TABS: { value: ReportStatus; label: string }[] = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'RESOLVED', label: 'Selesai' },
];

function typeLabel(type: ItemType): string {
  if (type === 'PILIHAN_GANDA') return 'Pilihan ganda';
  if (type === 'ISIAN') return 'Isian';
  return 'Susun kalimat';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LaporanPage() {
  const [tab, setTab] = useState<ReportStatus>('OPEN');
  const [reports, setReports] = useState<ItemReportView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const load = useCallback(async (status: ReportStatus) => {
    setLoading(true);
    setError('');
    try {
      const res = await api<ItemReportView[]>(`/admin/reports?status=${status}`);
      setReports(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRowErrors({});
    load(tab);
  }, [tab, load]);

  async function handleResolve(report: ItemReportView) {
    // Optimistic: hapus dari daftar dulu.
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[report.id];
      return next;
    });
    setResolving((prev) => ({ ...prev, [report.id]: true }));
    try {
      await api(`/admin/reports/${report.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
    } catch (err) {
      // Gagal: kembalikan baris + tampilkan error inline di baris tsb.
      setReports((prev) => {
        if (prev.some((r) => r.id === report.id)) return prev;
        return [...prev, report].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setRowErrors((prev) => ({
        ...prev,
        [report.id]: err instanceof Error ? err.message : 'Gagal menandai selesai',
      }));
    } finally {
      setResolving((prev) => {
        const next = { ...prev };
        delete next[report.id];
        return next;
      });
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-ink">Laporan Soal</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Tinjau laporan soal bermasalah dari karyawan.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`filter-pill${tab === t.value ? ' filter-pill-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm font-semibold text-bad">{error}</p>
          <button type="button" onClick={() => load(tab)} className="btn-outline-sm">
            Coba lagi
          </button>
        </div>
      )}

      {loading && !error && reports.length === 0 && <TableSkeleton />}

      {!loading && !error && reports.length === 0 && (
        <Card>
          <p className="text-sm font-semibold text-muted">
            {tab === 'OPEN'
              ? 'Tidak ada laporan terbuka \u{1F389}'
              : 'Belum ada laporan yang selesai.'}
          </p>
        </Card>
      )}

      {reports.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Soal</th>
                <th>Tipe</th>
                <th>Catatan</th>
                <th>Pelapor</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-xs font-bold text-ink">
                    <span className="line-clamp-2">{r.item.prompt}</span>
                  </td>
                  <td className="text-muted">{typeLabel(r.item.type)}</td>
                  <td className="max-w-xs text-muted">
                    <span className="line-clamp-2">{r.note}</span>
                  </td>
                  <td className="text-muted">{r.reporter.name}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(r.createdAt)}</td>
                  <td>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/content/${r.item.lessonId}`} className="btn-outline-sm">
                          Lihat soal
                        </Link>
                        {tab === 'OPEN' && (
                          <ChunkyButton
                            type="button"
                            variant="ghost"
                            className="btn-sm"
                            onClick={() => handleResolve(r)}
                            disabled={!!resolving[r.id]}
                          >
                            Tandai selesai
                          </ChunkyButton>
                        )}
                      </div>
                      {rowErrors[r.id] && (
                        <p className="text-xs font-semibold text-bad">{rowErrors[r.id]}</p>
                      )}
                    </div>
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
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton mb-2 h-9 w-full rounded-lg last:mb-0" />
        ))}
      </div>
    </div>
  );
}
