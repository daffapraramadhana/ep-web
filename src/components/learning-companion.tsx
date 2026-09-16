import type { ReactNode } from 'react';
import { Mascot, type MascotVariant } from '@/components/mascot';

/** Shared, character-led introduction for focused learner pages. */
export function LearningCompanion({ title, description, message, children, footer, variant = 'default' }: {
  title: string;
  description: string;
  message: string;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: MascotVariant;
}) {
  return <section className="learn-companion">
    <div className="learn-companion-copy">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
    <div className="learn-companion-stage">
      <p className="learn-bubble">{message}</p>
      <Mascot variant={variant} className="learn-companion-mascot" sizes="(min-width: 600px) 210px, 160px" priority />
    </div>
    {footer && <div className="learn-companion-footer">{footer}</div>}
  </section>;
}

export function LearningPageSkeleton({ title }: { title: string }) {
  return <div className="learn-page" aria-busy="true" aria-label={`Memuat ${title}`}>
    <div className="skeleton h-8 w-40 mb-3" />
    <div className="skeleton h-4 w-60 max-w-full mb-6" />
    <div className="skeleton h-[340px] rounded-3xl mb-7" />
    <div className="skeleton h-6 w-44 mb-4" />
    {[0, 1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl mb-3" />)}
  </div>;
}
