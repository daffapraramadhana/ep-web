'use client';

/**
 * Profil — Task 14 brief + design-system.md §8. Nama & email read-only
 * (dari `useMe()`, tidak ada endpoint edit profil dasar di scope ini).
 * Tiga pengaturan yang bisa diubah, semuanya lewat `PATCH /me`:
 *
 * - Level: 3 pilihan (choice-card, sama seperti onboarding/page.tsx) —
 *   ganti level SELALU lewat dialog konfirmasi ("Progress lesson level
 *   lama tetap tersimpan") sebelum PATCH benar-benar dikirim, supaya user
 *   tidak salah tap dan kaget progress lesson levelnya tidak ikut pindah.
 *   Dialog memakai class `.journey-confirm-backdrop`/`.journey-confirm-card`
 *   yang sudah ada (generik, bukan spesifik Perjalanan).
 * - Target harian: 2 pilihan (Santai/Serius) — langsung PATCH, tanpa
 *   dialog (brief hanya mewajibkan konfirmasi utk level).
 * - Toggle bunyi: WAJIB lewat `sfx.setMuted()` (persist localStorage,
 *   pola sama dgn (user)/session/page.tsx) DAN `PATCH /me {soundOn}` —
 *   carry-over review Task 7: jangan pernah tulis localStorage langsung.
 *
 * Semua PATCH sukses -> `useMe().mutate()` (carry-over review Task 8:
 * tanpa ini guard di (user)/layout.tsx bisa melihat cache lama).
 *
 * Keluar: hapus token/role/name dari localStorage -> replace ke /login
 * (replace, bukan push, supaya tombol back tidak balik ke area terproteksi).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Volume2, VolumeX } from 'lucide-react';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';
import { sfx } from '@/lib/sfx';
import type { Level, MeView, PatchMeRequest } from '@/lib/api-types';
import { Card, ChunkyButton } from '@/components/ui';

const APP_VERSION = '0.1.0'; // mirror package.json version — tanpa endpoint/build-info khusus (YAGNI)

interface LevelOption {
  value: Level;
  label: string;
  desc: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  { value: 'DASAR', label: 'Dasar', desc: 'Baru mulai atau masih di kosakata & kalimat sederhana sehari-hari.' },
  { value: 'MENENGAH', label: 'Menengah', desc: 'Sudah cukup lancar, ingin memperkuat grammar dan percakapan kerja.' },
  { value: 'MAHIR', label: 'Mahir', desc: 'Percaya diri berkomunikasi, ingin mengasah nuansa & konteks profesional.' },
];

interface TargetOption {
  value: 1 | 2;
  label: string;
  desc: string;
}

const TARGET_OPTIONS: TargetOption[] = [
  { value: 1, label: 'Santai', desc: '1 sesi per hari · sekitar 8 menit' },
  { value: 2, label: 'Serius', desc: '2 sesi per hari · sekitar 15 menit' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { me, mutate } = useMe();

  const [pendingLevel, setPendingLevel] = useState<Level | null>(null);
  const [savingLevel, setSavingLevel] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => sfx.getMuted());
  const [savingSound, setSavingSound] = useState(false);
  const [error, setError] = useState('');

  // (user)/layout.tsx sudah menahan render sampai `me` valid (token +
  // GET /me sukses) sebelum me-mount children — null di sini hanya utk
  // keamanan tipe, bukan state yang benar-benar diharapkan terjadi.
  if (!me) {
    return null;
  }

  async function patchMe(body: PatchMeRequest): Promise<void> {
    await api<MeView>('/me', { method: 'PATCH', body: JSON.stringify(body) });
    await mutate();
  }

  async function confirmLevelChange() {
    if (!pendingLevel || savingLevel) return;
    setError('');
    setSavingLevel(true);
    try {
      await patchMe({ level: pendingLevel });
      setPendingLevel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSavingLevel(false);
    }
  }

  const currentDailyTarget = me.dailyTargetSessions;

  async function changeTarget(target: 1 | 2) {
    if (savingTarget || target === currentDailyTarget) return;
    setError('');
    setSavingTarget(true);
    try {
      await patchMe({ dailyTargetSessions: target });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSavingTarget(false);
    }
  }

  async function toggleSound() {
    if (savingSound) return;
    const nextMuted = !muted;
    setError('');
    setSavingSound(true);
    sfx.setMuted(nextMuted);
    setMutedState(nextMuted);
    try {
      await patchMe({ soundOn: !nextMuted });
    } catch (err) {
      // Gagal sinkron ke server — pertahankan preferensi lokal (localStorage
      // tetap sumber kebenaran utk playback), tapi kabari usernya.
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSavingSound(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    router.replace('/login');
  }

  return (
    <div className="space-y-3.5 px-5 py-[22px]">
      <h1 className="text-[22px] font-black text-ink">Profil</h1>

      <Card eyebrow="Akun" title={me.name}>
        <div className="profile-field">
          <span className="profile-field-label">Nama</span>
          <span className="profile-field-value">{me.name}</span>
        </div>
        <div className="profile-field">
          <span className="profile-field-label">Email</span>
          <span className="profile-field-value">{me.email}</span>
        </div>
      </Card>

      <Card eyebrow="Belajar" title="Level">
        <div className="space-y-2.5">
          {LEVEL_OPTIONS.map((opt) => {
            const selected = me.level === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`choice-card${selected ? ' choice-card-selected' : ''}`}
                onClick={() => setPendingLevel(opt.value)}
                disabled={selected}
                aria-pressed={selected}
              >
                <div className="choice-card-title">{opt.label}</div>
                <div className="choice-card-desc">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card eyebrow="Belajar" title="Target harian">
        <div className="space-y-2.5">
          {TARGET_OPTIONS.map((opt) => {
            const selected = me.dailyTargetSessions === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`choice-card${selected ? ' choice-card-selected' : ''}`}
                onClick={() => changeTarget(opt.value)}
                disabled={selected || savingTarget}
                aria-pressed={selected}
              >
                <div className="choice-card-title">{opt.label}</div>
                <div className="choice-card-desc">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card eyebrow="Pengaturan" title="Bunyi">
        <div className="toggle-row">
          <div className="flex items-center gap-2.5">
            {muted ? (
              <VolumeX size={20} strokeWidth={2.25} className="text-muted" />
            ) : (
              <Volume2 size={20} strokeWidth={2.25} className="text-brand" />
            )}
            <span className="text-sm font-bold text-ink">
              {muted ? 'Bunyi dimatikan' : 'Bunyi aktif'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!muted}
            aria-label={muted ? 'Nyalakan bunyi' : 'Matikan bunyi'}
            className={`toggle-switch${!muted ? ' toggle-switch-on' : ''}`}
            onClick={toggleSound}
            disabled={savingSound}
          >
            <span className="toggle-switch-knob" />
          </button>
        </div>
      </Card>

      {error ? <p className="text-sm font-semibold text-bad">{error}</p> : null}

      <ChunkyButton variant="danger" onClick={logout}>
        <LogOut size={18} strokeWidth={2.25} />
        KELUAR
      </ChunkyButton>

      <p className="pt-1 text-center text-xs font-semibold text-muted">
        Versi app {APP_VERSION}
      </p>

      {pendingLevel ? (
        <div className="journey-confirm-backdrop" onClick={() => (savingLevel ? null : setPendingLevel(null))}>
          <Card
            className="journey-confirm-card"
            onClick={(e) => e.stopPropagation()}
            title="Ganti level?"
          >
            <p className="mb-4 text-sm font-semibold text-muted">
              Progress lesson level lama tetap tersimpan.
            </p>
            <div className="flex gap-2">
              <ChunkyButton
                variant="ghost"
                className="flex-1"
                onClick={() => setPendingLevel(null)}
                disabled={savingLevel}
              >
                Batal
              </ChunkyButton>
              <ChunkyButton
                variant="good"
                className="flex-1"
                onClick={confirmLevelChange}
                disabled={savingLevel}
              >
                {savingLevel ? 'Menyimpan...' : 'Ganti'}
              </ChunkyButton>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
