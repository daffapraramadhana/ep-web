'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';

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
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Import Soal</h1>
      <p className="mb-6 text-sm text-gray-500">
        Unggah berkas .xlsx berisi lesson dan item soal untuk diimpor ke sistem.
      </p>

      <form onSubmit={handleSubmit} className="mb-6 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="block text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Mengunggah...' : 'Unggah & Import'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

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
                <h2 className="text-sm font-semibold text-gray-900">Daftar Error</h2>
                <button
                  onClick={handleDownloadErrors}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Unduh laporan error (CSV)
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Baris</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Kolom</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Pesan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-red-600">{e.row}</td>
                        <td className="px-3 py-2 text-red-600">{e.column}</td>
                        <td className="px-3 py-2 text-red-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
