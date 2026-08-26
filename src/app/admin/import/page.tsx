'use client';

import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { Card, ChunkyButton } from '@/components/ui';
import { PetunjukModal } from './petunjuk-modal';

interface ImportError {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  lessonsCreated: number;
  lessonsUpdated: number;
  itemsCreated: number;
  itemsUpdated: number;
  skippedRows: number;
  errors: ImportError[];
}

export default function ImportSoalPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showPetunjuk, setShowPetunjuk] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Pilih berkas .xlsx terlebih dahulu.');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api<ImportResult>('/admin/import/questions', {
        method: 'POST',
        body: formData,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadErrors() {
    if (!result) return;
    downloadCsv(
      'laporan-error-import.csv',
      result.errors.map((e) => ({ baris: e.row, kolom: e.column, pesan: e.message }))
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-black text-ink">Import Soal</h1>
      <p className="mb-4 text-sm font-semibold text-muted">
        Unggah berkas .xlsx berisi lesson dan item soal untuk diimpor ke sistem.
      </p>

      {/* Template ikut dibundel app (public/) — tim konten tidak perlu
          dikirimi file manual. Sumber: deliverables/template-soal-v1.xlsx. */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <a
          href="/template-soal-v1.xlsx"
          download
          className="inline-flex items-center gap-2 rounded-xl border-2 border-line bg-white px-4 py-2.5 text-sm font-extrabold text-brand transition-colors hover:border-brand-soft hover:bg-brand-soft"
        >
          <Download size={16} strokeWidth={2.25} />
          Unduh Template (.xlsx)
        </a>
        <button
          type="button"
          onClick={() => setShowPetunjuk(true)}
          className="text-sm font-bold text-muted underline underline-offset-2 hover:text-ink"
        >
          Petunjuk pengisian
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 max-w-sm space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="block text-sm font-semibold text-ink file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-brand-dark hover:file:bg-line"
        />
        <ChunkyButton type="submit" disabled={loading}>
          {loading ? 'Mengunggah...' : 'Unggah & Import'}
        </ChunkyButton>
      </form>

      {error && <p className="mb-4 text-sm font-semibold text-bad">{error}</p>}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard label="Lesson dibuat" value={result.lessonsCreated} />
            <SummaryCard label="Lesson diperbarui" value={result.lessonsUpdated} />
            <SummaryCard label="Item dibuat" value={result.itemsCreated} />
            <SummaryCard label="Item diperbarui" value={result.itemsUpdated} />
            <SummaryCard label="Baris dilewati" value={result.skippedRows} />
            <SummaryCard label="Jumlah error" value={result.errors.length} />
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-black text-ink">Daftar Error</h2>
                <button type="button" onClick={handleDownloadErrors} className="btn-outline-sm">
                  Unduh laporan error (CSV)
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Baris</th>
                      <th>Kolom</th>
                      <th>Pesan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="text-bad">{e.row}</td>
                        <td className="text-bad">{e.column}</td>
                        <td className="text-bad">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {showPetunjuk ? <PetunjukModal onClose={() => setShowPetunjuk(false)} /> : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <Card eyebrow={label} title={value} />;
}
