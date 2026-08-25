'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';

interface ImportUserError {
  row: number;
  message: string;
}

interface Invite {
  name: string;
  email: string;
  inviteUrl: string;
}

interface ImportUsersResult {
  created: number;
  skipped: number;
  errors: ImportUserError[];
  invites: Invite[];
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  inviteStatus: string;
  level: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportUsersResult | null>(null);
  const [copiedEmail, setCopiedEmail] = useState('');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  async function loadUsers() {
    setListLoading(true);
    setListError('');
    try {
      const res = await api<UserRow[]>('/admin/users');
      setUsers(res);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Pilih berkas CSV terlebih dahulu.');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api<ImportUsersResult>('/admin/users/import', {
        method: 'POST',
        body: formData,
      });
      setResult(res);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink(url: string, email: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(''), 2000);
    } catch {
      // clipboard API may be unavailable; silently ignore
    }
  }

  function handleDownloadInvites() {
    if (!result) return;
    downloadCsv(
      'link-undangan-karyawan.csv',
      result.invites.map((i) => ({ nama: i.name, email: i.email, link: i.inviteUrl }))
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Karyawan</h1>
      <p className="mb-6 text-sm text-gray-500">
        Unggah berkas CSV (kolom: nama, email) untuk membuat akun dan mengirim undangan.
      </p>

      <form onSubmit={handleSubmit} className="mb-6 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
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
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard label="Akun dibuat" value={result.created} />
            <SummaryCard label="Dilewati" value={result.skipped} />
            <SummaryCard label="Jumlah error" value={result.errors.length} />
          </div>

          {result.errors.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Baris</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Pesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-red-600">{e.row}</td>
                      <td className="px-3 py-2 text-red-600">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.invites.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Link Undangan</h2>
                <button
                  onClick={handleDownloadInvites}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Unduh semua link undangan (CSV)
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Nama</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Link Undangan</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.invites.map((inv) => (
                      <tr key={inv.email}>
                        <td className="px-3 py-2 text-gray-900">{inv.name}</td>
                        <td className="px-3 py-2 text-gray-700">{inv.email}</td>
                        <td className="max-w-xs truncate px-3 py-2 text-gray-500">{inv.inviteUrl}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleCopyLink(inv.inviteUrl, inv.email)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {copiedEmail === inv.email ? 'Tersalin' : 'Salin link'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Daftar Karyawan</h2>
        <button
          onClick={loadUsers}
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
              <th className="px-3 py-2 text-left font-medium text-gray-500">Email</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status Undangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && !listLoading && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-gray-400">
                  Belum ada karyawan.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2 text-gray-900">{u.name}</td>
                <td className="px-3 py-2 text-gray-700">{u.email}</td>
                <td className="px-3 py-2 text-gray-700">{u.inviteStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
