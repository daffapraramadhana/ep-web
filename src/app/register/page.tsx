'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ChunkyButton } from '@/components/ui';
import { AuthShell } from '@/components/auth-shell';

/**
 * Registrasi mandiri — akun dibuat berstatus AWAITING_APPROVAL di BE;
 * user baru bisa login setelah admin menyetujui di /admin/users, jadi
 * sukses di sini TIDAK memberi token, hanya layar "tunggu persetujuan".
 */

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Pendaftaran diterima"
        subtitle="Akunmu sedang menunggu persetujuan admin."
        footer={
          <>
            Sudah disetujui?{' '}
            <Link href="/login" className="underline">
              Masuk di sini
            </Link>
          </>
        }
      >
        <p className="text-sm font-semibold text-muted">
          Kami sudah mencatat pendaftaranmu. Hubungi admin perusahaanmu untuk
          mempercepat persetujuan, lalu masuk dengan email dan kata sandi yang
          barusan kamu buat.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Daftar"
      subtitle="Buat akun, mulai kebiasaan kecil hari ini."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/login" className="underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="auth-label">
            Nama
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
          />
        </div>
        <div>
          <label htmlFor="email" className="auth-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </div>
        <div>
          <label htmlFor="password" className="auth-label">
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          <p className="mt-1 text-xs font-semibold text-muted">Minimal 8 karakter.</p>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <ChunkyButton type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Daftar'}
        </ChunkyButton>
      </form>
    </AuthShell>
  );
}
