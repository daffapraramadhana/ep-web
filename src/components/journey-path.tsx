'use client';

import { ArrowRight, BookOpen, BookOpenText, Check, LockKeyhole, Play, RotateCcw } from 'lucide-react';
import type { JourneyStepView, JourneyUnitView } from '@/lib/api-types';

export interface JourneyPathProps {
  units: JourneyUnitView[];
  nowDisabled?: boolean;
  onTapStep: (step: JourneyStepView) => void;
}

function stepCopy(step: JourneyStepView, nowDisabled?: boolean) {
  const bab = step.chapter ? `Bab ${step.chapter.position} · ` : '';
  if (step.kind === 'reading') return { label: 'Bacaan', small: `${bab}Bacaan`, aria: 'bacaan, buka materi' };
  if (step.state === 'done') {
    return {
      label: 'Selesai',
      small: bab + (step.accuracy == null ? 'Siap diulang kapan saja' : `Akurasi ${step.accuracy}% · Bisa diulang`),
      aria: 'selesai, ulangi materi',
    };
  }
  if (step.state === 'now') {
    return {
      label: 'Langkah berikutnya',
      small: nowDisabled ? 'Menyiapkan sesimu…' : step.kind === 'chapter' ? `${bab}Baca materi, lalu kerjakan kuis` : 'Siap saat kamu siap',
      aria: step.kind === 'chapter' ? 'buka bab' : 'mulai belajar',
    };
  }
  return { label: 'Terkunci', small: bab + 'Selesaikan materi sebelumnya', aria: 'terkunci, lihat penjelasan' };
}

/** Perjalanan per unit; urutan, status & progres sepenuhnya milik API. */
export function JourneyPath({ units, nowDisabled, onTapStep }: JourneyPathProps) {
  return <div className="learn-route">
    {units.map((unit, unitIndex) => {
      let counted = 0;
      return <section className="learn-route-topic" key={unit.moduleSlug ?? unit.title} aria-labelledby={`unit-${unitIndex}`}>
        <div className="learn-route-heading">
          <div>
            <p className="learn-eyebrow">{unit.kind === 'module' && <BookOpenText size={13} aria-hidden="true" className="learn-route-unit-icon" />}Unit {String(unitIndex + 1).padStart(2, '0')}{unit.kind === 'module' ? ' · Modul' : ''}</p>
            <h2 id={`unit-${unitIndex}`}>{unit.title}</h2>
          </div>
          <span>{unit.done}/{unit.total} selesai</span>
        </div>
        <ol className="learn-route-list">
          {unit.steps.map((step) => {
            const reading = step.kind === 'reading';
            const state = reading ? 'reading' : step.state!;
            const completed = state === 'done';
            const current = state === 'now';
            const number = reading ? null : ++counted;
            const copy = stepCopy(step, nowDisabled);
            return <li key={step.id} className={`learn-route-item learn-route-${state}`}>
              <span className="learn-route-marker" aria-hidden="true">{completed ? <Check size={17} /> : reading ? <BookOpen size={14} /> : number}</span>
              <button type="button" className="learn-route-card" disabled={nowDisabled}
                aria-current={current ? 'step' : undefined}
                aria-label={`${step.title} — ${copy.aria}`}
                onClick={() => onTapStep(step)}>
                <span className="learn-route-icon" aria-hidden="true">{completed ? <Check size={22} /> : reading ? <BookOpen size={21} /> : current ? step.kind === 'chapter' ? <BookOpenText size={22} /> : <Play size={22} /> : <LockKeyhole size={21} />}</span>
                <span className="learn-route-info">
                  <span className="learn-route-state">{copy.label}</span>
                  <b>{step.title}</b>
                  <small>{copy.small}</small>
                </span>
                {completed ? <RotateCcw className="learn-route-trailing" size={17} aria-hidden="true" /> : current || reading ? <ArrowRight className="learn-route-trailing" size={18} aria-hidden="true" /> : null}
              </button>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;
}
