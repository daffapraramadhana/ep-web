// apps/web/src/components/modules/module-cover.tsx
import { BookOpenText } from 'lucide-react';
import { coverTone } from '@/lib/modules';

export function ModuleCover({ url, index, size = 54 }: { url: string | null; index: number; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="mod-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="mod-cover" style={{ width: size, height: size, background: coverTone(index) }} aria-hidden="true">
      <BookOpenText size={Math.round(size * 0.48)} strokeWidth={2.25} />
    </span>
  );
}
