import type { RunwayLook } from '@swift2/experience';

/** Quiet "Sources" line under a look's description. Renders nothing when the
 * look has no sources. */
export function RunwaySources({ sources }: { sources?: RunwayLook['sources'] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
      <span className="font-medium">Sources:</span>{' '}
      {sources.map((s, i) => (
        <span key={`${s.url}-${i}`}>
          {i > 0 && ', '}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[color:var(--era-ink)]">
            {s.title}
          </a>
        </span>
      ))}
    </p>
  );
}
