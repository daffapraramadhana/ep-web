'use client';

/**
 * JourneyPath — peta belajar 1 kolom (Task 13 brief, mockup v2
 * `.journey`/`.topic`/`.node`/`.link` + design-system.md §2 "Path node").
 *
 * Presentational saja: `(user)/journey/page.tsx` memberi data (GET /journey)
 * dan menangani efek samping (konfirmasi ulang, navigasi, toast); komponen
 * ini hanya tahu cara merender node + konektor dan memicu callback saat
 * ditap. State shake per-node disimpan lokal (bukan lifted ke page) supaya
 * page tidak perlu tahu animasi mana yang sedang berjalan.
 *
 * Warna pill topic bersiklus per topic index: brand -> sky (grammar) ->
 * amber (listening) -> pink (reading), token yang sama dipakai untuk baris
 * skill di Progress (design-system.md §1 "Identitas per-skill").
 */

import { useState } from 'react';
import { Check, Lock, Play } from 'lucide-react';
import type { JourneyLessonView, JourneyTopicView } from '@/lib/api-types';

export interface JourneyPathProps {
  topics: JourneyTopicView[];
  /** Node 'now' di-disable sementara (mis. POST /session/today in-flight). */
  nowDisabled?: boolean;
  onTapDone: (lesson: JourneyLessonView) => void;
  onTapNow: () => void;
  /** Dipanggil setiap tap node locked — page menampilkan toast dari sini. */
  onTapLocked: () => void;
}

const TOPIC_PILL_COLORS = [
  'var(--brand)',
  'var(--skill-grammar)',
  'var(--skill-listening)',
  'var(--skill-reading)',
];

function nodeSubtext(lesson: JourneyLessonView): string {
  if (lesson.state === 'done') return `Selesai · ${lesson.accuracy ?? 0}%`;
  if (lesson.state === 'now') return 'Lesson berikutnya';
  return 'Terkunci';
}

export function JourneyPath({
  topics,
  nowDisabled,
  onTapDone,
  onTapNow,
  onTapLocked,
}: JourneyPathProps) {
  // id node locked yang sedang shake — di-null-kan lagi begitu animasi
  // selesai (onAnimationEnd), bukan lewat timer, supaya tidak meleset dari
  // durasi asli 300ms di §3 kalau browser sempat throttle rAF/timer.
  const [shakingId, setShakingId] = useState<string | null>(null);

  function handleLockedTap(lessonId: string) {
    // Retrigger animasi meski node yang sama baru saja selesai/sedang shake
    // (mirip trik `void offsetWidth` di mockup): lepas class dulu, baru
    // pasang lagi di frame berikutnya supaya browser benar-benar restart
    // animasinya, bukan no-op karena className tidak berubah.
    setShakingId(null);
    requestAnimationFrame(() => setShakingId(lessonId));
    onTapLocked();
  }

  return (
    <div className="journey px-5 py-[22px]">
      {topics.map((topicView, topicIdx) => {
        const doneCount = topicView.lessons.filter((l) => l.state === 'done').length;
        const color = TOPIC_PILL_COLORS[topicIdx % TOPIC_PILL_COLORS.length];

        return (
          <div key={topicView.topic} className={topicIdx > 0 ? 'mt-[18px]' : undefined}>
            <div className="journey-topic-pill" style={{ background: color }}>
              <span>{topicView.topic.toUpperCase()}</span>
              <small>
                {doneCount}/{topicView.lessons.length}
              </small>
            </div>

            <div className="journey-path">
              {topicView.lessons.map((lesson, lessonIdx) => {
                const prevLesson = topicView.lessons[lessonIdx - 1];
                const connectorDone = lessonIdx > 0 && prevLesson?.state === 'done';

                return (
                  <div key={lesson.id}>
                    {lessonIdx > 0 ? (
                      <div className="journey-link-wrap">
                        <div
                          className={`journey-link${connectorDone ? ' journey-link-done' : ''}`}
                        />
                      </div>
                    ) : null}

                    <div className="journey-node-row">
                      <div className="journey-node-wrap">
                        {lesson.state === 'done' ? (
                          <button
                            type="button"
                            className="journey-node journey-node-done"
                            onClick={() => onTapDone(lesson)}
                            aria-label={`${lesson.title} — selesai, tap untuk ulangi`}
                          >
                            <Check size={26} strokeWidth={2.25} />
                          </button>
                        ) : lesson.state === 'now' ? (
                          <button
                            type="button"
                            className="journey-node journey-node-now"
                            onClick={onTapNow}
                            disabled={nowDisabled}
                            aria-label={`${lesson.title} — mulai lesson ini`}
                          >
                            <Play size={28} strokeWidth={2.25} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`journey-node journey-node-locked${
                              shakingId === lesson.id ? ' journey-node-shake' : ''
                            }`}
                            onClick={() => handleLockedTap(lesson.id)}
                            onAnimationEnd={() =>
                              setShakingId((cur) => (cur === lesson.id ? null : cur))
                            }
                            aria-label={`${lesson.title} — terkunci`}
                          >
                            <Lock size={24} strokeWidth={2.25} />
                          </button>
                        )}
                      </div>

                      <div className="journey-node-info">
                        <div className="journey-node-title">{lesson.title}</div>
                        <div className="journey-node-sub">{nodeSubtext(lesson)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
