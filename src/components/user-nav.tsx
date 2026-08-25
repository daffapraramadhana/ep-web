'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, ChartColumn, User } from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Nav app user — design-system.md §2 "Navigasi": pill navy mengambang
 * (mobile, 16px dari bawah) yang menjadi sidebar kiri di desktop (>=1024px,
 * lihat media query `.user-nav-mobile` di globals.css). Item aktif =
 * lingkaran brand di belakang ikon. Disembunyikan di /session* dan
 * /onboarding oleh (user)/layout.tsx — komponen ini sendiri tidak tahu
 * kapan ia disembunyikan.
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

  return (
    <nav className="user-nav user-nav-mobile" aria-label="Navigasi utama">
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
    </nav>
  );
}
