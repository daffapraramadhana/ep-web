import { Flame } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * AuthShell — bingkai bersama halaman login (/login & /admin/login):
 * latar navy ber-glow (bahasa visual chrome/hero app), wordmark flame,
 * kartu putih, dan microcopy kaki. Logika form tetap milik halaman.
 */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-watermark" aria-hidden="true">
        <Flame size={260} strokeWidth={1} />
      </div>
      <div className="auth-box">
        <div className="auth-wordmark hero-anim hero-anim-1">
          <span className="auth-wordmark-icon">
            <Flame size={22} strokeWidth={2.25} />
          </span>
          Daily English
        </div>
        <div className="auth-card hero-anim hero-anim-2">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
        {footer ? <div className="auth-foot hero-anim hero-anim-3">{footer}</div> : null}
      </div>
    </div>
  );
}
