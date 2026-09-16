import Image from 'next/image';
import { getMascotAsset, type MascotVariant } from '@/lib/mascot';

export type { MascotVariant } from '@/lib/mascot';

export interface MascotProps {
  variant?: MascotVariant;
  className?: string;
  /** Empty alt keeps the mascot decorative when nearby copy says the same thing. */
  alt?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Velora's official companion mascot.
 *
 * One shared entry point for the default character and its 15 reusable poses.
 */
export function Mascot({
  variant = 'default',
  className,
  alt = '',
  priority = false,
  sizes = '160px',
}: MascotProps) {
  return (
    <Image
      {...getMascotAsset(variant)}
      alt={alt}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}
