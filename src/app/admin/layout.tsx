'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Import Soal', href: '/admin/import' },
  { label: 'Soal & Lesson', href: '/admin/soal' },
  { label: 'Media', href: '/admin/media' },
  { label: 'Karyawan', href: '/admin/karyawan' },
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
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-gray-50 p-4">
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Keluar
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
