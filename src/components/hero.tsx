'use client';

import { Flame, Star, Snowflake } from 'lucide-react';
import { StatPill } from './ui';
import { Ring } from './progress';

/**
 * Hero — hero gelap Beranda (design-system.md §1: gradien
 * navy → navy-2 → #4338CA, radius bawah 30; ref visual mockup v2 `.hero2`).
 * Task 9 brief §4 (copy states):
 * - sapaan per jam WIB: pagi<11, siang<15, sore<19, else malam.
 * - kalimat motivasi di bawah sapaan (tetap, tone umum).
 * - pesan status di samping ring: belum sesi -> motivasi progres;
 *   sebagian -> sisa sesi; tercapai -> "Sampai jumpa besok ✅".
 */

export interface HeroProps {
  name: string;
  streak: number;
  xpTotal: number;
  freezeAvailableThisWeek: boolean;
  sessionsCompletedToday: number;
  dailyTarget: number;
}

function greetingWIB(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(new Date()),
  );
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function statusMessage(sessionsCompletedToday: number, dailyTarget: number): string {
  if (sessionsCompletedToday >= dailyTarget) {
    return 'Target hari ini tercapai. Sampai jumpa besok ✅';
  }
  const remaining = dailyTarget - sessionsCompletedToday;
  if (sessionsCompletedToday === 0) {
    if (remaining <= 1) {
      return 'Satu sesi lagi untuk menjaga streak-mu tetap menyala 🔥';
    }
    return `${remaining} sesi lagi untuk menjaga streak-mu tetap menyala 🔥`;
  }
  return `Tinggal ${remaining} sesi lagi untuk mencapai target hari ini.`;
}

export function Hero({
  name,
  streak,
  xpTotal,
  freezeAvailableThisWeek,
  sessionsCompletedToday,
  dailyTarget,
}: HeroProps) {
  const target = dailyTarget > 0 ? dailyTarget : 1;
  const pct = (sessionsCompletedToday / target) * 100;

  return (
    <div className="hero">
      <div className="mb-[18px] flex gap-2 lg:hidden">
        <StatPill hot>
          <Flame size={16} strokeWidth={2.25} />
          {streak}
        </StatPill>
        <StatPill>
          <Star size={16} strokeWidth={2.25} />
          {xpTotal.toLocaleString('id-ID')} XP
        </StatPill>
        {freezeAvailableThisWeek ? (
          <StatPill className="ml-auto">
            <Snowflake size={16} strokeWidth={2.25} />1
          </StatPill>
        ) : null}
      </div>
      <div className="hero-greet">
        {greetingWIB()}, {name} 👋
        <small>Sedikit tiap hari, lama-lama jadi bukit.</small>
      </div>
      <div className="hero-bottom">
        <Ring pct={pct}>
          <div className="hero-ring-label">
            <b>
              {sessionsCompletedToday}/{target}
            </b>
            <span>SESI HARI INI</span>
          </div>
        </Ring>
        <div className="hero-msg">{statusMessage(sessionsCompletedToday, dailyTarget)}</div>
      </div>
    </div>
  );
}

/** Skeleton pulse — bentuk kasar hero, dipakai saat /me/summary loading. */
export function HeroSkeleton() {
  return (
    <div className="hero">
      <div className="mb-[18px] flex gap-2">
        <div className="skeleton h-[27px] w-[56px] rounded-full" />
        <div className="skeleton h-[27px] w-[80px] rounded-full" />
      </div>
      <div className="skeleton h-[21px] w-[70%] rounded-lg" />
      <div className="skeleton mt-2 h-[13px] w-[55%] rounded-lg" />
      <div className="hero-bottom">
        <div className="skeleton h-[92px] w-[92px] rounded-full" />
        <div className="skeleton h-[36px] flex-1 rounded-lg" />
      </div>
    </div>
  );
}
