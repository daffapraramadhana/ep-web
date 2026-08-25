'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Upload, Table2, Image as ImageIcon, Users, Gauge, Flag, LogOut } from 'lucide-react';
import type { ComponentType } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Pemantauan',
    items: [
      { label: 'Ringkasan', href: '/admin/ringkasan', icon: Gauge },
      { label: 'Karyawan', href: '/admin/karyawan', icon: Users },
      { label: 'Laporan Soal', href: '/admin/laporan', icon: Flag },
    ],
  },
  {
    label: 'Konten',
    items: [
      { label: 'Import Soal', href: '/admin/import', icon: Upload },
      { label: 'Soal & Lesson', href: '/admin/content', icon: Table2 },
      { label: 'Media', href: '/admin/media', icon: ImageIcon },
      { label: 'Undang Karyawan', href: '/admin/users', icon: Users },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      if (!isLoginPage) {
        router.replace('/admin/login');
        return;
      }
      setChecked(true);
      return;
    }

    if (role !== 'ADMIN') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      if (!isLoginPage) {
        router.replace('/admin/login');
        return;
      }
    }

    setChecked(true);
  }, [isLoginPage, router]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    router.push('/admin/login');
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!checked) {
    return null;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Admin</div>
        <nav className="admin-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <div className="admin-nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`admin-nav-item${active ? ' admin-nav-item-active' : ''}`}
                  >
                    <Icon size={20} strokeWidth={2.25} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <button type="button" onClick={handleLogout} className="admin-logout">
          <LogOut size={20} strokeWidth={2.25} />
          Keluar
        </button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
