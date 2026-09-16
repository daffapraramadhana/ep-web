'use client';

import { Check, LockKeyhole, Play, RotateCcw, ArrowRight } from 'lucide-react';
import type { JourneyLessonView, JourneyTopicView } from '@/lib/api-types';

export interface JourneyPathProps {
  topics: JourneyTopicView[];
  nowDisabled?: boolean;
  onTapDone: (lesson: JourneyLessonView) => void;
  onTapNow: () => void;
  onTapLocked: () => void;
}

/** Ordered learning path; lesson availability remains owned by the API. */
export function JourneyPath({ topics, nowDisabled, onTapDone, onTapNow, onTapLocked }: JourneyPathProps) {
  return <div className="learn-route">
    {topics.map((topic, topicIndex) => {
      const done = topic.lessons.filter(lesson => lesson.state === 'done').length;
      return <section className="learn-route-topic" key={topic.topic} aria-labelledby={`topic-${topicIndex}`}>
        <div className="learn-route-heading">
          <div><p className="learn-eyebrow">Bagian {String(topicIndex + 1).padStart(2, '0')}</p><h2 id={`topic-${topicIndex}`}>{topic.topic}</h2></div>
          <span>{done}/{topic.lessons.length} selesai</span>
        </div>
        <ol className="learn-route-list">
          {topic.lessons.map((lesson, index) => {
            const current = lesson.state === 'now';
            const completed = lesson.state === 'done';
            return <li key={lesson.id} className={`learn-route-item learn-route-${lesson.state}`}>
              <span className="learn-route-marker" aria-hidden="true">{completed ? <Check size={17} /> : index + 1}</span>
              <button type="button" className="learn-route-card" disabled={nowDisabled}
                aria-current={current ? 'step' : undefined}
                aria-label={`${lesson.title} — ${completed ? 'selesai, ulangi materi' : current ? 'mulai belajar' : 'terkunci, lihat penjelasan'}`}
                onClick={() => completed ? onTapDone(lesson) : current ? onTapNow() : onTapLocked()}>
                <span className="learn-route-icon" aria-hidden="true">{completed ? <Check size={22} /> : current ? <Play size={22} /> : <LockKeyhole size={21} />}</span>
                <span className="learn-route-info">
                  <span className="learn-route-state">{completed ? 'Selesai' : current ? 'Langkah berikutnya' : 'Terkunci'}</span>
                  <b>{lesson.title}</b>
                  <small>{completed ? lesson.accuracy == null ? 'Siap diulang kapan saja' : `Akurasi ${lesson.accuracy}% · Bisa diulang` : current ? nowDisabled ? 'Menyiapkan sesimu…' : 'Siap saat kamu siap' : 'Selesaikan materi sebelumnya'}</small>
                </span>
                {completed ? <RotateCcw className="learn-route-trailing" size={17} aria-hidden="true" /> : current ? <ArrowRight className="learn-route-trailing" size={18} aria-hidden="true" /> : null}
              </button>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;
}
