'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, resetMe } from '@/lib/use-me';

/**
 * Gate root (Task 8 brief): tanpa token → `/login`; token ada → fetch /me
 * → `onboarded` ? `/home` : `/onboarding`. `/admin/*` tetap terpisah dan
 * tidak melewati gate ini (login admin sendiri di `/admin/login`).
 */
export default function RootGate() {
  const router = useRouter();
  const { me, loading, error } = useMe();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      router.replace('/login');
      return;
    }

    if (loading) return;

    if (error || !me) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      // C1 fix: see (user)/layout.tsx and profile/page.tsx for the same
      // call — without it the module-scope useMe cache survives this
      // clear and the next user on this tab could see stale `me` data.
      resetMe();
      router.replace('/login');
      return;
    }

    router.replace(me.onboarded ? '/home' : '/onboarding');
  }, [loading, me, error, router]);

  return null;
}
