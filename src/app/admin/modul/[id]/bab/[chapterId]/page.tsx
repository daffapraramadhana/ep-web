// apps/web/src/app/admin/modul/[id]/bab/[chapterId]/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, HelpCircle, ListChecks } from 'lucide-react';
import { api } from '@/lib/api';
import type { ChapterBlock } from '@/lib/api-types';
import { ChunkyButton } from '@/components/ui';
import { ChapterBlocks } from '@/components/modules/chapter-blocks';
import type { AdminChapterDetail, PreviewResult } from '../../../types';

interface LessonOption { id: string; code: string; title: string; moduleChapter: unknown }

export default function ChapterEditorPage() {
  const { id: moduleId, chapterId } = useParams<{ id: string; chapterId: string }>();
  const router = useRouter();
  const [ch, setCh] = useState<AdminChapterDetail | null>(null);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [body, setBody] = useState('');
  const [blocks, setBlocks] = useState<ChapterBlock[]>([]);
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [cheat, setCheat] = useState(false);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [pick, setPick] = useState('');
  const gutterRef = useRef<HTMLDivElement>(null);

  const apply = (c: AdminChapterDetail) => {
    setCh(c);
    setTitle(c.title);
    setMinutes(c.estMinutes);
    setBody(c.body);
    setBlocks(c.blocks);
    setErrors([]);
    setDirty(false);
  };

  useEffect(() => {
    api<AdminChapterDetail>(`/admin/chapters/${chapterId}`).then(apply).catch((e) => setMsg(e instanceof Error ? e.message : 'Terjadi kesalahan'));
    api<LessonOption[]>('/admin/lessons').then((ls) => setLessons(ls.filter((l) => !l.moduleChapter))).catch(() => setLessons([]));
  }, [chapterId]);

  // Pratinjau: parser BE yang sama dengan simpan (debounce 500 ms).
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      api<PreviewResult>('/admin/modules/preview', { method: 'POST', body: JSON.stringify({ body }) })
        .then((r) => {
          if ('blocks' in r) {
            setBlocks(r.blocks);
            setErrors([]);
          } else setErrors(r.errors); // pratinjau tetap versi valid terakhir
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [body, dirty]);

  const save = useCallback(async () => {
    if (saving || errors.length) return;
    setSaving(true);
    setMsg('');
    try {
      apply(await api<AdminChapterDetail>(`/admin/chapters/${chapterId}`, { method: 'PATCH', body: JSON.stringify({ title, estMinutes: minutes, body }) }));
      setMsg('Tersimpan');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }, [saving, errors.length, chapterId, title, minutes, body]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  async function quizAction(fn: () => Promise<unknown>) {
    setMsg('');
    try {
      await fn();
      apply(await api<AdminChapterDetail>(`/admin/chapters/${chapterId}`));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Terjadi kesalahan');
    }
  }

  async function remove() {
    if (!confirm('Hapus bab ini? Hanya bisa selama modul DRAFT dan bab belum pernah dikerjakan.')) return;
    try {
      await api(`/admin/chapters/${chapterId}`, { method: 'DELETE' });
      router.push(`/admin/modul/${moduleId}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Terjadi kesalahan');
    }
  }

  const lineCount = useMemo(() => body.split('\n').length, [body]);
  const errLines = useMemo(() => new Set(errors.map((e) => e.line)), [errors]);

  if (!ch) return <p className="text-sm font-semibold text-muted">{msg || 'Memuat…'}</p>;

  const lesson = ch.lesson;
  const input = 'rounded-xl border-2 border-line px-3 py-2 text-sm font-bold text-ink focus:border-brand focus:outline-none';

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted">
        <Link href="/admin/modul">Modul</Link><ChevronRight size={14} />
        <Link href={`/admin/modul/${moduleId}`}>{ch.module.title}</Link><ChevronRight size={14} /> Bab {ch.order}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <input className={`${input} w-80`} value={title} aria-label="Judul bab" onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
          <label className="flex items-center gap-2 text-sm font-bold text-muted">±
            <input className={`${input} w-20`} type="number" min={1} max={60} value={minutes} aria-label="Estimasi menit" onChange={(e) => { setMinutes(Number(e.target.value)); setDirty(true); }} />
            menit
          </label>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-sm font-bold ${msg === 'Tersimpan' ? 'text-good' : 'text-bad'}`}>{msg}</span>}
          <button type="button" className="btn-outline-sm" onClick={() => setCheat((v) => !v)}><HelpCircle size={14} /> Sintaks</button>
          <button type="button" className="btn-outline-sm" onClick={remove}>Hapus bab</button>
          <ChunkyButton className="btn-sm" disabled={saving || errors.length > 0 || !dirty} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan'}</ChunkyButton>
        </div>
      </div>

      {cheat ? (
        <div className="chap-cheat mb-4 rounded-2xl border border-line bg-white p-4">
          <b>Blok khusus</b>
          <pre>{':::phrases\n- Could you help me? | Bisa bantu saya?\n- Sorry. | Maaf. | catatan opsional\n:::'}</pre>
          <pre>{':::dialog\nRina (Finance): The invoice is wrong.\nKamu (IT Support): Which invoice is it?\n:::'}</pre>
          <pre>{':::tip\n"Could you…" lebih sopan daripada "Can you…".\n:::'}</pre>
          <b>Markdown biasa</b>: <code>## Judul</code>, <code>**tebal**</code>, <code>*miring*</code>, daftar <code>- a</code> / <code>1. a</code>, tabel <code>| a | b |</code>, gambar/audio <code>![keterangan](media:nama-file.png)</code> (upload dulu di Media).
        </div>
      ) : null}

      <div className="chap-editor">
        <div className="chap-pane">
          <div className="chap-pane-title"><span>Markdown</span><span style={{ textTransform: 'none', letterSpacing: 0 }}>Ctrl/Cmd+S simpan</span></div>
          <div className="chap-code">
            <div className="chap-gutter" ref={gutterRef} aria-hidden="true">
              {Array.from({ length: lineCount }, (_, k) => (
                <div key={k} className={errLines.has(k + 1) ? 'err' : undefined}>{k + 1}</div>
              ))}
            </div>
            <textarea
              className="chap-textarea"
              value={body}
              spellCheck={false}
              aria-label="Isi bab (Markdown)"
              onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
              onChange={(e) => { setBody(e.target.value); setDirty(true); }}
            />
          </div>
          {errors.length ? (
            <ul className="chap-errors" role="alert">
              {errors.map((e, k) => <li key={k}>Baris {e.line}: {e.message}</li>)}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="chap-pane">
            <div className="chap-pane-title"><span>Pratinjau · 375px</span><span style={{ textTransform: 'none', letterSpacing: 0 }}>{errors.length ? 'versi valid terakhir' : 'parser BE'}</span></div>
            <div className="chap-preview">
              <div className="chap-preview-frame">
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--brand)' }}>Bab {ch.order}</p>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: '2px 0 8px' }}>{title}</h3>
                <ChapterBlocks blocks={blocks} />
              </div>
            </div>
          </div>

          <div className="chap-pane p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted"><ListChecks size={16} /> Kuis bab</div>
            {lesson ? (
              <>
                <div className="font-black text-ink">{lesson.code} · {lesson.title}</div>
                <div className="mb-3 text-xs font-bold text-muted">
                  {lesson.status} · {lesson.liveItemCount} soal LIVE · {lesson.draftItemCount} DRAFT
                  {!(lesson.status === 'LIVE' && lesson.liveItemCount > 0) ? ' — user melihat bab ini sebagai Bacaan' : ''}
                </div>
                <div className="flex gap-2">
                  <Link className="btn-outline-sm" href={`/admin/content/${lesson.id}`}>Kelola soal →</Link>
                  <button type="button" className="btn-outline-sm" onClick={() => quizAction(() => api(`/admin/chapters/${chapterId}/quiz`, { method: 'PATCH', body: JSON.stringify({ lessonId: null }) }))}>Lepas tautan</button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-xs font-bold text-muted">Belum ada kuis — user melihat bab ini sebagai Bacaan.</p>
                <div className="flex flex-col gap-2">
                  <ChunkyButton className="btn-sm" onClick={() => quizAction(() => api(`/admin/chapters/${chapterId}/quiz`, { method: 'POST' }))}>Buat kuis</ChunkyButton>
                  <div className="flex gap-2">
                    <select className={`${input} flex-1`} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Pilih lesson">
                      <option value="">Tautkan lesson yang ada…</option>
                      {lessons.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.title}</option>)}
                    </select>
                    <button type="button" className="btn-outline-sm" disabled={!pick} onClick={() => quizAction(() => api(`/admin/chapters/${chapterId}/quiz`, { method: 'PATCH', body: JSON.stringify({ lessonId: pick }) }))}>Tautkan</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
