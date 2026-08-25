'use client';

import { useState } from 'react';

export interface ActivityChartProps {
  series: { date: string; sessionsCompleted: number }[];
}

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function formatDateLabel(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_ID[m - 1]}`;
}

const WIDTH = 700;
const HEIGHT = 160;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;
const PAD_X = 10;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

/**
 * Grafik sesi selesai per hari — SVG tulis-tangan, tanpa lib
 * (design-system.md §6 "grafik per-departemen ... lib chart baru DITOLAK").
 * Deret selalu 28 titik (0 termasuk, brief §5) — jendela nilai konstan
 * (min 1) mencegah pembagian NaN saat semua nilai 0 (garis rata di dasar).
 */
export function ActivityChart({ series }: ActivityChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const n = series.length;
  const max = Math.max(1, ...series.map((d) => d.sessionsCompleted));
  const stepX = n > 1 ? (WIDTH - PAD_X * 2) / (n - 1) : 0;

  const points = series.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + PLOT_H - (d.sessionsCompleted / max) * PLOT_H,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const baseline = PAD_TOP + PLOT_H;
  const areaPath = n
    ? `${linePath} L${points[n - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`
    : '';

  const gridLevels = [max, max / 2, 0];
  const hovered = hover !== null ? points[hover] : null;

  return (
    <div className="activity-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="activity-chart-svg"
        role="img"
        aria-label="Grafik jumlah sesi selesai per hari, 28 hari terakhir"
      >
        {gridLevels.map((v, i) => {
          const y = PAD_TOP + (i / (gridLevels.length - 1)) * PLOT_H;
          return (
            <g key={i}>
              <line x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} className="activity-chart-grid" />
              <text x={2} y={y - 3} className="activity-chart-axis-label">
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} className="activity-chart-area" />
        <path d={linePath} className="activity-chart-line" />
        {points.map((p, i) => (
          <g key={p.date}>
            {i % 7 === 0 && (
              <text
                x={p.x}
                y={HEIGHT - 6}
                textAnchor={i === 0 ? 'start' : 'middle'}
                className="activity-chart-axis-label"
              >
                {formatDateLabel(p.date)}
              </text>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              className="activity-chart-dot"
              style={{ opacity: hover === i ? 1 : 0 }}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={10}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${p.sessionsCompleted} sesi · ${formatDateLabel(p.date)}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      {hovered && (
        <div
          className="activity-chart-tooltip"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
          }}
        >
          {hovered.sessionsCompleted} sesi &middot; {formatDateLabel(hovered.date)}
        </div>
      )}
    </div>
  );
}
