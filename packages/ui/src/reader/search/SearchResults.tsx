import type { SearchGroup, SearchTarget } from '@swift2/experience';
import { ResultRow } from './SearchResultRow';

/** Starter queries shown in the empty state — one per corner of the archive. */
const SUGGESTIONS = ['snake', 'vault', '13', 'crossing'];

export function SearchResults({
  groups,
  activeIndex,
  setActiveIndex,
  select,
  setQuery,
  setShowAll,
  showAll,
  showEmptyHint,
  showNoMatch,
  totalMatches,
  debounced,
}: {
  groups: readonly SearchGroup[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  select: (target: SearchTarget) => void;
  setQuery: (q: string) => void;
  setShowAll: (v: boolean) => void;
  showAll: boolean;
  showEmptyHint: boolean;
  showNoMatch: boolean;
  totalMatches: number;
  debounced: string;
}) {
  let flatIndex = -1; // running index across groups, for active-row tracking

  /* Results / states. The listbox wraps ONLY option/group children
            (#1206, axe `aria-required-children`): the empty hint, no-match
            message, and show-all header are chrome, so they live in the scroll
            container as siblings ABOVE the listbox, which mounts exactly when
            there are results — the same condition as the input's
            `aria-expanded`, so its `aria-controls` never points at a missing
            id while expanded. */
  return (
    <div className="min-h-0 overflow-y-auto overscroll-contain">
      {showEmptyHint && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[color:var(--era-ink-soft)]">
            Moments, songs, Easter eggs, theories, videos — the whole archive.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="era-chip rounded-full px-3 py-1 text-xs font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {showNoMatch && (
        <p className="px-4 py-8 text-center text-sm text-[color:var(--era-ink-soft)]">
          No matches for “{debounced.trim()}” — try an era, a song, or a motif like “snake”.
        </p>
      )}

      {showAll && (
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--era-line)] px-4 py-3">
          <p className="text-sm font-semibold">
            {totalMatches} {totalMatches === 1 ? 'result' : 'results'} for “{debounced.trim()}”
          </p>
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="era-chip shrink-0 rounded-full px-3 py-1 text-xs font-medium"
          >
            Back to top matches
          </button>
        </div>
      )}

      {groups.length > 0 && (
        <div id="ll-search-results" role="listbox" aria-label="Search results">
          {groups.map((group) => (
            <div key={group.type} role="group" aria-label={group.label}>
              <p
                role="presentation"
                className="sticky top-0 bg-[color:var(--era-bg)]/95 px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)] backdrop-blur-sm"
              >
                {group.label}
                {!showAll && group.totalMatches > group.results.length && (
                  <span className="ml-2 font-normal tracking-normal text-[color:var(--era-ink-soft)] normal-case">
                    {group.results.length} of {group.totalMatches}
                  </span>
                )}
              </p>
              {group.results.map((result) => {
                flatIndex += 1;
                return (
                  <ResultRow
                    key={result.doc.key}
                    result={result}
                    isActive={flatIndex === activeIndex}
                    index={flatIndex}
                    onHover={setActiveIndex}
                    onSelect={select}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchKeyHints() {
  return (
    <div className="hidden items-center justify-end gap-4 border-t border-[color:var(--era-line)] px-4 py-2 text-[11px] text-[color:var(--era-ink-soft)] sm:flex">
      <span>
        <kbd className="rounded border border-[color:var(--era-line)] px-1">↑</kbd>{' '}
        <kbd className="rounded border border-[color:var(--era-line)] px-1">↓</kbd> navigate
      </span>
      <span>
        <kbd className="rounded border border-[color:var(--era-line)] px-1">↵</kbd> open
      </span>
      <span>
        <kbd className="rounded border border-[color:var(--era-line)] px-1">esc</kbd> close
      </span>
    </div>
  );
}
