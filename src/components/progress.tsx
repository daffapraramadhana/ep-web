'use client';

import type { ReactNode } from 'react';

/**
 * Ring — SVG progress ring (target harian, % skill). design-system.md §2/§3:
 * stroke-linecap round, ring target di hero pakai stroke amber di atas
 * track putih-transparan (default class); ring % skill memakai warna lain
 * via trackClass/arcClass. dasharray dihitung dari keliling lingkaran
 * (2 * PI * r), r = (size - stroke) / 2, jadi selalu konsisten dengan size
 * yang diberikan.
 */
export interface RingProps {
  size?: number;
  stroke?: number;
  /** 0-100 */
  pct: number;
  trackClass?: string;
  arcClass?: string;
  children?: ReactNode;
}

export function Ring({
  size = 92,
  stroke = 9,
  pct,
  trackClass,
  arcClass,
  children,
}: RingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedPct = Math.min(100, Math.max(0, pct));
  const offset = circumference - (clampedPct / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={r}
          strokeWidth={stroke}
          fill="none"
          className={trackClass ?? 'ring-track-default'}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={arcClass ?? 'ring-arc-default'}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * SegmentBar — progress sesi tersegmen: satu segmen per soal (bukan bar
 * kontinu), tinggi 12px, radius 6, terisi --good dengan easing spring (§2/§3).
 */
export interface SegmentBarProps {
  total: number;
  filled: number;
}

export function SegmentBar({ total, filled }: SegmentBarProps) {
  return (
    <div className="flex flex-1 gap-[5px]">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="seg-track">
          <div
            className="seg-fill"
            style={{ width: i < filled ? '100%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}
