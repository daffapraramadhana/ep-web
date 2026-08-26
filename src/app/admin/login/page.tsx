'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChunkyButton } from '@/components/ui';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';

interface LoginResponse {
  accessToken: string;
  role: string;
  name: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.role !== 'ADMIN') {
        setError('Akun ini bukan admin');
        return;
      }

      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('role', res.role);
      localStorage.setItem('name', res.name);
      router.push('/admin/ringkasan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Masuk Admin"
      subtitle="Kelola konten & pantau aktivitas belajar."
      footer={
        <>
          Karyawan? <Link href="/login">Masuk lewat halaman utama</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <ChunkyButton type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </ChunkyButton>
      </form>
    </AuthShell>
  );
}
