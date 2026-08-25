'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe, resetMe } from '@/lib/use-me';
import { UserNav } from '@/components/user-nav';
import { sfx } from '@/lib/sfx';

/**
 * Layout route group `(user)` — guard + nav (Task 8 brief):
 * - Tanpa token → `/login`.
 * - Token invalid/expired (GET /me gagal) → bersihkan localStorage, `/login`.
 * - `me.onboarded === false` → `/onboarding` (kecuali sudah di sana).
 * - Nav disembunyikan di `/session*` dan `/onboarding` (design-system.md §2).
 * - Role ADMIN tetap boleh memakai app user (tidak ada filter role di sini).
 */

function isNavHidden(pathname: string): boolean {
  return pathname.startsWith('/session') || pathname === '/onboarding';
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { me, loading, error } = useMe();
  const [ready, setReady] = useState(false);

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
      // C1 fix: see page.tsx / profile/page.tsx for the same call — without
      // it the module-scope useMe cache survives this clear and the next
      // user on this tab could see stale `me` data.
      resetMe();
      router.replace('/login');
      return;
    }

    if (!me.onboarded && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }

    setReady(true);
  }, [loading, me, error, pathname, router]);

  // I4 fix: seed sfx's localStorage-backed mute state from the account's
  // `soundOn` preference the FIRST time this device/browser sees this user
  // (no 'soundOn' key in localStorage yet) — e.g. a new device, or a
  // freshly-cleared profile that just logged in. Once a local preference
  // exists, localStorage stays authoritative for playback (per sfx.ts) and
  // this must not override it on every mount.
  useEffect(() => {
    if (!me) return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem('soundOn') === null) {
      sfx.setMuted(!me.soundOn);
    }
  }, [me]);

  if (!ready) {
    return null;
  }

  const showNav = !isNavHidden(pathname);

  return (
    <div className={showNav ? 'lg:pl-60' : ''}>
      <main className={showNav ? 'min-h-screen pb-28 lg:pb-6' : 'min-h-screen'}>{children}</main>
      {showNav ? <UserNav /> : null}
    </div>
  );
}
