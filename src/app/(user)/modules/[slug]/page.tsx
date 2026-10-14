// apps/web/src/app/(user)/modules/[slug]/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BookOpenText, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import type { ModuleChapterRow, ModuleDetailView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { LearningPageSkeleton } from '@/components/learning-companion';
import { ModuleCover } from '@/components/modules/module-cover';
import { LEVEL_LABEL, MODULE_NOT_FOUND } from '@/lib/modules';

export default function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [m, setM] = useState<ModuleDetailView | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api<ModuleDetailView>(`/modules/${slug}`)
      .then(setM)
      .catch((e) => setError(e instanceof Error ? e.message : 'Terjadi kesalahan'));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    const notFound = error === MODULE_NOT_FOUND;
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Modul" title={notFound ? 'Modul tidak ditemukan' : 'Gagal memuat modul'} className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">{notFound ? 'Modul ini mungkin sudah ditarik. Pilih modul lain.' : 'Periksa koneksimu, lalu coba lagi.'}</p>
          {notFound ? null : <ChunkyButton className="mb-2" onClick={load}>Coba lagi</ChunkyButton>}
          <ChunkyButton variant="ghost" onClick={() => router.push('/modules')}>Ke daftar modul</ChunkyButton>
        </Card>
      </div>
    );
  }
  if (!m) return <LearningPageSkeleton title="Modul" />;

  const allDone = m.quizChapterCount > 0 && m.doneCount === m.quizChapterCount;
  const ctaOrder = m.nextOrder ?? m.chapters[0]?.order ?? 1;
  const ctaPosition = m.chapters.find((c) => c.order === ctaOrder)?.position ?? 1;
  const ctaLabel = allDone ? 'ULANGI DARI BAB 1' : m.doneCount === 0 ? 'MULAI BAB 1' : `LANJUTKAN BAB ${ctaPosition}`;

  return (
    <div className="learn-page">
      <Link href="/modules" className="mod-back"><ChevronLeft size={18} strokeWidth={2.25} />Modul</Link>
      <ModuleCover url={m.coverUrl} index={0} size={60} />
      <header className="learn-page-heading" style={{ marginTop: 12, marginBottom: 10 }}>
        <h1>{m.title}</h1>
        <p>{m.summary}</p>
      </header>
      <div className="mod-meta">
        <span className="mod-chip">{LEVEL_LABEL[m.level]} · {m.cefr}</span>
        <span className="mod-chip"><Clock size={13} strokeWidth={2.25} aria-hidden="true" />±{m.estMinutes} mnt</span>
      </div>
      {m.quizChapterCount > 0 ? (
        <div className="mod-progress">
          <div className="mod-bar"><i style={{ width: `${(m.doneCount / m.quizChapterCount) * 100}%` }} /></div>
          <span>{m.doneCount} dari {m.quizChapterCount} bab</span>
        </div>
      ) : <div style={{ height: 14 }} />}
      <ChunkyButton onClick={() => router.push(`/modules/${m.slug}/${allDone ? m.chapters[0].order : ctaOrder}`)}>{ctaLabel}</ChunkyButton>

      <p className="mod-section-title">Daftar bab</p>
      <Card className="mod-chapters">
        {m.chapters.map((c) => (
          <ChapterRow key={c.id} c={c} next={c.order === m.nextOrder} href={`/modules/${m.slug}/${c.order}`} />
        ))}
      </Card>
    </div>
  );
}

function ChapterRow({ c, next, href }: { c: ModuleChapterRow; next: boolean; href: string }) {
  const sub = c.kind === 'reading'
    ? `Bacaan · ±${c.estMinutes} mnt`
    : c.done
      ? `Selesai · akurasi ${c.accuracy ?? 0}%`
      : `${next ? 'Berikutnya · ' : ''}±${c.estMinutes} mnt · ${c.itemCount} soal`;
  return (
    <Link href={href} className={`mod-ch${next ? ' mod-ch-next' : ''}`}>
      <span className={`mod-num${c.done ? ' mod-num-done' : next ? ' mod-num-next' : ''}`}>
        {c.done ? <Check size={17} strokeWidth={2.25} aria-label="Selesai" /> : c.kind === 'reading' ? <BookOpenText size={16} strokeWidth={2.25} aria-label="Bacaan" /> : c.position}
      </span>
      <div><b>{c.title}</b><small>{sub}</small></div>
      <ChevronRight size={18} strokeWidth={2.25} className="mod-chev" aria-hidden="true" />
    </Link>
  );
}
