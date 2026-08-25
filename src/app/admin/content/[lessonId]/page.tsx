'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

type ItemType = 'PILIHAN_GANDA' | 'ISIAN' | 'SUSUN_KALIMAT';
type ItemStatus = 'DRAFT' | 'LIVE' | 'RETIRED';

interface ItemRow {
  id: string;
  type: ItemType;
  prompt: string;
  options: string[] | null;
  answerKey: string;
  acceptedAnswers: string[];
  explanation: string;
  mediaFile: string | null;
  passage: string | null;
  order: number;
  status: ItemStatus;
}

interface LessonListItem {
  id: string;
  code: string;
  title: string;
  topic: string;
  level: string;
  cefr: string;
  skill: string;
  order: number;
  status: string;
  itemCount: number;
  liveItemCount: number;
}

interface FormState {
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answerKey: string;
  acceptedAnswers: string;
  explanation: string;
  mediaFile: string;
  passage: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  LIVE: 'bg-green-100 text-green-700',
  RETIRED: 'bg-red-100 text-red-700',
};

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function toFormState(item: ItemRow): FormState {
  const options = item.options ?? ['', '', '', ''];
  return {
    prompt: item.prompt,
    optionA: options[0] ?? '',
    optionB: options[1] ?? '',
    optionC: options[2] ?? '',
    optionD: options[3] ?? '',
    answerKey: item.answerKey,
    acceptedAnswers: item.acceptedAnswers.join(';'),
    explanation: item.explanation,
    mediaFile: item.mediaFile ?? '',
    passage: item.passage ?? '',
  };
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function buildPatch(item: ItemRow, form: FormState, baseline: FormState) {
  const patch: Record<string, unknown> = {};

  if (form.prompt !== baseline.prompt) patch.prompt = form.prompt;

  if (item.type === 'PILIHAN_GANDA') {
    const options = [form.optionA, form.optionB, form.optionC, form.optionD];
    const baselineOptions = [
      baseline.optionA,
      baseline.optionB,
      baseline.optionC,
      baseline.optionD,
    ];
    if (!arraysEqual(options, baselineOptions)) patch.options = options;
    if (form.answerKey !== baseline.answerKey) patch.answerKey = form.answerKey;
  } else if (item.type === 'ISIAN') {
    if (form.answerKey !== baseline.answerKey) patch.answerKey = form.answerKey;
    const accepted = form.acceptedAnswers
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    const baselineAccepted = baseline.acceptedAnswers
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!arraysEqual(accepted, baselineAccepted)) patch.acceptedAnswers = accepted;
  } else if (item.type === 'SUSUN_KALIMAT') {
    if (form.answerKey !== baseline.answerKey) patch.answerKey = form.answerKey;
  }

  if (form.explanation !== baseline.explanation) patch.explanation = form.explanation;

  if (form.mediaFile !== baseline.mediaFile) {
    patch.mediaFile = form.mediaFile.trim() === '' ? null : form.mediaFile.trim();
  }

  if (form.passage !== baseline.passage) {
    patch.passage = form.passage.trim() === '' ? null : form.passage.trim();
  }

  return patch;
}

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<LessonListItem | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [baseline, setBaseline] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsRes, lessonsRes] = await Promise.all([
        api<ItemRow[]>(`/admin/lessons/${lessonId}/items`),
        api<LessonListItem[]>('/admin/lessons'),
      ]);
      setItems(itemsRes);
      setLesson(lessonsRes.find((l) => l.id === lessonId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  function handleSelect(item: ItemRow) {
    const initial = toFormState(item);
    setSelectedId(item.id);
    setForm(initial);
    setBaseline(initial);
    setSaveError('');
    setSaveSuccess(false);
  }

  async function handleSave() {
    if (!selectedItem || !form || !baseline) return;
    const patch = buildPatch(selectedItem, form, baseline);
    if (Object.keys(patch).length === 0) {
      setSaveError('Tidak ada perubahan untuk disimpan.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await api(`/admin/items/${selectedItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setSaveSuccess(true);
      setBaseline(form);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  async function handleItemTransition(item: ItemRow, next: string) {
    if (next === 'RETIRED' && !confirm('Soal pensiun tidak bisa dihidupkan lagi. Lanjut?')) {
      return;
    }
    setPendingStatusId(item.id);
    setError('');
    try {
      await api(`/admin/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setPendingStatusId('');
    }
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/content" className="mb-3 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar lesson
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">
        {lesson ? `${lesson.code} — ${lesson.title}` : 'Detail Lesson'}
      </h1>
      {lesson && (
        <p className="mb-6 text-sm text-gray-500">
          {lesson.topic} · {lesson.level}/{lesson.cefr} · {lesson.skill}
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Urutan</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Prompt</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Tipe</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                  Belum ada soal.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedId === item.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-3 py-2 text-gray-700">{item.order}</td>
                <td className="px-3 py-2 text-gray-900">{truncate(item.prompt, 80)}</td>
                <td className="px-3 py-2 text-gray-700">{item.type}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <ItemActions
                    item={item}
                    pending={pendingStatusId === item.id}
                    onTransition={handleItemTransition}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && form && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Edit Soal — urutan {selectedItem.order} ({selectedItem.type})
          </h2>

          <div className="space-y-4">
            <Field label="Prompt">
              <textarea
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>

            {selectedItem.type === 'PILIHAN_GANDA' && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Opsi & Kunci Jawaban</p>
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const key = (`option${letter}` as 'optionA' | 'optionB' | 'optionC' | 'optionD');
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="answerKey"
                        checked={form.answerKey === letter}
                        onChange={() => setForm({ ...form, answerKey: letter })}
                      />
                      <span className="w-5 text-sm font-medium text-gray-700">{letter}</span>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {selectedItem.type === 'ISIAN' && (
              <>
                <Field label="Jawaban (answer)">
                  <input
                    type="text"
                    value={form.answerKey}
                    onChange={(e) => setForm({ ...form, answerKey: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Jawaban lain yang diterima (pisahkan dengan ;)">
                  <textarea
                    value={form.acceptedAnswers}
                    onChange={(e) => setForm({ ...form, acceptedAnswers: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </Field>
              </>
            )}

            {selectedItem.type === 'SUSUN_KALIMAT' && (
              <Field label="Kalimat Jawaban">
                <input
                  type="text"
                  value={form.answerKey}
                  onChange={(e) => setForm({ ...form, answerKey: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
            )}

            <Field label="Penjelasan (explanation)">
              <textarea
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Berkas Media (media_file)">
              <input
                type="text"
                value={form.mediaFile}
                onChange={(e) => setForm({ ...form, mediaFile: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Passage">
              <textarea
                value={form.passage}
                onChange={(e) => setForm({ ...form, passage: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}
          {saveSuccess && !saveError && (
            <p className="mt-4 text-sm text-green-600">Tersimpan.</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={() => setSelectedId('')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function ItemActions({
  item,
  pending,
  onTransition,
}: {
  item: ItemRow;
  pending: boolean;
  onTransition: (item: ItemRow, next: string) => void;
}) {
  const buttons: { label: string; next: string; className: string }[] = [];
  if (item.status === 'DRAFT') {
    buttons.push({
      label: 'Terbitkan',
      next: 'LIVE',
      className: 'border-green-300 text-green-700 hover:bg-green-50',
    });
  } else if (item.status === 'LIVE') {
    buttons.push({
      label: 'Tarik',
      next: 'DRAFT',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50',
    });
    buttons.push({
      label: 'Pensiunkan',
      next: 'RETIRED',
      className: 'border-red-300 text-red-700 hover:bg-red-50',
    });
  }

  if (buttons.length === 0) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  return (
    <div className="flex gap-2">
      {buttons.map((b) => (
        <button
          key={b.next}
          disabled={pending}
          onClick={() => onTransition(item, b.next)}
          className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60 ${b.className}`}
        >
          {pending ? '...' : b.label}
        </button>
      ))}
    </div>
  );
}
