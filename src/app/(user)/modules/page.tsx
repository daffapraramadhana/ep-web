// apps/web/src/app/(user)/modules/page.tsx
'use client';

/**
 * Tab Modul (spec menu modul §7). GET /modules → kartu pendamping Mitha
 * (`LearningCompanion`, pola sama dengan Perjalanan & Kemajuan) + seksi
 * "Cocok untukmu" (level user) + "Modul lainnya". Skeleton/error meniru
 * Perjalanan.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { ModuleCard, ModulesView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { LearningCompanion, LearningPageSkeleton } from '@/components/learning-companion';
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

  const all = [...data.forYou, ...data.others];
  const empty = all.length === 0;
  const indexOf = (slug: string) => all.findIndex((m) => m.slug === slug);
  const current = data.inProgress;
  const suggested = data.forYou[0] ?? data.others[0];
  const done = current ? current.doneCount : all.reduce((n, m) => n + m.doneCount, 0);
  const total = current ? current.quizChapterCount : all.reduce((n, m) => n + m.quizChapterCount, 0);
  const chapterProgress = (
    <div className="learn-route-progress">
      <span><BookOpenText size={18} aria-hidden="true" /><b>{done}</b> dari {total} bab kuis selesai</span>
      {total > 0 && <progress value={done} max={total} aria-label={current ? `Bab selesai di ${current.title}` : 'Bab selesai di semua modul'} />}
    </div>
  );
  const levelLabel = LEVEL_LABEL[me?.level ?? ''];

  return (
    <div className="learn-page">
      <header className="learn-page-heading">
        <p className="learn-eyebrow">Belajar per topik</p>
        <h1>Modul</h1>
        <p>Baca materi singkat, lalu coba kuisnya.</p>
      </header>

      {empty ? (
        <LearningCompanion
          variant="thinking"
          title="Modul sedang disiapkan."
          description="Sementara itu, lanjutkan latihan harianmu di Beranda."
          message="Materinya sedang kusiapkan."
        >
          <Link className="learn-text-link" href="/home">Ke Beranda <ArrowRight size={17} aria-hidden="true" /></Link>
        </LearningCompanion>
      ) : current ? (
        <LearningCompanion
          variant="learning"
          title={current.title}
          description="Modul yang sedang kamu pelajari. Lanjutkan bab berikutnya selagi materinya masih segar."
          message="Ayo lanjutkan bacaanmu!"
          footer={chapterProgress}
        >
          <Link href={`/modules/${current.slug}`} className="btn">Lanjutkan <ArrowRight size={18} aria-hidden="true" /></Link>
        </LearningCompanion>
      ) : (
        <LearningCompanion
          variant="curious"
          title="Pilih topik yang ingin kamu kuasai."
          description="Setiap modul berisi bab bacaan singkat dan kuis kecil. Mulai dari yang paling dekat dengan pekerjaanmu."
          message="Mau belajar topik apa hari ini?"
          footer={chapterProgress}
        >
          {suggested ? <Link href={`/modules/${suggested.slug}`} className="btn">Mulai modul <ArrowRight size={18} aria-hidden="true" /></Link> : null}
        </LearningCompanion>
      )}

      {data.forYou.length ? (
        <section className="mod-section" aria-labelledby="mod-for-you">
          <div className="learn-section-heading">
            <div><p className="learn-eyebrow">{levelLabel ? `Level ${levelLabel}` : 'Sesuai levelmu'}</p><h2 id="mod-for-you">Cocok untukmu</h2></div>
            <span>{data.forYou.length} modul</span>
          </div>
          <div className="mod-list">{data.forYou.map((m) => <ModuleRow key={m.slug} m={m} index={indexOf(m.slug)} />)}</div>
        </section>
      ) : null}

      {data.others.length ? (
        <section className="mod-section" aria-labelledby="mod-others">
          <div className="learn-section-heading">
            <div><p className="learn-eyebrow">Jelajahi lebih jauh</p><h2 id="mod-others">Modul lainnya</h2></div>
            <span>{data.others.length} modul</span>
          </div>
          <div className="mod-list">{data.others.map((m) => <ModuleRow key={m.slug} m={m} index={indexOf(m.slug)} />)}</div>
        </section>
      ) : null}
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
