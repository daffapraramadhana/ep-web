'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface UploadRejected {
  name: string;
  reason: string;
}

interface UploadResult {
  saved: string[];
  rejected: UploadRejected[];
}

interface MediaFile {
  name: string;
  size: number;
}

export default function MediaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  async function loadFiles() {
    setListLoading(true);
    setListError('');
    try {
      const res = await api<MediaFile[]>('/admin/media');
      setFiles(res);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected = fileInputRef.current?.files;
    if (!selected || selected.length === 0) {
      setUploadError('Pilih setidaknya satu berkas.');
      return;
    }

    setUploadError('');
    setUploadResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(selected).forEach((f) => formData.append('files', f));
      const res = await api<UploadResult>('/admin/media', {
        method: 'POST',
        body: formData,
      });
      setUploadResult(res);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadFiles();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Media</h1>
      <p className="mb-6 text-sm text-gray-500">
        Unggah berkas audio/gambar yang dirujuk oleh soal (maks. 20 berkas per unggahan).
      </p>

      <form onSubmit={handleSubmit} className="mb-6 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="block text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {uploading ? 'Mengunggah...' : 'Unggah'}
        </button>
      </form>

      {uploadError && <p className="mb-4 text-sm text-red-600">{uploadError}</p>}

      {uploadResult && (
        <div className="mb-6 space-y-3">
          {uploadResult.saved.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-900">Berhasil disimpan</p>
              <ul className="space-y-1">
                {uploadResult.saved.map((name) => (
                  <li key={name} className="text-sm text-green-700">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {uploadResult.rejected.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-900">Ditolak</p>
              <ul className="space-y-1">
                {uploadResult.rejected.map((r) => (
                  <li key={r.name} className="text-sm text-red-600">
                    {r.name} — {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Berkas Tersimpan</h2>
        <button
          onClick={loadFiles}
          disabled={listLoading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {listLoading ? 'Memuat...' : 'Muat ulang'}
        </button>
      </div>

      {listError && <p className="mb-4 text-sm text-red-600">{listError}</p>}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Nama</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Ukuran (KB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.length === 0 && !listLoading && (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-gray-400">
                  Belum ada berkas.
                </td>
              </tr>
            )}
            {files.map((f) => (
              <tr key={f.name}>
                <td className="px-3 py-2 text-gray-900">{f.name}</td>
                <td className="px-3 py-2 text-gray-700">{(f.size / 1024).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
