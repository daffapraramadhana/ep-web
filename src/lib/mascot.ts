/** Public paths only: importing this registry never bundles all mascot images. */
export const MASCOT_VARIANTS = [
  'happy', 'excited', 'curious', 'thinking', 'proud', 'cheerful',
  'surprised', 'winking', 'welcome', 'learning', 'speaking',
  'achieving', 'daily-streak', 'exploring', 'celebrating',
] as const;

export type MascotVariant = 'default' | typeof MASCOT_VARIANTS[number];

export function getMascotAsset(variant: MascotVariant = 'default') {
  return variant === 'default'
    ? { src: '/mascot/velora-mascot.webp', width: 900, height: 900 }
    : { src: `/mascot/variants/${variant}.webp`, width: 768, height: 768 };
}
