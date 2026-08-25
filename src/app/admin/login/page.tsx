'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, ChunkyButton } from '@/components/ui';

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <Card title="Masuk Admin">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {error && <p className="text-sm font-semibold text-bad">{error}</p>}
            <ChunkyButton type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </ChunkyButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
