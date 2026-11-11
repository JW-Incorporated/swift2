import { CLOWN_JARGON_GUIDE } from './lib/clown-explain';
import { CLOWN_STARTERS, FAN_THEORY_CHIP_LABEL } from './lib/clown-starters';

interface ClownEmptyStateProps {
  intro: string;
  onSelect: (prompt: string) => void;
  /** Community Engine plan §Phase 2, card P2-5 — sends immediately (zero
   * model calls), flagged as a chip so the route skips the model.
   * Optional so this component's other, already-tested call sites/stories
   * are unaffected if one ever omits it; the button simply doesn't render. */
  onFanTheoryChip?: () => void;
}

/** Newcomer-readable definitions and starter questions; a starter tap sends
 * its question immediately (`onSelect`), same as a typed submit. */
export function ClownEmptyState({ intro, onSelect, onFanTheoryChip }: ClownEmptyStateProps) {
  return (
    <div className="mx-auto max-w-xl text-center text-[color:var(--clown-ink-soft)]">
      <p className="text-[13px]">{intro}</p>
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
            className="min-h-[44px] rounded-full border border-[color:var(--clown-line)] px-3 py-2 text-xs transition hover:border-[color:var(--era-accent)] hover:text-[color:var(--era-accent-text)]"
          >
            {starter.label}
          </button>
        ))}
        {onFanTheoryChip && (
          <button
            type="button"
            onClick={onFanTheoryChip}
            className="min-h-[44px] rounded-full border border-[color:var(--era-accent)] px-3 py-2 text-xs font-medium text-[color:var(--era-accent-text)] transition hover:opacity-80"
          >
            {FAN_THEORY_CHIP_LABEL}
          </button>
        )}
      </div>
    </div>
  );
}
