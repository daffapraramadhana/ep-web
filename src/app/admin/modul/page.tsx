// apps/web/src/app/admin/modul/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { ChunkyButton, StatusPill } from '@/components/ui';
import { CEFRS, LEVELS, type AdminModuleRow } from './types';

export default function AdminModulesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', level: 'MENENGAH', cefr: 'B1' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (level) qs.set('level', level);
      if (status) qs.set('status', status);
      setRows(await api<AdminModuleRow[]>(`/admin/modules${qs.toString() ? `?${qs}` : ''}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [level, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    setSaving(true);
    setError('');
    try {
      const m = await api<{ id: string }>('/admin/modules', { method: 'POST', body: JSON.stringify(form) });
      router.push(`/admin/modul/${m.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
      setSaving(false);
    }
  }

  const select = 'rounded-xl border border-line px-3 py-1.5 text-sm font-semibold text-ink focus:border-brand focus:outline-none';
  const input = 'w-full rounded-xl border-2 border-line px-3 py-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none';

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-black text-ink">Modul</h1>
          <p className="text-sm font-semibold text-muted">Materi bacaan per topik. Tiap bab bisa punya kuis dari lesson.</p>
        </div>
        <ChunkyButton className="btn-sm" onClick={() => setCreating((v) => !v)}><Plus size={16} strokeWidth={2.25} /> Modul baru</ChunkyButton>
      </div>

      {creating ? (
        <div className="admin-card mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4">
          <label className="md:col-span-2 text-xs font-black uppercase tracking-wider text-muted">Judul
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="text-xs font-black uppercase tracking-wider text-muted">Level
            <select className={input} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
          <label className="text-xs font-black uppercase tracking-wider text-muted">CEFR
            <select className={input} value={form.cefr} onChange={(e) => setForm({ ...form, cefr: e.target.value })}>{CEFRS.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="md:col-span-3 text-xs font-black uppercase tracking-wider text-muted">Ringkasan (1 kalimat)
            <input className={input} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </label>
          <div className="flex items-end"><ChunkyButton className="btn-sm w-full" disabled={saving} onClick={create}>{saving ? 'Menyimpan…' : 'Buat modul'}</ChunkyButton></div>
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-3">
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={select}>
          <option value="">Semua level</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
          <option value="">Semua status</option>
          {['DRAFT', 'LIVE', 'RETIRED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={load} disabled={loading} className="btn-outline-sm">{loading ? 'Memuat...' : 'Muat ulang'}</button>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-bad">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Modul</th><th>Level/CEFR</th><th>Bab</th><th>Status</th><th>Diubah</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center text-muted">Belum ada modul.</td></tr>
            )}
            {rows.map((m) => (
              <tr key={m.id} onClick={() => router.push(`/admin/modul/${m.id}`)} className="admin-table-row-clickable">
                <td className="text-muted">{m.order}</td>
                <td><div className="font-bold">{m.title}</div><div className="text-xs text-muted">{m.slug}</div></td>
                <td className="text-muted">{m.level} / {m.cefr}</td>
                <td>
                  <div className="font-bold">{m.chapterCount}</div>
                  <div className="text-xs text-muted">
                    {m.chapterCount === 0
                      ? 'Belum ada bab — tidak tampil walau LIVE'
                      : [
                          m.quizChapterCount ? `${m.quizChapterCount} berkuis` : '',
                          m.readingCount ? `${m.readingCount} bacaan` : '',
                          m.pendingQuizCount ? `${m.pendingQuizCount} kuis belum siap` : '',
                        ].filter(Boolean).join(' · ')}
                  </div>
                </td>
                <td><StatusPill status={m.status} /></td>
                <td className="text-muted">{new Date(m.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
