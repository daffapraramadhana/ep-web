'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ChunkyButton } from '@/components/ui';
import { AuthShell } from '@/components/auth-shell';
import { Mascot } from '@/components/mascot';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import './login.css';

/**
 * Login user-facing (Task 8 brief) — form sama dengan `/admin/login` tapi
 * copy netral dan TANPA cek role (ADMIN pun boleh memakai app user untuk
 * demo). Sukses → simpan token/name/role → `router.replace('/')` supaya
 * gate di root `page.tsx` yang menentukan tujuan akhir (`/home` atau
 * `/onboarding`).
 */

interface LoginResponse {
  accessToken: string;
  role: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('role', res.role);
      localStorage.setItem('name', res.name);
      router.replace('/');
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Belum bisa terhubung. Periksa koneksimu, lalu coba masuk lagi.'
        : err instanceof Error ? err.message : 'Belum berhasil masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      className="auth-login"
      intro={<div className="login-welcome">
        <p>Langkah kecil.<br /><strong>Percaya diri lebih besar.</strong></p>
        <Mascot variant="welcome" className="login-mascot" sizes="128px" priority />
      </div>}
      title="Selamat datang kembali."
      subtitle="Masuk untuk melanjutkan perjalanan belajarmu."
      footer={
        <>
          Belum punya akun?{' '}
          <Link href="/register" className="underline">
            Buat akun
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="login-form" aria-busy={loading}>
        <div>
          <label htmlFor="email" className="auth-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            autoComplete="email"
            placeholder="nama@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </div>
        <div>
          <label htmlFor="password" className="auth-label">
            Kata sandi
          </label>
          <div className="login-password">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Masukkan kata sandimu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <button
              type="button"
              className="login-password-toggle"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-controls="password"
              onClick={() => setShowPassword(value => !value)}
            >
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <ChunkyButton type="submit" disabled={loading}>
          {loading ? 'Sedang masuk…' : <>Masuk <ArrowRight size={18} aria-hidden="true" /></>}
        </ChunkyButton>
        <span className="sr-only" role="status">{loading ? 'Sedang masuk. Mohon tunggu.' : ''}</span>
      </form>
    </AuthShell>
  );
}
