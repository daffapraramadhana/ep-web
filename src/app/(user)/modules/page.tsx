// apps/web/src/app/(user)/modules/page.tsx
'use client';

/**
 * Tab Modul (spec menu modul §7). GET /modules → kartu "Sedang kamu
 * pelajari" + seksi "Cocok untukmu" (level user) + "Modul lainnya".
 * Skeleton/error meniru Perjalanan.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { ModuleCard, ModulesView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { LearningPageSkeleton } from '@/components/learning-companion';
import { ModuleCover } from '@/components/modules/module-cover';
import { LEVEL_LABEL } from '@/lib/modules';
import { useMe } from '@/lib/use-me';

export default function ModulesPage() {
  const { me } = useMe();
  const [data, setData] = useState<ModulesView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api<ModulesView>('/modules')
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Terjadi kesalahan'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data && loading) return <LearningPageSkeleton title="Modul" />;

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Modul" title="Gagal memuat data" className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">{error || 'Periksa koneksimu, lalu coba lagi.'}</p>
          <ChunkyButton variant="ghost" onClick={load}>Coba lagi</ChunkyButton>
        </Card>
      </div>
    );
  }

  const empty = data.forYou.length + data.others.length === 0;
  const all = [...data.forYou, ...data.others];
  const indexOf = (slug: string) => all.findIndex((m) => m.slug === slug);

  return (
    <div className="learn-page">
      <header className="learn-page-heading">
        <p className="learn-eyebrow">Belajar per topik</p>
        <h1>Modul</h1>
        <p>Baca materi singkat, lalu coba kuisnya.</p>
      </header>

      {empty ? (
        <Card title="Modul sedang disiapkan">
          <p className="mb-4 text-sm font-semibold text-muted">Sementara itu, lanjutkan latihan harianmu.</p>
          <Link className="learn-text-link" href="/home">Ke Beranda <ArrowRight size={17} aria-hidden="true" /></Link>
        </Card>
      ) : null}

      {data.inProgress ? (
        <Card eyebrow="Sedang kamu pelajari" title={data.inProgress.title}>
          <ProgressLine m={data.inProgress} />
          <Link href={`/modules/${data.inProgress.slug}`} className="btn" style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            LANJUTKAN <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Card>
      ) : null}

      {data.forYou.length ? (
        <>
          <p className="mod-section-title">Cocok untukmu · {LEVEL_LABEL[me?.level ?? ''] ?? ''}</p>
          <div className="mod-list">{data.forYou.map((m) => <ModuleRow key={m.slug} m={m} index={indexOf(m.slug)} />)}</div>
        </>
      ) : null}

      {data.others.length ? (
        <>
          <p className="mod-section-title">Modul lainnya</p>
          <div className="mod-list">{data.others.map((m) => <ModuleRow key={m.slug} m={m} index={indexOf(m.slug)} />)}</div>
        </>
      ) : null}
    </div>
  );
}

function ProgressLine({ m }: { m: ModuleCard }) {
  return (
    <div className="mod-progress">
      <div className="mod-bar"><i style={{ width: `${m.quizChapterCount ? (m.doneCount / m.quizChapterCount) * 100 : 0}%` }} /></div>
      <span>{m.doneCount}/{m.quizChapterCount}</span>
    </div>
  );
}

function ModuleRow({ m, index }: { m: ModuleCard; index: number }) {
  const finished = m.quizChapterCount > 0 && m.doneCount === m.quizChapterCount;
  return (
    <Link href={`/modules/${m.slug}`} className="mod-card">
      <ModuleCover url={m.coverUrl} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3>{m.title}</h3>
        <p>{m.summary}</p>
        <div className="mod-meta">
          <span className="mod-chip">{LEVEL_LABEL[m.level]} · {m.cefr}</span>
          {finished ? (
            <span className="mod-chip mod-chip-good"><Check size={13} strokeWidth={2.25} aria-hidden="true" />Selesai</span>
          ) : (
            <span>{m.chapterCount} bab · ±{m.estMinutes} mnt{m.doneCount ? ` · ${m.doneCount}/${m.quizChapterCount} ✓` : ''}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
