'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Map, ChartColumn, User, LogOut, Check, Flame } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';
import { useMe, resetMe } from '@/lib/use-me';
import { useSummary, resetSummary } from '@/lib/use-summary';
import { Ring } from '@/components/progress';
import { Logo } from '@/components/logo';
import { APP_NAME } from '@/lib/brand';

/**
 * Learner navigation: floating pill with active label on mobile, white sidebar
 * from 1024px. Desktop goal and account details share the summary cache
 * with the progress rail; learner.css owns the responsive presentation.
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
  const activeIndex = NAV_ITEMS.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`));

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
        {APP_NAME}
      </div>

      <div
        className="user-nav-items"
        data-active-index={activeIndex}
        style={{ '--nav-active-index': Math.max(0, activeIndex) } as CSSProperties}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`user-nav-item${active ? ' user-nav-item-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="user-nav-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={2.25} />
              </span>
              <span className="user-nav-label">{label}</span>
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
              {done}/{target} sesi{targetMet ? <Check size={13} aria-label="Target tercapai" /> : null}
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
              ? <><Flame size={13} aria-hidden="true" /> {summary.streak} hari</>
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
