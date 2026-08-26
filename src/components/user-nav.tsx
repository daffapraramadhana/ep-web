'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Map, ChartColumn, User, LogOut } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMe, resetMe } from '@/lib/use-me';
import { useSummary, resetSummary } from '@/lib/use-summary';
import { Ring } from '@/components/progress';
import { Logo } from '@/components/logo';

/**
 * Nav app user — design-system.md §2 "Navigasi": pill navy mengambang
 * (mobile) yang menjadi sidebar kiri di desktop (>=1024px).
 *
 * Desktop "premium" (impeccable craft): permukaan gradien navy + garis
 * highlight tepi kanan; item aktif memakai idiom chunky (border-bottom
 * brand-dark + tekan-turun); blok target harian (ring mini dari
 * /me/summary via useSummary — fetch dibagi dengan rail); blok user
 * dengan ring avatar gradien + baris streak. Semua elemen desktop
 * disembunyikan di mobile (display:none), pill mobile tak berubah.
 */

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Beranda', icon: Home },
  { href: '/journey', label: 'Perjalanan', icon: Map },
  { href: '/progress', label: 'Progress', icon: ChartColumn },
  { href: '/profile', label: 'Profil', icon: User },
];

export function UserNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useMe();
  const { summary } = useSummary();

  const name = me?.name ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const target = summary && summary.dailyTarget > 0 ? summary.dailyTarget : 1;
  const done = summary?.sessionsCompletedToday ?? 0;
  const targetMet = summary !== null && done >= target;

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    resetMe();
    resetSummary();
    router.replace('/login');
  }

  return (
    <nav className="user-nav user-nav-mobile" aria-label="Navigasi utama">
      <div className="user-nav-brand" aria-hidden="true">
        <span className="user-nav-brand-icon">
          <Logo size={25} />
        </span>
        Fluen
      </div>

      <div className="user-nav-items">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`user-nav-item${active ? ' user-nav-item-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="user-nav-icon">
                <Icon size={20} strokeWidth={2.25} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {summary ? (
        <div className="user-nav-goal" aria-label={`Target hari ini ${done} dari ${target} sesi`}>
          <Ring
            size={30}
            stroke={4}
            pct={(done / target) * 100}
            trackClass="user-nav-goal-track"
            arcClass="user-nav-goal-arc"
          />
          <div className="user-nav-goal-text">
            <b>Target hari ini</b>
            <span>
              {done}/{target} sesi{targetMet ? ' ✅' : ''}
            </span>
          </div>
        </div>
      ) : null}

      <div className="user-nav-user">
        <div className="user-nav-avatar-ring" aria-hidden="true">
          <div className="user-nav-avatar">{initial}</div>
        </div>
        <div className="user-nav-user-info">
          <div className="user-nav-user-name" title={name}>
            {name}
          </div>
          <div className="user-nav-user-streak">
            {summary && summary.streak > 0
              ? `🔥 ${summary.streak} hari`
              : summary
                ? 'Belum ada streak'
                : ''}
          </div>
        </div>
        <button type="button" className="user-nav-logout" onClick={logout} aria-label="Keluar">
          <LogOut size={18} strokeWidth={2.25} />
        </button>
      </div>
    </nav>
  );
}
