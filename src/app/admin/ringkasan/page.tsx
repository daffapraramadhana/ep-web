'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Flag, MessagesSquare } from 'lucide-react';
import { api } from '@/lib/api';
import type { OverviewView } from '@/lib/api-types';
import { Card } from '@/components/ui';
import { ActivityChart } from '@/components/admin/activity-chart';

export default function RingkasanPage() {
  const [data, setData] = useState<OverviewView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<OverviewView>('/admin/monitoring/overview');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-ink">Ringkasan</h1>
      <p className="mb-4 text-sm font-semibold text-muted">
        Pantauan aktivitas karyawan dan kesehatan konten.
      </p>

      {data && data.openReports > 0 && (
        <Link href="/admin/laporan" className="admin-report-badge">
          <Flag size={14} strokeWidth={2.25} />
          {data.openReports} laporan soal terbuka
        </Link>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm font-semibold text-bad">{error}</p>
          <button type="button" onClick={load} className="btn-outline-sm">
            Coba lagi
          </button>
        </div>
      )}

      {loading && !data && <OverviewSkeleton />}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Karyawan" value={data.totals.employees} />
            <StatCard
              label="Aktif"
              value={data.totals.active}
              caption="≥1 sesi dalam 7 hari — bisa tumpang tindih status lain"
            />
            <StatCard label="On-track" value={data.totals.onTrack} />
            <StatCard
              label="Butuh Perhatian"
              value={data.totals.needsAttention}
              amber
              href="/admin/karyawan?status=butuh_perhatian"
            />
            <StatCard label="Belum Mulai" value={data.totals.notStarted} />
          </div>

          <div className="mb-1 flex items-center gap-2 text-sm font-black text-ink">
            <MessagesSquare size={15} strokeWidth={2.5} className="text-brand" />
            Ngobrol dengan AI
          </div>
          <p className="mb-3 text-xs font-semibold text-muted">
            Percakapan talking agent, 7 hari terakhir.
          </p>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Percakapan" value={data.voice.conversations7d} />
            <StatCard label="Pengguna unik" value={data.voice.uniqueUsers7d} />
            <StatCard label="Total menit" value={data.voice.minutes7d} />
            <StatCard
              label="Tingkat lulus"
              value={data.voice.passRate7d === null ? '—' : `${data.voice.passRate7d}%`}
            />
            <StatCard label="Kredit terpakai" value={data.voice.costCredits7d} />
          </div>

          <Card title="Sesi selesai per hari (28 hari)" className="mb-6">
            <ActivityChart series={data.activitySeries} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Soal paling sering salah">
              {data.contentHealth.hardestItems.length === 0 ? (
                <p className="text-sm font-semibold text-muted">
                  Belum ada data yang cukup.
                </p>
              ) : (
                <div>
                  {data.contentHealth.hardestItems.map((h) => (
                    <div
                      key={h.itemId}
                      className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{h.prompt}</p>
                        <p className="truncate text-xs font-semibold text-muted">
                          {h.lessonTitle}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-black text-bad">{h.wrongRate}%</span>
                        <span className="hidden text-xs font-semibold text-muted sm:inline">
                          {h.answers} jawaban
                        </span>
                        <Link href={`/admin/content/${h.lessonId}`} className="btn-outline-sm">
                          Lihat
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Kehabisan konten">
              {data.contentHealth.exhaustedByLevel.every((e) => e.exhaustedPct === 0) ? (
                <p className="text-sm font-semibold text-muted">
                  Semua level masih punya konten ✅
                </p>
              ) : (
                <div className="space-y-3">
                  {data.contentHealth.exhaustedByLevel.map((e) => (
                    <div key={e.level}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-ink">
                        <span>{e.level}</span>
                        <span className="text-muted">
                          {e.exhaustedPct}% &middot; {e.users} user
                        </span>
                      </div>
                      <div className="exhausted-bar-track">
                        <div
                          className="exhausted-bar-fill"
                          style={{ width: `${e.exhaustedPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  amber,
  href,
  caption,
}: {
  label: string;
  value: ReactNode;
  amber?: boolean;
  href?: string;
  caption?: string;
}) {
  const card = (
    <Card eyebrow={label} className={amber ? 'admin-stat-card-amber' : undefined}>
      <div className="admin-stat-value">{value}</div>
      {caption && <p className="mt-1 text-[11px] text-muted">{caption}</p>}
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="admin-stat-card-link">
        {card}
      </Link>
    );
  }
  return card;
}

function OverviewSkeleton() {
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton mb-2 h-[11px] w-2/3 rounded-md" />
            <div className="skeleton h-[30px] w-1/2 rounded-md" />
          </div>
        ))}
      </div>
      <div className="card mb-6">
        <div className="skeleton h-[160px] w-full rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="skeleton h-[200px] w-full rounded-xl" />
        </div>
        <div className="card">
          <div className="skeleton h-[200px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
