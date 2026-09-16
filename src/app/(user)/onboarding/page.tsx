'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';
import type { Level, MeView, PatchMeRequest } from '@/lib/api-types';
import { ChunkyButton } from '@/components/ui';
import { Mascot } from '@/components/mascot';

/**
 * Onboarding (Task 9 brief §Step 1) — 2 langkah, state lokal, satu route
 * (bukan sub-route per langkah). Step 1: level; Step 2: target harian ->
 * PATCH /me -> WAJIB `await useMe().mutate()` sebelum `router.replace('/home')`
 * (carry-over review Task 8: kalau tidak, guard di (user)/layout.tsx masih
 * melihat cache `onboarded:false` lama dan melempar balik ke /onboarding).
 */

interface LevelOption {
  value: Level;
  label: string;
  desc: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    value: 'DASAR',
    label: 'Dasar',
    desc: 'Baru mulai atau masih di kosakata & kalimat sederhana sehari-hari.',
  },
  {
    value: 'MENENGAH',
    label: 'Menengah',
    desc: 'Sudah cukup lancar, ingin memperkuat grammar dan percakapan kerja.',
  },
  {
    value: 'MAHIR',
    label: 'Mahir',
    desc: 'Percaya diri berkomunikasi, ingin mengasah nuansa & konteks profesional.',
  },
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

export default function OnboardingPage() {
  const router = useRouter();
  const { mutate } = useMe();
  const [step, setStep] = useState<1 | 2>(1);
  const [level, setLevel] = useState<Level | null>(null);
  const [dailyTarget, setDailyTarget] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    if (!level || !consented || saving) return;
    setError('');
    setSaving(true);
    try {
      const body: PatchMeRequest = {
        level,
        dailyTargetSessions: dailyTarget,
        // Konsen sekali set, permanen (BE abaikan kalau sudah ada) — syarat
        // UU PDP untuk latihan berbicara yang merekam suara.
        voiceConsent: true,
      };
      await api<MeView>('/me', { method: 'PATCH', body: JSON.stringify(body) });
      await mutate();
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setSaving(false);
    }
  }

  return (
    <div className="learn-onboarding flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="learn-onboarding-intro">
          <Mascot sizes="144px" priority />
          <p>{step === 1 ? 'Kita mulai dari tempat yang nyaman untukmu.' : 'Pilih ritme yang bisa kamu nikmati setiap hari.'}</p>
        </div>
        <p className="learn-eyebrow mb-3">Langkah {step} dari 2</p>
        <div className="mb-5 flex gap-2" aria-hidden="true">
          <div className={`h-1.5 w-10 rounded-full ${step >= 1 ? 'bg-brand' : 'bg-line'}`} />
          <div className={`h-1.5 w-10 rounded-full ${step >= 2 ? 'bg-brand' : 'bg-line'}`} />
        </div>

        {step === 1 ? (
          <div>
            <h1 className="mb-1 text-[22px] font-black text-ink">Berapa levelmu sekarang?</h1>
            <p className="mb-5 text-sm font-semibold text-muted">
              Kami akan menyesuaikan materi dengan levelmu. Bisa diubah kapan pun di Profil.
            </p>
            <fieldset className="space-y-3" aria-label="Level bahasa Inggris">
              {LEVEL_OPTIONS.map((opt) => {
                const selected = level === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`choice-card${selected ? ' choice-card-selected' : ''}`}
                  >
                    <input type="radio" name="level" value={opt.value} checked={selected} onChange={() => setLevel(opt.value)} className="sr-only" />
                    <div className="choice-card-title">{opt.label}</div>
                    <div className="choice-card-desc">{opt.desc}</div>
                  </label>
                );
              })}
            </fieldset>
            <div className="mt-6">
              <ChunkyButton onClick={() => setStep(2)} disabled={!level}>
                Lanjut
              </ChunkyButton>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="mb-1 text-[22px] font-black text-ink">Berapa target harianmu?</h1>
            <p className="mb-5 text-sm font-semibold text-muted">
              Target menentukan berapa sesi yang perlu kamu selesaikan tiap hari agar streak tetap
              menyala.
            </p>
            <fieldset className="space-y-3" aria-label="Target harian">
              {TARGET_OPTIONS.map((opt) => {
                const selected = dailyTarget === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`choice-card${selected ? ' choice-card-selected' : ''}`}
                  >
                    <input type="radio" name="daily-target" value={opt.value} checked={selected} onChange={() => setDailyTarget(opt.value)} className="sr-only" />
                    <div className="choice-card-title">{opt.label}</div>
                    <div className="choice-card-desc">{opt.desc}</div>
                  </label>
                );
              })}
            </fieldset>
            <label className={`consent-card${consented ? ' consent-card-checked' : ''}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
              />
              <span className="consent-box" aria-hidden="true">
                {consented ? '✓' : ''}
              </span>
              <span className="consent-text">
                Saya setuju rekaman suara saya disimpan untuk keperluan penilaian latihan
                berbicara.
              </span>
            </label>
            {error ? <p role="alert" className="mt-3 text-sm font-semibold text-bad">{error}</p> : null}
            <div className="mt-6 space-y-2.5">
              <ChunkyButton onClick={finish} disabled={saving || !consented}>
                {saving ? 'Menyimpan…' : 'Mulai belajar'}
              </ChunkyButton>
              <ChunkyButton variant="ghost" onClick={() => setStep(1)} disabled={saving}>
                Kembali
              </ChunkyButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
