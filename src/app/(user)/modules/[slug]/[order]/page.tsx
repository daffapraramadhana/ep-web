// apps/web/src/app/(user)/modules/[slug]/[order]/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { ChapterView, SessionView } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';
import { LearningPageSkeleton } from '@/components/learning-companion';
import { ChapterBlocks } from '@/components/modules/chapter-blocks';
import { MODULE_NOT_FOUND } from '@/lib/modules';

export default function ChapterPage() {
  const { slug, order } = useParams<{ slug: string; order: string }>();
  const router = useRouter();
  const [ch, setCh] = useState<ChapterView | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [toast, setToast] = useState('');
  const [read, setRead] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError('');
    setCh(null);
    api<ChapterView>(`/modules/${slug}/chapters/${order}`)
      .then(setCh)
      .catch((e) => setError(e instanceof Error ? e.message : 'Terjadi kesalahan'));
  }, [slug, order]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  // Garis progres baca — murni visual.
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setRead(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 100);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function startQuiz() {
    if (!ch || starting) return;
    setStarting(true);
    try {
      await api<SessionView>('/session/module', { method: 'POST', body: JSON.stringify({ chapterId: ch.id }) });
      router.push(`/session?module=${ch.id}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Terjadi kesalahan');
      setStarting(false);
    }
  }

  if (error) {
    const notFound = error === MODULE_NOT_FOUND;
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card eyebrow="Modul" title={notFound ? 'Bab tidak ditemukan' : 'Gagal memuat bab'} className="w-full max-w-sm text-center">
          <p className="mb-4 text-sm font-semibold text-muted">{notFound ? 'Urutan bab mungkin sudah berubah.' : 'Periksa koneksimu, lalu coba lagi.'}</p>
          {notFound ? null : <ChunkyButton className="mb-2" onClick={load}>Coba lagi</ChunkyButton>}
          <ChunkyButton variant="ghost" onClick={() => router.push(`/modules/${slug}`)}>Kembali ke modul</ChunkyButton>
        </Card>
      </div>
    );
  }
  if (!ch) return <LearningPageSkeleton title="Bab" />;

  return (
    <div className="learn-page" ref={topRef}>
      <div className="mod-reader-top">
        <div>
          <Link href={`/modules/${ch.moduleSlug}`} className="mod-back" style={{ margin: 0 }}><ChevronLeft size={18} strokeWidth={2.25} />Kembali</Link>
          <span>Bab {ch.position} dari {ch.chapterCount}</span>
        </div>
        <div className="mod-readbar" aria-hidden="true"><i style={{ width: `${read}%` }} /></div>
      </div>

      <p className="learn-eyebrow" style={{ marginTop: 20 }}>Bab {ch.position}</p>
      <h1 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, margin: '4px 0 10px' }}>{ch.title}</h1>
      <ChapterBlocks blocks={ch.blocks} />

      {ch.quiz ? (
        <div className="mod-quiz">
          <p className="learn-eyebrow">{ch.quiz.done ? 'Sudah selesai' : 'Coba yang barusan'}</p>
          <h4>Kuis Bab {ch.position}</h4>
          <p className="mb-3.5 text-[12.5px] font-bold text-muted">
            {ch.quiz.itemCount} soal · ±{Math.max(1, Math.ceil(ch.quiz.itemCount * 0.75))} mnt
            {ch.quiz.estXp !== null ? ` · +${ch.quiz.estXp} XP · dihitung ke target harian` : ' · ulangan, XP percobaan ulang'}
          </p>
          <ChunkyButton variant={ch.quiz.done ? 'ghost' : 'brand'} onClick={startQuiz} disabled={starting} aria-busy={starting}>
            {starting ? 'Menyiapkan…' : ch.quiz.done ? 'ULANGI KUIS' : 'MULAI KUIS'}
          </ChunkyButton>
        </div>
      ) : ch.nextOrder !== null ? (
        <div className="mod-continue">
          <ChunkyButton onClick={() => router.push(`/modules/${ch.moduleSlug}/${ch.nextOrder}`)}>BAB BERIKUTNYA</ChunkyButton>
        </div>
      ) : null}

      <nav className="mod-pager" aria-label="Navigasi bab">
        {ch.prevOrder !== null ? <Link href={`/modules/${ch.moduleSlug}/${ch.prevOrder}`}><ChevronLeft size={16} />Bab sebelumnya</Link> : <span />}
        {ch.nextOrder !== null ? <Link href={`/modules/${ch.moduleSlug}/${ch.nextOrder}`}>Bab berikutnya<ChevronRight size={16} /></Link> : <span />}
      </nav>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
