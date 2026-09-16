import type { ProgressWeekDayView } from '@/lib/api-types';
import { Check, Snowflake } from 'lucide-react';

/**
 * WeekStrip — baris 7 hari Senin->Minggu (dipakai Beranda & Progress).
 * Icons distinguish completed, frozen, and empty days. Labels use index,
 * not date parsing,
 * dari `date`, supaya tidak tergantung timezone parsing di browser
 * (BE mengirim week terurut Senin->Minggu, 7 entri).
 */

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function WeekStrip({ week }: { week: ProgressWeekDayView[] }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return (
    <div className="week-grid">
      {week.map((day, i) => (
        <div key={day.date} className={`week-day week-day-${day.state}${day.date === today ? ' week-day-today' : ''}`} aria-label={`${WEEKDAY_LABELS[i]}, ${day.date}: ${day.state === 'active' ? 'target tercapai' : day.state === 'frozen' ? 'streak dibekukan' : 'belum ada aktivitas'}`} aria-current={day.date === today ? 'date' : undefined}>
          <span className="week-day-label">{WEEKDAY_LABELS[i] ?? ''}</span>
          <span className="week-day-emoji" aria-hidden="true">{day.state === 'active' ? <Check size={16} strokeWidth={2.5} /> : day.state === 'frozen' ? <Snowflake size={16} /> : '·'}</span>
        </div>
      ))}
    </div>
  );
}
