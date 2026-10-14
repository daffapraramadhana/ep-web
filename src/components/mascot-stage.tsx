'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { getImageProps } from 'next/image';
import { Mascot } from '@/components/mascot';
import { getMascotAsset, type MascotVariant } from '@/lib/mascot';

/** Peak lean in degrees when the pointer reaches the stage edge. */
const MAX_TILT = 12;

/**
 * Warm the browser cache for poses that appear later (tap cycle, feedback
 * sheet) so a pose swap never flashes an empty frame. Uses the same
 * optimized URL set `next/image` will request.
 */
export function preloadMascots(variants: readonly MascotVariant[], sizes: string) {
  for (const variant of variants) {
    const { props } = getImageProps({ ...getMascotAsset(variant), alt: '', sizes });
    const img = new window.Image();
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  }
}

export interface MascotStageProps {
  variant?: MascotVariant;
  /** Poses cycled on tap/click; omit for a non-interactive mascot. Pass a module-level constant. */
  tapPoses?: readonly MascotVariant[];
  /** Applied to the image itself, so existing sizing classes keep working. */
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
  /** Gentle breathing loop; pair with a `.mascot-ground` shadow for depth. */
  idle?: boolean;
}

/**
 * Animated wrapper around the official mascot. Each layer owns exactly one
 * transform so effects compose instead of overwriting each other:
 * stage (entrance pop) → tilt (pointer lean) → squash (tap) → breathe (idle)
 * → pose image (cross-blur swap on pose change).
 */
export function MascotStage({
  variant = 'default',
  tapPoses,
  className,
  sizes = '160px',
  priority = false,
  alt = '',
  idle = true,
}: MascotStageProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const squashRef = useRef<HTMLDivElement>(null);
  const [tapCount, setTapCount] = useState(0);
  const pose = tapPoses && tapCount > 0 ? tapPoses[(tapCount - 1) % tapPoses.length] : variant;

  useEffect(() => {
    if (tapPoses) preloadMascots(tapPoses, sizes);
  }, [tapPoses, sizes]);

  function canAnimatePointer() {
    return matchMedia('(hover: hover) and (pointer: fine)').matches
      && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function track(e: PointerEvent<HTMLDivElement>) {
    const tilt = tiltRef.current;
    if (!tilt || e.pointerType !== 'mouse' || !canAnimatePointer()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    tilt.classList.add('is-tilting');
    // Written on the element itself (not a CSS variable on the parent) so
    // only this node recalculates style on every pointer move.
    tilt.style.transform = `perspective(800px) rotateX(${((0.5 - py) * MAX_TILT).toFixed(2)}deg) rotateY(${((px - 0.5) * MAX_TILT).toFixed(2)}deg)`;
  }

  function reset() {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.classList.remove('is-tilting');
    tilt.style.transform = '';
  }

  function tap() {
    if (!tapPoses) return;
    setTapCount((n) => n + 1);
    const squash = squashRef.current;
    if (!squash) return;
    // Replay the squash from a clean baseline on every tap.
    squash.classList.remove('is-squashing');
    void squash.offsetWidth;
    squash.classList.add('is-squashing');
  }

  return (
    <div
      className={`mascot-stage${tapPoses ? ' is-tappable' : ''}`}
      onPointerMove={track}
      onPointerLeave={reset}
      onClick={tap}
      aria-hidden={alt ? undefined : true}
    >
      <div className="mascot-tilt" ref={tiltRef}>
        <div className="mascot-squash" ref={squashRef} onAnimationEnd={(e) => e.currentTarget.classList.remove('is-squashing')}>
          <div className={idle ? 'mascot-breathe' : undefined}>
            <Mascot key={pose} variant={pose} className={`mascot-pose ${className ?? ''}`.trim()} sizes={sizes} priority={priority} alt={alt} />
          </div>
        </div>
      </div>
    </div>
  );
}
