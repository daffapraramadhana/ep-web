'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { Card, ChunkyButton } from '@/components/ui';

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
  const [approvingId, setApprovingId] = useState('');

  async function handleApprove(id: string) {
    setApprovingId(id);
    setListError('');
    try {
      await api(`/admin/users/${id}/approve`, { method: 'PATCH' });
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setApprovingId('');
    }
  }

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
      <h1 className="mb-1 text-xl font-black text-ink">Karyawan</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        Unggah berkas CSV (kolom: nama, email) untuk membuat akun dan mengirim undangan.
      </p>

      <form onSubmit={handleSubmit} className="mb-6 max-w-sm space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="block text-sm font-semibold text-ink file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-brand-dark hover:file:bg-line"
        />
        <ChunkyButton type="submit" disabled={loading}>
          {loading ? 'Mengunggah...' : 'Unggah & Import'}
        </ChunkyButton>
      </form>

      {error && <p className="mb-4 text-sm font-semibold text-bad">{error}</p>}

      {result && (
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard label="Akun dibuat" value={result.created} />
            <SummaryCard label="Dilewati" value={result.skipped} />
            <SummaryCard label="Jumlah error" value={result.errors.length} />
          </div>

          {result.errors.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Baris</th>
                    <th>Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="text-bad">{e.row}</td>
                      <td className="text-bad">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.invites.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-black text-ink">Link Undangan</h2>
                <button type="button" onClick={handleDownloadInvites} className="btn-outline-sm">
                  Unduh semua link undangan (CSV)
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Link Undangan</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.invites.map((inv) => (
                      <tr key={inv.email}>
                        <td>{inv.name}</td>
                        <td>{inv.email}</td>
                        <td className="max-w-xs truncate text-muted">{inv.inviteUrl}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv.inviteUrl, inv.email)}
                            className="btn-outline-sm"
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
        <h2 className="text-sm font-black text-ink">Daftar Karyawan</h2>
        <button type="button" onClick={loadUsers} disabled={listLoading} className="btn-outline-sm">
          {listLoading ? 'Memuat...' : 'Muat ulang'}
        </button>
      </div>

      {listError && <p className="mb-4 text-sm font-semibold text-bad">{listError}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Status Undangan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && !listLoading && (
              <tr>
                <td colSpan={4} className="text-center text-muted">
                  Belum ada karyawan.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="text-muted">{u.email}</td>
                <td className="text-muted">
                  {u.inviteStatus === 'AWAITING_APPROVAL' ? 'Menunggu persetujuan' : u.inviteStatus}
                </td>
                <td>
                  {u.inviteStatus === 'AWAITING_APPROVAL' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(u.id)}
                      disabled={approvingId === u.id}
                      className="btn-outline-sm"
                    >
                      {approvingId === u.id ? 'Menyetujui...' : 'Setujui'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <Card eyebrow={label} title={value} />;
}
