// apps/web/src/app/admin/modul/[id]/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronUp, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { ChunkyButton, StatusPill } from '@/components/ui';
import { CEFRS, LEVELS, type AdminModuleDetail } from '../types';

const NEW_CHAPTER_BODY = 'Tulis pengantar bab di sini.';

export default function AdminModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [m, setM] = useState<AdminModuleDetail | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', summary: '', level: '', cefr: '', coverFile: '' });
  const [media, setMedia] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = (d: AdminModuleDetail) => {
    setM(d);
    setForm({ title: d.title, slug: d.slug, summary: d.summary, level: d.level, cefr: d.cefr, coverFile: d.coverFile ?? '' });
  };

  const load = useCallback(() => {
    api<AdminModuleDetail>(`/admin/modules/${id}`).then(apply).catch((e) => setError(e instanceof Error ? e.message : 'Terjadi kesalahan'));
    api<{ name: string }[]>('/admin/media').then((xs) => setMedia(xs.map((x) => x.name).filter((n) => /\.(png|jpe?g|webp|svg)$/i.test(n)))).catch(() => setMedia([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(fn: () => Promise<AdminModuleDetail | void>) {
    setBusy(true);
    setError('');
    try {
      const d = await fn();
      if (d) apply(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  const save = () => run(() => api<AdminModuleDetail>(`/admin/modules/${id}`, { method: 'PATCH', body: JSON.stringify({ ...form, coverFile: form.coverFile || null }) }));
  const transition = (status: string) => {
    if (status === 'RETIRED' && !confirm('Modul pensiun tidak bisa dihidupkan lagi. Lanjut?')) return;
    run(() => api<AdminModuleDetail>(`/admin/modules/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }));
  };
  const move = (chapterId: string, direction: 'up' | 'down') =>
    run(() => api<AdminModuleDetail>(`/admin/chapters/${chapterId}/move`, { method: 'POST', body: JSON.stringify({ direction }) }));
  const addChapter = () =>
    run(async () => {
      const c = await api<{ id: string }>(`/admin/modules/${id}/chapters`, { method: 'POST', body: JSON.stringify({ title: 'Bab baru', estMinutes: 5, body: NEW_CHAPTER_BODY }) });
      router.push(`/admin/modul/${id}/bab/${c.id}`);
    });

  if (!m) return <p className="text-sm font-semibold text-muted">{error || 'Memuat…'}</p>;

  const input = 'w-full rounded-xl border-2 border-line px-3 py-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none';
  const label = 'text-xs font-black uppercase tracking-wider text-muted';

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted">
        <Link href="/admin/modul">Modul</Link><ChevronRight size={14} /> {m.title}
      </div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-black text-ink">{m.title}</h1>
          <p className="text-sm font-semibold text-muted">Status <StatusPill status={m.status} /> · tampil ke semua karyawan bila LIVE dan punya ≥1 bab</p>
        </div>
        <div className="flex gap-2">
          {m.status === 'DRAFT' && <ChunkyButton variant="good" className="btn-sm" disabled={busy} onClick={() => transition('LIVE')}>Terbitkan</ChunkyButton>}
          {m.status === 'LIVE' && <ChunkyButton variant="ghost" className="btn-sm" disabled={busy} onClick={() => transition('DRAFT')}>Jadikan DRAFT</ChunkyButton>}
          {m.status === 'LIVE' && <ChunkyButton variant="danger" className="btn-sm" disabled={busy} onClick={() => transition('RETIRED')}>Pensiunkan</ChunkyButton>}
          <ChunkyButton className="btn-sm" disabled={busy} onClick={save}>Simpan</ChunkyButton>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-bad">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3">
        <label className={label}>Judul<input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className={label}>Level<select className={input} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
        <label className={label}>CEFR<select className={input} value={form.cefr} onChange={(e) => setForm({ ...form, cefr: e.target.value })}>{CEFRS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className={`${label} md:col-span-2`}>Ringkasan (1 kalimat)<input className={input} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
        <label className={label}>Slug<input className={input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
        <label className={`${label} md:col-span-3`}>Cover (dari Media)
          <select className={input} value={form.coverFile} onChange={(e) => setForm({ ...form, coverFile: e.target.value })}>
            <option value="">Tanpa cover (ikon default)</option>
            {media.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black text-ink">Bab <span className="text-muted">· {m.chapters.length}</span></h2>
        <ChunkyButton className="btn-sm" disabled={busy} onClick={addChapter}><Plus size={16} strokeWidth={2.25} /> Bab baru</ChunkyButton>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Urut</th><th>Bab</th><th>Menit</th><th>Kuis</th></tr></thead>
          <tbody>
            {m.chapters.length === 0 && <tr><td colSpan={4} className="text-center text-muted">Belum ada bab.</td></tr>}
            {m.chapters.map((c, i) => (
              <tr key={c.id} className="admin-table-row-clickable" onClick={() => router.push(`/admin/modul/${id}/bab/${c.id}`)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-0.5">
                    <button type="button" aria-label="Naikkan" className="btn-outline-sm" disabled={busy || i === 0} onClick={() => move(c.id, 'up')}><ChevronUp size={13} /></button>
                    <button type="button" aria-label="Turunkan" className="btn-outline-sm" disabled={busy || i === m.chapters.length - 1} onClick={() => move(c.id, 'down')}><ChevronDown size={13} /></button>
                  </div>
                </td>
                <td className="font-bold">{c.order} · {c.title}</td>
                <td className="text-muted">±{c.estMinutes}</td>
                <td><QuizChip lesson={c.lesson} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuizChip({ lesson }: { lesson: AdminModuleDetail['chapters'][number]['lesson'] }) {
  if (!lesson) return <span className="status-pill status-pill-draft">Bacaan saja</span>;
  const ready = lesson.status === 'LIVE' && lesson.liveItemCount > 0;
  return ready
    ? <span className="status-pill status-pill-live">{lesson.code} · {lesson.liveItemCount} soal LIVE</span>
    : <span className="status-pill status-pill-employee-butuh-perhatian">{lesson.code} · belum siap → tampil sebagai Bacaan</span>;
}
