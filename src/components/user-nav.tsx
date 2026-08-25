'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Map, ChartColumn, User, Flame, LogOut } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMe, resetMe } from '@/lib/use-me';

/**
 * Nav app user — design-system.md §2 "Navigasi": pill navy mengambang
 * (mobile, 16px dari bawah) yang menjadi sidebar kiri di desktop (>=1024px,
 * lihat media query `.user-nav-mobile` di globals.css). Item aktif =
 * lingkaran brand di belakang ikon (mobile) / pill penuh (desktop).
 * Wordmark + blok user hanya tampil di desktop (`.user-nav-brand` /
 * `.user-nav-user` display:none di mobile). Disembunyikan di /session* dan
 * /onboarding oleh (user)/layout.tsx.
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

  const name = me?.name ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    resetMe();
    router.replace('/login');
  }

  return (
    <nav className="user-nav user-nav-mobile" aria-label="Navigasi utama">
      <div className="user-nav-brand" aria-hidden="true">
        <span className="user-nav-brand-icon">
          <Flame size={20} strokeWidth={2.25} />
        </span>
        Daily English
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

      <div className="user-nav-user">
        <div className="user-nav-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="user-nav-user-name" title={name}>
          {name}
        </div>
        <button type="button" className="user-nav-logout" onClick={logout} aria-label="Keluar">
          <LogOut size={18} strokeWidth={2.25} />
        </button>
      </div>
    </nav>
  );
}
