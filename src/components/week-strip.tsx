import type { ProgressWeekDayView } from '@/lib/api-types';

/**
 * WeekStrip — baris 7 hari Senin->Minggu (dipakai Beranda & Progress).
 * Emoji kalender streak dipertahankan sesuai design-system.md §5 (emoji
 * sah untuk kalender streak). Label dipetakan by index, bukan diparse
 * dari `date`, supaya tidak tergantung timezone parsing di browser
 * (BE mengirim week terurut Senin->Minggu, 7 entri).
 */

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function weekEmoji(state: ProgressWeekDayView['state']): string {
  if (state === 'active') return '🔥';
  if (state === 'frozen') return '🧊';
  return '·';
}

export function WeekStrip({ week }: { week: ProgressWeekDayView[] }) {
  return (
    <div className="week-grid">
      {week.map((day, i) => (
        <div key={day.date} className={`week-day week-day-${day.state}`}>
          <span className="week-day-label">{WEEKDAY_LABELS[i] ?? ''}</span>
          <span className="week-day-emoji">{weekEmoji(day.state)}</span>
        </div>
      ))}
    </div>
  );
}
