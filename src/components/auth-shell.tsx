import type { ReactNode } from 'react';
import { Logo } from './logo';
import { APP_NAME } from '@/lib/brand';

/**
 * AuthShell — bingkai bersama halaman auth (/login, /register,
 * /admin/login): latar terang polos (senada hero typographic Beranda),
 * wordmark flame versi terang, kartu putih ala .card, microcopy kaki.
 * Logika form tetap milik halaman.
 */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
  intro,
  className,
}: {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={['auth-page', className].filter(Boolean).join(' ')}>
      <div className="auth-box">
        <div className="auth-wordmark hero-anim hero-anim-1">
          <span className="auth-wordmark-icon">
            <Logo size={28} />
          </span>
          {APP_NAME}
        </div>
        <div className="auth-card hero-anim hero-anim-2">
          {intro}
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
        {footer ? <div className="auth-foot hero-anim hero-anim-3">{footer}</div> : null}
      </div>
    </div>
  );
}
