'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Flame, Star, Snowflake } from 'lucide-react';

/**
 * Hero — hero terang typographic Beranda (redesign 26 Agu 2026, ref
 * Dribbble Scanner/EverSync): sapaan = headline ink besar di latar
 * terang, SATU aksen warna berupa chip highlight pada info kunci
 * (.hero-mark), target harian sebagai tile kotak (bahasa rectangle yang
 * sama dgn kartu; ref tile pastel Scanner) di kanan.
 * Task 9 brief §4 (copy states):
 * - sapaan per jam WIB: pagi<11, siang<15, sore<19, else malam.
 * - kalimat motivasi di bawah sapaan (tetap, tone umum).
 * - pesan status: belum sesi -> motivasi progres; sebagian -> sisa sesi;
 *   tercapai -> "Sampai jumpa besok."
 * Tanpa emoji: design-system.md §5 — emoji hanya untuk perayaan &
 * kalender streak, bukan elemen UI struktural seperti hero.
 */

export interface HeroProps {
  name: string;
  streak: number;
  xpTotal: number;
  freezeAvailableThisWeek: boolean;
  sessionsCompletedToday: number;
  dailyTarget: number;
  /** Baris konteks "Berikutnya: ..." — desktop saja (lg). */
  nextLabel?: string | null;
}

function greetingWIB(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(new Date()),
  );
  // Dini hari (00-03) tetap "malam" — jam 00:54 bukan "pagi".
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

/**
 * Pesan status dengan satu highlight chip (.hero-mark) pada info kunci —
 * chip hijau-gelap saat tercapai, chip brand untuk sisa sesi.
 */
function statusMessage(sessionsCompletedToday: number, dailyTarget: number): ReactNode {
  if (sessionsCompletedToday >= dailyTarget) {
    return (
      <>
        Target hari ini <span className="hero-mark hero-mark-good">tercapai</span>. Sampai
        jumpa besok.
      </>
    );
  }
  const remaining = dailyTarget - sessionsCompletedToday;
  if (sessionsCompletedToday === 0) {
    return (
      <>
        Tinggal <span className="hero-mark">{remaining} sesi</span> lagi untuk menjaga
        streak-mu tetap menyala.
      </>
    );
  }
  return (
    <>
      Tinggal <span className="hero-mark">{remaining} sesi</span> lagi untuk mencapai
      target hari ini.
    </>
  );
}

export function Hero({
  name,
  streak,
  xpTotal,
  freezeAvailableThisWeek,
  sessionsCompletedToday,
  dailyTarget,
  nextLabel,
}: HeroProps) {
  const target = dailyTarget > 0 ? dailyTarget : 1;
  const pct = Math.min(100, (sessionsCompletedToday / target) * 100);
  const targetMet = sessionsCompletedToday >= target;

  // Entrance: bar tile terisi dari 0 -> pct saat mount (transisi CSS 1s).
  // Reduced-motion: CSS mematikan transisinya, nilai final tetap benar.
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setBarPct(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <header className="hero">
      <div className="hero-stats hero-anim hero-anim-1">
        <span className="hero-stat">
          <Flame size={16} strokeWidth={2.25} />
          {streak}
        </span>
        <span className="hero-stat">
          <Star size={16} strokeWidth={2.25} />
          {xpTotal.toLocaleString('id-ID')} XP
        </span>
        {freezeAvailableThisWeek ? (
          <span className="hero-stat hero-stat-sky ml-auto">
            <Snowflake size={16} strokeWidth={2.25} />1
          </span>
        ) : null}
      </div>
      <div className="hero-inner">
        <div className="hero-text">
          <h1 className="hero-greet hero-anim hero-anim-2">
            {greetingWIB()}, {name}
            <small>Sedikit tiap hari, lama-lama jadi bukit.</small>
          </h1>
          <p className="hero-msg hero-anim hero-anim-3">
            {statusMessage(sessionsCompletedToday, dailyTarget)}
          </p>
          {nextLabel ? (
            <div className="hero-next hero-anim hero-anim-3">Berikutnya: {nextLabel}</div>
          ) : null}
        </div>
        <div
          className={`hero-tile${targetMet ? ' hero-tile-met' : ''} hero-anim hero-anim-2`}
          aria-label={`Sesi hari ini ${sessionsCompletedToday} dari ${target}`}
        >
          <b>
            {sessionsCompletedToday}/{target}
          </b>
          <span>SESI HARI INI</span>
          <div className="hero-tile-bar" aria-hidden="true">
            <div style={{ width: `${barPct}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}

/** Skeleton pulse — bentuk kasar hero terang, dipakai saat /me/summary loading. */
export function HeroSkeleton() {
  return (
    <div className="hero">
      <div className="hero-stats">
        <div className="skeleton h-[30px] w-[62px] rounded-full" />
        <div className="skeleton h-[30px] w-[92px] rounded-full" />
      </div>
      <div className="hero-inner">
        <div className="hero-text">
          <div className="skeleton h-[26px] w-[75%] rounded-lg" />
          <div className="skeleton mt-2 h-[13px] w-[55%] rounded-lg" />
          <div className="skeleton mt-4 h-[18px] w-[85%] rounded-lg" />
        </div>
        <div className="skeleton h-[96px] w-[108px] rounded-[20px]" />
      </div>
    </div>
  );
}
