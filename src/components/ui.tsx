'use client';

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

/**
 * Tombol chunky — signature komponen (design-system.md §2).
 * Efek tekan-turun (`active:translateY` via CSS `.btn:active`) wajib di
 * semua varian; jangan dihapus meski varian baru ditambahkan.
 */
export type ChunkyButtonVariant = 'brand' | 'good' | 'danger' | 'ghost';

const VARIANT_CLASS: Record<ChunkyButtonVariant, string> = {
  brand: '',
  good: 'btn-good',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export interface ChunkyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChunkyButtonVariant;
}

export function ChunkyButton({
  variant = 'brand',
  className,
  children,
  ...props
}: ChunkyButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

/**
 * Kartu — struktur: eyebrow label -> judul -> meta-chips -> aksi (§2).
 * `eyebrow`/`title` opsional supaya Card tetap bisa dipakai polos.
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: ReactNode;
  title?: ReactNode;
}

export function Card({
  eyebrow,
  title,
  className,
  children,
  ...props
}: CardProps) {
  const classes = ['card', className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...props}>
      {eyebrow ? <div className="card-eyebrow">{eyebrow}</div> : null}
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </div>
  );
}

/**
 * Meta-chip (di kartu) — tone `brand` (default) atau `amber`.
 * Teks amber memakai #B45309 di atas --warn-soft (aksesibilitas §7 —
 * jangan teks putih di atas amber).
 */
export interface MetaChipProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'brand' | 'amber';
}

/**
 * Pill status admin (design-system.md §6): DRAFT abu, LIVE hijau-soft,
 * RETIRED merah-soft. Kelas `.status-pill*` didefinisikan di globals.css,
 * khusus dipakai di /admin (tabel lesson & item soal).
 */
export type StatusPillStatus = 'DRAFT' | 'LIVE' | 'RETIRED';

const STATUS_PILL_CLASS: Record<StatusPillStatus, string> = {
  DRAFT: 'status-pill-draft',
  LIVE: 'status-pill-live',
  RETIRED: 'status-pill-retired',
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusPillStatus | string;
}

export function StatusPill({ status, className, ...props }: StatusPillProps) {
  const variant = STATUS_PILL_CLASS[status as StatusPillStatus] ?? 'status-pill-draft';
  const classes = ['status-pill', variant, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...props}>
      {status}
    </span>
  );
}

export function MetaChip({
  tone = 'brand',
  className,
  children,
  ...props
}: MetaChipProps) {
  const classes = [
    'meta-chip',
    tone === 'amber' ? 'meta-chip-amber' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
