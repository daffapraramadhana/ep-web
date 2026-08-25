'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ChunkyButton } from '@/components/ui';

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
      <h1 className="mb-1 text-xl font-black text-ink">Media</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Unggah berkas audio/gambar yang dirujuk oleh soal (maks. 20 berkas per unggahan).
      </p>

      <form onSubmit={handleSubmit} className="mb-6 max-w-sm space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="block text-sm font-semibold text-ink file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-brand-dark hover:file:bg-line"
        />
        <ChunkyButton type="submit" disabled={uploading}>
          {uploading ? 'Mengunggah...' : 'Unggah'}
        </ChunkyButton>
      </form>

      {uploadError && <p className="mb-4 text-sm font-semibold text-bad">{uploadError}</p>}

      {uploadResult && (
        <div className="mb-6 space-y-3">
          {uploadResult.saved.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-black text-ink">Berhasil disimpan</p>
              <ul className="space-y-1">
                {uploadResult.saved.map((name) => (
                  <li key={name} className="text-sm font-semibold text-good-dark">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {uploadResult.rejected.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-black text-ink">Ditolak</p>
              <ul className="space-y-1">
                {uploadResult.rejected.map((r) => (
                  <li key={r.name} className="text-sm font-semibold text-bad">
                    {r.name} — {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-black text-ink">Berkas Tersimpan</h2>
        <button type="button" onClick={loadFiles} disabled={listLoading} className="btn-outline-sm">
          {listLoading ? 'Memuat...' : 'Muat ulang'}
        </button>
      </div>

      {listError && <p className="mb-4 text-sm font-semibold text-bad">{listError}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Ukuran (KB)</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 && !listLoading && (
              <tr>
                <td colSpan={2} className="text-center text-muted">
                  Belum ada berkas.
                </td>
              </tr>
            )}
            {files.map((f) => (
              <tr key={f.name}>
                <td>{f.name}</td>
                <td>{(f.size / 1024).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
