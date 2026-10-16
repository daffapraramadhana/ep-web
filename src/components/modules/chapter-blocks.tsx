// apps/web/src/components/modules/chapter-blocks.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Lightbulb, Volume2 } from 'lucide-react';
import type { ChapterBlock, ModuleInline } from '@/lib/api-types';
import { canSpeak, speakEn } from '@/lib/speak';
import { resolveApiUrl } from '@/lib/api';
import { playAudio } from '@/lib/play-audio';

/** Render blok bab — dipakai pembaca user & pratinjau admin (gaya: .chapter-blocks di learner.css). */
export function ChapterBlocks({ blocks }: { blocks: ChapterBlock[] }) {
  // canSpeak() baru akurat setelah mount (SSR tidak punya window).
  const [tts, setTts] = useState(false);
  useEffect(() => setTts(canSpeak()), []);

  return (
    <div className="chapter-blocks">
      {blocks.map((b, i) => (
        <Block key={i} b={b} tts={tts} />
      ))}
    </div>
  );
}

function Block({ b, tts }: { b: ChapterBlock; tts: boolean }) {
  switch (b.type) {
    case 'heading':
      return b.level === 2 ? <h2><Inline text={b.text} /></h2> : <h3><Inline text={b.text} /></h3>;
    case 'paragraph':
      return <p><Inline text={b.text} /></p>;
    case 'list': {
      const items = b.items.map((it, k) => <li key={k}><Inline text={it} /></li>);
      return b.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case 'table':
      return (
        <table className="cb-table">
          <thead><tr>{b.head.map((h, k) => <th key={k}><Inline text={h} /></th>)}</tr></thead>
          <tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}><Inline text={c} /></td>)}</tr>)}</tbody>
        </table>
      );
    case 'image':
      // eslint-disable-next-line @next/next/no-img-element
      return <img className="cb-img" src={b.url} alt={b.alt} />;
    case 'audio':
      return <audio controls preload="none" src={resolveApiUrl(b.url)} />;
    case 'phrases':
      return (
        <div>
          {b.items.map((p, k) => (
            <div key={k} className="cb-phrase">
              <div>
                <div className="cb-phrase-en">{p.en}</div>
                <div className="cb-phrase-id">{p.id}</div>
                {p.note ? <div className="cb-phrase-note">{p.note}</div> : null}
              </div>
              {tts || p.audioUrl ? <SpeakButton text={p.en} audioUrl={p.audioUrl} /> : null}
            </div>
          ))}
        </div>
      );
    case 'dialog':
      return (
        <div className="cb-dialog">
          {b.lines.map((l, k) => (
            <div key={k} className={`cb-bubble ${l.side === 'left' ? 'cb-left' : 'cb-right'}`}>
              <div>
                <small>{l.speaker}{l.role ? ` · ${l.role}` : ''}</small>
                {l.text}
              </div>
              {tts || l.audioUrl ? <SpeakButton text={l.text} audioUrl={l.audioUrl} /> : null}
            </div>
          ))}
        </div>
      );
    case 'tip':
      return (
        <div className="cb-tip">
          <Lightbulb size={20} strokeWidth={2.25} aria-hidden="true" style={{ flex: 'none' }} />
          <div>{b.text.map((t, k) => <p key={k}><Inline text={t} /></p>)}</div>
        </div>
      );
  }
}

function SpeakButton({ text, audioUrl }: { text: string; audioUrl?: string | null }) {
  return (
    <button
      type="button"
      className="cb-speak"
      aria-label={`Dengarkan: ${text}`}
      onClick={() => (audioUrl ? playAudio(audioUrl, text) : speakEn(text))}
    >
      <Volume2 size={17} strokeWidth={2.25} />
    </button>
  );
}

function Inline({ text }: { text: ModuleInline }) {
  return (
    <>
      {text.map((s, i) => {
        let node: React.ReactNode = s.t;
        if (s.code) node = <code>{node}</code>;
        if (s.i) node = <em>{node}</em>;
        if (s.b) node = <strong>{node}</strong>;
        if (s.href) node = <a href={s.href} target="_blank" rel="noopener noreferrer">{node}</a>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}
