import { CLOWN_JARGON_GUIDE } from '@/lib/longlive/clown-explain';
import { CLOWN_STARTERS } from '@/lib/longlive/clown-starters';

interface ClownEmptyStateProps {
  intro: string;
  onSelect: (prompt: string) => void;
}

/** Newcomer-readable definitions and composer prefills; never auto-sends. */
export function ClownEmptyState({ intro, onSelect }: ClownEmptyStateProps) {
  return (
    <div className="mx-auto max-w-xl text-center text-[color:var(--clown-ink-soft)]">
      <p className="text-[13px] opacity-70">{intro}</p>
      <p className="mt-3 text-sm leading-relaxed">{CLOWN_JARGON_GUIDE}</p>
      <div
        className="mt-4 flex flex-wrap justify-center gap-2"
        role="group"
        aria-label="Clownbot starter questions"
      >
        {CLOWN_STARTERS.map((starter) => (
          <button
            key={starter.prompt}
            type="button"
            onClick={() => onSelect(starter.prompt)}
            className="min-h-[44px] rounded-full border border-[color:var(--clown-line)] px-3 py-2 text-xs transition hover:border-[color:var(--era-accent)] hover:text-[color:var(--era-accent)]"
          >
            {starter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
